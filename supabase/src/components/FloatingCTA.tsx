import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { PHONE_COMPACT, PHONE_E164 } from "@/config/site";

const PHONE = PHONE_E164.replace("+", "");
const WHATSAPP_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent("Hi LoadSaathi, I need help with freight booking.")}`;
const TEL_URL = `tel:${PHONE_E164}`;

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const handleToggle = useCallback(() => {
    setExpanded(prev => {
      const next = !prev;
      window.dispatchEvent(new CustomEvent("lsaathi-fab-open", { detail: { open: next } }));
      return next;
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed right-4 z-[95] flex flex-col items-end gap-2 sm:bottom-6 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-materialize">
      {expanded && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-ios">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Get Help</span>
            <button onClick={() => setExpanded(false)} aria-label="Close help menu" className="press p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="press flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Chat with freight expert</p>
            </div>
          </a>
          <a
            href={TEL_URL}
            className="press flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Call Now</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{PHONE_COMPACT}</p>
            </div>
          </a>
        </div>
      )}

      <button
        onClick={handleToggle}
        className="press h-14 w-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 flex items-center justify-center hover:scale-105 active:scale-95"
        aria-label="Contact LoadSaathi"
      >
        <span key={String(expanded)} className="inline-flex animate-materialize">
          {expanded ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </span>
      </button>
    </div>
  );
}
