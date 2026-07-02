import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SubscriptionStatusBadge } from '@/components/partner/SubscriptionStatusBadge';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { formatSubscriptionDate } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import type { SubscriptionStatus, SubscriptionTier } from '@/constants/subscriptions';

type AdminPartnerRow = {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  payment_method_on_file: boolean | null;
};

const STATUS_ORDER: SubscriptionStatus[] = ['past_due', 'trial', 'paused', 'active', 'cancelled'];

export default function AdminSubscriptionsScreen() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [partners, setPartners] = useState<AdminPartnerRow[]>([]);

  useEffect(() => {
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setAllowed(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();

      const isAdmin = Boolean(profile?.is_admin);
      setAllowed(isAdmin);

      if (!isAdmin) return;

      const { data } = await supabase
        .from('partners')
        .select(
          'id, name, subscription_tier, subscription_status, trial_ends_at, current_period_end, payment_method_on_file',
        )
        .order('subscription_status');

      const rows = (data ?? []) as AdminPartnerRow[];
      rows.sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.subscription_status) - STATUS_ORDER.indexOf(b.subscription_status),
      );
      setPartners(rows);
    })();
  }, []);

  if (allowed === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Checking access…</Text>
      </View>
    );
  }

  if (!allowed) {
    return <Redirect href="/(tabs)/customer/home" />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Partner subscriptions</Text>
      <Text style={styles.subtitle}>Internal view — sorted by urgency</Text>

      {partners.map((partner) => {
        const endDate =
          partner.subscription_status === 'trial'
            ? partner.trial_ends_at
            : partner.current_period_end;

        return (
          <View key={partner.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.name}>{partner.name}</Text>
              <Text style={styles.meta}>
                {partner.subscription_tier} · ends {formatSubscriptionDate(endDate)} · payment{' '}
                {partner.payment_method_on_file ? 'yes' : 'no'}
              </Text>
            </View>
            <SubscriptionStatusBadge status={partner.subscription_status} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.h1, color: Palette.textPrimary },
  subtitle: { ...Type.caption, color: Palette.textSecondary, marginBottom: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    padding: Spacing.lg,
  },
  rowMain: { flex: 1, gap: Spacing.xs },
  name: { ...Type.bodyMedium, fontWeight: '700', color: Palette.textPrimary },
  meta: { ...Type.caption, color: Palette.textSecondary },
  muted: { ...Type.body, color: Palette.textSecondary },
});
