import { useState } from 'react';
import { useVoiceGuide } from '@/contexts/AudioGuideContext';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface VoiceGuideProps {
  screenKey: string;
  className?: string;
}

const VoiceGuide = ({ screenKey, className = '' }: VoiceGuideProps) => {
  const [enabled, setEnabled] = useState(true);
  useVoiceGuide(screenKey, enabled);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setEnabled((prev: boolean) => !prev)}
      className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full ${className}`}
      aria-label={enabled ? 'Mute voice guidance' : 'Unmute voice guidance'}
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
    </Button>
  );
};

export default VoiceGuide;
