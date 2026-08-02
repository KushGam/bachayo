import { markIntentionalSignOut } from '@/lib/auth/signOutIntent';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * User-initiated logout. Always marks intentional so the root
 * "Session expired" listener does not fire.
 */
export async function performSignOut() {
  markIntentionalSignOut();
  useAuthStore.getState().setAuthRole(null);
  try {
    await clearPushTokenForCurrentUser();
  } catch (error) {
    console.warn('[auth] clearPushToken before signOut failed:', error);
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('[auth] signOut failed:', error.message);
  }
}
