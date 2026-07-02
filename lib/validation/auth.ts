import { z } from 'zod';

import { KATHMANDU_NEIGHBORHOODS } from '@/constants/partnerAreas';
import { PARTNER_CATEGORY_IDS } from '@/constants/partnerCategories';

export const authMethodField = z.enum(['email', 'phone']);

export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long');

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number'),
});

export const loginSchema = z
  .object({
    authMethod: authMethodField,
    email: z.string(),
    phone: z.string(),
    password: passwordField,
  })
  .superRefine((data, ctx) => {
    if (data.authMethod === 'email') {
      const parsed = z.email().safeParse(data.email.trim());
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid email address',
          path: ['email'],
        });
      }
      return;
    }

    const parsed = phoneSchema.shape.phone.safeParse(data.phone);
    if (!parsed.success) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid Nepal mobile number',
        path: ['phone'],
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number'),
  fullName: z.string().min(2, 'Full name is required'),
  agreedToTerms: z.boolean().refine((value) => value, {
    message: 'You must agree to the Terms & Privacy Policy',
  }),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code').regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map((v) => Number(v));
  return (h ?? 0) * 60 + (m ?? 0);
}

const categoryValues = PARTNER_CATEGORY_IDS;

export const partnerStep1Schema = z
  .object({
    name: z.string().min(2, 'Business name is required'),
    name_np: z.string().optional(),
    category: z.enum(categoryValues),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number'),
    opening_start: z.string().min(1, 'Opening time is required'),
    opening_end: z.string().min(1, 'Closing time is required'),
  })
  .refine((data) => timeToMinutes(data.opening_end) > timeToMinutes(data.opening_start), {
    message: 'Closing time must be after opening time',
    path: ['opening_end'],
  });

export const partnerStep2Schema = z.object({
  address: z.string().min(5, 'Address is required'),
  neighborhood: z.enum(KATHMANDU_NEIGHBORHOODS),
  latitude: z.number(),
  longitude: z.number(),
});

export const partnerStep3Schema = z.object({
  cover_image_url: z.string().optional(),
});

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type PartnerStep1Values = z.infer<typeof partnerStep1Schema>;
export type PartnerStep2Values = z.infer<typeof partnerStep2Schema>;
export type PartnerStep3Values = z.infer<typeof partnerStep3Schema>;
