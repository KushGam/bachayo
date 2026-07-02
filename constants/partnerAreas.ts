export const KATHMANDU_NEIGHBORHOODS = [
  'Thamel',
  'Lazimpat',
  'Baneshwor',
  'Patan',
  'Bhaktapur',
  'Bouddha',
  'Maharajgunj',
  'Baluwatar',
  'New Road',
  'Other',
] as const;

export type KathmanduNeighborhood = (typeof KATHMANDU_NEIGHBORHOODS)[number];
