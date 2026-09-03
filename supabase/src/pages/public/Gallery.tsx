import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExpandableGallery } from '@/components/ui/gallery-animation';
import { ImageIcon, X } from 'lucide-react';
import SeoMeta from '@/components/SeoMeta';

const CATEGORIES = [
  { value: 'all', label: 'All' },
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
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      let query = supabase
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true });

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    setLoading(true);
    fetchImages();
  }, [fetchImages]);

  const getPublicUrl = (storagePath: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/gallery/${storagePath}`;
  };

  const masonryImages = images;
  const expandableImages = images.slice(0, 6);

  return (
    <>
      <SeoMeta
        title="Gallery — LoadSaathi | Our Story in Pictures"
        description="See LoadSaathi in action — our fleet, offices, corridors, and the team behind India's smart freight marketplace."
        canonical="/gallery"
      />

      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className="pt-32 pb-16 px-6 sm:px-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground dark:text-white mb-4">
            Our Story in Pictures
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From fleet operations to corridor routes — see the people and infrastructure powering India&apos;s freight network.
          </p>
        </section>

        {/* Filter tabs */}
        <div className="px-6 sm:px-12 mb-10">
          <div className="max-w-[1440px] mx-auto">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="bg-muted/50 dark:bg-white/5 border border-border dark:border-white/10 p-1 h-auto flex-wrap">
                {CATEGORIES.map(cat => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white px-4 py-2 text-sm"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Expandable Gallery Row */}
        {!loading && expandableImages.length > 0 && (
          <section className="px-6 sm:px-12 mb-16">
            <div className="max-w-[1440px] mx-auto">
              <ExpandableGallery
                images={expandableImages}
                getImageUrl={getPublicUrl}
                className="w-full"
                maxVisible={6}
              />
            </div>
          </section>
        )}

        {/* Masonry Grid */}
        <section className="px-6 sm:px-12 pb-24">
          <div className="max-w-[1440px] mx-auto">
            {loading ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="break-inside-avoid bg-muted rounded-xl animate-pulse aspect-[4/3]" />
                ))}
              </div>
            ) : masonryImages.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No images in this category yet.</p>
                <p className="text-sm mt-1">Check back soon — we&apos;re building our visual story.</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {masonryImages.map((image) => (
                  <div
                    key={image.id}
                    className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative bg-muted border border-border/50 dark:border-white/5 hover:border-orange-500/30 transition-colors"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={getPublicUrl(image.storage_path)}
                      alt={image.title || 'Gallery image'}
                      className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      loading="lazy"
                    />
                    {(image.title || image.caption) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {image.title && (
                          <p className="text-white font-semibold text-sm">{image.title}</p>
                        )}
                        {image.caption && (
                          <p className="text-white/70 text-xs mt-0.5">{image.caption}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Masonry Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0 overflow-hidden">
          {selectedImage && (
            <>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-black/50 rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={getPublicUrl(selectedImage.storage_path)}
                alt={selectedImage.title || 'Gallery image'}
                className="w-full max-h-[80vh] object-contain"
              />
              {(selectedImage.title || selectedImage.caption) && (
                <div className="p-4 text-white">
                  {selectedImage.title && (
                    <p className="font-semibold">{selectedImage.title}</p>
                  )}
                  {selectedImage.caption && (
                    <p className="text-white/60 text-sm mt-1">{selectedImage.caption}</p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
