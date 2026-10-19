import { Link } from "react-router-dom";
import { MapPinned, Calculator, MessageCircle, Zap } from "lucide-react";
import { trackInternalCtaClick } from "@/utils/analytics";
import { generateOwnerWhatsAppLink } from "@/utils/whatsapp";

interface TrustItem {
  icon: typeof MapPinned;
  title: string;
  sub: string;
  /** Internal route this item links to. */
  to?: string;
  /** When true, opens the owner WhatsApp instead of an internal route. */
  wa?: boolean;
}

interface TrustStripProps {
  className?: string;
}

/**
 * Trust strip rendered on every public page, directly above the footer.
 *
 * Every claim below is verifiable in-repo:
 *   - 40+ corridors  → supabase/src/data/routes.ts (48 route entries)
 *   - 15+ free tools → supabase/src/pages/public/tools/* (19 tool pages)
 *   - Direct WhatsApp → wa.me to VITE_OWNER_WHATSAPP (the founder's number)
 *   - AI rate estimates → /functions/v1/price-predict backs the calculators
 * Do NOT add "X trucks live" / "Y loads shipped" claims here — there is no
 * real number behind them yet, and fabricated social proof kills trust.
 */
const TRUST_ITEMS: TrustItem[] = [
  { icon: MapPinned, title: "40+ freight corridors", sub: "Rate data on live routes", to: "/routes" },
  { icon: Calculator, title: "15+ free freight tools", sub: "Calculators & checklists", to: "/tools" },
  { icon: Zap, title: "Instant AI rate estimates", sub: "From real shipment data", to: "/tools/fare-calculator" },
  { icon: MessageCircle, title: "Direct WhatsApp support", sub: "Talk to the founder, no call center", wa: true },
];

function TrustTile({ item }: { item: TrustItem }) {
  const { icon: Icon, title, sub } = item;
  const content = (
    <>
      <div className="bg-orange-100 dark:bg-orange-900/30 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-sm text-foreground leading-tight">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </>
  );

  const clickProps = {
    onClick: () =>
      trackInternalCtaClick({ cta_location: "trust_strip", cta_text: title, page_type: "public" }),
  };

  const shell =
    "flex items-start gap-3 rounded-xl p-3 -m-1 hover:bg-background/70 dark:hover:bg-white/5 transition-colors text-left h-full";

  if (item.wa) {
    return (
      <a
        href={generateOwnerWhatsAppLink("Hi, general question about LoadSaathi freight services.")}
        target="_blank"
        rel="noopener noreferrer"
        className={shell}
        {...clickProps}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={item.to as string} className={shell} {...clickProps}>
      {content}
    </Link>
  );
}

export default function TrustStrip({ className = "" }: TrustStripProps) {
  return (
    <section
      className={`bg-muted/50 dark:bg-[#0B1220]/60 border-y border-border dark:border-white/5 ${className}`}
      aria-label="Why shippers use LoadSaathi"
    >
      <div className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {TRUST_ITEMS.map((item) => (
          <TrustTile key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}
