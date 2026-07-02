import { useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Mail,
  MessageCircle,
  Search,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { TextField } from '@/components/ui/TextField';
import { Palette } from '@/constants/Colors';
import {
  CUSTOMER_FAQ,
  PARTNER_FAQ,
  SUPPORT_EMAIL,
  SUPPORT_SUBJECTS,
  SUPPORT_WHATSAPP,
  type FaqItem,
  type SupportSubject,
} from '@/constants/supportFaq';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { useUserRole } from '@/hooks/useUserRole';
import { hapticButtonPress } from '@/lib/haptics';
import { submitSupportContact } from '@/lib/support';
import { supabase } from '@/lib/supabase';

const MESSAGE_MAX = 500;

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

function FaqRow({
  item,
  expanded,
  isLast,
  onToggle,
}: {
  item: FaqItem;
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 200 });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View>
      <Pressable
        onPress={() => {
          void hapticButtonPress();
          onToggle();
        }}
        style={({ pressed }) => [
          styles.faqRow,
          !isLast && styles.faqRowBorder,
          pressed && { opacity: 0.9 },
        ]}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={Palette.textTertiary} strokeWidth={2.5} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.faqAnswerWrap}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function FaqSectionBlock({
  section,
  expandedId,
  onToggle,
}: {
  section: FaqSection;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (section.items.length === 0) return null;

  return (
    <View style={styles.faqSection}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.faqCard}>
        {section.items.map((item, index) => (
          <FaqRow
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            isLast={index === section.items.length - 1}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPartner } = useUserRole();

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subject, setSubject] = useState<SupportSubject | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<{ title: string; message?: string } | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? '');
    });
  }, []);

  useEffect(() => {
    setRole(isPartner ? 'partner' : 'customer');
  }, [isPartner]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const filterFaq = useCallback(
    (items: FaqItem[]) => {
      const query = search.trim().toLowerCase();
      if (!query) return items;
      return items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query),
      );
    },
    [search],
  );

  const faqSections = useMemo((): FaqSection[] => {
    const query = search.trim();
    if (isPartner && !query) {
      return [
        { id: 'customer', title: 'Customer topics', items: filterFaq(CUSTOMER_FAQ) },
        { id: 'partner', title: 'Partner topics', items: filterFaq(PARTNER_FAQ) },
      ];
    }
    const merged = isPartner ? [...CUSTOMER_FAQ, ...PARTNER_FAQ] : CUSTOMER_FAQ;
    return [{ id: 'all', title: 'Frequently asked questions', items: filterFaq(merged) }];
  }, [filterFaq, isPartner, search]);

  const hasFaqResults = faqSections.some((section) => section.items.length > 0);

  const handleSubmit = async () => {
    if (!subject) {
      setErrorMessage('Please select a topic.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please describe your issue.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    void hapticButtonPress();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await submitSupportContact({
        subject,
        message: message.trim(),
        email: email.trim(),
        userId,
        role,
      });
      setSuccessToast({
        title: 'Message sent!',
        message: `We'll reply to ${email.trim()} within a few hours.`,
      });
      setMessage('');
      setSubject(null);
    } catch {
      setErrorMessage(`Couldn't send — try emailing ${SUPPORT_EMAIL} directly.`);
    } finally {
      setSubmitting(false);
    }
  };

  const openEmail = () => {
    void hapticButtonPress();
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const openWhatsApp = () => {
    void hapticButtonPress();
    void Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <SuccessToast
        visible={Boolean(successToast)}
        title={successToast?.title ?? ''}
        message={successToast?.message}
        onHide={() => setSuccessToast(null)}
      />

      {errorMessage ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.errorBanner, { top: insets.top + 8 }]}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </Animated.View>
      ) : null}

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => {
              void hapticButtonPress();
              router.back();
            }}
            style={styles.backBtn}
            hitSlop={8}>
            <ChevronLeft size={20} color={Palette.primary} strokeWidth={2.5} />
          </Pressable>
          <View style={styles.responsePill}>
            <Text style={styles.responsePillText}>Replies in ~2–4 hrs</Text>
          </View>
        </View>

        <View style={styles.headerIconWrap}>
          <HelpCircle size={28} color={Palette.white} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>
          {isPartner
            ? 'Answers for you and your customers'
            : 'Find answers or reach our team'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}>
            <View style={styles.searchWrap}>
              <Search size={18} color={Palette.textTertiary} strokeWidth={2} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search help topics..."
                placeholderTextColor={Palette.textTertiary}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search.length > 0 ? (
                <Pressable
                  onPress={() => {
                    void hapticButtonPress();
                    setSearch('');
                  }}
                  hitSlop={8}
                  style={styles.searchClear}>
                  <X size={16} color={Palette.textTertiary} strokeWidth={2.5} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickLinks}>
              <Pressable
                onPress={openEmail}
                style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}>
                <Mail size={16} color={Palette.primary} strokeWidth={2} />
                <Text style={styles.quickLinkText}>Email</Text>
              </Pressable>
              <Pressable
                onPress={openWhatsApp}
                style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}>
                <MessageCircle size={16} color="#25D366" strokeWidth={2} />
                <Text style={styles.quickLinkText}>WhatsApp</Text>
              </Pressable>
              {isPartner ? (
                <Pressable
                  onPress={() => router.push('/(tabs)/partner/dashboard')}
                  style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}>
                  <Store size={16} color={Palette.primary} strokeWidth={2} />
                  <Text style={styles.quickLinkText}>Dashboard</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push('/(tabs)/customer/my-bags')}
                  style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}>
                  <ShoppingBag size={16} color={Palette.primary} strokeWidth={2} />
                  <Text style={styles.quickLinkText}>My Bags</Text>
                </Pressable>
              )}
            </ScrollView>

            {!hasFaqResults ? (
              <View style={styles.faqEmptyCard}>
                <Text style={styles.faqEmptyEmoji}>🔍</Text>
                <Text style={styles.faqEmptyTitle}>No topics found</Text>
                <Text style={styles.faqEmptyText}>Try a different search or contact us below.</Text>
              </View>
            ) : (
              faqSections.map((section) => (
                <FaqSectionBlock
                  key={section.id}
                  section={section}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
                />
              ))
            )}

            <View style={styles.contactHeader}>
              <Text style={styles.contactTitle}>Still need help?</Text>
              <Text style={styles.contactSubtitle}>Send us a message — we read every one</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Topic</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectRow}>
                {SUPPORT_SUBJECTS.map((option) => {
                  const active = subject === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        void hapticButtonPress();
                        setSubject(option);
                      }}
                      style={[styles.subjectChip, active && styles.subjectChipActive]}>
                      <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <TextField
                label="Message"
                value={message}
                onChangeText={(text) => setMessage(text.slice(0, MESSAGE_MAX))}
                placeholder="Describe your issue..."
                multiline
                textAlignVertical="top"
                style={styles.messageInput}
              />
              <Text style={styles.charCount}>
                {message.length}/{MESSAGE_MAX}
              </Text>

              <TextField
                label="Your email"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Button
                label={submitting ? 'Sending…' : 'Send message →'}
                onPress={() => void handleSubmit()}
                loading={submitting}
                size="md"
                style={styles.submitButton}
                disabled={!subject || !message.trim() || !email.trim()}
              />
            </View>

            <View style={styles.contactCard}>
              <Pressable
                onPress={openEmail}
                style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.9 }]}>
                <View style={[styles.contactIcon, styles.contactIconEmail]}>
                  <Mail size={18} color={Palette.primary} strokeWidth={2} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={styles.contactLabel}>Email us</Text>
                  <Text style={styles.contactHint}>{SUPPORT_EMAIL}</Text>
                </View>
                <ChevronRight size={18} color={Palette.textTertiary} strokeWidth={2} />
              </Pressable>

              <View style={styles.contactDivider} />

              <Pressable
                onPress={openWhatsApp}
                style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.9 }]}>
                <View style={[styles.contactIcon, styles.contactIconWhatsapp]}>
                  <MessageCircle size={18} color="#25D366" strokeWidth={2} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={styles.contactLabel}>WhatsApp</Text>
                  <Text style={styles.contactHint}>Chat with us</Text>
                </View>
                <ChevronRight size={18} color={Palette.textTertiary} strokeWidth={2} />
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
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
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: Palette.dangerSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: Palette.dangerText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responsePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  responsePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 0,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    height: 48,
    marginHorizontal: 16,
    marginTop: -22,
    paddingHorizontal: 14,
    ...FloatingShadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.textPrimary,
    paddingVertical: 0,
  },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinks: {
    paddingHorizontal: 16,
    paddingTop: Spacing.lg,
    gap: 8,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    marginRight: 8,
  },
  quickLinkPressed: {
    opacity: 0.9,
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primaryMid,
  },
  quickLinkText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  faqSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginHorizontal: 16,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  faqRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Palette.borderSubtle,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  faqAnswerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
    backgroundColor: '#FAFAF9',
    borderBottomWidth: 0.5,
    borderBottomColor: Palette.borderSubtle,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  faqEmptyCard: {
    marginHorizontal: 16,
    marginTop: Spacing.xl,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 6,
    ...FloatingShadow,
  },
  faqEmptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  faqEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  faqEmptyText: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactHeader: {
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 12,
    gap: 4,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  contactSubtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  formCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginHorizontal: 16,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...FloatingShadow,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 4,
  },
  subjectRow: {
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  subjectChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: 8,
  },
  subjectChipActive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primary,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  subjectChipTextActive: {
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  messageInput: {
    height: 120,
    paddingTop: 12,
  },
  charCount: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'right',
    marginTop: -4,
    marginBottom: Spacing.xs,
  },
  submitButton: {
    height: 52,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  contactCard: {
    marginHorizontal: 16,
    marginTop: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contactDivider: {
    height: 0.5,
    backgroundColor: Palette.borderSubtle,
    marginLeft: 64,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIconEmail: {
    backgroundColor: '#FAECE7',
  },
  contactIconWhatsapp: {
    backgroundColor: '#ECFDF5',
  },
  contactCopy: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  contactHint: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
});
