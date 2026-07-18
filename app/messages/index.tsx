import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/helpers';
import { fetchMessageThreads, type MessageThread } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';

const TERRACOTTA = '#D85A30';

function ThreadRow({
  item,
  onPress,
}: {
  item: MessageThread;
  onPress: () => void;
}) {
  const unread = item.unreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, unread && styles.rowUnread]}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${item.counterpartName}`}>
      <View style={styles.iconCircle}>
        <MessageCircle size={20} color={TERRACOTTA} strokeWidth={2} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={1}>
            {item.counterpartName}
          </Text>
          {item.lastMessageAt ? (
            <Text style={styles.rowTime}>{formatRelativeTime(item.lastMessageAt)}</Text>
          ) : null}
        </View>
        <Text style={styles.bagTitle} numberOfLines={1}>
          {item.bagTitle}
        </Text>
        <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
          {item.lastMessage ?? 'No messages yet — say hello'}
        </Text>
      </View>
      {unread ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {item.unreadCount > 9 ? '9+' : String(item.unreadCount)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setErrorText(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) {
      setThreads([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchMessageThreads(uid);
      setThreads(rows);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ListSkeleton count={5} />
        </View>
      ) : errorText ? (
        <View style={styles.loadingWrap}>
          <RetryState message={errorText} onRetry={() => void loadThreads()} />
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyCircle}>
            <MessageCircle size={28} color={TERRACOTTA} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No active chats</Text>
          <Text style={styles.emptySubtitle}>
            Message threads for pending and confirmed{'\n'}orders show up here
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={TERRACOTTA} />
          }
          renderItem={({ item }) => (
            <ThreadRow
              item={item}
              onPress={() => router.push(`/order/chat/${item.orderId}` as Href)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    backgroundColor: Palette.primaryDarker,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    color: Palette.white,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    marginTop: -2,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    ...Type.h2,
    color: Palette.text,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.background,
  },
  rowUnread: {
    backgroundColor: '#FFF8F5',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    ...Type.body,
    color: Palette.text,
    fontWeight: '600',
    flex: 1,
  },
  rowTitleUnread: {
    fontWeight: '700',
  },
  rowTime: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  bagTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  preview: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  previewUnread: {
    color: Palette.text,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: TERRACOTTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
