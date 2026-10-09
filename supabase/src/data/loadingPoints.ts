/**
 * Documented loading/unloading points per city, rendered as the
 * "Loading & unloading points" block on lane pages.
 *
 * Only cities with known points are listed — lanes touching other cities
 * simply omit the column rather than inventing transport nagars, which is
 * exactly the kind of unverifiable detail that damages E-E-A-T on freight pages.
 */
export const cityLoadingPoints: Record<string, string[]> = {
  Rourkela: ["Rourkela Industrial Estate"],
  Ranchi: ["Namkum Industrial Area", "Hatia"],
  Jamshedpur: ["Adityapur Industrial Area", "Sakchi"],
  Kolkata: ["Howrah"],
  Bhubaneswar: ["Mancheswar Industrial Estate"],
  Cuttack: ["Choudwar Industrial Estate"],
};
