import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared speech-to-text hook — the same Web Speech API the voice location
 * input uses, but generic: it just hands you the transcript.
 */
interface RecognitionAlternative {
  transcript?: string;
}
interface RecognitionResultItem {
  0?: RecognitionAlternative;
}
interface RecognitionEvent {
  results?: RecognitionResultItem[];
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const SR = (
  window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor }
).webkitSpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor })
    .SpeechRecognition;

export function useSpeechToText(opts: { language?: string } = {}) {
  const { language = "hi-IN" } = opts;
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(() => Boolean(SR));
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const start = useCallback(
    (onResult: (transcript: string) => void) => {
      if (!SR) return;
      stop();
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
        if (transcript) onResult(transcript);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setIsListening(false);
      }
    },
    [language, stop]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return { supported, isListening, start, stop };
}
