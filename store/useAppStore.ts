import { create } from 'zustand';

type AppState = {
  isOnboarded: boolean;
  setOnboarded: (value: boolean) => void;
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  unreadMessages: 0,
  setUnreadMessages: (count) => set({ unreadMessages: count }),
}));
