import { useLanguage } from "./useLanguage";

/** Convenience hook: returns the translate function for the active language. */
export function useT() {
  const { t } = useLanguage();
  return t;
}
