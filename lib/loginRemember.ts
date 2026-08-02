import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'login_remember_v1';

export type RememberedLoginMethod = 'phone' | 'email' | 'password';

export type RememberedLogin = {
  remember: boolean;
  email: string;
  phone: string;
  lastMethod: RememberedLoginMethod | null;
};

const EMPTY: RememberedLogin = {
  remember: false,
  email: '',
  phone: '',
  lastMethod: null,
};

export async function loadRememberedLogin(): Promise<RememberedLogin> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<RememberedLogin>;
    const lastMethod =
      parsed.lastMethod === 'phone' ||
      parsed.lastMethod === 'email' ||
      parsed.lastMethod === 'password'
        ? parsed.lastMethod
        : null;
    return {
      remember: Boolean(parsed.remember),
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      lastMethod,
    };
  } catch {
    return EMPTY;
  }
}

export async function saveRememberedLogin(input: {
  remember: boolean;
  email?: string;
  phone?: string;
  lastMethod?: RememberedLoginMethod;
}): Promise<void> {
  try {
    if (!input.remember) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    const prev = await loadRememberedLogin();
    const next: RememberedLogin = {
      remember: true,
      email: (input.email ?? prev.email).trim().toLowerCase(),
      phone: (input.phone ?? prev.phone).replace(/\D/g, '').slice(0, 10),
      lastMethod: input.lastMethod ?? prev.lastMethod,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}

export async function clearRememberedLogin(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}
