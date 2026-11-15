import { motion, type MotionValue } from "framer-motion";
import { LOADS, MAP_H, MAP_W, ROUTE_D } from "./routeData";

/** Deterministic city-block grid (no randomness → no hydration / layout drift) */
const BLOCKS: { x: number; y: number; w: number; h: number; fill: string }[] = [];
for (let i = 0; i < 11; i++) {
  for (let j = 0; j < 7; j++) {
    const h = (i * 37 + j * 17 + i * j * 5) % 11;
    if (h === 0) continue;
    BLOCKS.push({
      x: i * 72 + 7,
      y: j * 62 + 7,
      w: 58,
      h: 48,
      fill: h < 4 ? "#e0e7f1" : h === 7 ? "#dbe3ee" : "#e6ebf3",
    });
  }
}

export function MapBackdrop({ progress }: { progress: MotionValue<number> }) {
  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="stv-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#d6ead9" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#c6e0cb" strokeWidth="3" />
        </pattern>
        <linearGradient id="stv-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* base + city blocks */}
      <rect width={MAP_W} height={MAP_H} fill="#f5f8fc" />
      {BLOCKS.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill={b.fill} />
      ))}

      {/* river */}
      <path
        d="M-10 74 C 110 38, 200 122, 330 84 S 530 24, 780 52"
        fill="none"
        stroke="#cfe3f6"
        strokeWidth={30}
        strokeLinecap="round"
      />
      <path
        d="M-10 74 C 110 38, 200 122, 330 84 S 530 24, 780 52"
        fill="none"
        stroke="#dbeafb"
        strokeWidth={14}
        strokeLinecap="round"
      />

      {/* parks */}
      <rect x={262} y={338} width={118} height={72} rx={16} fill="url(#stv-hatch)" />
      <rect x={600} y={318} width={130} height={86} rx={18} fill="url(#stv-hatch)" />
      <rect x={20} y={150} width={78} height={64} rx={14} fill="url(#stv-hatch)" />

      {/* secondary highway */}
      <path
        d="M-10 392 C 120 370, 190 392, 262 372"
        fill="none"
        stroke="#d3dbe7"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d="M440 400 C 520 380, 560 392, 780 340"
        fill="none"
        stroke="#d3dbe7"
        strokeWidth={9}
        strokeLinecap="round"
      />

      {/* connectors from each business to the road */}
      {LOADS.map((l) => (
        <line
          key={l.id}
          x1={l.pin.x}
          y1={l.pin.y}
          x2={l.road.x}
          y2={l.road.y}
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="3 5"
          strokeLinecap="round"
        />
      ))}

      {/* main route: casing + road */}
      <path d={ROUTE_D} fill="none" stroke="#c3cddb" strokeWidth={21} strokeLinecap="round" strokeLinejoin="round" />
      <path d={ROUTE_D} fill="none" stroke="#ffffff" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />

      {/* animated dashed route (brand orange — reserved accent) */}
      <path
        d={ROUTE_D}
        fill="none"
        stroke="#f15a24"
        strokeOpacity={0.5}
        strokeWidth={3}
        strokeDasharray="3 8"
        strokeLinecap="round"
        className="route-dash"
      />

      {/* travelled portion */}
      <motion.path
        d={ROUTE_D}
        fill="none"
        stroke="#f15a24"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: progress }}
      />

      <rect width={MAP_W} height={MAP_H} fill="url(#stv-fade)" />
    </svg>
  );
}
