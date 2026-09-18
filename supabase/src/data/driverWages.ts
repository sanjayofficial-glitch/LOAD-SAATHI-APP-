export interface DriverWage {
  state: string;
  wagePerKm: number;
  allowancePerDay: number;
}

export const DRIVER_WAGES: DriverWage[] = [
  { state: "Odisha", wagePerKm: 12, allowancePerDay: 450 },
  { state: "Jharkhand", wagePerKm: 11, allowancePerDay: 420 },
  { state: "West Bengal", wagePerKm: 13, allowancePerDay: 480 },
  { state: "Chhattisgarh", wagePerKm: 11, allowancePerDay: 420 },
  { state: "Bihar", wagePerKm: 10, allowancePerDay: 400 },
  { state: "Uttar Pradesh", wagePerKm: 12, allowancePerDay: 450 },
  { state: "Madhya Pradesh", wagePerKm: 11, allowancePerDay: 420 },
  { state: "Maharashtra", wagePerKm: 14, allowancePerDay: 500 },
  { state: "Karnataka", wagePerKm: 13, allowancePerDay: 480 },
  { state: "Tamil Nadu", wagePerKm: 13, allowancePerDay: 480 },
  { state: "Telangana", wagePerKm: 12, allowancePerDay: 450 },
  { state: "Andhra Pradesh", wagePerKm: 12, allowancePerDay: 450 },
  { state: "Gujarat", wagePerKm: 13, allowancePerDay: 480 },
  { state: "Rajasthan", wagePerKm: 12, allowancePerDay: 450 },
  { state: "Delhi NCR", wagePerKm: 15, allowancePerDay: 550 },
];

export function getDriverWage(state: string): DriverWage {
  const normalized = state.toLowerCase();
  const match = DRIVER_WAGES.find(w => normalized.includes(w.state.toLowerCase()));
  return match || { state: "Default", wagePerKm: 12, allowancePerDay: 450 };
}
