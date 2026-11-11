import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Phone, CheckCircle, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  trackQuoteRequested,
  trackWhatsappClicked,
  trackRegisterStarted,
  trackQuoteFormStart,
  trackQuoteFormSubmit,
  trackQuoteFormSuccess,
} from "@/utils/analytics";
import { generateOwnerWhatsAppLink } from "@/utils/whatsapp";
import { attributionSuffix } from "@/utils/leadAttribution";

interface QuoteLeadCardProps {
  origin?: string;
  destination?: string;
  /** Cargo weight in tonnes. Omitted on pages that don't know it (e.g. route pages). */
  weight?: number;
  /** Estimate rendered to the user and pre-filled into WhatsApp. Priced per `priceUnit`. */
  avgPrice?: number;
  /** Unit for `avgPrice` — e.g. "tonne" (per-tonne rate) or "trip" (full-truck per-trip rate). */
  priceUnit?: string;
  /** Optional ready-made route label; defaults to `origin → destination`. */
  route?: string;
}

/**
 * Lead-capture card used on rate/route/tool pages.
 *
 * Flow (matches PLAN-LEAD-CONVERSION Phase A1 decisions):
 *   1. Soft gate — plain 10-digit phone, no OTP.
 *   2. Submit → best-effort INSERT into public.leads (source: quote_lead_card),
 *      never blocking the UI. Without this insert the lead is lost, so the
 *      insert is attempted synchronously with the optimistic success screen.
 *   3. Success screen → WhatsApp hand-off with the route context pre-filled,
 *      plus register fallback.
 *   4. "or" quick path → lead insert again (source: quote_wa_quick) before
 *      opening WhatsApp, so quick chatters are recorded too.
 */
export default function QuoteLeadCard({ origin, destination, weight, avgPrice, priceUnit, route }: QuoteLeadCardProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const formStarted = useRef(false);

  const hasRoute = Boolean(route || (origin && destination));
  const routeLabel = route || (origin && destination ? `${origin} → ${destination}` : "");
  const weightLine = weight && weight > 0 ? `${weight} tonnes` : "";
  const estimateLine = avgPrice && avgPrice > 0 ? `₹${avgPrice.toLocaleString("en-IN")}${priceUnit ? ` / ${priceUnit}` : ""}` : "";

  // Context rows included in the lead record and the WhatsApp pre-fill, so the
  // founder sees exactly what the visitor was looking at.
  const contextRows = [
    routeLabel ? `Route: ${routeLabel}` : "Route: (not set — from the website)",
    weightLine ? `Weight: ${weightLine}` : "",
    estimateLine ? `Estimate shown: ${estimateLine}` : "",
    `Page: ${window.location.pathname}`,
  ].filter(Boolean);

  const buildLeadMessage = (): string => {
    const who = [name, phone].filter(Boolean).join(" | ");
    return (
      contextRows.join("\n") +
      (who ? `\nName/phone: ${who}` : "") +
      attributionSuffix()
    );
  };

  const buildWhatsAppText = (): string => {
    const who = [name, phone].filter(Boolean).join(" | ");
    return (
      `Hi, I need truck options:\n\n` +
      contextRows.join("\n") +
      (who ? `\nMe: ${who}` : "") +
      `\n\nPlease share verified truck options.`
    );
  };

  // Best-effort insert — lazy-loaded like FloatingWhatsAppButton so the
  // Supabase client chunk only lands when a capture point is actually used.
  const captureLead = (source: string): void => {
    import("@/lib/leadCapture")
      .then((m) =>
        m.insertLead({
          phone: phone,
          name: name,
          source: source,
          page_path: window.location.pathname,
          user_id: "",
          message: buildLeadMessage(),
          // Optional — when filled, the leads trigger fires the instant
          // quote email (migration 20261019140001).
          email: email.trim() || undefined,
        })
      )
      .catch(() => {
        // Insert failed — the WhatsApp hand-off below is the second chance.
      });
  };

  const handleFormFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackQuoteFormStart({ origin, destination, weight });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    captureLead("quote_lead_card");
    trackQuoteFormSubmit({ origin, destination, weight });
    trackQuoteRequested({
      role: "shipper",
      route: routeLabel || undefined,
      origin: origin || undefined,
      destination: destination || undefined,
      weight,
    });
    trackQuoteFormSuccess({ origin, destination, weight });
    setSubmitted(true);
  };

  const handleWhatsAppClick = () => {
    // Quick chatters are leads too — record them before the tab hand-off.
    captureLead("quote_wa_quick");
    trackWhatsappClicked({
      channel: "quote",
      origin: origin || "",
      destination: destination || "",
      route: routeLabel,
    });
    window.open(generateOwnerWhatsAppLink(buildWhatsAppText()), "_blank", "noopener,noreferrer");
  };

  const handleRegisterClick = () => {
    trackRegisterStarted({ role: "shipper", source: "quote_lead_card" });
  };

  if (submitted) {
    return (
      <div className="mt-6 p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-center animate-fade-in-up">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h4 className="font-bold text-foreground mb-1">Request Received!</h4>
        <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1.5">
          <Clock className="h-4 w-4 inline text-green-600 dark:text-green-400" />
          Expected reply on <strong>{phone}</strong> within 2 hours.
        </p>
        {email && (
          <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1.5">
            <Mail className="h-4 w-4 inline text-green-600 dark:text-green-400" />
            Written quote on its way to <strong>{email}</strong>.
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-4">
          Don't want to wait? Reach us directly on WhatsApp now.
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
        <h4 className="font-bold text-foreground mb-1">
          {hasRoute ? `Get Trucks for ${routeLabel}` : "Get Trucks for Your Route"}
        </h4>
        <p className="text-sm text-muted-foreground">
          Share your load — get verified truck options on WhatsApp within 2 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} onFocus={handleFormFocus} className="space-y-3 mb-4">
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
        <Input
          placeholder="Email (optional — get the written quote too)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 text-sm"
        />
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
