import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Trash2, Upload, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
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

export default function GalleryManager() {
  const { getToken } = useClerkAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [category, setCategory] = useState<string>('fleet');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const getPublicUrl = (storagePath: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
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

    try {
      const client = await getClient();
      for (const rawFile of Array.from(files)) {
        const file = await resizeImage(rawFile);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await client.storage
          .from('gallery')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        const maxOrder = Math.max(0, ...images.map(i => i.sort_order));
        const { error: insertError } = await client.rpc('upsert_gallery_image', {
          p_storage_path: path,
          p_title: title || file.name.replace(/\.[^.]+$/, ''),
          p_caption: caption || null,
          p_category: category,
          p_sort_order: maxOrder + 1,
          p_file_size: file.size,
        });
        if (insertError) throw insertError;
      }
      setTitle('');
      setCaption('');
      await fetchImages();
    } catch (err) {
      console.error('Upload failed:', err);
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
      await client.storage.from('gallery').remove([image.storage_path]);
      await client.rpc('delete_gallery_image', { p_image_id: image.id });
      setImages(prev => prev.filter(i => i.id !== image.id));
    } catch (err) {
      console.error('Delete failed:', err);
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
    await client.rpc('reorder_gallery_images', {
      p_ids: [a.id, b.id],
      p_sort_orders: [b.sort_order, a.sort_order],
    });
    await fetchImages();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gallery Manager</h1>
        <p className="text-muted-foreground mt-1">Upload, organize, and manage your photo gallery.</p>
      </div>

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
              <img
                src={getPublicUrl(image.storage_path)}
                alt={image.title || 'Gallery image'}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
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
