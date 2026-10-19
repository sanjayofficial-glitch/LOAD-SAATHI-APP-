import imageCompression from 'browser-image-compression';

/**
 * Client-side image compression.
 *
 * Supabase image transformation is a Pro-plan feature, so every byte we save has
 * to be saved in the browser before upload. `browser-image-compression` runs in a
 * Web Worker (MIT licensed, no network calls, no paid service).
 *
 * A 4 MB phone photo of an RC book typically lands around 250-400 KB at 1280px
 * and quality 0.7, which is plenty to read a document number on a phone screen.
 */

export interface CompressOptions {
  /** Longest edge, in pixels. Documents stay legible at 1280. */
  maxWidthOrHeight?: number;
  /** Target size cap in MB. This is a ceiling, not the actual size. */
  maxSizeMB?: number;
  /** JPEG quality 0-1. */
  quality?: number;
}

export interface CompressResult {
  /** The file to upload: compressed when it is an image, the original otherwise. */
  file: File;
  originalSize: number;
  compressedSize: number;
  /** Whole-number percentage saved, 0-100. */
  savedPercent: number;
  /** True when the file was passed through untouched (already an image/PDF that we kept). */
  skipped: boolean;
  /** true when the input was not an image (for example a PDF). */
  notAnImage: boolean;
}

/** Anything above this is refused before we bother the CPU. */
export const MAX_IMAGE_INPUT_BYTES = 12 * 1024 * 1024;
/** PDFs cannot be compressed in the browser, so they get a hard cap. */
export const MAX_PDF_BYTES = 3 * 1024 * 1024;

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidthOrHeight: 1280,
  maxSizeMB: 0.35,
  quality: 0.7,
};

/** Formats the compressor can safely re-encode. */
const COMPRESSIBLE = /^image\/(jpeg|jpg|png|webp|bmp|tiff|heic|heif)$/i;
/** Animated or vector: re-encoding would destroy them. */
const NEVER_REENCODE = /^image\/(gif|svg\+xml)$/i;

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function withJpegExtension(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base || 'photo'}.jpg`;
}

/**
 * Compress an image for upload. Never throws for an uncompressible file — it
 * returns the original with `skipped: true` so the caller can decide.
 *
 * Throws only when the input is too large to accept at all.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { maxWidthOrHeight, maxSizeMB, quality } = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

  if (isPdf) {
    if (originalSize > MAX_PDF_BYTES) {
      throw new Error(
        `This PDF is ${formatBytes(originalSize)}. Please upload a PDF under ${formatBytes(MAX_PDF_BYTES)}, or take a photo instead — photos are compressed automatically.`,
      );
    }
    return { file, originalSize, compressedSize: originalSize, savedPercent: 0, skipped: true, notAnImage: true };
  }

  if (!isImage) {
    throw new Error('Only photos and PDF files can be uploaded.');
  }

  if (originalSize > MAX_IMAGE_INPUT_BYTES) {
    throw new Error(
      `That photo is ${formatBytes(originalSize)}, which is too large to process. Please retake it at a lower resolution.`,
    );
  }

  // Already small enough, or a format we must not re-encode.
  if (originalSize <= maxSizeMB * 1024 * 1024 || NEVER_REENCODE.test(file.type) || !COMPRESSIBLE.test(file.type)) {
    return { file, originalSize, compressedSize: originalSize, savedPercent: 0, skipped: true, notAnImage: false };
  }

  try {
    const output = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality: quality,
      useWebWorker: true,
      fileType: 'image/jpeg',
      preserveExif: false,
      alwaysKeepResolution: false,
    });

    const compressed = new File([output], withJpegExtension(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // Guard against a freak case where "compression" made it bigger.
    if (compressed.size >= originalSize) {
      return { file, originalSize, compressedSize: originalSize, savedPercent: 0, skipped: true, notAnImage: false };
    }

    const savedPercent = Math.max(
      0,
      Math.round((1 - compressed.size / Math.max(originalSize, 1)) * 100),
    );

    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
      savedPercent,
      skipped: false,
      notAnImage: false,
    };
  } catch {
    // Never block an upload because the compressor choked on an exotic format.
    return { file, originalSize, compressedSize: originalSize, savedPercent: 0, skipped: true, notAnImage: false };
  }
}

/** Human summary like "4.2 MB → 310 KB · 93% smaller". */
export function describeCompression(result: CompressResult): string {
  if (result.skipped || result.savedPercent <= 0) {
    return `${formatBytes(result.originalSize)} · already optimised`;
  }
  return `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} · ${result.savedPercent}% smaller`;
}
