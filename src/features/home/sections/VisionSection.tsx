import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VisionSectionProps {
  globeRef: React.RefObject<HTMLDivElement | null>;
}

const VisionSection = React.memo(({ globeRef }: VisionSectionProps) => (
  <section id="vision" className="fade-section min-h-[716px] flex items-center justify-center relative bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 py-24 overflow-hidden isolate">
    <div className="absolute inset-0 opacity-30 dark:opacity-30 bg-[radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:4px_4px]" />
    <div ref={globeRef} id="globe-container" className="absolute inset-0 z-0" />
    <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center relative z-10 pointer-events-none">
      <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black text-foreground dark:text-white tracking-tighter leading-none mb-6">
        Building the<br />operating system<br />for freight.
      </h2>
      <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
        A future where every load finds its perfect space instantly, transparently, and efficiently.
      </p>
      <div className="mt-12 pointer-events-auto">
        <Link to="/register">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            Join the Network <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
));
VisionSection.displayName = "VisionSection";

export default VisionSection;
