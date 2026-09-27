import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VEHICLE_RATES } from '@/components/VehicleRateCard';
import { routes } from '@/data/routes';
import distancesData from '@/data/distances.json';

interface DistanceEntry {
  distanceKm: number;
  transitHours: number;
  highway: string;
}

const DISTANCES = (distancesData as { routes: Record<string, DistanceEntry> }).routes;

const CITIES: string[] = [...new Set(routes.flatMap((r) => [r.from, r.to]))].sort();
const CITIES_LOWER: string[] = CITIES.map((c) => c.toLowerCase());

const ROUTE_FALLBACK: Record<string, DistanceEntry> = {};
for (const r of routes) {
  const entry: DistanceEntry = {
    distanceKm: r.distanceKm,
    transitHours: Number(r.transitTime) || 0,
    highway: '',
  };
  ROUTE_FALLBACK[`${r.from.toLowerCase()}-${r.to.toLowerCase()}`] = entry;
}

function findCity(input: string): string | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  const idx = CITIES_LOWER.indexOf(q);
  if (idx >= 0) return CITIES[idx]!;
  const starts = CITIES_LOWER.findIndex((c) => c.startsWith(q));
  if (starts >= 0) return CITIES[starts]!;
  const inc = CITIES_LOWER.findIndex((c) => c.includes(q));
  return inc >= 0 ? CITIES[inc]! : null;
}

function lookupKm(from: string, to: string): DistanceEntry | null {
  const a = `${from.toLowerCase()}-${to.toLowerCase()}`;
  const b = `${to.toLowerCase()}-${from.toLowerCase()}`;
  return DISTANCES[a] ?? DISTANCES[b] ?? ROUTE_FALLBACK[a] ?? ROUTE_FALLBACK[b] ?? null;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

interface Estimate {
  km: number;
  hours: number;
  vehicleLabel: string;
  ptlMin: number | null;
  ptlMax: number | null;
  ftlMin: number;
  ftlMax: number;
}

/**
 * Instant freight estimate — fully client-side, no login, no network.
 * Covers the 28 East-India corridors in distances.json; anything else
 * funnels to the full fare calculator with cities prefilled.
 */
export default function HeroQuoteWidget() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [estimate, setEstimate] = useState<Estimate | 'unknown' | null>(null);

  const calcHref = useMemo(() => {
    const params = new URLSearchParams();
    if (from.trim()) params.set('from', from.trim());
    if (to.trim()) params.set('to', to.trim());
    const qs = params.toString();
    return `/tools/fare-calculator${qs ? `?${qs}` : ''}`;
  }, [from, to]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fromCity = findCity(from);
    const toCity = findCity(to);
    const tonnes = Number(weightKg.replace(/[^0-9.]/g, '')) / 1000;
    if (!fromCity || !toCity || !(tonnes > 0)) {
      setEstimate('unknown');
      return;
    }
    const leg = lookupKm(fromCity, toCity);
    if (!leg) {
      setEstimate('unknown');
      return;
    }
    const vehicle =
      VEHICLE_RATES.find((v) => v.capacityTonnes >= tonnes) ??
      VEHICLE_RATES[VEHICLE_RATES.length - 1]!;
    const ftl = leg.distanceKm * vehicle.ratePerKm;
    const ftlMin = ftl * 0.85;
    const ftlMax = ftl * 1.2;
    let ptlMin: number | null = null;
    let ptlMax: number | null = null;
    if (tonnes < vehicle.capacityTonnes) {
      const share = (tonnes / vehicle.capacityTonnes) * 1.25;
      ptlMin = Math.max(500, ftl * share * 0.85);
      ptlMax = ftl * share * 1.15;
    }
    setEstimate({
      km: leg.distanceKm,
      hours: leg.transitHours,
      vehicleLabel: vehicle.label,
      ptlMin,
      ptlMax,
      ftlMin,
      ftlMax,
    });
  };

  return (
    <div className="bg-card/80 dark:bg-[#0d2035]/80 backdrop-blur-xl border border-border dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-orange-500" />
        <h2 className="text-sm font-bold tracking-wider uppercase text-foreground">
          Instant freight estimate
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            list="ls-quote-cities"
            placeholder="Rourkela"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            list="ls-quote-cities"
            placeholder="Ranchi"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </label>
        <datalist id="ls-quote-cities">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <label className="block col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Weight (kg)</span>
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            inputMode="decimal"
            placeholder="e.g. 1200"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </label>
        <Button
          type="submit"
          className="col-span-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold tracking-wider uppercase"
        >
          Get estimate — no login needed
        </Button>
      </form>

      {estimate && estimate !== 'unknown' && (
        <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {estimate.km} km · ~{estimate.hours} hrs · {estimate.vehicleLabel}
          </p>
          {estimate.ptlMin !== null && estimate.ptlMax !== null ? (
            <p className="text-lg font-black text-foreground">
              Shared: {inr(estimate.ptlMin)}–{inr(estimate.ptlMax)}
            </p>
          ) : null}
          <p className="text-sm font-semibold text-muted-foreground">
            Full truck: {inr(estimate.ftlMin)}–{inr(estimate.ftlMax)}
          </p>
          <Link
            to={calcHref}
            className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Get exact quote <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      {estimate === 'unknown' && (
        <div className="mt-4 rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Instant rates cover 28 East-India corridors. Get a precise quote for this lane in under
            a minute:
          </p>
          <Link
            to={calcHref}
            className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Open fare calculator <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
