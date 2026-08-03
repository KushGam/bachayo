import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Info } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Spacing, Type } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/helpers';
import {
  fetchNotificationById,
  markNotificationRead,
  type InboxNotification,
} from '@/lib/notificationsInbox';
import { supabase } from '@/lib/supabase';

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to load notification';
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [notification, setNotification] = useState<InboxNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setErrorText('Notification not found');
      setLoading(false);
      return;
    }

    setErrorText(null);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        setErrorText('Please sign in to view this notification');
        setNotification(null);
        return;
      }

      const row = await fetchNotificationById(id, uid);
      if (!row) {
        setErrorText('Notification not found');
        setNotification(null);
        return;
      }

      setNotification(row);
      if (!row.is_read) {
        await markNotificationRead(row.id, uid);
        setNotification({ ...row, is_read: true });
      }
    } catch (err) {
      setErrorText(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={22} color={Palette.white} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle}>Notification</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ListSkeleton count={2} />
        </View>
      ) : errorText ? (
        <View style={styles.loadingWrap}>
          <RetryState message={errorText} onRetry={() => void load()} />
        </View>
      ) : notification ? (
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + 32,
          }}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Info size={22} color="#6B7280" strokeWidth={2.2} />
            </View>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.time}>{formatRelativeTime(notification.created_at)}</Text>
            <Text style={styles.body}>{notification.body}</Text>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    ...FloatingShadow,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.white,
  },
  headerSpacer: {
    width: 36,
  },
  loadingWrap: {
    padding: Spacing.lg,
  },
  card: {
    ...CardChrome,
    padding: Spacing.xl,
    ...FloatingShadow,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  time: {
    ...Type.label,
    color: Palette.textTertiary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  body: {
    ...Type.body,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
});
