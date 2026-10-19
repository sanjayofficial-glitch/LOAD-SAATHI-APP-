export interface StatsData {
  activeTrips: number;
  activeLoads: number;
  pendingRequests: number;
  totalUsers: number;
  truckers: number;
  shippers: number;
  completedToday: number;
  unmatchedShipments: number;
  /** Loads that found a match today (accepted requests created today). */
  matchedLoads: number;
  todayLeads: number;
  hotCorridors: Array<{ route: string; count: number }>;
  todayRevenue: number;
  yesterdayRevenue: number;
  pendingRevenue: number;
  /** Busiest hour of the day from trip creation times, e.g. "10-12". */
  peakHour: string;
}

export interface TrendData {
  trucks: number[];
  loads: number[];
  leads: number[];
  trips: number[];
  pending: number[];
  unmatched: number[];
  completed: number[];
  revenue: number[];
}
