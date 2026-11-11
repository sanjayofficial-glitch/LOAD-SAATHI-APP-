import { useContext, useEffect, useRef } from 'react';
import { AudioGuideContext, AUDIO_GUIDES, type AudioGuideMap } from './AudioGuideContext.shared';

export function useAudioGuides(): AudioGuideMap {
  return useContext(AudioGuideContext);
}

export function useVoiceGuide(screenKey: string | null, enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || !screenKey) return;
    const src = AUDIO_GUIDES[screenKey];
    if (!src) return;

    audioRef.current = new Audio(src);
    audioRef.current.volume = 0.7;
    audioRef.current.play().catch(() => {});
  }, [screenKey, enabled]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);
}
