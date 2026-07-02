import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import {
  DEFAULT_NOTIFICATION_PREFS,
  mergeNotificationPrefs,
  type NotificationPrefs,
} from '@/constants/notificationPrefs';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/lib/supabase';

const TERRACOTTA = '#D85A30';

type PrefRowProps = {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  isLast?: boolean;
};

function PrefRow({ label, value, onChange, isLast = false }: PrefRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E7EB', true: Palette.primaryMid }}
        thumbColor={Palette.white}
      />
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPartner } = useUserRole();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    setErrorText(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('notification_prefs')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setPrefs(mergeNotificationPrefs(data?.notification_prefs as Partial<NotificationPrefs> | null));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const savePref = async (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ notification_prefs: next } as never)
      .eq('id', userId);
    setSaving(false);

    if (error) {
      setPrefs(prefs);
      setErrorText(error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Notification preferences</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={styles.content}>
          <ListSkeleton count={4} />
        </View>
      ) : errorText ? (
        <View style={styles.content}>
          <RetryState message={errorText} onRetry={() => void loadPrefs()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          {isPartner ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Partner alerts</Text>
              <PrefRow
                label="New reservations"
                value={prefs.new_reservations}
                onChange={(value) => void savePref('new_reservations', value)}
              />
              <PrefRow
                label="Bag expiring alerts"
                value={prefs.bag_expiring}
                onChange={(value) => void savePref('bag_expiring', value)}
              />
              <PrefRow
                label="Subscription reminders"
                value={prefs.subscription_reminders}
                onChange={(value) => void savePref('subscription_reminders', value)}
              />
              <PrefRow
                label="Cancellation alerts"
                value={prefs.cancellation_alerts}
                onChange={(value) => void savePref('cancellation_alerts', value)}
                isLast
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Customer alerts</Text>
              <PrefRow
                label="New bags nearby"
                value={prefs.new_bags}
                onChange={(value) => void savePref('new_bags', value)}
              />
              <PrefRow
                label="Pickup reminders"
                value={prefs.pickup_reminders}
                onChange={(value) => void savePref('pickup_reminders', value)}
              />
              <PrefRow
                label="Review requests"
                value={prefs.review_requests}
                onChange={(value) => void savePref('review_requests', value)}
              />
              <PrefRow
                label="Cancellation updates"
                value={prefs.cancellations}
                onChange={(value) => void savePref('cancellations', value)}
                isLast
              />
            </View>
          )}

          {saving ? <Text style={styles.savingText}>Saving…</Text> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    backgroundColor: TERRACOTTA,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  savingText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
