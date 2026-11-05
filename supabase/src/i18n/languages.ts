/**
 * LoadSaathi languages — Hindi is the default (Devanagari), English and Odia
 * are one tap away everywhere in the app shell.
 */
export type Lang = "hi" | "en" | "or";

export const LANG_STORAGE_KEY = "loadsaathi-lang";
export const DEFAULT_LANG: Lang = "hi";

export interface LanguageMeta {
  code: Lang;
  /** Shown in the switcher, in the language itself. */
  native: string;
  /** Compact label for tight switchers. */
  short: string;
  /** English name (aria-label). */
  english: string;
}

export const LANGUAGES: Record<Lang, LanguageMeta> = {
  hi: { code: "hi", native: "हिंदी", short: "हिंदी", english: "Hindi" },
  en: { code: "en", native: "English", short: "EN", english: "English" },
  or: { code: "or", native: "ଓଡ଼ିଆ", short: "ଓଡ଼ିଆ", english: "Odia" },
};

export const LANG_ORDER: Lang[] = ["hi", "en", "or"];

export function isLang(value: unknown): value is Lang {
  return value === "hi" || value === "en" || value === "or";
}
