import { ReactNode } from "react";
import { DishaProvider, Disha } from "./Disha";
import { DishaGuideProvider } from "./DishaGuideProvider";
import { MascotInteractionTracker } from "@/hooks/useMascotInteractionTracker";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <DishaProvider>
      <DishaGuideProvider>
        {children}
        <Disha accent="orange" size="lg" />
        <MascotInteractionTracker />
      </DishaGuideProvider>
    </DishaProvider>
  );
}
