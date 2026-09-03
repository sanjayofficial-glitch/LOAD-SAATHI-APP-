import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryImage {
  id: string;
  storage_path: string;
  title: string | null;
  caption: string | null;
  category: string;
  sort_order: number;
}

interface ExpandableGalleryProps {
  images: GalleryImage[];
  getImageUrl: (storagePath: string) => string;
  className?: string;
  maxVisible?: number;
}

export function ExpandableGallery({
  images,
  getImageUrl,
  className = '',
  maxVisible = 6,
}: ExpandableGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const visibleImages = images.slice(0, maxVisible);
  const currentImage = selectedIndex !== null ? visibleImages[selectedIndex] : undefined;

  const openImage = (index: number) => setSelectedIndex(index);
  const closeImage = () => setSelectedIndex(null);

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % visibleImages.length);
    }
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + visibleImages.length) % visibleImages.length);
    }
  };

  const getFlexValue = (index: number) => {
    if (hoveredIndex === null) return 1;
    return hoveredIndex === index ? 2.5 : 0.6;
  };

  if (visibleImages.length === 0) return null;

  return (
    <div className={className}>
      {/* Horizontal Expandable Gallery */}
      <div className="flex gap-2 h-64 sm:h-80 md:h-96 w-full">
        {visibleImages.map((image, index) => (
          <motion.div
            key={image.id}
            className="relative cursor-pointer overflow-hidden rounded-xl"
            style={{ flex: 1 }}
            animate={{ flex: getFlexValue(index) }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => openImage(index)}
          >
            <img
              src={getImageUrl(image.storage_path)}
              alt={image.title || `Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay on non-hovered */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredIndex === index ? 0 : 0.35 }}
              transition={{ duration: 0.3 }}
            />
            {/* Title overlay on hover */}
            <AnimatePresence>
              {hoveredIndex === index && image.title && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                >
                  <p className="text-white font-semibold text-sm sm:text-base">{image.title}</p>
                  {image.caption && (
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{image.caption}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={closeImage}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full p-2"
              onClick={closeImage}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous */}
            {visibleImages.length > 1 && (
              <button
                className="absolute left-2 sm:left-4 z-10 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full p-2 sm:p-3"
                onClick={goToPrev}
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Image */}
            <motion.div
              className="relative max-w-6xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedIndex}
                  src={currentImage ? getImageUrl(currentImage.storage_path) : undefined}
                  alt={currentImage?.title || `Gallery image ${selectedIndex + 1}`}
                  className="w-full h-full object-contain rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {/* Title + caption in lightbox */}
              {(currentImage?.title || currentImage?.caption) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg"
                >
                  {currentImage?.title && (
                    <p className="text-white font-semibold">{currentImage.title}</p>
                  )}
                  {currentImage?.caption && (
                    <p className="text-white/70 text-sm mt-0.5">{currentImage.caption}</p>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Next */}
            {visibleImages.length > 1 && (
              <button
                className="absolute right-2 sm:right-4 z-10 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full p-2 sm:p-3"
                onClick={goToNext}
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              {selectedIndex + 1} / {visibleImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
