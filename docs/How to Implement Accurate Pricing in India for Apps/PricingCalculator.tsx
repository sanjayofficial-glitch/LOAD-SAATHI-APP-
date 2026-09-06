import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Fuel, Info, IndianRupee, Truck } from 'lucide-react';
import { calculateFreightPrice, PRICING_DATA, pricingSources, VEHICLE_MODELS } from '@/data/pricing';
import { routeBetweenCities, type RoadRoute } from '@/services/routing.service';

const formatINR = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export default function PricingCalculator() {
  const [distanceKm, setDistanceKm] = useState('500');
  const [shipmentMode, setShipmentMode] = useState<'ptl' | 'ftl'>('ptl');
  const [shipmentWeightTonnes, setShipmentWeightTonnes] = useState('1');
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [route, setRoute] = useState<RoadRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [vehicleModelId, setVehicleModelId] = useState(VEHICLE_MODELS[0].id);
  const [vehicleClassId, setVehicleClassId] = useState(PRICING_DATA.vehicleClasses[2].id);
  const [dieselPrice, setDieselPrice] = useState(String(PRICING_DATA.dieselReferencePrice));
  const [tolls, setTolls] = useState('0');
  const [loadingPoints, setLoadingPoints] = useState('1');
  const [unloadingPoints, setUnloadingPoints] = useState('1');
  const [detentionHours, setDetentionHours] = useState('0');
  const [includeReturnLeg, setIncludeReturnLeg] = useState(false);
  const [returnLoadCoverage, setReturnLoadCoverage] = useState('0');
  const [applyGst, setApplyGst] = useState(true);

  const result = useMemo(() => calculateFreightPrice({
    distanceKm: Number(distanceKm),
    vehicleClassId,
    shipmentMode,
    shipmentWeightTonnes: Number(shipmentWeightTonnes),
    dieselPrice: Number(dieselPrice),
    tolls: Number(tolls),
    loadingPoints: Number(loadingPoints),
    unloadingPoints: Number(unloadingPoints),
    detentionHours: Number(detentionHours),
    detentionRatePerHour: PRICING_DATA.defaultDetentionRatePerHour,
    includeReturnLeg,
    returnLoadCoverage: Number(returnLoadCoverage),
    applyGst,
  }), [distanceKm, vehicleClassId, shipmentMode, shipmentWeightTonnes, dieselPrice, tolls, loadingPoints, unloadingPoints, detentionHours, includeReturnLeg, returnLoadCoverage, applyGst]);

  const selectedModel = VEHICLE_MODELS.find((model) => model.id === vehicleModelId) ?? VEHICLE_MODELS[0];
  const selectedVehicle = PRICING_DATA.vehicleClasses.find((vehicle) => vehicle.id === vehicleClassId) ?? PRICING_DATA.vehicleClasses[0];

  async function calculateRoadDistance() {
    if (!originCity.trim() || !destinationCity.trim()) {
      setRouteError('Enter both cities to calculate a road distance.');
      return;
    }
    setRouteLoading(true);
    setRouteError('');
    const result = await routeBetweenCities(originCity, destinationCity);
    setRouteLoading(false);
    if (!result) {
      setRouteError('Could not find both cities. You can still enter kilometres manually.');
      return;
    }
    setRoute(result);
    setDistanceKm(String(result.distanceKm));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900"><Truck className="h-6 w-6 text-orange-600" /> LoadSaathi</Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-orange-600"><ArrowLeft className="h-4 w-4" /> Back home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-600">India rate card · reference calculator</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Know the freight cost before you book.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">A transparent estimate based on vehicle class, route kilometres, diesel price, tolls and handling. It is an estimate, not a guaranteed quote; the final amount should be confirmed against the actual route and carrier.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-6 text-xl font-bold">Trip inputs</h2>
            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Use road distance from OpenStreetMap</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Enter cities and click once. The free route engine uses the road network rather than a straight line. The result is cached in this browser.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input value={originCity} onChange={(e) => setOriginCity(e.target.value)} placeholder="From city, e.g. Ranchi" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                <input value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} placeholder="To city, e.g. Kolkata" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              </div>
              <button type="button" onClick={calculateRoadDistance} disabled={routeLoading} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60">{routeLoading ? 'Finding road route…' : 'Calculate road distance'}</button>
              {route && <p className="mt-2 text-xs text-green-700">{route.distanceKm.toLocaleString('en-IN')} km · about {Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m · {route.source === 'osrm' ? 'road route' : 'fallback estimate'}</p>}
              {routeError && <p className="mt-2 text-xs text-red-700">{routeError}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">Shipment type<select value={shipmentMode} onChange={(e) => setShipmentMode(e.target.value as 'ptl' | 'ftl')} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"><option value="ptl">PTL · shared truck space</option><option value="ftl">FTL · dedicated full truck</option></select><span className="mt-1 block text-xs text-slate-500">PTL prices your cargo share with a consolidation/minimum-charge floor. FTL prices the dedicated vehicle.</span></label>
              <label className="block text-sm font-medium">Shipment weight (tonnes)<input type="number" min="0.01" value={shipmentWeightTonnes} onChange={(e) => setShipmentWeightTonnes(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /><span className="mt-1 block text-xs text-slate-500">Used for PTL capacity share and validation.</span></label>
              <label className="block text-sm font-medium">Distance (km)<input type="number" min="0" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="block text-sm font-medium sm:col-span-2">Truck model<select value={vehicleModelId} onChange={(e) => { const model = VEHICLE_MODELS.find((item) => item.id === e.target.value) ?? VEHICLE_MODELS[0]; setVehicleModelId(model.id); setVehicleClassId(model.vehicleClassId); }} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100">{VEHICLE_MODELS.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}</select><span className="mt-1 block text-xs text-slate-500">{selectedModel.manufacturer} · pricing class {selectedVehicle.label} · up to {selectedVehicle.capacityTonnes}t. Exact payload depends on the registered body and configuration.</span></label>
              <label className="block text-sm font-medium">Diesel price (₹/L)<input type="number" min="0" step="0.01" value={dieselPrice} onChange={(e) => setDieselPrice(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /><span className="mt-1 block text-xs text-slate-500">Reference: Delhi {formatINR(PRICING_DATA.dieselReferencePrice)}/L on {new Date(PRICING_DATA.dieselReferenceDate).toLocaleDateString('en-IN')}</span></label>
              <label className="block text-sm font-medium">Tolls (₹)<input type="number" min="0" value={tolls} onChange={(e) => setTolls(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /><span className="mt-1 block text-xs text-slate-500">Pass-through actuals; enter the route total.</span></label>
              <label className="block text-sm font-medium">Loading points<input type="number" min="0" value={loadingPoints} onChange={(e) => setLoadingPoints(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="block text-sm font-medium">Unloading points<input type="number" min="0" value={unloadingPoints} onChange={(e) => setUnloadingPoints(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="block text-sm font-medium sm:col-span-2">Detention (hours)<input type="number" min="0" value={detentionHours} onChange={(e) => setDetentionHours(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /><span className="mt-1 block text-xs text-slate-500">Reference charge: {formatINR(PRICING_DATA.defaultDetentionRatePerHour)}/hour after free time.</span></label>
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
              <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={includeReturnLeg} onChange={(e) => setIncludeReturnLeg(e.target.checked)} className="h-4 w-4 accent-orange-600" /><span><span className="font-semibold">Include return trip</span><span className="block text-xs text-slate-500">Adds the full reverse distance; an empty return carries a 15% operating premium.</span></span></label>
              {includeReturnLeg && <label className="ml-7 block text-sm font-medium">Return load coverage<select value={returnLoadCoverage} onChange={(e) => setReturnLoadCoverage(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"><option value="0">Empty return · 0%</option><option value="0.5">Partially loaded · 50%</option><option value="1">Confirmed backhaul · 100%</option></select><span className="mt-1 block text-xs text-slate-500">Coverage reduces the return freight charge; the truck still travels the return distance.</span></label>}
              <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={applyGst} onChange={(e) => setApplyGst(e.target.checked)} className="h-4 w-4 accent-orange-600" /><span><span className="font-semibold">Add 5% GST estimate</span><span className="block text-xs text-slate-500">Use only where your GTA invoice classification requires it; confirm tax treatment with your accountant.</span></span></label>
            </div>
          </section>

          <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-7">
            <div className="flex items-center gap-2 text-orange-300"><Fuel className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-wider">Estimated all-in cost</span></div>
            <div className="mt-3 flex items-end gap-3"><p className="text-5xl font-bold tracking-tight">{formatINR(result.total)}</p><span className="pb-1 text-sm text-slate-400">for this trip</span></div>
            <p className="mt-3 text-sm text-slate-400">{shipmentMode.toUpperCase()} · {selectedVehicle.label} · {shipmentWeightTonnes || 0}t · {distanceKm || 0} km · fuel-adjusted at {formatINR(result.ratePerKm)}/km</p>
            <div className="mt-8 divide-y divide-slate-700 rounded-xl bg-slate-800/70 px-4">
              {[
                ['Line haul', result.distanceCharge],
                ['Return trip', result.returnLegCharge],
                ['Tolls (pass-through)', result.tolls],
                ['Loading / unloading', result.handling],
                ['Detention', result.detention],
                ['GST estimate', result.gst],
              ].map(([label, value]) => <div key={label} className="flex justify-between py-3 text-sm"><span className="text-slate-300">{label}</span><span className="font-semibold">{formatINR(Number(value))}</span></div>)}
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-slate-700 p-3 text-xs leading-5 text-slate-300"><Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /> Rate is driven by published vehicle bands and diesel movement. Update the editable rate card when your corridor data or carrier quotes change.</div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-2"><IndianRupee className="h-5 w-5 text-orange-600" /><h2 className="text-xl font-bold">Reference rate card</h2></div>
          <p className="mt-2 text-sm text-slate-600">These are market reference bands, not government-fixed tariffs. Use actual carrier quotes to calibrate each corridor.</p>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Vehicle</th><th className="px-3 py-3">Capacity</th><th className="px-3 py-3">Reference rate</th><th className="px-3 py-3">Use case</th></tr></thead><tbody>{PRICING_DATA.vehicleClasses.map((vehicle) => <tr key={vehicle.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 font-semibold">{vehicle.label}</td><td className="px-3 py-3">{vehicle.capacityTonnes}t</td><td className="px-3 py-3">{formatINR(vehicle.marketRateMin)}–{formatINR(vehicle.marketRateMax)}/km</td><td className="px-3 py-3 text-slate-600">{vehicle.description}</td></tr>)}</tbody></table></div>
        </section>

        <section className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 sm:p-7">
          <h2 className="text-xl font-bold">What this calculator does not hide</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">{['PTL charges your weight share with a minimum viable space floor.', 'FTL charges the dedicated vehicle, even when it is not full.', 'Diesel, tolls, GST and return-leg costs remain visible separately.'].map((item) => <div key={item} className="flex gap-2 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-orange-600" />{item}</div>)}</div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500"><p className="font-semibold text-slate-700">Data sources and update notes</p>{pricingSources.map((source) => <p key={source.url} className="mt-1">{source.label}: <a className="text-orange-700 underline" href={source.url} target="_blank" rel="noreferrer">source</a> — {source.note}</p>)}<p className="mt-3">Diesel prices vary by city and state. Replace the reference diesel price with the pickup-city RSP before confirming a booking.</p></footer>
      </main>
    </div>
  );
}
