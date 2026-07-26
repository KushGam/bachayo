import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessToast } from '@/components/ui/SuccessToast';
import { HelpContactSection } from '@/components/support/HelpContactSection';
import { HelpFaqEmpty, HelpFaqSection, type FaqSection } from '@/components/support/HelpFaq';
import { HelpHeader } from '@/components/support/HelpHeader';
import {
  HelpQuickLinks,
  HelpSearchBar,
  Mail,
  MessageCircle,
  ShoppingBag,
  Store,
} from '@/components/support/HelpSearchBar';
import { Palette } from '@/constants/Colors';
import {
  CUSTOMER_FAQ,
  PARTNER_FAQ,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP,
  type FaqItem,
  type SupportSubject,
} from '@/constants/supportFaq';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useUserRole } from '@/hooks/useUserRole';
import { hapticButtonPress } from '@/lib/haptics';
import { submitSupportContact } from '@/lib/support';
import { supabase } from '@/lib/supabase';

const MESSAGE_MAX = 500;

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

  const quickLinks = useMemo(
    () => [
      {
        key: 'email',
        label: 'Email',
        icon: Mail,
        iconColor: Palette.primary,
        onPress: () => {
          void hapticButtonPress();
          void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
        },
      },
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        iconColor: '#25D366',
        onPress: () => {
          void hapticButtonPress();
          void Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`);
        },
      },
      isPartner
        ? {
            key: 'dashboard',
            label: 'Dashboard',
            icon: Store,
            iconColor: Palette.primary,
            onPress: () => router.push('/(tabs)/partner/dashboard'),
          }
        : {
            key: 'bags',
            label: 'My Bags',
            icon: ShoppingBag,
            iconColor: Palette.primary,
            onPress: () => router.push('/(tabs)/customer/my-bags'),
          },
    ],
    [isPartner, router],
  );

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
        title: 'Message sent',
        message: `We'll reply to ${email.trim()} within a few hours.`,
      });
      setMessage('');
      setSubject(null);
    } catch (error) {
      console.error('[support] submit failed:', error);
      setErrorMessage(`Couldn't send — try emailing ${SUPPORT_EMAIL} directly.`);
    } finally {
      setSubmitting(false);
    }
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

      <HelpHeader paddingTop={insets.top + Spacing.sm} isPartner={isPartner} />

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
            <HelpSearchBar value={search} onChangeText={setSearch} />
            <HelpQuickLinks links={quickLinks} />

            {!hasFaqResults ? (
              <HelpFaqEmpty />
            ) : (
              faqSections.map((section) => (
                <HelpFaqSection
                  key={section.id}
                  section={section}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
                />
              ))
            )}

            <HelpContactSection
              subject={subject}
              message={message}
              email={email}
              submitting={submitting}
              messageMax={MESSAGE_MAX}
              onSubjectChange={setSubject}
              onMessageChange={setMessage}
              onEmailChange={setEmail}
              onSubmit={() => void handleSubmit()}
              onEmailPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              onWhatsAppPress={() => void Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`)}
              supportEmail={SUPPORT_EMAIL}
            />
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
  scrollContent: {
    paddingTop: 0,
  },
  errorBanner: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    backgroundColor: Palette.dangerSoft,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  errorBannerText: {
    ...Type.caption,
    color: Palette.dangerText,
    fontWeight: '600',
    lineHeight: 20,
  },
});
