import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import {
  Check,
  CircleDot,
  Factory,
  Flag,
  Navigation,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Tag,
  Truck,
  Warehouse,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { MapBackdrop } from "./MapBackdrop";
import { CargoBay } from "./CargoBay";
import { SPRING } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import {
  CAPACITY_T,
  DEPOT,
  DEST,
  FULL_TRUCK_RATE,
  LOADS,
  LOAD_BY_ID,
  MAP_H,
  MAP_W,
  pct,
  pointAt,
  progressFor,
  shareAmount,
  sharePct,
  type LabelSide,
  type LoadDef,
  type LoadId,
} from "./routeData";

type Mode = "plan" | "trip" | "done";
type Target = LoadId | "depot" | null;
type PinState = "idle" | "queued" | "loaded";

const ICONS: Record<LoadId, LucideIcon> = { A: Factory, B: ShoppingBag, C: Wheat };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const labelPos: Record<LabelSide, string> = {
  top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
  bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
  left: "right-full mr-2 top-1/2 -translate-y-1/2",
  right: "left-full ml-2 top-1/2 -translate-y-1/2",
};

/* ------------------------------ map pieces ------------------------------ */

function BusinessPin({ load, state }: { load: LoadDef; state: PinState }) {
  const Icon = ICONS[load.id];
  const filled = state !== "idle";
  return (
    <>
      {/* road stop dot */}
      <div
        className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-colors duration-300"
        style={{
          left: pct(load.road.x, MAP_W),
          top: pct(load.road.y, MAP_H),
          background: state === "idle" ? "#94a3b8" : load.color,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ left: pct(load.pin.x, MAP_W), top: pct(load.pin.y, MAP_H) }}
        aria-hidden="true"
      >
        {state === "queued" && (
          <span
            className="pulse-ring absolute inset-0 rounded-full border-2"
            style={{ borderColor: load.color }}
          />
        )}
        <motion.div
          animate={{ scale: filled ? 1.1 : 1 }}
          /* State change, not a thrown gesture → critically damped, no
             bounce (Apple §4: bounce only when momentum earned it). */
          transition={SPRING.snappy}
          className="relative grid h-8 w-8 place-items-center rounded-full border-2 shadow-md transition-colors duration-300 sm:h-10 sm:w-10"
          style={{
            background: filled ? load.color : "#ffffff",
            borderColor: filled ? "#ffffff" : load.color,
            color: filled ? "#ffffff" : load.color,
          }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
          <AnimatePresence>
            {state === "loaded" && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        <div
          className={`absolute whitespace-nowrap rounded-lg bg-white/95 px-1.5 py-0.5 text-[10px] leading-tight shadow ring-1 ring-slate-200 sm:px-2 sm:py-1 sm:text-xs ${labelPos[load.labelSide]}`}
        >
          <span className="font-extrabold" style={{ color: load.color }}>
            {load.name}
          </span>
          <span className="hidden font-semibold text-slate-500 sm:inline"> · {load.business}</span>
          <span className="block text-[9px] font-semibold text-slate-500 sm:text-[10px]">
            {load.weight}T {load.cargo}
          </span>
        </div>
      </div>
    </>
  );
}

function EndPoint({
  at,
  label,
  arrived,
  kind,
}: {
  at: { x: number; y: number };
  label: string;
  arrived?: boolean;
  kind: "depot" | "dest";
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: pct(at.x, MAP_W), top: pct(at.y, MAP_H) }}
      aria-hidden="true"
    >
      {kind === "dest" ? (
        <>
          <span className="pulse-ring absolute inset-0 rounded-full border-2 border-brand-orange" />
          <span
            className="pulse-ring absolute inset-0 rounded-full border-2 border-brand-orange"
            style={{ animationDelay: "0.95s" }}
          />
          <div
            className={`relative grid h-9 w-9 place-items-center rounded-full border-[3px] border-white text-white shadow-lg transition-colors sm:h-11 sm:w-11 ${
              arrived ? "bg-emerald-500" : "bg-brand-orange"
            }`}
          >
            {arrived ? <Check className="h-5 w-5" strokeWidth={3} /> : <Flag className="h-4 w-4 sm:h-5 sm:w-5" />}
          </div>
        </>
      ) : (
        <div className="relative grid h-9 w-9 place-items-center rounded-xl border-[3px] border-white bg-brand-navy text-white shadow-lg sm:h-11 sm:w-11">
          <Warehouse className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      )}
      <div className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-navy px-1.5 py-0.5 text-[10px] font-bold text-white shadow sm:px-2 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

/* ------------------------------ main component ------------------------------ */

export function SharedTruckVisualizer() {
  const titleId = useId();
  const reduce = useReducedMotion();

  const progress = useMotionValue(0);
  const ctrl = useRef<AnimationPlaybackControls | null>(null);

  const [selected, setSelected] = useState<LoadId[]>([]);
  const [loaded, setLoaded] = useState<LoadId[]>([]);
  const [target, setTarget] = useState<Target>(null);
  const [mode, setMode] = useState<Mode>("plan");
  const [moving, setMoving] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);

  const stopT = useMemo(
    () =>
      Object.fromEntries(LOADS.map((l) => [l.id, progressFor(l.road.x, l.road.y)])) as Record<LoadId, number>,
    [],
  );

  const left = useTransform(progress, (v) => `${(pointAt(v).x / MAP_W) * 100}%`);
  const top = useTransform(progress, (v) => `${(pointAt(v).y / MAP_H) * 100}%`);

  const driveTo = useCallback(
    (to: number, onDone: () => void) => {
      // Velocity handoff: read the truck's live velocity BEFORE stopping, then
      // hand it to the new spring. Without this, re-targeting mid-trip (tap a
      // different load while the truck is moving) restarts from zero velocity
      // and the truck visibly stalls — the "brick wall" seam (Apple §5).
      const velocity = progress.getVelocity();
      ctrl.current?.stop();
      const from = progress.get();
      const dist = Math.abs(to - from);
      setFacing(to >= from ? 1 : -1);
      setMoving(true);
      // Critically damped spring (bounce 0 — bounce is reserved for gestures
      // the user actually threw). `duration` stays distance-proportional so
      // a longer leg still takes proportionally longer, while the spring
      // gives us interruptibility and velocity continuity (Apple §3, §4).
      ctrl.current = animate(progress, to, {
        type: "spring",
        bounce: 0,
        duration: reduce ? 0.01 : Math.min(6.5, Math.max(0.8, dist * 7)),
        velocity,
        onComplete: () => {
          setMoving(false);
          onDone();
        },
      });
    },
    [progress, reduce],
  );

  /* Driver brain: go to the next tapped pickup, or head home when nothing is selected */
  useEffect(() => {
    if (mode !== "plan") return;

    const abort = () => {
      ctrl.current?.stop();
      setMoving(false);
      setTarget(null);
    };

    if (target && target !== "depot" && !selected.includes(target)) return abort();
    if (target === "depot" && selected.length > 0) return abort();
    if (target) return;

    const pending = selected.filter((id) => !loaded.includes(id));
    if (pending.length) {
      const cur = progress.get();
      const sorted = [...pending].sort((a, b) => Math.abs(stopT[a] - cur) - Math.abs(stopT[b] - cur));
      const next = sorted[0]!;
      setTarget(next);
      driveTo(stopT[next], () => {
        setLoaded((l) => (l.includes(next) ? l : [...l, next]));
        setTarget(null);
        // Load is on board — commit feedback on the same frame as the visual
        // (Apple §13: causality, harmony, utility).
        haptic("light");
      });
      return;
    }

    if (selected.length === 0 && progress.get() > 0.001) {
      const id = window.setTimeout(() => {
        setTarget("depot");
        driveTo(0, () => setTarget(null));
      }, 700);
      return () => window.clearTimeout(id);
    }
  }, [selected, loaded, target, mode, driveTo, progress, stopT]);

  useEffect(() => () => ctrl.current?.stop(), []);

  const toggle = (id: LoadId) => {
    if (mode !== "plan") return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setLoaded((l) => l.filter((x) => x !== id));
    // Segmented-control change — barely perceptible (Apple §13, utility).
    haptic("selection");
  };

  const dispatch = () => {
    if (mode !== "plan" || loaded.length === 0 || selected.length !== loaded.length || target) return;
    setMode("trip");
    haptic("medium");
    driveTo(1, () => {
      setMode("done");
      // Milestone — the delivery lands with tactile confirmation.
      haptic("success");
    });
  };

  const reset = () => {
    ctrl.current?.stop();
    setMoving(false);
    setSelected([]);
    setLoaded([]);
    setTarget(null);
    setMode("plan");
  };

  /* derived values */
  const loadedT = loaded.reduce((sum, id) => sum + LOAD_BY_ID[id].weight, 0);
  const fillPct = Math.round((loadedT / CAPACITY_T) * 100);
  const freeT = Math.max(0, CAPACITY_T - loadedT);
  const pinState = (id: LoadId): PinState =>
    loaded.includes(id) ? "loaded" : selected.includes(id) ? "queued" : "idle";
  const readyToGo = mode === "plan" && loaded.length > 0 && selected.length === loaded.length && !target;
  const waiting = mode === "plan" && loaded.length === 0 && !moving;

  const status = (() => {
    if (mode === "done")
      return `Delivered at Mumbai Hub — ${loaded.length} shipper${loaded.length > 1 ? "s" : ""} shared one truck and one trip.`;
    if (mode === "trip") return `On the road to Mumbai Hub with ${loaded.length} load${loaded.length > 1 ? "s" : ""} on board…`;
    if (target === "depot") return "No loads selected — driver is heading back to the depot.";
    if (target) return `Driver is heading to ${LOAD_BY_ID[target].business} to pick up ${LOAD_BY_ID[target].name}…`;
    if (loaded.length === 0) return "Driver is waiting at the Pune depot. Tap Load A, B or C to send them to pick up.";
    return `${loaded.length} of 3 loads picked up · truck is ${fillPct}% full. Add more, or dispatch.`;
  })();

  const badge = (() => {
    const you = loaded.includes("A");
    if (mode === "done" && you)
      return { hot: true, text: `Delivered — you paid ${inr(shareAmount("A"))}, not ${inr(FULL_TRUCK_RATE)}` };
    if (you) return { hot: true, text: `You pay only ${sharePct("A")}% of the full-truck rate` };
    if (loaded.length) return { hot: false, text: "Shippers split the truck — everyone pays only for their space" };
    return { hot: false, text: "Tap a load to start filling the truck" };
  })();

  return (
    <section
      aria-labelledby={titleId}
      className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_24px_60px_-20px_rgba(13,35,64,0.25)] ring-1 ring-brand-line backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1b2a]/85 dark:ring-white/10 sm:p-6"
    >
      {/* header */}
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-brand-orange ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
            <Truck className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3
            id={titleId}
            className="text-base font-extrabold tracking-tight text-brand-navy dark:text-slate-50 sm:text-lg"
          >
            Shared truck visualizer
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-slate shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Interactive
        </span>
      </header>

      {/* map */}
      <div
        className="relative w-full select-none overflow-hidden rounded-2xl ring-1 ring-brand-line"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
        role="img"
        aria-label="Route map from Pune depot to Mumbai Hub with three pickup points: a steel mill, an FMCG warehouse and an agro mandi"
      >
        <MapBackdrop progress={progress} />

        <EndPoint at={DEPOT} label="Pune Depot" kind="depot" />
        <EndPoint at={DEST} label="Mumbai Hub" kind="dest" arrived={mode === "done"} />
        {LOADS.map((l) => (
          <BusinessPin key={l.id} load={l} state={pinState(l.id)} />
        ))}

        {/* cost-split badge */}
        <div className="absolute left-2 top-2 z-40 max-w-[78%] sm:left-3 sm:top-3">
          {/* The pill (and its icon) stay mounted; only the text swaps. A
              disappearing badge would blink out at the peak moment — the
              savings reveal is the one instant the user must not miss
              (DK-02, LX-05). */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur sm:px-3 sm:py-1.5 sm:text-xs ${
              badge.hot
                ? "border-orange-200 bg-orange-50/95 text-orange-700"
                : "border-slate-200 bg-white/90 text-slate-600"
            }`}
          >
            <Tag className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <AnimatePresence initial={false}>
              <motion.span
                key={badge.text}
                initial={reduce ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                {badge.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* the truck */}
        <motion.div className="absolute z-30" style={{ left, top, x: "-50%", y: "-50%" }} aria-hidden="true">
          <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2">
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-brand-navy shadow-md ring-1 ring-slate-200 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-white/10 sm:text-[11px]">
              {waiting ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="pulse-ring absolute inset-0 rounded-full bg-brand-orange" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                  </span>
                  Waiting for loads
                </>
              ) : (
                <>
                  <span className="relative h-1.5 w-8 overflow-hidden rounded-full bg-slate-200">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-brand-blue"
                      animate={{ width: `${fillPct}%` }}
                      transition={reduce ? { duration: 0 } : SPRING.gentle}
                    />
                  </span>
                  {fillPct}% full
                </>
              )}
            </div>
          </div>

          <div className="relative" style={{ transform: `scaleX(${facing})` }}>
            {moving && (
              <span className="absolute right-full top-1/2 mr-1 flex -translate-y-1/2 flex-col gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="speed-line h-0.5 rounded-full bg-brand-orange"
                    style={{ width: 10 + (i % 2) * 6, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
            )}
            {waiting && <span className="pulse-ring absolute inset-0 rounded-full bg-brand-orange/40" />}
            <motion.div
              animate={moving && !reduce ? { y: [0, -1.5, 0] } : { y: 0 }}
              transition={moving ? { duration: 0.35, repeat: Infinity } : { duration: 0.2 }}
              className="relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-brand-navy text-white shadow-xl sm:h-12 sm:w-12"
            >
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.1} />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* live status for assistive tech + sighted users */}
      <p
        role="status"
        aria-live="polite"
        className="mt-3 flex items-start gap-2 text-xs font-medium text-brand-slate dark:text-slate-300 sm:text-[13px]"
      >
        <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange" aria-hidden="true" />
        <span>{status}</span>
      </p>

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Loads to add to the shared truck" className="flex flex-wrap items-center gap-2">
          {LOADS.map((l) => {
            const on = selected.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={on}
                disabled={mode !== "plan"}
                onClick={() => toggle(l.id)}
                className={`group inline-flex min-h-12 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  on
                    ? "text-brand-navy shadow-sm dark:text-slate-50"
                    : "border-brand-line bg-white text-brand-navy hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                }`}
                style={on ? { background: l.soft, borderColor: l.color } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} aria-hidden="true" />
                <Plus
                  className={`h-4 w-4 transition-transform duration-200 ${on ? "rotate-45" : ""}`}
                  aria-hidden="true"
                />
                {l.name}
                <span className="sr-only">
                  , {l.weight} tonnes of {l.cargo} from {l.business}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {mode === "done" ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-bold text-brand-navy shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Play again
            </button>
          ) : (
            <button
              type="button"
              onClick={dispatch}
              disabled={!readyToGo}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#12315a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              {mode === "trip" ? "On the way…" : "Dispatch truck"}
            </button>
          )}
        </div>
      </div>

      {/* cargo bay */}
      <div className="mt-5">
        <CargoBay loaded={loaded} freeT={freeT} moving={moving || mode === "trip"} />
      </div>

      {/* fill meter */}
      <div className="mt-2">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold sm:text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-4 w-4" aria-hidden="true" />
            Container space filled
          </span>
          <span className="tabular-nums" aria-hidden="true">
            {fillPct}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Container space filled"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={fillPct}
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-brand-soft dark:bg-white/10"
        >
          <AnimatePresence initial={false}>
            {loaded.map((id) => (
              <motion.div
                key={id}
                layout
                initial={{ width: 0 }}
                animate={{ width: `${(LOAD_BY_ID[id].weight / CAPACITY_T) * 100}%` }}
                exit={{ width: 0 }}
                transition={reduce ? { duration: 0 } : SPRING.gentle}
                className="h-full rounded-full"
                style={{ background: LOAD_BY_ID[id].color }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* cost split */}
      <div className="mt-4 rounded-2xl bg-brand-warm/70 p-3 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:ring-orange-500/20">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
          <span>Cost split</span>
          <span className="normal-case tracking-normal text-slate-500 dark:text-slate-400">
            Full truck · {inr(FULL_TRUCK_RATE)}
          </span>
        </div>
        <ul className="grid grid-cols-3 gap-2">
          {LOADS.map((l) => {
            const on = loaded.includes(l.id);
            return (
              <li
                key={l.id}
                className={`rounded-xl border px-2.5 py-2 transition-all duration-300 ${
                  on
                    ? l.you
                      ? "border-orange-300 bg-white shadow-sm dark:bg-white/10 dark:border-orange-400/50"
                      : "border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/10"
                    : "border-dashed border-slate-300/80 bg-white/40 dark:border-white/15 dark:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />
                    {l.name}
                  </span>
                  {l.you && <span className="rounded bg-orange-100 px-1 text-[9px] font-extrabold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">YOU</span>}
                </div>
                <div
                  className={`mt-0.5 text-sm font-extrabold tabular-nums sm:text-base ${
                    on ? (l.you ? "text-brand-orange" : "text-brand-navy dark:text-slate-100") : "text-slate-500"
                  }`}
                >
                  {on ? inr(shareAmount(l.id)) : "—"}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {on ? `${sharePct(l.id)}% of truck rate` : "not on board"}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        Illustrative split — get your exact rate in the estimator below.
      </p>
    </section>
  );
}
