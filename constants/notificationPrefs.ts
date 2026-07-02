export type CustomerNotificationPrefs = {
  new_bags: boolean;
  pickup_reminders: boolean;
  review_requests: boolean;
  cancellations: boolean;
};

export type PartnerNotificationPrefs = {
  new_reservations: boolean;
  bag_expiring: boolean;
  subscription_reminders: boolean;
  cancellation_alerts: boolean;
};

export type NotificationPrefs = CustomerNotificationPrefs & PartnerNotificationPrefs;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  new_bags: true,
  pickup_reminders: true,
  review_requests: true,
  cancellations: true,
  new_reservations: true,
  bag_expiring: true,
  subscription_reminders: true,
  cancellation_alerts: true,
};

export function mergeNotificationPrefs(
  raw: Partial<NotificationPrefs> | null | undefined,
): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(raw ?? {}) };
}

export function isNotificationPrefEnabled(
  prefs: NotificationPrefs | null | undefined,
  key: keyof NotificationPrefs,
) {
  return mergeNotificationPrefs(prefs)[key] !== false;
}
