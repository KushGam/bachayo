import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error — RN-only export; types ship without it
  getReactNativePersistence,
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function ensureFirebase(): { app: FirebaseApp; auth: Auth } {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Phone auth is not configured yet. Add Firebase keys to .env.local / EAS.',
    );
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }

  if (!authInstance) {
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(app);
    }
  }

  return { app, auth: authInstance };
}

export function getFirebaseAuth(): Auth {
  return ensureFirebase().auth;
}

export function getFirebaseApp(): FirebaseApp {
  return ensureFirebase().app;
}
