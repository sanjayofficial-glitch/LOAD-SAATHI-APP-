export interface StatsData {
  activeTrips: number;
  activeLoads: number;
  pendingRequests: number;
  totalUsers: number;
  truckers: number;
  shippers: number;
  completedToday: number;
  unmatchedShipments: number;
  todayLeads: number;
  hotCorridors: Array<{ route: string; count: number }>;
  todayRevenue: number;
  yesterdayRevenue: number;
  pendingRevenue: number;
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
