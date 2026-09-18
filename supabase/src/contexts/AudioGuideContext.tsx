import { createContext, useContext, useEffect, useRef } from 'react';

type AudioGuideMap = Record<string, string>;

const AUDIO_GUIDES: AudioGuideMap = {
  'post-trip-origin': '/audio/post-trip-step1.mp3',
  'post-trip-destination': '/audio/post-trip-step2.mp3',
  'post-trip-weight': '/audio/post-trip-step3.mp3',
  'post-trip-done': '/audio/post-trip-done.mp3',
  'browse-loads': '/audio/browse-loads.mp3',
  'track-shipment': '/audio/track-shipment.mp3',
};

const AudioGuideContext = createContext<AudioGuideMap>(AUDIO_GUIDES);

export const AudioGuideProvider = AudioGuideContext.Provider;

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
