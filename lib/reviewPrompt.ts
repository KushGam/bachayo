import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'review_prompt_shown:';

export async function wasReviewPromptShown(orderId: string): Promise<boolean> {
  // TEMP: always allow auto-popup while we verify realtime + mount triggers.
  // Restore AsyncStorage check after pickup → review flow is confirmed.
  void orderId;
  return false;

  // try {
  //   const value = await AsyncStorage.getItem(`${KEY_PREFIX}${orderId}`);
  //   return value === '1';
  // } catch {
  //   return false;
  // }
}

export async function markReviewPromptShown(orderId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEY_PREFIX}${orderId}`, '1');
    // Also write the alternate key used in some debug notes.
    await AsyncStorage.setItem(`review_shown_${orderId}`, 'true');
  } catch {
    // best-effort
  }
}

/** Clear a stale "shown" flag so unreviwed orders can prompt again. */
export async function clearReviewPromptShown(orderId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${KEY_PREFIX}${orderId}`);
    await AsyncStorage.removeItem(`review_shown_${orderId}`);
  } catch {
    // best-effort
  }
}
