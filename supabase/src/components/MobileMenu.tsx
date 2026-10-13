import React from "react";
import { Link } from "react-router-dom";
import {
  X,
  BookOpen,
  Calculator,
  Info,
  HelpCircle,
  Newspaper,
  Images,
  Lock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems: { label: string; path: string; icon: React.ReactNode }[] = [
  { label: "How It Works", path: "/how-it-works", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Fare Calculator", path: "/tools/fare-calculator", icon: <Calculator className="h-5 w-5" /> },
  { label: "Freight Rate Calculator", path: "/tools/freight-rate-calculator", icon: <Calculator className="h-5 w-5" /> },
  { label: "Return Load Calculator", path: "/tools/return-load-calculator", icon: <Calculator className="h-5 w-5" /> },
  { label: "About", path: "/about", icon: <Info className="h-5 w-5" /> },
  { label: "FAQ", path: "/faq", icon: <HelpCircle className="h-5 w-5" /> },
  { label: "Blog", path: "/blog", icon: <Newspaper className="h-5 w-5" /> },
  { label: "Gallery", path: "/gallery", icon: <Images className="h-5 w-5" /> },
];

const footerItems: { label: string; path: string; icon: React.ReactNode }[] = [
  { label: "Privacy", path: "/privacy", icon: <Lock className="h-4 w-4" /> },
  { label: "Terms", path: "/terms", icon: <FileText className="h-4 w-4" /> },
];

const MobileMenu = React.memo(({ open, onClose }: MobileMenuProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-background/95 dark:bg-[#050816]/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-5 overflow-y-auto px-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-6 press p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent min-h-11 min-w-11 flex items-center justify-center"
        aria-label="Close menu"
      >
        <X className="h-6 w-6" />
      </button>
      {menuItems.map((item, i) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClose}
          style={{ animationDelay: `${i * 35}ms` }}
          className="animate-materialize flex items-center gap-3 text-xl font-bold text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-[color] duration-fast ease-ios"
        >
          <span className="text-orange-500">{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
        {footerItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className="flex items-center gap-1.5 hover:text-foreground dark:hover:text-orange-400 transition-all"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <Link to="/login" onClick={onClose}>
          <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-3 h-auto rounded-lg">
            Sign In
          </Button>
        </Link>
        <Link to="/register" onClick={onClose}>
          <Button className="bg-orange-700 hover:bg-orange-800 text-white text-sm font-bold tracking-wider uppercase px-8 py-3 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
});
MobileMenu.displayName = "MobileMenu";

export default MobileMenu;
