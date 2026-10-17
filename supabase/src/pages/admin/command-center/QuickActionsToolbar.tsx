import { useState } from 'react';
import { Megaphone, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickActionsToolbarProps {
  onlineCount: number;
  onBroadcast?: (message: string) => void;
  onAutoMatch?: () => void;
  onExport?: () => void;
}

export default function QuickActionsToolbar({
  onlineCount,
  onBroadcast,
  onAutoMatch,
  onExport,
}: QuickActionsToolbarProps) {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [message, setMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleSendBroadcast = () => {
    if (!message.trim()) return;
    onBroadcast?.(message.trim());
    setBroadcastSent(true);
    setTimeout(() => {
      setShowBroadcast(false);
      setMessage('');
      setBroadcastSent(false);
    }, 1500);
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1.5 bg-slate-950/95 border border-slate-700/60 rounded-full px-2 py-1.5 backdrop-blur-md shadow-2xl">
        {/* Spacer for timeline */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-full px-3 text-xs gap-1.5 hover:bg-slate-800"
          onClick={() => setShowBroadcast(true)}
        >
          <Megaphone className="h-3.5 w-3.5 text-orange-400" />
          <span className="hidden sm:inline">Broadcast</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-full px-3 text-xs gap-1.5 hover:bg-slate-800"
          onClick={onAutoMatch}
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">Auto-Match</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-full px-3 text-xs gap-1.5 hover:bg-slate-800"
          onClick={onExport}
        >
          <Download className="h-3.5 w-3.5 text-blue-400" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-orange-500" />
              Broadcast Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Send a message to all <span className="font-semibold text-foreground">{onlineCount}</span> online users.
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBroadcast(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendBroadcast} disabled={!message.trim() || broadcastSent}>
                {broadcastSent ? 'Sent!' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
