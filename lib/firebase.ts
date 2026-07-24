import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';

// RN persistence helper — available when Metro resolves the RN Auth build.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth(firebaseApp: FirebaseApp): Auth {
  try {
    if (typeof getReactNativePersistence === 'function') {
      return initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage) as never,
      });
    }
    return getAuth(firebaseApp);
  } catch {
    return getAuth(firebaseApp);
  }
}

export const firebaseAuth = createAuth(app);

export default app;
