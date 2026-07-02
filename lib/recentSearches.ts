import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recent_searches';
const MAX_RECENT = 5;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function addRecentSearch(term: string): Promise<string[]> {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();

  const existing = await getRecentSearches();
  const next = [trimmed, ...existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_RECENT,
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function removeRecentSearch(term: string): Promise<string[]> {
  const existing = await getRecentSearches();
  const next = existing.filter((item) => item !== term);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
