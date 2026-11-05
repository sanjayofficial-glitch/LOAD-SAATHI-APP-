import { createContext } from "react";
import type { Lang } from "./languages";

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a dictionary key with fallback → English → the key itself. */
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
