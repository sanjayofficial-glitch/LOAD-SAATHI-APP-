import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Trash2, Upload, ArrowUp, ArrowDown, ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'fleet', label: 'Fleet' },
  { value: 'office', label: 'Office' },
  { value: 'team', label: 'Team' },
  { value: 'corridors', label: 'Corridors' },
  { value: 'operations', label: 'Operations' },
  { value: 'events', label: 'Events' },
] as const;

interface GalleryImage {
  id: string;
  storage_path: string;
  title: string | null;
  caption: string | null;
  category: string;
  sort_order: number;
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
}

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

export default function GalleryManager() {
  const { getToken } = useClerkAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [category, setCategory] = useState<string>('fleet');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = useCallback((type: 'success' | 'error', text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 5000);
  }, []);

  const getClient = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    return createClerkSupabaseClient(token);
  }, [getToken]);

  const fetchImages = useCallback(async () => {
    try {
      const client = await getClient();
      const { data, error } = await client
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Failed to fetch images:', err);
      showStatus('error', 'Failed to load gallery images.');
    } finally {
      setLoading(false);
    }
  }, [getClient, showStatus]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const getPublicUrl = (storagePath: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // storage_path may or may not include a subfolder prefix — use it as-is
    return `${supabaseUrl}/storage/v1/object/public/gallery/${storagePath}`;
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const maxDim = 1920;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.src = url;
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setStatus(null);

    try {
      const client = await getClient();
      let uploadedCount = 0;
      let updatedCount = 0;

      for (const rawFile of Array.from(files)) {
        const file = await resizeImage(rawFile);
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = file.name.replace(/\.[^.]+$/, '');
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await client.storage
          .from('gallery')
          .upload(path, file, { contentType: file.type, upsert: false });
        // Note: path is relative to the bucket root (no "gallery/" prefix)
        if (uploadError) throw uploadError;

        // Check for duplicate by title
        const { data: existing } = await client
          .from('gallery_images')
          .select('id, storage_path')
          .eq('title', title || fileName)
          .limit(1);

        if (existing && existing.length > 0) {
          // Update existing entry instead of creating duplicate
          const oldPath = existing[0]?.storage_path;
          await client.rpc('upsert_gallery_image', {
            p_id: existing[0]?.id,
            p_storage_path: path,
            p_title: title || fileName,
            p_caption: caption || null,
            p_category: category,
            p_file_size: file.size,
          });
          // Remove old file from storage
          try {
            await client.storage.from('gallery').remove([oldPath]);
          } catch { /* old file may not exist */ }
          updatedCount++;
        } else {
          // Insert new entry
          const maxOrder = Math.max(0, ...images.map(i => i.sort_order));
          const { error: insertError } = await client.rpc('upsert_gallery_image', {
            p_storage_path: path,
            p_title: title || fileName,
            p_caption: caption || null,
            p_category: category,
            p_sort_order: maxOrder + 1 + uploadedCount,
            p_file_size: file.size,
          });
          if (insertError) throw insertError;
          uploadedCount++;
        }
      }

      setTitle('');
      setCaption('');
      await fetchImages();

      const parts: string[] = [];
      if (uploadedCount > 0) parts.push(`${uploadedCount} uploaded`);
      if (updatedCount > 0) parts.push(`${updatedCount} updated`);
      showStatus('success', parts.join(', ') || 'Done');
    } catch (err) {
      console.error('Upload failed:', err);
      showStatus('error', `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(`Delete "${image.title || 'untitled'}"? This cannot be undone.`)) return;
    try {
      const client = await getClient();
      // Remove from storage (ignore errors if file doesn't exist)
      try {
        await client.storage.from('gallery').remove([image.storage_path]);
      } catch { /* file may not exist */ }
      // Remove from database
      const { error } = await client.rpc('delete_gallery_image', { p_id: image.id });
      if (error) throw error;
      setImages(prev => prev.filter(i => i.id !== image.id));
      showStatus('success', 'Image deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      showStatus('error', `Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleReorder = async (image: GalleryImage, direction: 'up' | 'down') => {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(i => i.id === image.id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    if (!a || !b) return;
    const client = await getClient();
    const { error } = await client.rpc('reorder_gallery_images', {
      p_ids: [a.id, b.id],
      p_orders: [b.sort_order, a.sort_order],
    });
    if (error) {
      console.error('Reorder failed:', error);
      showStatus('error', 'Reorder failed');
      return;
    }
    await fetchImages();
  };

  const handleImageError = (imageId: string) => {
    setBrokenImages(prev => new Set(prev).add(imageId));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gallery Manager</h1>
        <p className="text-muted-foreground mt-1">Upload, organize, and manage your photo gallery.</p>
      </div>

      {/* Status message */}
      {status && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium',
          status.type === 'success'
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
        )}>
          {status.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {status.text}
        </div>
      )}

      {/* Upload zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          dragOver ? 'border-orange-500 bg-orange-500/10' : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — max 1920px, auto-resized</p>
      </div>

      {/* Metadata inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Title (optional)</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Image title" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Caption (optional)</label>
          <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Description" />
        </div>
      </div>

      {/* Image grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No images yet. Upload some to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.sort((a, b) => a.sort_order - b.sort_order).map((image) => (
            <div key={image.id} className="group relative rounded-lg overflow-hidden bg-muted">
              {brokenImages.has(image.id) ? (
                <div className="w-full aspect-square flex items-center justify-center bg-muted text-muted-foreground">
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Image not found</p>
                  </div>
                </div>
              ) : (
                <img
                  src={getPublicUrl(image.storage_path)}
                  alt={image.title || 'Gallery image'}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                  onError={() => handleImageError(image.id)}
                />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-orange-500/80 text-white px-2 py-0.5 rounded-full">
                    {image.category}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:text-orange-400"
                      onClick={() => handleReorder(image, 'up')}
                      disabled={images.indexOf(image) === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:text-orange-400"
                      onClick={() => handleReorder(image, 'down')}
                      disabled={images.indexOf(image) === images.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:text-red-400"
                      onClick={() => handleDelete(image)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {image.title && (
                  <p className="text-white text-xs font-medium truncate">{image.title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
