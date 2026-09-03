import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface CreditScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
  factors?: string[];
}

const sizeConfig = {
  sm: { variant: "outline" as const, color: "border-orange-300 dark:border-orange-700", textSize: "text-xs" },
  lg: { variant: "default" as const, color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700", textSize: "text-sm" },
};

const getConfig = (score: number) => {
  if (score >= 800) return { label: "Elite", color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700" };
  if (score >= 650) return { label: "Trusted", color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" };
  if (score >= 500) return { label: "Standard", color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" };
  return { label: "Building", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" };
};

const CreditScoreBadge: React.FC<CreditScoreBadgeProps> = ({ score, size = "sm", factors }) => {
  const sizeCfg = sizeConfig[size] ?? sizeConfig.sm;
  const config = getConfig(score);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={sizeCfg.variant}
            className={`${config.color} ${sizeCfg.textSize} cursor-help`}
          >
            Credit: {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="space-y-1 text-xs">
            <p className="font-semibold">
              {config.label} &mdash; {score}/900
            </p>
            {factors && factors.length > 0 && (
              <div className="space-y-0.5">
                {factors.map((factor, i) => (
                  <div key={i} className="text-muted-foreground">
                    &bull; {factor}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CreditScoreBadge;
