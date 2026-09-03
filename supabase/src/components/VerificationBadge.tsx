import React from "react";
import { ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  isVerified?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default React.memo(function VerificationBadge({ isVerified, className = "", size = "sm" }: VerificationBadgeProps) {
  if (!isVerified) return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padding = size === "sm" ? "p-0.5" : "p-1";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${padding} rounded-full bg-blue-100 dark:bg-blue-900/40 ${className}`}>
            <ShieldCheck className={`${iconSize} text-blue-600 dark:text-blue-400`} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified User</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
})
