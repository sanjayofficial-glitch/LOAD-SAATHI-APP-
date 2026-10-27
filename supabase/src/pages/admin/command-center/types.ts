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
  /** Trips posted so far today (all statuses). */
  tripsToday: number;
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
  /** The 7 days immediately before the series above, summed — for WoW deltas. */
  prev: {
    trucks: number;
    loads: number;
    leads: number;
    trips: number;
    pending: number;
    unmatched: number;
    completed: number;
    revenue: number;
  };
}

/** Ageing buckets for money sitting on unmatched (pending) loads. */
export interface PendingAgeing {
  /** 0–7 days old. */
  fresh: number;
  /** 8–30 days old. */
  mid: number;
  /** Older than 30 days. */
  aged: number;
}
