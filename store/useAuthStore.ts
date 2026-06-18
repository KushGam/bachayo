import { create } from 'zustand';

import type { UserRole } from '@/types/database';

export type Locale = 'en' | 'np';

type AuthState = {
  pendingRole: UserRole;
  pendingPhone: string;
  locale: Locale;
  setPendingRole: (role: UserRole) => void;
  setPendingPhone: (phone: string) => void;
  setLocale: (locale: Locale) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  pendingRole: 'customer',
  pendingPhone: '',
  locale: 'en',
  setPendingRole: (role) => set({ pendingRole: role }),
  setPendingPhone: (phone) => set({ pendingPhone: phone }),
  setLocale: (locale) => set({ locale }),
  reset: () => set({ pendingRole: 'customer', pendingPhone: '', locale: 'en' }),
}));
