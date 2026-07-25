import { z } from 'zod';

import { CITIES } from '@/constants/locations';
import { PARTNER_CATEGORY_IDS } from '@/constants/partnerCategories';
import { authMethodField, passwordField } from '@/lib/validation/auth';

const ALL_AREA_IDS = CITIES.flatMap((city) => city.areas.map((area) => area.id));
const ALL_CITY_IDS = CITIES.map((city) => city.id);

const phoneField = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number (97/98 + 8 digits)');

const optionalEmailField = z.string().refine(
  (value) => value.trim() === '' || z.email().safeParse(value.trim()).success,
  { message: 'Enter a valid email address' },
);

const requiredEmailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

const personNameField = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name is too long');

const businessNameField = z
  .string()
  .trim()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name is too long');

const optionalBusinessNameNpField = z
  .string()
  .trim()
  .max(100, 'Name is too long')
  .optional()
  .or(z.literal(''));

const addressField = z
  .string()
  .trim()
  .min(10, 'Enter a full street address (building, street, landmark)')
  .max(220, 'Address is too long');

export const websiteField = z.string().refine(
  (value) => {
    const trimmed = value.trim();
    if (!trimmed) return true;

    const withProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    if (z.url().safeParse(withProtocol).success) return true;

    return /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed);
  },
  { message: 'Enter a valid website or social link' },
);

const cityIdField = z.enum(ALL_CITY_IDS as [string, ...string[]], {
  message: 'Select your city',
});

const areaIdField = z.enum(ALL_AREA_IDS as [string, ...string[]], {
  message: 'Select your area',
});

const passwordPairFields = {
  password: passwordField,
  confirmPassword: z.string().min(1, 'Confirm your password'),
};

function addPasswordMatchIssue(data: { password: string; confirmPassword: string }, ctx: z.RefinementCtx) {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }
}

export const customerBasicsSchema = z
  .object({
    authMethod: authMethodField,
    fullName: personNameField,
    email: z.string(),
    phone: z.string(),
    ...passwordPairFields,
  })
  .superRefine((data, ctx) => {
    addPasswordMatchIssue(data, ctx);

    if (data.authMethod === 'email') {
      const parsed = requiredEmailField.safeParse(data.email);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: parsed.error.issues[0]?.message ?? 'Enter a valid email',
          path: ['email'],
        });
      }
      if (data.phone.trim()) {
        const phoneParsed = phoneField.safeParse(data.phone);
        if (!phoneParsed.success) {
          ctx.addIssue({
            code: 'custom',
            message: 'Enter a valid Nepal mobile number',
            path: ['phone'],
          });
        }
      }
      return;
    }

    const phoneParsed = phoneField.safeParse(data.phone);
    if (!phoneParsed.success) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid Nepal mobile number',
        path: ['phone'],
      });
    }
  });

export const customerLocationSchema = z.object({
  homeLatitude: z.number(),
  homeLongitude: z.number(),
  homeAddress: z.string().trim().max(220, 'Address is too long').optional(),
});

export const partnerBasicsSchema = z
  .object({
    authMethod: authMethodField,
    ownerName: personNameField,
    email: z.string(),
    phone: phoneField,
    ...passwordPairFields,
  })
  .superRefine((data, ctx) => {
    addPasswordMatchIssue(data, ctx);

    if (data.authMethod === 'email') {
      const parsed = requiredEmailField.safeParse(data.email);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: parsed.error.issues[0]?.message ?? 'Enter a valid email',
          path: ['email'],
        });
      }
      return;
    }

    const emailParsed = requiredEmailField.safeParse(data.email);
    if (!emailParsed.success) {
      ctx.addIssue({
        code: 'custom',
        message: 'Business email is required',
        path: ['email'],
      });
    }
  });

export const partnerBusinessSchema = z.object({
  businessName: businessNameField,
  businessNameNp: optionalBusinessNameNpField,
  category: z.enum(PARTNER_CATEGORY_IDS, { message: 'Select a business category' }),
  businessPhone: phoneField,
  subscriptionTier: z.enum(['small', 'medium', 'large'], {
    message: 'Select your average daily meal volume',
  }),
  avgDailyMeals: z.number().int().min(1).max(1000),
});

export const partnerLocationSchema = z.object({
  address: addressField,
  cityId: cityIdField,
  areaId: areaIdField,
  latitude: z.number(),
  longitude: z.number(),
  locationVerified: z.boolean().optional(),
  website: websiteField,
});

export type CustomerBasicsValues = z.infer<typeof customerBasicsSchema>;
export type CustomerLocationValues = z.infer<typeof customerLocationSchema>;
export type PartnerBasicsValues = z.infer<typeof partnerBasicsSchema>;
export type PartnerBusinessValues = z.infer<typeof partnerBusinessSchema>;
export type PartnerLocationValues = z.infer<typeof partnerLocationSchema>;
