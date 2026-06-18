import { z } from 'zod';

import type { PartnerCategory } from '@/types/database';

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code').regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const partnerStep1Schema = z.object({
  name: z.string().min(2, 'Name is required'),
  name_np: z.string().min(1, 'Nepali name is required'),
  category: z.enum([
    'restaurant',
    'bakery',
    'hotel',
    'dhaba',
    'cafe',
    'supermarket',
  ] as [PartnerCategory, ...PartnerCategory[]]),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number'),
});

export const partnerStep2Schema = z.object({
  address: z.string().min(5, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
});

export const partnerStep3Schema = z.object({
  cover_image_url: z.string().min(1, 'Cover photo is required'),
});

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type PartnerStep1Values = z.infer<typeof partnerStep1Schema>;
export type PartnerStep2Values = z.infer<typeof partnerStep2Schema>;
export type PartnerStep3Values = z.infer<typeof partnerStep3Schema>;
