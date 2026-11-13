import { ReactNode } from "react";
import { DishaProvider } from "./Disha";
import { DishaGuideProvider } from "./DishaGuideProvider";
import { MascotInteractionTracker } from "@/hooks/useMascotInteractionTracker";
import { usePageFade } from "@/hooks/usePageFade";
import FreddyWidget from "./FreddyWidget";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pageFadeRef = usePageFade<HTMLElement>();
  return (
    <DishaProvider>
      <DishaGuideProvider>
        <main id="auth-main" ref={pageFadeRef} className="min-h-screen">
          {children}
        </main>
        <FreddyWidget />
        <MascotInteractionTracker />
      </DishaGuideProvider>
    </DishaProvider>
  );
}
