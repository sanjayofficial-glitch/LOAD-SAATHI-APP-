import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ImageIcon, X, Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

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
    // storage_path may or may not include a subfolder prefix — use it as-is
    return `${supabaseUrl}/storage/v1/object/public/gallery/${storagePath}`;
  };

  const handleImageError = (imageId: string) => {
    setBrokenImages(prev => new Set(prev).add(imageId));
  };

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

        {/* Masonry Grid */}
        <section className="px-6 sm:px-12 pb-24">
          <div className="max-w-[1440px] mx-auto">
            {loading ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="break-inside-avoid bg-muted rounded-xl animate-pulse aspect-[4/3]" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-24 glass-card p-8 rounded-xl border-border dark:border-white/[0.08]">
                <Camera className="h-16 w-16 mx-auto mb-4 text-orange-500/60" />
                <p className="text-lg font-semibold text-foreground dark:text-white mb-1">No images in this category yet.</p>
                <p className="text-sm text-muted-foreground mb-6">Check back soon — we&apos;re building our visual story.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/contact">
                    <Button variant="outline" size="sm" className="text-xs font-bold tracking-wider uppercase border-border text-foreground hover:bg-accent">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative bg-muted border border-border/50 dark:border-white/5 hover:border-orange-500/30 transition-colors"
                    onClick={() => !brokenImages.has(image.id) && setSelectedImage(image)}
                  >
                    {brokenImages.has(image.id) ? (
                      <div className="w-full aspect-[4/3] flex items-center justify-center bg-muted text-muted-foreground">
                        <div className="text-center p-4">
                          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Image not available</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getPublicUrl(image.storage_path)}
                        alt={`${image.title || image.category} — ${image.caption || 'gallery'} | LoadSaathi`}
                        className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        loading="lazy"
                        onError={() => handleImageError(image.id)}
                      />
                    )}
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
              {selectedImage && !brokenImages.has(selectedImage.id) && (
                <>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-black/50 rounded-full h-11 w-11 flex items-center justify-center transition-colors"
                    aria-label="Close image"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <img
                    src={getPublicUrl(selectedImage.storage_path)}
                    alt={`${selectedImage.title || selectedImage.category} — ${selectedImage.caption || 'gallery'} | LoadSaathi`}
                    className="w-full max-h-[80vh] object-contain"
                    onError={() => handleImageError(selectedImage.id)}
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
      <noscript>
        <div style={{maxWidth:960, margin:'0 auto', padding:24}}>
          <h1>LoadSaathi — Our Story in Pictures</h1>
          <p>See LoadSaathi in action — our fleet, offices, corridors, and the team behind India's smart freight marketplace.</p>
          <h2>Gallery Categories</h2>
          <ul>
            <li><strong>Fleet</strong> — Our trucks and vehicles in action across Indian highways.</li>
            <li><strong>Office</strong> — The LoadSaathi workspace where technology meets logistics.</li>
            <li><strong>Team</strong> — The people powering India's freight revolution.</li>
            <li><strong>Corridors</strong> — Key freight routes connecting major economic hubs.</li>
            <li><strong>Operations</strong> — Behind-the-scenes platform operations.</li>
            <li><strong>Events</strong> — Conferences, launches, and community gatherings.</li>
          </ul>
          <h2>Visit LoadSaathi</h2>
          <p>LoadSaathi is India's AI-powered freight matching platform connecting shippers with truckers for FTL, PTL, and part-load freight across 50,000+ pin codes. Explore our visual story at <a href="https://loadsaathi.in">loadsaathi.in</a>.</p>
        </div>
      </noscript>
    </>
  );
}

const ImageGallerySchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "LoadSaathi Gallery — Our Story in Pictures",
  description: "See LoadSaathi in action — our fleet, offices, corridors, and the team behind India's smart freight marketplace.",
  url: "https://loadsaathi.in/gallery",
  isPartOf: { "@type": "WebSite", name: "LoadSaathi", url: "https://loadsaathi.in" },
};
