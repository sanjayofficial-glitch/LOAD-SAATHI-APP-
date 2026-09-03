import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackQuoteRequested, trackWhatsappClicked, trackRegisterStarted } from "@/utils/analytics";

const SPECIALIST_PHONE = "918328998031";

function buildSpecialistWhatsAppLink(origin: string, destination: string, weight: number, avgPrice: number): string {
  const msg = encodeURIComponent(
    `Hi, I need a freight quote for:\n\n` +
    `📍 ${origin} → ${destination}\n` +
    `⚖️ ${weight} tonnes\n` +
    `💰 Estimate: ₹${avgPrice.toLocaleString("en-IN")}\n\n` +
    `Please share verified truck options.`
  );
  return `https://wa.me/${SPECIALIST_PHONE}?text=${msg}`;
}

interface QuoteLeadCardProps {
  origin: string;
  destination: string;
  weight: number;
  avgPrice: number;
  route?: string;
}

export default function QuoteLeadCard({ origin, destination, weight, avgPrice, route }: QuoteLeadCardProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const routeLabel = route || `${origin} → ${destination}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackQuoteRequested({
      name,
      phone,
      role: "shipper",
      route: routeLabel,
      origin,
      destination,
      weight,
    });
    setSubmitted(true);
  };

  const handleWhatsAppClick = () => {
    trackWhatsappClicked({
      channel: "quote",
      origin,
      destination,
      route: routeLabel,
    });
    window.open(buildSpecialistWhatsAppLink(origin, destination, weight, avgPrice), "_blank");
  };

  const handleRegisterClick = () => {
    trackRegisterStarted({ role: "shipper", source: "fare_calculator" });
  };

  if (submitted) {
    return (
      <div className="mt-6 p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-center animate-fade-in-up">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h4 className="font-bold text-foreground mb-1">Quote Request Received!</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Our freight specialist will contact you on <strong>{phone}</strong> within 2 hours with verified truck options.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleWhatsAppClick} className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold">
            <MessageSquare className="mr-2 h-4 w-4" /> Talk on WhatsApp Now
          </Button>
          <Link to="/register" onClick={handleRegisterClick}>
            <Button variant="outline" className="border-orange-500/30 text-foreground hover:bg-orange-500/5 text-sm font-bold">
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 rounded-xl bg-orange-50/80 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/20">
      <div className="text-center mb-4">
        <h4 className="font-bold text-foreground mb-1">Get Verified Truck Rates</h4>
        <p className="text-sm text-muted-foreground">
          Talk to a freight specialist for the best rate on {routeLabel}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 text-sm"
          />
          <Input
            placeholder="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            pattern="[0-9]{10}"
            className="h-11 text-sm"
          />
        </div>
        <Button type="submit" className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold">
          <Phone className="mr-2 h-4 w-4" /> Request Verified Quote
        </Button>
      </form>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-orange-200 dark:border-orange-800/30" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-background text-muted-foreground">or</span>
        </div>
      </div>

      <Button onClick={handleWhatsAppClick} variant="outline" className="w-full h-11 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 text-sm font-bold">
        <MessageSquare className="mr-2 h-4 w-4" /> Chat on WhatsApp Now
      </Button>
    </div>
  );
}
