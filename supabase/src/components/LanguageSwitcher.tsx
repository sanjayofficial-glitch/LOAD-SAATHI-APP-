import React from "react";
import { cn } from "@/lib/utils";
import { LANG_ORDER, LANGUAGES, type Lang } from "@/i18n/languages";
import { useLanguage } from "@/i18n/useLanguage";

interface LanguageSwitcherProps {
  className?: string;
  /** Tighter padding for header placement. */
  compact?: boolean;
}

/**
 * Hindi → English → Odia one-tap switcher. A segmented pill, always visible in
 * the app header so the user can flip languages from anywhere.
 */
const LanguageSwitcher = React.memo(function LanguageSwitcher({
  className,
  compact,
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language / भाषा / ଭାଷା"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-gray-200/70 bg-gray-50/80 p-0.5 dark:border-gray-700/60 dark:bg-gray-900/80",
        compact ? "h-8" : "h-9",
        className
      )}
    >
      {LANG_ORDER.map((code: Lang) => {
        const meta = LANGUAGES[code];
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            aria-label={meta.english}
            className={cn(
              "press flex h-full items-center rounded-full px-2.5 text-[11px] font-bold leading-none transition-colors duration-fast ease-ios",
              compact && "px-1.5 text-[10px]",
              active
                ? "bg-orange-600 text-white shadow-sm dark:bg-orange-500"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {meta.native}
          </button>
        );
      })}
    </div>
  );
});

export default LanguageSwitcher;
