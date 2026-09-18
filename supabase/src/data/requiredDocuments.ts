export interface DocumentRequirement {
  route: string;
  vehicleType: string;
  commodity: string;
  documents: string[];
  special?: string;
}

export const REQUIRED_DOCUMENTS: DocumentRequirement[] = [
  {
    route: "rourkela-to-ranchi",
    vehicleType: "Tata 407",
    commodity: "general",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License"],
  },
  {
    route: "rourkela-to-ranchi",
    vehicleType: "Tata LPT",
    commodity: "cement",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "Permit (OD-07)", "Weight Certificate"],
    special: "Hazardous goods declaration if carrying cement additives",
  },
  {
    route: "rourkela-to-jamshedpur",
    vehicleType: "Tata Signa",
    commodity: "steel",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "Permit (JH-01)", "Over-dimensional Cargo Permit (if applicable)"],
    special: "Steel coils require special loading instructions and lashing certificate",
  },
  {
    route: "rourkela-to-bhubaneswar",
    vehicleType: "Tata Ultra",
    commodity: "fmcg",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "E-Way Bill"],
  },
  {
    route: "rourkela-to-kolkata",
    vehicleType: "Tata Prima",
    commodity: "general",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "Permit (WB-01)", "E-Way Bill", "Border Check Post Clearance"],
    special: "Inter-state border crossing requires additional documentation at Jharkhand/West Bengal border",
  },
  {
    route: "ranchi-to-jamshedpur",
    vehicleType: "Tata 407",
    commodity: "agricultural",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "E-Way Bill"],
    special: "Organic produce may require phytosanitary certificate",
  },
  {
    route: "jamshedpur-to-kolkata",
    vehicleType: "Tata LPT",
    commodity: "automobile",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "Permit (WB-01)", "E-Way Bill", "Vehicle Transit Insurance"],
    special: "Automobile parts require careful handling documentation and transit insurance",
  },
  {
    route: "ranchi-to-bhubaneswar",
    vehicleType: "Mahindra Furio",
    commodity: "textiles",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "E-Way Bill"],
  },
  {
    route: "bhubaneswar-to-kolkata",
    vehicleType: "Tata Ace",
    commodity: "electronics",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "E-Way Bill", "Valuable Cargo Declaration"],
    special: "Electronics require GPS-enabled vehicle and valuable cargo declaration",
  },
  {
    route: "sambalpur-to-bhubaneswar",
    vehicleType: "Eicher Pro",
    commodity: "minerals",
    documents: ["RC Book Copy", "Insurance Certificate", "Fitness Certificate", "Tax Receipt", "Driver License", "Permit (OD-07)", "Mining Transport Permit", "Weight Certificate"],
    special: "Minerals require mining transport permit and weight certificate",
  },
];

export function getDocumentRequirements(route: string, vehicleType: string, commodity: string): DocumentRequirement | undefined {
  const r = route.toLowerCase().replace(/\s+/g, "-");
  const v = vehicleType.toLowerCase();
  const c = commodity.toLowerCase();

  let match = REQUIRED_DOCUMENTS.find(d =>
    d.route === r &&
    d.vehicleType.toLowerCase() === v &&
    d.commodity.toLowerCase() === c
  );

  if (!match) {
    match = REQUIRED_DOCUMENTS.find(d =>
      d.route === r &&
      d.commodity.toLowerCase() === c
    );
  }

  if (!match) {
    match = REQUIRED_DOCUMENTS.find(d => d.route === r);
  }

  return match;
}
