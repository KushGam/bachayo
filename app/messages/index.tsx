import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { formatRelativeTime, getInitials } from '@/lib/helpers';
import { fetchMessageThreads, type MessageThread } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';

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
      style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${item.counterpartName}`}>
      <View style={[styles.avatar, unread && styles.avatarUnread]}>
        <Text style={[styles.avatarText, unread && styles.avatarTextUnread]}>
          {getInitials(item.counterpartName || 'C')}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={1}>
            {item.counterpartName}
          </Text>
          {item.lastMessageAt ? (
            <Text style={[styles.rowTime, unread && styles.rowTimeUnread]}>
              {formatRelativeTime(item.lastMessageAt)}
            </Text>
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
      ) : (
        <AppSymbol ios="chevron.right" android="chevron-right" size={16} color={Palette.textTertiary} />
      )}
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
            <AppSymbol ios="chevron.left" android="arrow-back" size={20} color={Palette.white} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Messages</Text>
            {!loading && threads.length > 0 ? (
              <Text style={styles.headerSubtitle}>
                {threads.length} active chat{threads.length === 1 ? '' : 's'}
              </Text>
            ) : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Palette.primary} />
            <Text style={styles.loadingText}>Loading conversations…</Text>
          </View>
        ) : errorText ? (
          <View style={styles.stateWrap}>
            <RetryState message={errorText} onRetry={() => void loadThreads()} />
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <MessageCircle size={30} color={Palette.primary} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No active chats</Text>
            <Text style={styles.emptySubtitle}>
              Chats appear here while an order is reserved and waiting for pickup.
            </Text>
            <Pressable onPress={() => router.back()} style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>Go back</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => item.orderId}
            style={styles.list}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={Palette.primary}
              />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    backgroundColor: Palette.primaryDarker,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.white,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  headerSpacer: {
    width: 36,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.sm,
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
    backgroundColor: Palette.primaryLight,
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
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: Spacing.md,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
  },
  emptyActionText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: Palette.surface,
  },
  rowUnread: {
    backgroundColor: '#FFF8F5',
  },
  rowPressed: {
    opacity: 0.92,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: Palette.primary,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  avatarTextUnread: {
    color: Palette.white,
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
  rowTimeUnread: {
    color: Palette.primary,
    fontWeight: '600',
  },
  bagTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  preview: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  previewUnread: {
    color: Palette.text,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.borderSubtle,
    marginLeft: Spacing.lg + 48 + 12,
  },
});
