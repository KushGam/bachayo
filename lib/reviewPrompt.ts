import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'review_prompt_shown:';

export async function wasReviewPromptShown(orderId: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${KEY_PREFIX}${orderId}`);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markReviewPromptShown(orderId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEY_PREFIX}${orderId}`, '1');
  } catch {
    // best-effort
  }
}
