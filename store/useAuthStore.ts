import { create } from 'zustand';

import type { UserRole } from '@/types/database';

export type Locale = 'en' | 'np';

export type AuthMode = 'login' | 'signup';

type AuthState = {
  pendingRole: UserRole;
  pendingPhone: string;
  pendingMode: AuthMode | null;
  pendingName: string | null;
  locale: Locale;
  role: UserRole | null;
  roleLoaded: boolean;
  setPendingRole: (role: UserRole) => void;
  setPendingPhone: (phone: string) => void;
  setPendingMode: (mode: AuthMode | null) => void;
  setPendingName: (name: string | null) => void;
  setLocale: (locale: Locale) => void;
  setRole: (role: UserRole | null) => void;
  setRoleLoaded: (loaded: boolean) => void;
  /** Set role after login/signup when it is already known. */
  setAuthRole: (role: UserRole | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  pendingRole: 'customer',
  pendingPhone: '',
  pendingMode: null,
  pendingName: null,
  locale: 'en',
  role: null,
  roleLoaded: false,
  setPendingRole: (role) => set({ pendingRole: role }),
  setPendingPhone: (phone) => set({ pendingPhone: phone }),
  setPendingMode: (pendingMode) => set({ pendingMode }),
  setPendingName: (pendingName) => set({ pendingName }),
  setLocale: (locale) => set({ locale }),
  setRole: (role) => set({ role }),
  setRoleLoaded: (roleLoaded) => set({ roleLoaded }),
  setAuthRole: (role) => set({ role, roleLoaded: true }),
  reset: () =>
    set({
      pendingRole: 'customer',
      pendingPhone: '',
      pendingMode: null,
      pendingName: null,
      locale: 'en',
      role: null,
      roleLoaded: false,
    }),
}));
