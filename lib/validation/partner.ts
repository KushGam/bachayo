import { z } from 'zod';

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map((v) => Number(v));
  return (h ?? 0) * 60 + (m ?? 0);
}

const priceField = z
  .string()
  .min(1, 'Price is required')
  .transform((val) => Number(val))
  .pipe(z.number().positive('Enter a valid price'));

export const addBagSchema = z
  .object({
    title: z.string().min(2, 'Bag name is required'),
    description: z.string().optional(),
    original_price_npr: priceField,
    rescue_price_npr: z
      .string()
      .min(1, 'Rescue price is required')
      .transform((val) => Number(val))
      .pipe(z.number().min(50, 'Rescue price must be at least NPR 50')),
    quantity_available: z.number().int().min(1).max(200),
    max_per_customer: z.number().int().min(1).max(200),
    pickup_start: z.string().min(1, 'Pickup start is required'),
    pickup_end: z.string().min(1, 'Pickup end is required'),
    image_url: z.string().optional(),
  })
  .refine((data) => data.rescue_price_npr < data.original_price_npr, {
    message: 'Rescue price must be less than original price',
    path: ['rescue_price_npr'],
  })
  .refine((data) => data.max_per_customer <= data.quantity_available, {
    message: 'Cannot exceed the number of bags listed',
    path: ['max_per_customer'],
  })
  .refine((data) => timeToMinutes(data.pickup_end) > timeToMinutes(data.pickup_start), {
    message: 'Pickup end must be after pickup start',
    path: ['pickup_end'],
  });

export type AddBagFormInput = z.input<typeof addBagSchema>;
export type AddBagFormValues = z.output<typeof addBagSchema>;

export const PICKUP_PRESETS = [
  { label: 'Morning (7-9am)', start: '07:00', end: '09:00' },
  { label: 'Lunch (12-2pm)', start: '12:00', end: '14:00' },
  { label: 'Dinner (8-10pm)', start: '20:00', end: '22:00' },
] as const;

export function formatTimeFromDate(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatTimeForDb(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

export function nprToPaisa(npr: number) {
  return Math.round(npr * 100);
}

export function estimateSavingsNpr(original: number, rescue: number) {
  return Math.max(0, original - rescue);
}

export function estimateDiscountPct(original: number, rescue: number) {
  if (original <= 0 || rescue <= 0 || rescue >= original) return 0;
  return Math.round(((original - rescue) / original) * 100);
}
