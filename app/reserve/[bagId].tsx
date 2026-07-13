import { AppSymbol } from '@/components/ui/AppSymbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage } from '@/components/ui/AppImage';
import { Button } from '@/components/ui/Button';
import { DismissKeyboardView } from '@/components/ui/DismissKeyboardView';
import { RetryState } from '@/components/ui/RetryState';
import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { Palette } from '@/constants/Colors';
import { getCategoryById } from '@/constants/partnerCategories';
import { Border, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';
import { enrichBagsWithLiveStock } from '@/lib/bagStock';
import {
  formatNprPaisa,
  formatTodayPickupWindow,
  formatTime12h,
  getBagDineInExtraPaisa,
  getBagServiceType,
} from '@/lib/helpers';
import { getRescueBagImageUrl } from '@/lib/images';
import { createReservation, findActiveReservationForBag } from '@/lib/reservations';
import { dismissModalsAndReplace } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import type { RescueBagWithPartner } from '@/types/app';

const NOTE_MAX = 100;

export default function ReserveBagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bagId, qty: qtyParam, service: serviceParam } = useLocalSearchParams<{
    bagId: string;
    qty?: string;
    service?: string;
  }>();

  const [bag, setBag] = useState<RescueBagWithPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(() => {
    const parsed = Number(qtyParam);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.min(3, Math.floor(parsed)) : 1;
  });
  const [selectedServiceType, setSelectedServiceType] = useState<'takeaway' | 'dinein'>(() =>
    serviceParam === 'dinein' ? 'dinein' : 'takeaway',
  );
  const [submitting, setSubmitting] = useState(false);
  const [soldOutVisible, setSoldOutVisible] = useState(false);
  const duplicateAlertShown = useRef(false);

  const showDuplicateAlert = (orderId: string) => {
    if (duplicateAlertShown.current) return;
    duplicateAlertShown.current = true;
    Alert.alert(
      'Already reserved! ✓',
      'You already have an active reservation for this bag. Check My Bags for your QR code.',
      [
        {
          text: 'View my reservation',
          onPress: () => router.replace(`/order/${orderId}`),
        },
        {
          text: 'Go back',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ],
    );
  };

  useEffect(() => {
    void (async () => {
      if (!bagId) return;
      setLoading(true);
      setFetchError(null);
      duplicateAlertShown.current = false;

      const [{ data: bagData, error: bagError }, { data: sessionData }] = await Promise.all([
        supabase.from('rescue_bags').select('*, partner:partners(*)').eq('id', bagId).maybeSingle(),
        supabase.auth.getSession(),
      ]);

      if (bagError || !bagData) {
        setFetchError(bagError?.message ?? 'Bag not found');
        setLoading(false);
        return;
      }

      const bagRow = bagData as unknown as RescueBagWithPartner;
      const [withStock] = await enrichBagsWithLiveStock([bagRow]);
      const mergedBag = { ...bagRow, ...withStock };
      setBag(mergedBag);
      const serviceType = getBagServiceType(mergedBag);
      if (serviceParam === 'dinein' || serviceParam === 'takeaway') {
        if (serviceType === 'both' || serviceType === serviceParam) {
          setSelectedServiceType(serviceParam);
        } else if (serviceType === 'dinein') {
          setSelectedServiceType('dinein');
        } else {
          setSelectedServiceType('takeaway');
        }
      } else if (serviceType === 'dinein') {
        setSelectedServiceType('dinein');
      } else {
        setSelectedServiceType('takeaway');
      }

      const parsedQty = Number(qtyParam);
      if (Number.isFinite(parsedQty) && parsedQty >= 1) {
        const left = Math.max(0, mergedBag.quantity_available - mergedBag.quantity_reserved);
        setQuantity(Math.min(3, Math.max(1, Math.floor(parsedQty)), Math.max(1, left)));
      }

      const userId = sessionData.session?.user?.id;
      if (userId) {
        const existing = await findActiveReservationForBag(userId, bagId);
        if (existing) {
          showDuplicateAlert(existing.id);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.full_name) setFullName(profile.full_name);
        if (profile?.phone) setPhone(profile.phone);
      }

      setLoading(false);
    })();
  }, [bagId, qtyParam, router, reloadKey, serviceParam]);

  const remaining = useMemo(() => {
    if (!bag) return 0;
    return Math.max(0, bag.quantity_available - bag.quantity_reserved);
  }, [bag]);

  const maxQty = useMemo(() => Math.max(1, Math.min(3, remaining)), [remaining]);

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), maxQty));
  }, [maxQty]);

  const savings = useMemo(() => {
    if (!bag) return null;
    const save = Math.max(0, bag.original_price - bag.rescue_price);
    const pct = bag.original_price > 0 ? Math.round((save / bag.original_price) * 100) : 0;
    return { save, pct };
  }, [bag]);

  const totalPrice = useMemo(() => {
    if (!bag) return 0;
    const dineInExtra = getBagDineInExtraPaisa(bag);
    const unit =
      selectedServiceType === 'dinein' ? bag.rescue_price + dineInExtra : bag.rescue_price;
    return unit * quantity;
  }, [bag, quantity, selectedServiceType]);

  const canSubmit =
    fullName.trim().length > 0 && phone.trim().length > 0 && !submitting && remaining > 0;

  const handleSubmit = async () => {
    if (!bag || !bagId || !canSubmit) return;

    void hapticButtonPress();
    setSubmitting(true);
    const result = await createReservation({
      bagId,
      quantity,
      customerName: fullName,
      customerPhone: phone,
      customerNote: note,
      serviceType: selectedServiceType,
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.error === 'sold_out') {
        setSoldOutVisible(true);
        return;
      }
      if (result.error === 'auth') {
        Alert.alert('Sign in required', result.message ?? 'Please sign in to reserve a bag.', [
          { text: 'Sign in', onPress: () => router.push('/(auth)/login') },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      if (result.error === 'profile') {
        Alert.alert('Complete your profile', result.message ?? 'Add your details before reserving.', [
          { text: 'Continue', onPress: () => router.push('/(auth)/complete-profile') },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      if (result.error === 'duplicate') {
        Alert.alert(
          'Already reserved!',
          result.message ?? 'You already have an active reservation for this bag.',
          [
            {
              text: 'View in My Bags',
              onPress: () =>
                result.orderId
                  ? router.replace(`/order/${result.orderId}`)
                  : router.push('/(tabs)/customer/my-bags'),
            },
            { text: 'OK', style: 'cancel' },
          ],
        );
        return;
      }
      Alert.alert('Could not reserve', result.message ?? 'Please check your connection and try again.', [
        { text: 'Retry', onPress: () => void handleSubmit() },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    dismissModalsAndReplace(router, `/order/confirmed/${result.orderId}`);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <BagCardSkeleton />
      </View>
    );
  }

  if (fetchError || !bag) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <RetryState message={fetchError ?? 'Bag not found'} onRetry={() => setReloadKey((k) => k + 1)} />
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const category = getCategoryById(bag.partner.category);
  const pickupWindow = formatTodayPickupWindow(bag.pickup_start, bag.pickup_end);
  const pickupShort = `${formatTime12h(bag.pickup_start)} – ${formatTime12h(bag.pickup_end)}`;
  const soldOut = remaining <= 0;
  const bagServiceType = getBagServiceType(bag);
  const dineInExtra = getBagDineInExtraPaisa(bag);
  const showServiceChooser = bagServiceType === 'both';
  const canChooseDineIn = bagServiceType !== 'takeaway';

  return (
    <DismissKeyboardView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <AppImage
              source={{ uri: getRescueBagImageUrl(bag) }}
              style={styles.heroImage}
              aspectRatio={16 / 9}
            />
            <Pressable
              onPress={() => {
                void hapticButtonPress();
                router.back();
              }}
              style={({ pressed }) => [styles.heroBack, { top: insets.top + Spacing.sm }, pressed && { opacity: 0.85 }]}>
              <AppSymbol ios="chevron.left" android="arrow-back" size={20} color={Palette.textPrimary} />
            </Pressable>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free to reserve</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Pressable
              onPress={() => router.push(`/partner/${bag.partner_id}`)}
              style={({ pressed }) => [styles.partnerRow, pressed && { opacity: 0.9 }]}>
              <View style={styles.partnerLogo}>
                <Text style={styles.partnerLogoText}>
                  {(bag.partner.name?.[0] || 'B').toUpperCase()}
                </Text>
              </View>
              <View style={styles.partnerCopy}>
                <Text style={styles.partnerName}>{bag.partner.name}</Text>
                {category ? (
                  <Text style={styles.partnerCategory}>
                    {category.icon} {category.label}
                  </Text>
                ) : null}
              </View>
              <AppSymbol ios="chevron.right" android="chevron-right" size={16} color={Palette.textSecondary} />
            </Pressable>

            <Text style={styles.bagTitle}>{bag.title}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.rescuePrice}>{formatNprPaisa(bag.rescue_price)}</Text>
              {bag.original_price > bag.rescue_price ? (
                <Text style={styles.originalPrice}>{formatNprPaisa(bag.original_price)}</Text>
              ) : null}
              {savings && savings.pct > 0 ? (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>{savings.pct}% off</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <AppSymbol ios="clock" android="schedule" size={16} color={Palette.primary} />
                <Text style={styles.metaText}>{pickupWindow}</Text>
              </View>
              <View style={styles.metaRow}>
                <AppSymbol ios="mappin.and.ellipse" android="place" size={16} color={Palette.primary} />
                <Text style={styles.metaText} numberOfLines={2}>
                  {bag.partner.address || 'Address not set'}
                </Text>
              </View>
            </View>
          </View>

          {soldOut ? (
            <View style={styles.soldOutBanner}>
              <Text style={styles.soldOutTitle}>This bag just sold out</Text>
              <Text style={styles.soldOutBody}>Try another rescue bag nearby — new ones drop daily.</Text>
              <Button
                label="Browse bags"
                onPress={() => dismissModalsAndReplace(router, '/(tabs)/customer/home')}
                size="md"
                style={styles.soldOutBtn}
              />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Your details</Text>
                <Text style={styles.cardSubtitle}>So the restaurant knows who&apos;s picking up</Text>

                <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
                <TextField
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="98XXXXXXXX"
                  keyboardType="phone-pad"
                />

                <View style={styles.optionalLabelRow}>
                  <Text style={styles.fieldLabel}>Note to restaurant</Text>
                  <Text style={styles.optionalTag}>Optional</Text>
                </View>
                <TextField
                  hideLabel
                  value={note}
                  onChangeText={(text) => setNote(text.slice(0, NOTE_MAX))}
                  placeholder="e.g. I'll arrive closer to 9pm"
                  multiline
                  style={styles.noteInput}
                />
                <Text style={styles.charCount}>
                  {note.length}/{NOTE_MAX}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>How many bags?</Text>
                <View style={styles.qtyRow}>
                  {[1, 2, 3].map((q) => {
                    const disabled = q > maxQty;
                    const active = q === quantity;
                    return (
                      <Pressable
                        key={q}
                        disabled={disabled}
                        onPress={() => {
                          void hapticButtonPress();
                          setQuantity(q);
                        }}
                        style={[
                          styles.qtyPill,
                          active && styles.qtyPillActive,
                          disabled && styles.qtyPillDisabled,
                        ]}>
                        <Text style={[styles.qtyText, active && styles.qtyTextActive]}>{q}</Text>
                      </Pressable>
                    );
                  })}
                  <Text style={styles.qtyHint}>
                    {remaining} left today
                    {remaining === 1 ? ' · Only 1 left!' : remaining <= 3 ? ` · Only ${remaining} left!` : ''}
                  </Text>
                </View>
              </View>
              {showServiceChooser ? (
                <View style={styles.card}>
                  <Text style={styles.serviceTitle}>How would you like to enjoy your bag?</Text>
                  <View style={styles.serviceRow}>
                    <Pressable
                      onPress={() => {
                        void hapticButtonPress();
                        setSelectedServiceType('takeaway');
                      }}
                      style={[
                        styles.serviceCard,
                        selectedServiceType === 'takeaway' && styles.serviceCardActive,
                      ]}>
                      <Text style={styles.serviceEmoji}>🛍</Text>
                      <Text style={styles.serviceName}>Takeaway</Text>
                      <Text style={styles.serviceHint}>Collect and take away</Text>
                      <Text style={styles.servicePrice}>{formatNprPaisa(bag.rescue_price)}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        void hapticButtonPress();
                        if (!canChooseDineIn) return;
                        setSelectedServiceType('dinein');
                      }}
                      style={[
                        styles.serviceCard,
                        selectedServiceType === 'dinein' && styles.serviceCardActive,
                      ]}>
                      <Text style={styles.serviceEmoji}>🪑</Text>
                      <Text style={styles.serviceName}>Dine-in</Text>
                      <Text style={styles.serviceHint}>Eat at the restaurant</Text>
                      <Text style={styles.servicePrice}>
                        {formatNprPaisa(bag.rescue_price + dineInExtra)}
                      </Text>
                      <Text
                        style={[
                          styles.serviceSubHint,
                          dineInExtra === 0 && styles.serviceSubHintPositive,
                        ]}>
                        {dineInExtra > 0
                          ? `Includes ${formatNprPaisa(dineInExtra)} dine-in charge`
                          : 'Same price'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <View style={styles.reminderCard}>
                <Text style={styles.reminderEmoji}>🕐</Text>
                <View style={styles.reminderCopy}>
                  <Text style={styles.reminderTitle}>Pickup today</Text>
                  <Text style={styles.reminderText}>
                    Come between {pickupShort}. Pay {formatNprPaisa(totalPrice)} at the counter — no upfront
                    payment needed.
                  </Text>
                  <Text style={styles.reminderService}>
                    Service: {selectedServiceType === 'dinein' ? 'Dine-in' : 'Takeaway'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {!soldOut ? (
          <View style={[styles.stickyBar, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.stickyLeft}>
              <Text style={styles.stickyLabel}>Pay at pickup</Text>
              <Text style={styles.stickyPrice}>{formatNprPaisa(totalPrice)}</Text>
              <Text style={styles.stickyHint}>
                {quantity} bag{quantity === 1 ? '' : 's'} ·{' '}
                {selectedServiceType === 'dinein' ? 'Dine-in' : 'Takeaway'}
              </Text>
            </View>
            <Pressable
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.stickyBtn,
                !canSubmit && styles.stickyBtnDisabled,
                pressed && canSubmit && { opacity: 0.92 },
              ]}>
              <Text style={styles.stickyBtnText}>
                {submitting ? 'Reserving…' : 'Confirm →'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Modal visible={soldOutVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEmoji}>😔</Text>
              <Text style={styles.modalTitle}>Sorry, this bag just sold out</Text>
              <Text style={styles.modalBody}>
                Someone grabbed the last one while you were reserving. Try another bag!
              </Text>
              <Button
                label="Browse other bags"
                onPress={() => {
                  setSoldOutVisible(false);
                  dismissModalsAndReplace(router, '/(tabs)/customer/home');
                }}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backLink: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  backLinkText: {
    color: Palette.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    gap: Spacing.md,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Palette.imagePlaceholder,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBack: {
    position: 'absolute',
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: Border.width,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...FloatingShadow,
  },
  freeBadge: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...FloatingShadow,
  },
  freeBadgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...FloatingShadow,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    marginBottom: Spacing.xs,
  },
  partnerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  partnerCopy: {
    flex: 1,
    gap: 2,
  },
  partnerName: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  partnerCategory: {
    ...Type.caption,
    color: Palette.textSecondary,
    textTransform: 'capitalize',
  },
  bagTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 2,
  },
  rescuePrice: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 15,
    color: Palette.textSecondary,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  savingsBadge: {
    backgroundColor: '#FAEEDA',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  metaList: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  metaText: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  soldOutBanner: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    borderStyle: 'dashed',
  },
  soldOutTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  soldOutBody: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  soldOutBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'stretch',
  },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...FloatingShadow,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginBottom: Spacing.xs,
  },
  optionalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  optionalTag: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  noteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  charCount: {
    ...Type.label,
    color: Palette.textSecondary,
    textAlign: 'right',
    marginTop: -Spacing.xs,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  qtyPill: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: Border.width,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  qtyPillDisabled: {
    opacity: 0.35,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  qtyTextActive: {
    color: Palette.white,
  },
  qtyHint: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
    flex: 1,
    minWidth: 120,
  },
  reminderCard: {
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: '#FAECE7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F0DDD4',
  },
  reminderEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  reminderCopy: {
    flex: 1,
    gap: 4,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  reminderText: {
    ...Type.caption,
    color: Palette.primaryDark,
    lineHeight: 20,
    fontWeight: '500',
  },
  reminderService: {
    ...Type.label,
    color: Palette.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    padding: 12,
  },
  serviceCardActive: {
    borderColor: Palette.primary,
    backgroundColor: '#FAECE7',
  },
  serviceEmoji: {
    fontSize: 28,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  serviceHint: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: 6,
  },
  serviceSubHint: {
    ...Type.label,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  serviceSubHintPositive: {
    color: Palette.success,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  stickyLeft: {
    flex: 1,
    gap: 2,
  },
  stickyLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stickyPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: -0.3,
  },
  stickyHint: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  stickyBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    minWidth: 130,
    alignItems: 'center',
  },
  stickyBtnDisabled: {
    opacity: 0.45,
  },
  stickyBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
