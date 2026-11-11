import { ReactNode } from "react";
import { DishaProvider } from "./Disha";
import { DishaGuideProvider } from "./DishaGuideProvider";
import { MascotInteractionTracker } from "@/hooks/useMascotInteractionTracker";
import FreddyAssistant from "./FreddyAssistant";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <DishaProvider>
      <DishaGuideProvider>
        {children}
        <FreddyAssistant />
        <MascotInteractionTracker />
      </DishaGuideProvider>
    </DishaProvider>
  );
}
