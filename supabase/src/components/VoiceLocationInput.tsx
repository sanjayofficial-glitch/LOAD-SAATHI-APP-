import { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Mic, Loader2 } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

type LocationResult = { state: string; district: string; city: string };

interface VoiceLocationInputProps {
  label: string;
  value?: LocationResult;
  onChange: (value: LocationResult) => void;
  data: Record<string, Record<string, string[]>>;
  placeholder?: string;
  disabled?: boolean;
  onSelect?: () => void;
}

const SpeechRecognition = (window as unknown as { webkitSpeechRecognition: unknown; SpeechRecognition: unknown }).webkitSpeechRecognition || (window as unknown as { webkitSpeechRecognition: unknown; SpeechRecognition: unknown }).SpeechRecognition;

function buildCityIndex(data: Record<string, Record<string, string[]>>): { city: string; state: string; district: string }[] {
  const index: { city: string; state: string; district: string }[] = [];
  for (const [state, districts] of Object.entries(data)) {
    for (const [district, cities] of Object.entries(districts)) {
      for (const city of cities) {
        index.push({ city, state, district });
      }
    }
  }
  return index;
}

function searchCities(query: string, index: { city: string; state: string; district: string }[]): { city: string; state: string; district: string; confidence: number }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const scored = index
    .map((item) => {
      const city = item.city.toLowerCase();
      const state = item.state.toLowerCase();
      let score = 0;
      if (city === q) score = 1;
      else if (city.startsWith(q)) score = 0.85;
      else if (city.includes(q)) score = 0.6;
      else if (state.includes(q)) score = 0.3;
      return { ...item, confidence: score };
    })
    .filter((item) => item.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
  return scored.slice(0, 12);
}

const VoiceLocationInput = forwardRef<HTMLInputElement, VoiceLocationInputProps>(function VoiceLocationInput({
  label,
  value,
  onChange,
  onSelect,
  data,
  placeholder = 'Type or speak your city',
  disabled,
}, ref) {
  const [inputValue, setInputValue] = useState(value?.city || '');
  const [suggestions, setSuggestions] = useState<{ city: string; state: string; district: string; confidence: number }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cityIndex = useMemo(() => buildCityIndex(data || {}), [data]);

  useEffect(() => {
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    if (value) {
      setInputValue(value.city);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const results = searchCities(val, cityIndex);
    setSuggestions(results);
    setShowSuggestions(results.length > 0 && val.length > 0);
  };

  const handleSelect = (item: { city: string; state: string; district: string; confidence: number }) => {
    setInputValue(item.city);
    setShowSuggestions(false);
    onChange({ state: item.state, district: item.district, city: item.city });
    onSelect?.();
  };

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new (SpeechRecognition as any)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setInputValue(transcript);
      const results = searchCities(transcript, cityIndex);
      setSuggestions(results);
      setShowSuggestions(true);
      const top = results[0];
      if (top && top.confidence >= 0.6) {
        trackEvent('voice_location_auto_selected', {
          transcript,
          matched_city: top.city,
          confidence: top.confidence,
        });
        setTimeout(() => handleSelect(top), 300);
      } else {
        trackEvent('voice_location_weak_match', {
          transcript,
          top_match: top?.city ?? null,
          confidence: top?.confidence ?? 0,
          suggestion_count: results.length,
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative flex items-center gap-2">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0 && inputValue.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className="pl-9 pr-10"
          disabled={disabled}
          autoComplete="off"
        />
        {speechSupported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            className={`absolute right-1 h-8 w-8 p-0 rounded-full ${
              isListening ? 'text-red-600 animate-pulse' : 'text-gray-400 hover:text-orange-600'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.state}-${item.district}-${item.city}-${idx}`}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{item.city}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.district}, {item.state}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default VoiceLocationInput;
