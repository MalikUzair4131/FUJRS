export const STITCHING_STATUSES = [
  "Awaiting Measurements",
  "In Progress",
  "Quality Check",
  "Ready for Fitting",
  "Delivered",
] as const;

export type StitchingStatus = (typeof STITCHING_STATUSES)[number];
