import { cn } from "@/lib/utils";

/**
 * icons8 icons (downloaded to /public/icons8 — free PNG, no key required).
 * Usage: <I8 name="truck" className="h-5 w-5" />
 */
const ICONS: Record<string, string> = {
  home: "/icons8/home.png",
  search: "/icons8/search.png",
  chat: "/icons8/chat.png",
  truck: "/icons8/truck.png",
  box: "/icons8/box.png",
  user: "/icons8/user.png",
  heart: "/icons8/heart.png",
  history: "/icons8/history.png",
  shield: "/icons8/shield.png",
  plus: "/icons8/plus.png",
  menu: "/icons8/menu.png",
};

interface I8Props {
  name: keyof typeof ICONS | string;
  className?: string;
  alt?: string;
  title?: string;
}

export function I8({ name, className, alt = "", title }: I8Props) {
  const src = ICONS[name] ?? name;
  return (
    <img
      src={src}
      alt={alt}
      title={title}
      draggable={false}
      loading="lazy"
      className={cn(
        "pointer-events-none select-none dark:invert",
        className
      )}
    />
  );
}

export default I8;
