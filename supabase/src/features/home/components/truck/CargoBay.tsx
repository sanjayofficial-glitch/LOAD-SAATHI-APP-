import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CAPACITY_T, LOAD_BY_ID, type LoadId } from "./routeData";
import { SPRING } from "@/lib/motion";

interface Props {
  loaded: LoadId[];
  freeT: number;
  moving: boolean;
}

function Wheel({ className, spin }: { className: string; spin: boolean }) {
  return (
    <div
      className={`absolute bottom-0 grid h-8 w-8 place-items-center rounded-full border-[3px] border-white bg-brand-navy shadow ${className}`}
      aria-hidden="true"
    >
      <div className={`h-full w-full rounded-full ${spin ? "wheel-spin" : ""}`}>
        <span className="absolute left-1/2 top-[3px] h-1.5 w-0.5 -translate-x-1/2 rounded bg-white/70" />
        <span className="absolute bottom-[3px] left-1/2 h-1.5 w-0.5 -translate-x-1/2 rounded bg-white/70" />
      </div>
    </div>
  );
}

/** Side-view of the trailer: blocks snap in like puzzle pieces (brand idea) */
export function CargoBay({ loaded, freeT, moving }: Props) {
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : SPRING.snappy;

  return (
    <div className="relative pb-5" role="img" aria-label={`Truck container, ${freeT.toFixed(1)} tonnes of space free`}>
      <div className="flex items-end">
        {/* trailer */}
        <div className="relative h-24 min-w-0 flex-1 overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50 sm:h-28">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0, transparent calc(20% - 2px), #e2e8f0 calc(20% - 2px), #e2e8f0 20%)",
            }}
          />
          <div className="relative flex h-full gap-1.5">
            <AnimatePresence initial={false}>
              {loaded.map((id) => {
                const l = LOAD_BY_ID[id];
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={reduce ? false : { y: -56, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { y: -36, opacity: 0, scale: 0.9 }}
                    transition={spring}
                    style={{
                      width: `${(l.weight / CAPACITY_T) * 100}%`,
                      background: l.soft,
                      borderColor: l.color,
                    }}
                    className="relative flex min-w-0 flex-none flex-col items-center justify-center overflow-hidden rounded-lg border-2 text-center"
                  >
                    {l.you && (
                      <span
                        className="absolute left-1 top-1 rounded px-1 text-[9px] font-extrabold leading-4 tracking-wide text-white"
                        style={{ background: l.color }}
                      >
                        YOU
                      </span>
                    )}
                    <span className="text-xs font-extrabold sm:text-sm" style={{ color: l.color }}>
                      {l.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                      {l.weight}T<span className="hidden sm:inline"> · {l.cargo}</span>
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* free capacity: the "orange block" from the brand logo */}
            <motion.div
              layout
              transition={spring}
              className="relative grid min-w-0 flex-1 place-items-center overflow-hidden rounded-lg border-2 border-dashed border-orange-300 text-center"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, #fff4ec 0 8px, #ffe9db 8px 16px)",
              }}
            >
              <span className="px-1 text-[10px] font-bold leading-tight text-orange-700 sm:text-xs">
                {freeT > 0.05 ? `${freeT.toFixed(1)}T free` : "Full"}
              </span>
            </motion.div>
          </div>
        </div>

        {/* cab */}
        <svg viewBox="0 0 96 96" className="-ml-0.5 h-20 w-[72px] shrink-0 sm:h-24 sm:w-[86px]" aria-hidden="true">
          <path d="M0 10 H44 Q54 10 60 20 L88 52 Q92 57 92 64 V90 H0 Z" fill="#0d2340" />
          <path d="M48 24 Q52 24 55 28 L74 52 H48 Z" fill="#cfe0f2" />
          <rect x="80" y="70" width="12" height="8" rx="3" fill="#f6c453" />
        </svg>

        <Wheel className="left-[10%]" spin={moving} />
        <Wheel className="left-[24%]" spin={moving} />
        <Wheel className="right-[22px] sm:right-[28px]" spin={moving} />
      </div>
    </div>
  );
}
