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
    title: z.string().min(2, 'Title is required'),
    title_np: z.string().min(1, 'Nepali title is required'),
    description: z.string().optional(),
    original_price_npr: priceField,
    rescue_price_npr: z
      .string()
      .min(1, 'Rescue price is required')
      .transform((val) => Number(val))
      .pipe(z.number().min(50, 'Rescue price must be at least NPR 50')),
    quantity_available: z.number().int().min(1).max(20),
    pickup_start: z.string().min(1, 'Pickup start is required'),
    pickup_end: z.string().min(1, 'Pickup end is required'),
    image_url: z.string().optional(),
  })
  .refine((data) => data.rescue_price_npr < data.original_price_npr, {
    message: 'Rescue price must be less than original price',
    path: ['rescue_price_npr'],
  })
  .refine((data) => timeToMinutes(data.pickup_end) > timeToMinutes(data.pickup_start), {
    message: 'Pickup end must be after pickup start',
    path: ['pickup_end'],
  });

export type AddBagFormInput = z.input<typeof addBagSchema>;
export type AddBagFormValues = z.output<typeof addBagSchema>;

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

export function estimateReachCount(discountPct: number, quantity: number) {
  return Math.round(80 + discountPct * 4 + quantity * 12);
}
