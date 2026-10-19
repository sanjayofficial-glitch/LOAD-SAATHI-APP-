import type { SupabaseClient } from '@supabase/supabase-js';
import type { KycDocumentType, UserDocument, VerificationStatus } from '@/types';
import { compressImage, describeCompression, type CompressResult } from '@/utils/imageCompress';

/** Private bucket. Documents are only reachable through short-lived signed URLs. */
export const KYC_BUCKET = 'kyc-documents';
/** Public bucket, so an avatar can be shown with a plain <img src>. */
export const AVATAR_BUCKET = 'avatars';

/** How long a signed document link stays valid, in seconds. */
const SIGNED_URL_TTL = 60 * 10;

export interface DocSpec {
  type: KycDocumentType;
  label: string;
  hint: string;
  /** Required documents gate the "Submit for review" button. */
  required: boolean;
  /** Ask the user for an expiry date, and warn approaching the owner. */
  needsExpiry?: boolean;
  /** Show a camera-first input. */
  cameraPreferred?: boolean;
  /** Skip client compression (nothing to gain, e.g. a photo of a truck). */
  noCompression?: boolean;
}

/**
 * The document checklist.
 *
 * Aadhaar is deliberately NOT collected — holding Aadhaar images brings India's
 * DPDP Act obligations (and a real breach risk) with no operational benefit for
 * verifying a truck and a licence.
 */
export const KYC_DOCS: DocSpec[] = [
  {
    type: 'driving_licence',
    label: 'Driving Licence (front)',
    hint: 'Photo of the front of your licence. Name and licence number must be readable.',
    required: true,
    needsExpiry: true,
    cameraPreferred: true,
  },
  {
    type: 'driving_licence_back',
    label: 'Driving Licence (back)',
    hint: 'Optional. Helps us confirm the vehicle classes you are allowed to drive.',
    required: false,
    needsExpiry: true,
    cameraPreferred: true,
  },
  {
    type: 'vehicle_rc',
    label: 'Vehicle RC',
    hint: 'Registration certificate for the truck. Plate number and owner name must be visible.',
    required: true,
    needsExpiry: true,
    cameraPreferred: true,
  },
  {
    type: 'vehicle_insurance',
    label: 'Vehicle Insurance',
    hint: 'Current policy. We read the expiry date from it.',
    required: true,
    needsExpiry: true,
    cameraPreferred: true,
  },
  {
    type: 'truck_photo',
    label: 'Truck photo with number plate',
    hint: 'Side or front view of the truck with the number plate clearly visible.',
    required: true,
    cameraPreferred: true,
  },
  {
    type: 'permit',
    label: 'Transport Permit',
    hint: 'Optional at launch, but it speeds up verification.',
    required: false,
    needsExpiry: true,
  },
  {
    type: 'fitness',
    label: 'Fitness Certificate',
    hint: 'Optional at launch, but it speeds up verification.',
    required: false,
    needsExpiry: true,
  },
  {
    type: 'puc',
    label: 'PUC Certificate',
    hint: 'Optional at launch, but it speeds up verification.',
    required: false,
    needsExpiry: true,
  },
];

export const REQUIRED_DOC_TYPES: KycDocumentType[] = KYC_DOCS.filter((d) => d.required).map((d) => d.type);

export function getDocSpec(type: KycDocumentType): DocSpec | undefined {
  return KYC_DOCS.find((d) => d.type === type);
}

