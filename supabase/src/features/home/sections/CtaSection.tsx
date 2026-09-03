import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CtaSection = React.memo(() => (
  <section className="fade-section py-32 relative overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
    <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
      <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
        <div className="bg-orange-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Truck className="h-8 w-8 text-orange-400" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Ready to Transform Your Freight?</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">Join India&apos;s intelligent freight network. Sign up as a shipper or trucker and start optimizing today.</p>
        <div className="space-y-4">
          <Link to="/register?type=shipper" className="block">
            <Button className="w-full bg-orange-700 hover:bg-orange-800 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <Package className="mr-2 h-5 w-5" /> I Want to Ship Goods
            </Button>
          </Link>
          <Link to="/register?type=trucker" className="block">
            <Button variant="outline" className="w-full text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg border-border text-foreground hover:bg-accent">
              <Truck className="mr-2 h-5 w-5" /> I Have Truck Space
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground pt-4">
            Already have an account? <Link to="/login" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  </section>
));
CtaSection.displayName = "CtaSection";

export default CtaSection;
