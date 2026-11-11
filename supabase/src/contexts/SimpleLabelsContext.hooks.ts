import { useContext } from 'react';
import { SimpleLabelsContext, HINDI_LABELS, type TranslationMap } from './SimpleLabelsContext.shared';

export function useSimpleLabels(): TranslationMap {
  return useContext(SimpleLabelsContext);
}

export function t(key: string): string {
  return HINDI_LABELS[key] || key;
}
