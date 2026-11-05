import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/utils/imageCompress';
import {
  KYC_DOCS,
  deleteDocument,
  documentStatusLabel,
  expiryState,
  friendlyKycError,
  getSignedDocumentUrl,
  listDocuments,
  summarize,
  submitForReview,
  updateDocumentExpiry,
  uploadDocument,
  type DocSpec,
} from '@/utils/kyc';
import type { KycDocumentType, UserDocument } from '@/types';
import {
  AlertTriangle,
  Camera,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';

const Verification = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();

  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<KycDocumentType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [expiryDraft, setExpiryDraft] = useState<Record<string, string>>({});
  const [savedBytes, setSavedBytes] = useState(0);

  // Two hidden inputs: one that can reach the camera, one that opens the gallery.
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<KycDocumentType | null>(null);

  const userId = userProfile?.id;
  const status = userProfile?.verification_status || 'none';

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const client = await getAuthenticatedClient();
      const rows = await listDocuments(client, userId);
      setDocs(rows);

      const nextExpiry: Record<string, string> = {};
      const nextSaved: Record<string, number> = {};
      for (const row of rows) {
        nextExpiry[row.id] = row.valid_until || '';
        if (row.original_size && row.file_size && row.original_size > row.file_size) {
          nextSaved[row.id] = row.original_size - row.file_size;
        }
      }
      setExpiryDraft(nextExpiry);
      setSavedBytes(Object.values(nextSaved).reduce((sum, v) => sum + v, 0));

      // Preview URLs for image documents only.
      const imageRows = rows.filter((row) => (row.mime_type || '').startsWith('image/'));
      const urls = await Promise.all(
        imageRows.map(async (row) => [row.id, await getSignedDocumentUrl(client, row.storage_path)] as const),
      );
      const urlMap: Record<string, string> = {};
      for (const [id, url] of urls) if (url) urlMap[id] = url;
      setSignedUrls(urlMap);
    } catch (err) {
      showError(friendlyKycError(err));
    } finally {
      setLoading(false);
    }
  }, [userId, getAuthenticatedClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarize(docs, status), [docs, status]);

  const openPicker = (type: KycDocumentType, preferCamera: boolean) => {
    pendingTypeRef.current = type;
    const input = preferCamera ? cameraInputRef.current : fileInputRef.current;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleFileChosen = async (file: File | undefined) => {
    const type = pendingTypeRef.current;
    pendingTypeRef.current = null;
    if (!file || !type || !userId) return;

    setUploading(type);
    try {
      const client = await getAuthenticatedClient();
      const result = await uploadDocument(client, userId, type, file, expiryDraft[type] || null);
      if (result.compression.savedPercent > 0) {
        showSuccess(`Saved: ${result.summary}`);
      } else {
        showSuccess('Document uploaded. It is now waiting for review.');
      }
      await load();
    } catch (err) {
      showError(friendlyKycError(err));
    } finally {
      setUploading(null);
    }
  };

  const handleExpiryChange = async (docId: string, value: string) => {
    setExpiryDraft((prev) => ({ ...prev, [docId]: value }));
    try {
      const client = await getAuthenticatedClient();
      await updateDocumentExpiry(client, docId, value || null);
    } catch (err) {
      showError(friendlyKycError(err));
    }
  };

  const handleRemove = async (docId: string, storagePath: string) => {
    if (!userId) return;
    setRemovingId(docId);
    try {
      const client = await getAuthenticatedClient();
      const target = docs.find((d) => d.id === docId);
      if (target) await deleteDocument(client, target);
      else await client.storage.from('kyc-documents').remove([storagePath]);
      showSuccess('Document removed.');
      await load();
    } catch (err) {
      showError(friendlyKycError(err));
    } finally {
      setRemovingId(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const client = await getAuthenticatedClient();
      await submitForReview(client);
      showSuccess('Submitted. We will review your documents shortly.');
      await refreshProfile();
      await load();
    } catch (err) {
      showError(friendlyKycError(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------- banners ----------------------------- */

  const banner = (() => {
    if (status === 'verified') {
      return (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">Your profile is verified</p>
            <p className="text-sm text-green-700 dark:text-green-400">
              Shippers can see the verified badge on your profile and trips.
              {userProfile?.verified_at
                ? ` Verified on ${new Date(userProfile.verified_at).toLocaleDateString('en-IN')}.`
                : ''}
            </p>
          </div>
        </div>
      );
    }
    if (status === 'pending') {
      return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <Clock className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Under review</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Your documents have been submitted
              {userProfile?.kyc_submitted_at
                ? ` on ${new Date(userProfile.kyc_submitted_at).toLocaleDateString('en-IN')}`
                : ''}
              . You will keep full access while we check them.
            </p>
          </div>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <XCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">More information needed</p>
            {userProfile?.verification_note ? (
              <p className="text-sm text-red-700 dark:text-red-400">
                Reviewer said: &ldquo;{userProfile.verification_note}&rdquo;
              </p>
            ) : null}
            <p className="text-sm text-red-700 dark:text-red-400">
              Please replace the documents mentioned above and submit again.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
        <img
          src="/illustrations/checklist.png"
          alt=""
          draggable={false}
          loading="lazy"
          className="h-12 w-12 object-contain shrink-0"
        />
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-300">Get your verified badge</p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Verified truckers get more shipment requests. Upload the four marked documents below and submit.
          </p>
        </div>
      </div>
    );
  })();

  /* ------------------------------ render ----------------------------- */

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trucker Verification</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Verify your licence and truck once. Documents are visible only to the LoadSaathi owner.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        {banner}

        <Card className="border-orange-100 shadow-sm dark:border-orange-900">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {summary.uploadedCount} of {summary.totalCount} documents added
              </span>
              {savedBytes > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Saved {formatBytes(savedBytes)} by compressing
                </span>
              )}
            </div>
            <Progress value={summary.progressPercent} className="h-2" />
            {summary.missingRequired.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Still needed: {summary.missingRequired.map((d) => d.label).join(', ')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden inputs. `capture` opens the rear camera on Android and most mobile browsers. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFileChosen(e.target.files?.[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => void handleFileChosen(e.target.files?.[0])}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {KYC_DOCS.map((spec: DocSpec) => {
          const doc = summary.byType[spec.type];
          const expiry = doc ? expiryState(doc.valid_until) : 'none';
          const isUploading = uploading === spec.type;

          return (
            <Card
              key={spec.type}
              className={cn(
                'shadow-sm overflow-hidden',
                doc && doc.status === 'rejected'
                  ? 'border-red-200 dark:border-red-900'
                  : 'border-gray-200 dark:border-gray-800',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base text-gray-900 dark:text-white">{spec.label}</CardTitle>
                    <CardDescription className="mt-1 text-xs dark:text-gray-400">{spec.hint}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-[10px]',
                      spec.required
                        ? 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400'
                        : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400',
                    )}
                  >
                    {spec.required ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {doc ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          doc.status === 'approved'
                            ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                            : doc.status === 'rejected'
                              ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                              : 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400',
                        )}
                      >
                        {documentStatusLabel(doc)}
                      </Badge>
                      {doc.file_size ? (
                        <span className="text-[11px] text-gray-400">{(doc.file_size / 1024).toFixed(0)} KB</span>
                      ) : null}
                    </div>

                    {doc.reviewer_note && doc.status === 'rejected' && (
                      <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                        {doc.reviewer_note}
                      </p>
                    )}

                    {signedUrls[doc.id] ? (
                      <a
                        href={signedUrls[doc.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <img
                          src={signedUrls[doc.id]}
                          alt={spec.label}
                          loading="lazy"
                          className="h-32 w-full object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
                        <FileText className="h-4 w-4" />
                        {doc.mime_type === 'application/pdf' ? 'PDF document' : 'Uploaded'}
                      </div>
                    )}

                    {spec.needsExpiry && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Valid until
                        </Label>
                        <Input
                          type="date"
                          value={expiryDraft[doc.id] || ''}
                          onChange={(e) => void handleExpiryChange(doc.id, e.target.value)}
                          className="h-9 dark:bg-gray-900 dark:text-white"
                        />
                        {expiry === 'expired' && (
                          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3.5 w-3.5" /> Expired — please upload the renewed copy.
                          </p>
                        )}
                        {expiry === 'expiring' && (
                          <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" /> Expiring within 30 days.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUploading || status === 'pending'}
                        onClick={() => openPicker(spec.type, Boolean(spec.cameraPreferred))}
                        className="flex-1"
                      >
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2 h-4 w-4" />
                        )}
                        Retake
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removingId === doc.id || status === 'pending'}
                        onClick={() => void handleRemove(doc.id, doc.storage_path)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {removingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 dark:border-gray-700">
                      {isUploading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Compressing and uploading…
                        </span>
                      ) : (
                        'Not uploaded'
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isUploading || status === 'pending'}
                        onClick={() => openPicker(spec.type, Boolean(spec.cameraPreferred))}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2 h-4 w-4" />
                        )}
                        Take photo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUploading || status === 'pending'}
                        onClick={() => openPicker(spec.type, false)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        File
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {status !== 'pending' && status !== 'verified' && (
        <div className="mt-8 flex flex-col gap-3">
          <Button
            onClick={() => void handleSubmit()}
            disabled={!summary.canSubmit || submitting}
            className="w-full bg-orange-600 hover:bg-orange-700 sm:w-auto sm:self-end"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Submit for verification
          </Button>          {!summary.canSubmit && (
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-right">
              Add the required documents to enable submission.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          We only ask for what is needed to prove the truck and licence are genuine. Documents are stored privately,
          shared only with the LoadSaathi owner during review, and served through links that expire in 10 minutes.
          We do not collect Aadhaar.
        </p>
      </div>
    </div>
  );
};

export default Verification;
