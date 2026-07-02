import { create } from 'zustand';

import { DEFAULT_AREA_ID, DEFAULT_CITY_ID } from '@/constants/locations';
import { getAreaById, getCityById } from '@/lib/locations';
import type { PartnerCategoryOption } from '@/constants/partnerCategories';
import type { SubscriptionTier } from '@/constants/subscriptions';

const DEFAULT_CITY = getCityById(DEFAULT_CITY_ID)!;
const DEFAULT_AREA = getAreaById(DEFAULT_AREA_ID)!;

export type CustomerSignupData = {
  fullName: string;
  email: string;
  phone: string;
  cityId: string;
  areaId: string;
  homeAddress: string;
  homeLatitude: number;
  homeLongitude: number;
  foodPreferences: string[];
};

export type PartnerSignupData = {
  ownerName: string;
  email: string;
  phone: string;
  businessName: string;
  businessNameNp: string;
  category: PartnerCategoryOption;
  businessPhone: string;
  subscriptionTier: SubscriptionTier | null;
  avgDailyMeals: number | null;
  address: string;
  cityId: string;
  areaId: string;
  latitude: number;
  longitude: number;
  website: string;
  openingStart: string;
  openingEnd: string;
  coverUri: string | null;
};

const defaultCustomer: CustomerSignupData = {
  fullName: '',
  email: '',
  phone: '',
  cityId: DEFAULT_CITY_ID,
  areaId: DEFAULT_AREA_ID,
  homeAddress: '',
  homeLatitude: DEFAULT_AREA.latitude,
  homeLongitude: DEFAULT_AREA.longitude,
  foodPreferences: [],
};

const defaultPartner: PartnerSignupData = {
  ownerName: '',
  email: '',
  phone: '',
  businessName: '',
  businessNameNp: '',
  category: 'restaurant',
  businessPhone: '',
  subscriptionTier: null,
  avgDailyMeals: null,
  address: '',
  cityId: DEFAULT_CITY_ID,
  areaId: DEFAULT_AREA_ID,
  latitude: DEFAULT_AREA.latitude,
  longitude: DEFAULT_AREA.longitude,
  website: '',
  openingStart: '10:00',
  openingEnd: '21:00',
  coverUri: null,
};

type SignupStore = {
  customer: CustomerSignupData;
  partner: PartnerSignupData;
  customerAuthMethod: 'email' | 'phone';
  partnerAuthMethod: 'email' | 'phone';
  signupPassword: string;
  phoneOtpVerified: boolean;
  otpSentForPhone: string | null;
  setCustomer: (patch: Partial<CustomerSignupData>) => void;
  setPartner: (patch: Partial<PartnerSignupData>) => void;
  setCustomerAuthMethod: (method: 'email' | 'phone') => void;
  setPartnerAuthMethod: (method: 'email' | 'phone') => void;
  setSignupPassword: (password: string) => void;
  setPhoneOtpVerified: (verified: boolean) => void;
  setOtpSentForPhone: (phone: string | null) => void;
  resetCustomer: () => void;
  resetPartner: () => void;
};

export const useSignupStore = create<SignupStore>((set) => ({
  customer: { ...defaultCustomer },
  partner: { ...defaultPartner },
  customerAuthMethod: 'phone',
  partnerAuthMethod: 'phone',
  signupPassword: '',
  phoneOtpVerified: false,
  otpSentForPhone: null,
  setCustomer: (patch) => set((state) => ({ customer: { ...state.customer, ...patch } })),
  setPartner: (patch) => set((state) => ({ partner: { ...state.partner, ...patch } })),
  setCustomerAuthMethod: (customerAuthMethod) => set({ customerAuthMethod }),
  setPartnerAuthMethod: (partnerAuthMethod) => set({ partnerAuthMethod }),
  setSignupPassword: (signupPassword) => set({ signupPassword }),
  setPhoneOtpVerified: (phoneOtpVerified) => set({ phoneOtpVerified }),
  setOtpSentForPhone: (otpSentForPhone) => set({ otpSentForPhone }),
  resetCustomer: () =>
    set({
      customer: { ...defaultCustomer },
      customerAuthMethod: 'phone',
      signupPassword: '',
      phoneOtpVerified: false,
      otpSentForPhone: null,
    }),
  resetPartner: () =>
    set({
      partner: { ...defaultPartner },
      partnerAuthMethod: 'phone',
      signupPassword: '',
      phoneOtpVerified: false,
      otpSentForPhone: null,
    }),
}));

export const KATHMANDU_DEFAULT = {
  latitude: DEFAULT_CITY.latitude,
  longitude: DEFAULT_CITY.longitude,
};
