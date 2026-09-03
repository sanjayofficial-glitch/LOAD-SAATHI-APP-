import L from 'leaflet';

// Fix Leaflet default icon for Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Truck marker (orange pulse) ──────────────────────────────────────────────
export const truckerIcon = new L.DivIcon({
  className: 'trucker-marker',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(249,115,22,0.25);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(249,115,22,0.6);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ── Selected truck marker (orange, white ring) ───────────────────────────────
export const selectedTruckerIcon = new L.DivIcon({
  className: 'trucker-marker-selected',
  html: `<div style="position:relative;width:40px;height:40px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(249,115,22,0.35);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#f97316;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(249,115,22,0.35), 0 4px 16px rgba(249,115,22,0.8);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
    </div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// ── Selected in-transit marker (green, white ring) ───────────────────────────
export const selectedOnTripIcon = new L.DivIcon({
  className: 'ontrip-marker-selected',
  html: `<div style="position:relative;width:44px;height:44px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,0.3);animation:pulse-ring 1.5s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#22c55e;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(34,197,94,0.35), 0 4px 16px rgba(34,197,94,0.8);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </div>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// ── My location marker (blue dot, white ring) ────────────────────────────────
export const myLocationIcon = new L.DivIcon({
  className: 'my-location-marker',
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.3);animation:pulse-ring 1.8s ease-out infinite;"></div>
    <div style="position:absolute;inset:5px;border-radius:50%;background:#2563eb;border:2.5px solid #fff;box-shadow:0 0 10px rgba(37,99,235,0.8);"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// ── Shipper/load marker (blue pulse) ─────────────────────────────────────────
export const shipperIcon = new L.DivIcon({
  className: 'shipper-marker',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(59,130,246,0.6);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ── In-transit marker (green pulse) ──────────────────────────────────────────
export const onTripIcon = new L.DivIcon({
  className: 'ontrip-marker',
  html: `<div style="position:relative;width:32px;height:32px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,0.2);animation:pulse-ring 1.5s ease-out infinite;"></div>
    <div style="position:absolute;inset:2px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(34,197,94,0.6);border:2px solid rgba(255,255,255,0.3);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// ── Origin pin (green) ───────────────────────────────────────────────────────
export const originIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Destination pin (red) ────────────────────────────────────────────────────
export const destIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

// ── Default marker (generic) ─────────────────────────────────────────────────
export const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ── Get marker icon by role/status ───────────────────────────────────────────
export function getMarkerIcon(
  role: 'trucker' | 'shipper' | 'origin' | 'destination' | 'in_transit',
): L.Icon | L.DivIcon {
  switch (role) {
    case 'trucker':
      return truckerIcon;
    case 'shipper':
      return shipperIcon;
    case 'in_transit':
      return onTripIcon;
    case 'origin':
      return originIcon;
    case 'destination':
      return destIcon;
    default:
      return defaultIcon;
  }
}
