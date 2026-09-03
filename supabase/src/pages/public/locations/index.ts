export const locationSlugs = [
  "rourkela",
  "ranchi",
  "kolkata",
  "bhubaneswar",
  "jamshedpur",
] as const;

export type LocationSlug = (typeof locationSlugs)[number];
