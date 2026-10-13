import { Progress } from '@/components/ui/progress';

interface ProfileProgressBarProps {
  progress: number;
  className?: string;
}

export default function ProfileProgressBar({ progress, className }: ProfileProgressBarProps) {
  return (
    <div className={className ?? ''}>
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Onboarding
        </span>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {progress}%
        </span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
}
