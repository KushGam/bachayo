import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import {
  fetchOrderMessages,
  markOrderMessagesRead,
  sendOrderMessage,
  type OrderMessage,
} from '@/lib/orderMessages';
import { formatNprPaisa, formatTime12h } from '@/lib/helpers';
import { getDisplayName, getDisplayPhone } from '@/lib/privacy';
import { supabase } from '@/lib/supabase';

type ChatOrder = {
  id: string;
  customer_id: string;
  service_type?: 'takeaway' | 'dinein';
  total_price: number;
  bag: { title: string; pickup_start: string };
  partner: { id: string; name: string; category: string; phone: string | null; user_id: string };
  customer: {
    full_name: string | null;
    phone: string | null;
    privacy_settings?: {
      show_phone?: boolean;
      show_full_name?: boolean;
      name_display?: string;
    } | null;
  };
};

function toDateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (key(date) === key(today)) return 'Today';
  if (key(date) === key(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-NP', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function OrderChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const flatListRef = useRef<FlatList<OrderMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [order, setOrder] = useState<ChatOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  const isPartner = useMemo(() => {
    if (!order || !currentUserId) return false;
    return order.partner.user_id === currentUserId;
  }, [currentUserId, order]);

  const quickReplies = isPartner
    ? ['Bag is ready', 'Please arrive within 30 min', 'Fully packed', 'Thank you']
    : ["I'm on my way", 'Running 10 min late', 'Is the bag ready?', 'Can I dine in?'];

  const canSend = messageText.trim().length > 0;
  const showQuickReplies = !inputFocused && !canSend;

  useEffect(() => {
    void (async () => {
      if (!orderId) return;
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? null;
      setCurrentUserId(userId);
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .select(`
          *,
          bag:rescue_bags(title, pickup_start),
          partner:partners(id, name, category, phone, user_id),
          customer:profiles!orders_customer_id_fkey(full_name, phone, privacy_settings)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr || !orderRow) {
        Alert.alert('Error', orderErr?.message ?? 'Order not found');
        setLoading(false);
        return;
      }
      setOrder(orderRow as unknown as ChatOrder);

      try {
        const rows = await fetchOrderMessages(orderId);
        setMessages(rows);
        await markOrderMessagesRead(orderId, userId);
      } catch (error) {
        console.warn('[order-chat] load failed:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !currentUserId) return;
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` },
        (payload) => {
          const newMsg = payload.new as OrderMessage;
          setMessages((prev) =>
            prev.some((item) => item.id === newMsg.id) ? prev : [...prev, newMsg],
          );
          requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
          if (newMsg.sender_id !== currentUserId) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void markOrderMessagesRead(orderId, currentUserId);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, orderId]);

  const sendMessage = async () => {
    if (!orderId || !currentUserId) return;
    const text = messageText.trim();
    if (!text) return;
    setMessageText('');
    const senderRole: 'partner' | 'customer' = isPartner ? 'partner' : 'customer';
    const tempMessage: OrderMessage = {
      id: `temp-${Date.now()}`,
      order_id: orderId,
      sender_id: currentUserId,
      sender_role: senderRole,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      const row = await sendOrderMessage({
        orderId,
        senderId: currentUserId,
        senderRole,
        message: text,
      });
      setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? row : m)));

      const receiverUserId =
        isPartner || !order ? order?.customer_id : order.partner.user_id;
      if (receiverUserId) {
        await supabase.functions.invoke('send-notification', {
          body: {
            user_id: receiverUserId,
            title: isPartner
              ? order?.partner.name
              : getDisplayName(order?.customer ?? { full_name: null }) || order?.partner.name,
            body: text.slice(0, 100),
            type: 'order_message',
            data: { order_id: orderId },
          },
        });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setMessageText(text);
      Alert.alert('Error', 'Message failed to send');
    }
  };

  const applyQuickReply = (reply: string) => {
    setMessageText(reply);
    inputRef.current?.focus();
  };

  const renderItem = ({ item, index }: { item: OrderMessage; index: number }) => {
    const mine = item.sender_id === currentUserId;
    const prev = messages[index - 1];
    const prevDate = prev ? toDateLabel(prev.created_at) : null;
    const currentDate = toDateLabel(item.created_at);
    const showDate = index === 0 || prevDate !== currentDate;
    const showSender = !mine && (!prev || prev.sender_id !== item.sender_id);
    return (
      <>
        {showDate ? (
          <View style={styles.dateSeparatorWrap}>
            <Text style={styles.dateSeparatorText}>{currentDate}</Text>
          </View>
        ) : null}
        <View style={[styles.bubbleWrap, mine ? styles.bubbleMineWrap : styles.bubbleOtherWrap]}>
          {showSender ? (
            <Text style={styles.senderName}>
              {isPartner
                ? getDisplayName(order?.customer ?? { full_name: null })
                : order?.partner.name}
            </Text>
          ) : null}
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.message}</Text>
            <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
              {formatTime12h(item.created_at.slice(11, 16))}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const subtitle = order
    ? isPartner
      ? `${order.bag.title} · ${formatNprPaisa(order.total_price)}`
      : order.bag.title
    : '';
  const otherName = order
    ? isPartner
      ? getDisplayName(order.customer)
      : order.partner.name
    : 'Chat';
  const phone = order
    ? isPartner
      ? getDisplayPhone(order.customer)
      : order.partner.phone
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <AppSymbol ios="chevron.left" android="arrow-back" size={20} color={Palette.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {otherName}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.iconBtn} hitSlop={8}>
            <AppSymbol ios="phone" android="call" size={18} color={Palette.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}
      </View>

      {order ? (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {order.bag.title}
          </Text>
          <Text style={styles.summaryMeta}>
            {formatNprPaisa(order.total_price)} · {formatTime12h(order.bag.pickup_start)}
          </Text>
          <View
            style={[
              styles.servicePill,
              order.service_type === 'dinein' ? styles.servicePillDinein : styles.servicePillTakeaway,
            ]}>
            <Text
              style={[
                styles.servicePillText,
                order.service_type === 'dinein'
                  ? styles.servicePillTextDinein
                  : styles.servicePillTextTakeaway,
              ]}>
              {order.service_type === 'dinein' ? 'Dine-in' : 'Takeaway'}
            </Text>
          </View>
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.listFlex}
        contentContainerStyle={[styles.list, messages.length === 0 && styles.listEmpty]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Loading chat…</Text>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyHint}>Coordinate pickup here — keep it short and clear.</Text>
            </View>
          )
        }
      />

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
        {showQuickReplies ? (
          <View style={styles.quickOverlay}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.quickRow}>
              {quickReplies.map((reply) => (
                <Pressable key={reply} onPress={() => applyQuickReply(reply)} style={styles.quickPill}>
                  <Text style={styles.quickPillText}>{reply}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            value={messageText}
            onChangeText={setMessageText}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Message…"
            placeholderTextColor={Palette.textTertiary}
            multiline
            scrollEnabled
            blurOnSubmit={false}
            autoCorrect
            autoCapitalize="sentences"
            underlineColorAndroid="transparent"
            style={styles.input}
          />
          <Pressable
            onPress={() => void sendMessage()}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            hitSlop={4}>
            <AppSymbol ios="arrow.up" android="send" size={18} color={Palette.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const INPUT_MIN_HEIGHT = 44;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.borderSubtle,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  iconBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  headerSubtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.borderSubtle,
  },
  summaryTitle: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
    flexShrink: 1,
    maxWidth: '42%',
  },
  summaryMeta: {
    ...Type.label,
    color: Palette.textSecondary,
    flex: 1,
  },
  servicePill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  servicePillTakeaway: {
    backgroundColor: Palette.surfaceMuted,
  },
  servicePillDinein: {
    backgroundColor: Palette.primaryLight,
  },
  servicePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  servicePillTextTakeaway: {
    color: Palette.textSecondary,
  },
  servicePillTextDinein: {
    color: Palette.primaryDark,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '500',
    color: Palette.textTertiary,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  bubbleWrap: {
    marginBottom: 6,
    maxWidth: '78%',
  },
  bubbleMineWrap: {
    alignSelf: 'flex-end',
  },
  bubbleOtherWrap: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: Palette.primary,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: Palette.surface,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textPrimary,
  },
  bubbleTextMine: {
    color: Palette.white,
  },
  bubbleTime: {
    fontSize: 10,
    color: Palette.textTertiary,
    marginTop: 4,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: Palette.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  emptyHint: {
    textAlign: 'center',
    color: Palette.textTertiary,
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 260,
  },
  composer: {
    position: 'relative',
    backgroundColor: Palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.borderSubtle,
    paddingTop: Spacing.sm,
  },
  quickOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    paddingBottom: Spacing.sm,
  },
  quickRow: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickPill: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: INPUT_MIN_HEIGHT,
    maxHeight: 120,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: 22,
    paddingHorizontal: 16,
    // Explicit top/bottom padding avoids iOS multiline vertical jump on space
    paddingTop: Platform.OS === 'ios' ? 11 : 10,
    paddingBottom: Platform.OS === 'ios' ? 11 : 10,
    fontSize: 16,
    lineHeight: 22,
    color: Palette.textPrimary,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: INPUT_MIN_HEIGHT,
    height: INPUT_MIN_HEIGHT,
    borderRadius: INPUT_MIN_HEIGHT / 2,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
});
