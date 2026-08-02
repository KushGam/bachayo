import { createSupabaseAdmin } from '@/lib/supabase-admin';

type Prefs = Record<string, boolean>;

/**
 * `reservation` and `cancellation` are sent to both sides of an order, and each
 * side has its own toggle, so the pref key depends on the recipient's role.
 * A `null` key means the type is not user-suppressible.
 */
const PREF_KEY_BY_TYPE: Record<string, { customer: string | null; partner: string | null }> = {
  new_bag: { customer: 'new_bags', partner: null },
  pickup_reminder: { customer: 'pickup_reminders', partner: null },
  review_request: { customer: 'review_requests', partner: null },
  cancellation: { customer: 'cancellations', partner: 'cancellation_alerts' },
  bag_cancelled: { customer: 'cancellations', partner: 'cancellation_alerts' },
  // The customer side of `reservation` is the confirmation of something they
  // just did — always send it. Only the partner's inbound alert is optional.
  reservation: { customer: null, partner: 'new_reservations' },
  bag_expiring: { customer: null, partner: 'bag_expiring' },
  subscription: { customer: null, partner: 'subscription_reminders' },
  // No dedicated toggles — always deliver when mapped with null keys.
  new_review: { customer: null, partner: null },
  order_message: { customer: null, partner: null },
  pickup_confirmed: { customer: null, partner: null },
};

export async function shouldSendNotification(
  userId: string,
  type: string | undefined,
): Promise<boolean> {
  if (!type) return true;

  const mapping = PREF_KEY_BY_TYPE[type];
  if (!mapping) return true;

  const supabase = createSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, notification_prefs')
    .eq('id', userId)
    .maybeSingle();

  // Never let a lookup failure swallow a notification.
  if (error || !profile) return true;

  const key = profile.role === 'partner' ? mapping.partner : mapping.customer;
  if (!key) return true;

  const prefs = profile.notification_prefs as Prefs | null;
  if (!prefs) return true;

  // Only an explicit opt-out blocks delivery; missing keys default to on.
  return prefs[key] !== false;
}
