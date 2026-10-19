import { CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatusValue = 'sending' | 'sent' | 'failed';

export function MessageStatus({
  status,
  isRead = false,
  className,
}: {
  status: MessageStatusValue;
  /** When true the recipient has read the message — renders blue ticks. */
  isRead?: boolean;
  className?: string;
}) {
  if (status === 'sending') {
    return <Loader2 className={cn('h-3 w-3 animate-spin text-muted-foreground', className)} aria-label="Sending" />;
  }
  if (status === 'failed') {
    return <AlertCircle className={cn('h-3 w-3 text-destructive', className)} aria-label="Failed to send" />;
  }
  return (
    <CheckCheck
      className={cn('h-3 w-3', isRead ? 'text-blue-500' : 'text-muted-foreground', className)}
      aria-label={isRead ? 'Read' : 'Sent'}
    />
  );
}