/** Turn a raw Postgres/Storage error into something a trucker can act on. */
export function friendlyKycError(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Something went wrong. Please try again.';

  if (raw.includes('required documents first')) return raw;
  if (raw.includes('exceeded the maximum allowed size')) {
    return 'That file is too large for storage. Please retake the photo — it will be compressed automatically.';
  }
  if (raw.includes('mime type')) return 'Only JPG, PNG, WEBP or PDF files are allowed.';
  if (raw.includes('row-level security') || raw.includes('violates row-level security')) {
    return 'You do not have permission to change that.';
  }
  if (raw.includes('duplicate key')) return 'That document is already on file. Please refresh and try again.';
  if (raw.toLowerCase().includes('failed to fetch') || raw.toLowerCase().includes('network')) {
    return 'Network problem. Check your connection and try again.';
  }
  return raw;
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function listDocuments(
  client: SupabaseClient,
  userId: string,
): Promise<UserDocument[]> {
  const { data, error } = await client
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('doc_type');

  if (error) throw new Error(friendlyKycError(error));
  return (data || []) as UserDocument[];
}

/** Short-lived signed URL for a private document. */
export async function getSignedDocumentUrl(
  client: SupabaseClient,
  storagePath: string,
  ttlSeconds = SIGNED_URL_TTL,
): Promise<string | null> {
  const { data, error } = await client.storage.from(KYC_BUCKET).createSignedUrl(storagePath, ttlSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export interface UploadDocumentResult {
  doc: UserDocument;
  compression: CompressResult;
  summary: string;
}

/**
 * Compress, upload and register one document.
 *
 * Re-uploading the same document type replaces the previous file, and the old
 * object is deleted from storage so re-uploads never accumulate dead bytes.
 */
export async function uploadDocument(
  client: SupabaseClient,
  userId: string,
  docType: KycDocumentType,
  file: File,
  validUntil?: string | null,
): Promise<UploadDocumentResult> {
  if (!userId) throw new Error('You must be signed in to upload documents.');

  const spec = getDocSpec(docType);
  const compression = await compressImage(
    file,
    spec?.noCompression ? { maxSizeMB: 1, maxWidthOrHeight: 1600, quality: 0.8 } : {},
  );

  const storagePath = `${userId}/${docType}_${Date.now()}.jpg`;
  const compressed = compression.file;
  const contentType = compressed.type || 'image/jpeg';

  const { error: uploadError } = await client.storage
    .from(KYC_BUCKET)
    .upload(storagePath, compressed, { cacheControl: '3600', upsert: false, contentType });

  if (uploadError) throw new Error(friendlyKycError(uploadError));

  // Remember the previous object so we can clean it up after a successful swap.
  const { data: previous } = await client
    .from('user_documents')
    .select('storage_path')
    .eq('user_id', userId)
    .eq('doc_type', docType)
    .maybeSingle();

  const { data, error } = await client
    .from('user_documents')
    .upsert(
      {
        user_id: userId,
        doc_type: docType,
        storage_path: storagePath,
        mime_type: contentType,
        file_size: compressed.size,
        original_size: compression.originalSize,
        valid_until: validUntil || null,
        status: 'pending',
        reviewer_note: null,
        reviewed_by: null,
        reviewed_at: null,
      },
      { onConflict: 'user_id,doc_type' },
    )
    .select()
    .single();

  if (error) {
    // Do not leave an orphaned object behind if the row could not be written.
    await client.storage.from(KYC_BUCKET).remove([storagePath]).catch(() => undefined);
    throw new Error(friendlyKycError(error));
  }

  const oldPath = (previous as { storage_path?: string } | null)?.storage_path;
  if (oldPath && oldPath !== storagePath) {
    await client.storage.from(KYC_BUCKET).remove([oldPath]).catch(() => undefined);
  }

  return {
    doc: data as UserDocument,
    compression,
    summary: describeCompression(compression),
  };
}

export async function deleteDocument(client: SupabaseClient, doc: UserDocument): Promise<void> {
  const { error } = await client.from('user_documents').delete().eq('id', doc.id);
  if (error) throw new Error(friendlyKycError(error));
  await client.storage.from(KYC_BUCKET).remove([doc.storage_path]).catch(() => undefined);
}

export async function updateDocumentExpiry(
  client: SupabaseClient,
  docId: string,
  validUntil: string | null,
): Promise<void> {
  const { error } = await client
    .from('user_documents')
    .update({ valid_until: validUntil })
    .eq('id', docId);
  if (error) throw new Error(friendlyKycError(error));
}

/** Hand the pack to the owner for review. Server-side rules re-check everything. */
export async function submitForReview(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc('submit_kyc');
  if (error) throw new Error(friendlyKycError(error));
}

/* ------------------------------------------------------------------ */
/* Avatars                                                             */
/* ------------------------------------------------------------------ */

export async function uploadAvatar(
  client: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  if (!userId) throw new Error('You must be signed in to change your photo.');

  const compression = await compressImage(file, {
    maxWidthOrHeight: 512,
    maxSizeMB: 0.2,
    quality: 0.75,
  });

  const storagePath = `${userId}/avatar_${Date.now()}.jpg`;
  const contentType = compression.file.type || 'image/jpeg';

  const { error: uploadError } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, compression.file, { cacheControl: '3600', upsert: false, contentType });

  if (uploadError) throw new Error(friendlyKycError(uploadError));

  const { data: urlData } = client.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { data: current } = await client
    .from('users')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const { error: updateError } = await client
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    await client.storage.from(AVATAR_BUCKET).remove([storagePath]).catch(() => undefined);
    throw new Error(friendlyKycError(updateError));
  }

  // Drop the previous avatar object, if it lived in our bucket.
  const previousUrl = (current as { avatar_url?: string | null } | null)?.avatar_url;
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const previousPath = previousUrl?.includes(marker) ? previousUrl.split(marker)[1] : null;
  if (previousPath && previousPath !== storagePath) {
    await client.storage.from(AVATAR_BUCKET).remove([previousPath]).catch(() => undefined);
  }

  return publicUrl;
}

/* ------------------------------------------------------------------ */
/* Progress helpers                                                    */
/* ------------------------------------------------------------------ */

export interface VerificationSummary {
  docs: UserDocument[];
  byType: Partial<Record<KycDocumentType, UserDocument>>;
  missingRequired: DocSpec[];
  uploadedCount: number;
  totalCount: number;
  progressPercent: number;
  canSubmit: boolean;
  status: VerificationStatus;
}

export function summarize(
  docs: UserDocument[],
  status: VerificationStatus = 'none',
): VerificationSummary {
  const byType: Partial<Record<KycDocumentType, UserDocument>> = {};
  for (const doc of docs) byType[doc.doc_type] = doc;

  const missingRequired = KYC_DOCS.filter(
    (spec) =>
      spec.required &&
      (!byType[spec.type] || byType[spec.type]?.status === 'rejected'),
  );

  const uploadedCount = KYC_DOCS.filter((spec) => Boolean(byType[spec.type])).length;

  return {
    docs,
    byType,
    missingRequired,
    uploadedCount,
    totalCount: KYC_DOCS.length,
    progressPercent: Math.round((uploadedCount / KYC_DOCS.length) * 100),
    canSubmit: missingRequired.length === 0 && status !== 'pending',
    status,
  };
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  none: 'Not started',
  pending: 'Under review',
  verified: 'Verified',
  rejected: 'Action needed',
};

export function documentStatusLabel(doc?: UserDocument): string {
  if (!doc) return 'Not uploaded';
  if (doc.status === 'approved') return 'Approved';
  if (doc.status === 'rejected') return 'Rejected';
  return 'Awaiting review';
}

/** True when the document's expiry date has passed or is within 30 days. */
export function expiryState(validUntil?: string | null): 'none' | 'expired' | 'expiring' | 'valid' {
  if (!validUntil) return 'none';
  const expiry = new Date(validUntil);
  if (Number.isNaN(expiry.getTime())) return 'none';
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}
