import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, MessageCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { odishaCityOptions } from "@/data/odishaHubs";
import { trackQuoteRequested, trackWhatsappClicked } from "@/utils/analytics";
import { generateOwnerWhatsAppLink } from "@/utils/whatsapp";
import { attributionSuffix } from "@/utils/leadAttribution";

/**
 * OdishaLeadWidget — mobile-first, additive lead-capture card.
 *
 * Embed on any Odisha page (hub pages, location pages, route pages) without
 * touching H1s or existing body copy. Two instant actions:
 *   1. "Get Instant Odisha Rate" → /tools/fare-calculator?from=…&to=…
 *      (deep-link prefill; lead recorded when a phone is provided)
 *   2. "WhatsApp Dispatch" → wa.me/+91-83289-98031 with the route pre-filled
 *
 * Reuses the app's existing lead pipeline (lib/leadCapture), WhatsApp helper
 * (utils/whatsapp) and analytics trackers — no new backend surface.
 */

export const ODISHA_TRUCK_TYPES = [
  "PTL 1–15 Ton",
  "14ft Eicher",
  "19ft / 22ft Open or Container",
  "32ft MXL Container",
  "12-Wheeler Taurus (21T–25T)",
  "Return Load Truck",
] as const;

interface OdishaLeadWidgetProps {
  /** Default pickup city for this page (e.g. the current hub name). */
  defaultOrigin?: string;
  /** Short label logged with the lead, e.g. "odisha_hub_kalinganagar". */
  leadSource?: string;
}

const INPUT_CLASS =
  "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-[border-color,box-shadow,background-color] duration-fast ease-ios placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function OdishaLeadWidget({
  defaultOrigin = "",
  leadSource = "odisha_lead_widget",
}: OdishaLeadWidgetProps) {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState("");
  const [truckType, setTruckType] = useState<string>(ODISHA_TRUCK_TYPES[0]);
  const [phone, setPhone] = useState("");

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits);

  const routeLabel = origin && destination ? `${origin} → ${destination}` : "";
  const hasRoute = Boolean(origin && destination);

  const leadMessage = (): string =>
    [
      routeLabel ? `Route: ${routeLabel}` : "Route: (not set — from the website)",
      `Truck/Load type: ${truckType}`,
      phoneDigits ? `Phone: +91-${phoneDigits}` : "",
      `Page: ${window.location.pathname}`,
    ]
      .filter(Boolean)
      .join("\n") + attributionSuffix();

  // Best-effort insert — same lazy pattern as QuoteLeadCard so the Supabase
  // client chunk only lands when a capture point is actually used.
  const captureLead = (source: string): void => {
    if (!phoneDigits) return;
    import("@/lib/leadCapture")
      .then((m) =>
        m.insertLead({
          phone: phoneDigits,
          name: "",
          source,
          page_path: window.location.pathname,
          user_id: "",
          message: leadMessage(),
        })
      )
      .catch(() => {
        // swallow — WhatsApp navigation must always proceed
      });
  };

  const handleInstantRate = (): void => {
    if (hasRoute) {
      trackQuoteRequested({ origin, destination, role: "shipper" });
      captureLead(leadSource);
      navigate(`/tools/fare-calculator?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`);
      return;
    }
    trackQuoteRequested({ role: "shipper" });
    navigate("/tools/fare-calculator");
  };

  const handleWhatsAppDispatch = (): void => {
    const text = [
      "Hi, I need an Odisha truck rate:",
      routeLabel ? `Route: ${routeLabel}` : "Route: (need help choosing)",
      `Truck/Load type: ${truckType}`,
      phoneDigits ? `My number: +91-${phoneDigits}` : "",
      `\nPlease share a verified quote.`,
    ]
      .filter(Boolean)
      .join("\n");
    trackWhatsappClicked({
      channel: "owner",
      origin: origin || undefined,
      destination: destination || undefined,
      route: routeLabel || undefined,
    });
    captureLead("odisha_wa_quick");
    window.open(generateOwnerWhatsAppLink(text), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="glass-card rounded-xl border border-border p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <h3 className="text-lg font-bold text-foreground">Get an Instant Odisha Rate</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Pickup City (Odisha)
          </span>
          <select
            aria-label="Pickup city in Odisha"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select pickup city…</option>
            {odishaCityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Drop City
          </span>
          <select
            aria-label="Drop city"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select drop city…</option>
            {odishaCityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Truck / Load Type
          </span>
          <select
            aria-label="Truck or load type"
            value={truckType}
            onChange={(e) => setTruckType(e.target.value)}
            className={INPUT_CLASS}
          >
            {ODISHA_TRUCK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Mobile / WhatsApp Number
          </span>
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile"
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="h-11"
            aria-invalid={phone.length > 0 && !phoneValid}
          />
          {phone.length > 0 && !phoneValid && (
            <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
              Enter a valid 10-digit Indian mobile number.
            </span>
          )}
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <Button
          onClick={handleInstantRate}
          className="h-12 bg-orange-600 hover:bg-orange-700 text-white text-sm"
        >
          Get Instant Odisha Rate <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleWhatsAppDispatch}
          variant="outline"
          className="h-12 border-green-600/40 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp Dispatch (+91-83289-98031)
        </Button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        No broker commission · KYC-verified Odisha fleet · E-Way Bill–ready
      </p>
    </div>
  );
}
