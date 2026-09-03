export const guideSlugs = [
  "ptl-vs-ftl",
  "freight-rates-east-india",
  "shipping-steel",
] as const;

export type GuideSlug = (typeof guideSlugs)[number];
