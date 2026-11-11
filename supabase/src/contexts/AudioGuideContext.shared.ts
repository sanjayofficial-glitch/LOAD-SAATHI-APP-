import { createContext } from 'react';

export type AudioGuideMap = Record<string, string>;

export const AUDIO_GUIDES: AudioGuideMap = {
  'post-trip-origin': '/audio/post-trip-step1.mp3',
  'post-trip-destination': '/audio/post-trip-step2.mp3',
  'post-trip-weight': '/audio/post-trip-step3.mp3',
  'post-trip-done': '/audio/post-trip-done.mp3',
  'browse-loads': '/audio/browse-loads.mp3',
  'track-shipment': '/audio/track-shipment.mp3',
};

export const AudioGuideContext = createContext<AudioGuideMap>(AUDIO_GUIDES);
