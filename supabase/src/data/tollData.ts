export interface TollEntry {
  highway: string;
  fromCity: string;
  toCity: string;
  vehicleClass: "LCV" | "MCV" | "HCV" | "all";
  tollINR: number;
}

export const TOLL_DATA: TollEntry[] = [
  { highway: "NH-16", fromCity: "Bhubaneswar", toCity: "Kolkata", vehicleClass: "HCV", tollINR: 850 },
  { highway: "NH-16", fromCity: "Bhubaneswar", toCity: "Kolkata", vehicleClass: "MCV", tollINR: 550 },
  { highway: "NH-16", fromCity: "Bhubaneswar", toCity: "Kolkata", vehicleClass: "LCV", tollINR: 350 },
  { highway: "NH-16", fromCity: "Rourkela", toCity: "Bhubaneswar", vehicleClass: "HCV", tollINR: 620 },
  { highway: "NH-16", fromCity: "Rourkela", toCity: "Bhubaneswar", vehicleClass: "MCV", tollINR: 400 },
  { highway: "NH-16", fromCity: "Rourkela", toCity: "Bhubaneswar", vehicleClass: "LCV", tollINR: 250 },
  { highway: "NH-33", fromCity: "Jamshedpur", toCity: "Kolkata", vehicleClass: "HCV", tollINR: 480 },
  { highway: "NH-33", fromCity: "Jamshedpur", toCity: "Kolkata", vehicleClass: "MCV", tollINR: 320 },
  { highway: "NH-33", fromCity: "Jamshedpur", toCity: "Kolkata", vehicleClass: "LCV", tollINR: 200 },
  { highway: "NH-33", fromCity: "Ranchi", toCity: "Jamshedpur", vehicleClass: "HCV", tollINR: 280 },
  { highway: "NH-33", fromCity: "Ranchi", toCity: "Jamshedpur", vehicleClass: "MCV", tollINR: 180 },
  { highway: "NH-33", fromCity: "Ranchi", toCity: "Jamshedpur", vehicleClass: "LCV", tollINR: 120 },
  { highway: "NH-14", fromCity: "Rourkela", toCity: "Ranchi", vehicleClass: "HCV", tollINR: 350 },
  { highway: "NH-14", fromCity: "Rourkela", toCity: "Ranchi", vehicleClass: "MCV", tollINR: 230 },
  { highway: "NH-14", fromCity: "Rourkela", toCity: "Ranchi", vehicleClass: "LCV", tollINR: 150 },
  { highway: "NH-2", fromCity: "Kolkata", toCity: "Burdwan", vehicleClass: "HCV", tollINR: 220 },
  { highway: "NH-2", fromCity: "Kolkata", toCity: "Burdwan", vehicleClass: "MCV", tollINR: 150 },
  { highway: "NH-2", fromCity: "Kolkata", toCity: "Burdwan", vehicleClass: "LCV", tollINR: 100 },
  { highway: "NH-20", fromCity: "Ranchi", toCity: "Bhubaneswar", vehicleClass: "HCV", tollINR: 520 },
  { highway: "NH-20", fromCity: "Ranchi", toCity: "Bhubaneswar", vehicleClass: "MCV", tollINR: 340 },
  { highway: "NH-20", fromCity: "Ranchi", toCity: "Bhubaneswar", vehicleClass: "LCV", tollINR: 220 },
  { highway: "NH-6", fromCity: "Jamshedpur", toCity: "Burdwan", vehicleClass: "HCV", tollINR: 380 },
  { highway: "NH-6", fromCity: "Jamshedpur", toCity: "Burdwan", vehicleClass: "MCV", tollINR: 250 },
  { highway: "NH-6", fromCity: "Jamshedpur", toCity: "Burdwan", vehicleClass: "LCV", tollINR: 160 },
];

export function lookupToll(highway: string, fromCity: string, toCity: string, vehicleClass: string): number {
  const vc = vehicleClass.toLowerCase();
  let cls: "LCV" | "MCV" | "HCV" | "all" = "HCV";
  if (vc.includes("light") || vc.includes("lcv") || vc.includes("ace") || vc.includes("pickup")) cls = "LCV";
  else if (vc.includes("medium") || vc.includes("mcv") || vc.includes("407")) cls = "MCV";

  const entry = TOLL_DATA.find(t =>
    t.highway === highway &&
    ((t.fromCity.toLowerCase() === fromCity.toLowerCase() && t.toCity.toLowerCase() === toCity.toLowerCase()) ||
     (t.fromCity.toLowerCase() === toCity.toLowerCase() && t.toCity.toLowerCase() === fromCity.toLowerCase())) &&
    (t.vehicleClass === cls || t.vehicleClass === "all")
  );
  return entry?.tollINR || Math.round((highway.includes("NH-16") ? 700 : 300) * (cls === "LCV" ? 0.45 : cls === "MCV" ? 0.65 : 1));
}
