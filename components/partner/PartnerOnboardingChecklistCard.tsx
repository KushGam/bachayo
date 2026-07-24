import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export type PartnerOnboardingChecklist = {
  profile_photo: boolean;
  business_description: boolean;
  first_bag_listed: boolean;
  bank_details: boolean;
};

const DEFAULT_CHECKLIST: PartnerOnboardingChecklist = {
  profile_photo: false,
  business_description: false,
  first_bag_listed: false,
  bank_details: false,
};

type PartnerOnboardingChecklistCardProps = {
  partnerId: string;
  coverImageUrl?: string | null;
  description?: string | null;
  address?: string | null;
  createdAt?: string | null;
};

function normalizeChecklist(value: unknown): PartnerOnboardingChecklist {
  const row = (value ?? {}) as Partial<PartnerOnboardingChecklist>;
  return {
    profile_photo: Boolean(row.profile_photo),
    business_description: Boolean(row.business_description),
    first_bag_listed: Boolean(row.first_bag_listed),
    bank_details: Boolean(row.bank_details),
  };
}

function daysSince(iso?: string | null) {
  if (!iso) return 0;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 0;
  return (Date.now() - created) / (1000 * 60 * 60 * 24);
}

export function PartnerOnboardingChecklistCard({
  partnerId,
  coverImageUrl,
  description,
  address,
  createdAt,
}: PartnerOnboardingChecklistCardProps) {
  const router = useRouter();
  const [checklist, setChecklist] = useState<PartnerOnboardingChecklist>(DEFAULT_CHECKLIST);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const updateChecklist = useCallback(async () => {
    const [{ data: partner }, { count: bagCount }] = await Promise.all([
      supabase
        .from('partners')
        .select('cover_image_url, description, address, onboarding_checklist, created_at')
        .eq('id', partnerId)
        .maybeSingle(),
      supabase
        .from('rescue_bags')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId),
    ]);

    const current = normalizeChecklist(
      (partner as { onboarding_checklist?: unknown } | null)?.onboarding_checklist,
    );

    const next: PartnerOnboardingChecklist = {
      ...current,
      profile_photo: Boolean(
        coverImageUrl ?? (partner as { cover_image_url?: string | null } | null)?.cover_image_url,
      ),
      business_description: Boolean(
        (description ?? (partner as { description?: string | null } | null)?.description) &&
          (address ?? (partner as { address?: string | null } | null)?.address),
      ),
      first_bag_listed: (bagCount || 0) > 0,
      bank_details: current.bank_details,
    };

    if (JSON.stringify(next) !== JSON.stringify(current)) {
      await supabase
        .from('partners')
        .update({ onboarding_checklist: next } as never)
        .eq('id', partnerId);
    }

    setChecklist(next);
    setLoaded(true);

    const allDone = Object.values(next).every(Boolean);
    const ageDays = daysSince(
      createdAt ?? (partner as { created_at?: string | null } | null)?.created_at,
    );
    setCelebrationVisible(allDone && ageDays <= 3);
  }, [address, coverImageUrl, createdAt, description, partnerId]);

  useFocusEffect(
    useCallback(() => {
      void updateChecklist();
    }, [updateChecklist]),
  );

  const completedCount = useMemo(
    () => Object.values(checklist).filter(Boolean).length,
    [checklist],
  );
  const allDone = completedCount === 4;
  const ageDays = daysSince(createdAt);

  const markBankDetailsDone = async () => {
    const next = { ...checklist, bank_details: true };
    setChecklist(next);
    await supabase
      .from('partners')
      .update({ onboarding_checklist: next } as never)
      .eq('id', partnerId);
    void updateChecklist();
  };

  if (!loaded) return null;
  if (allDone && ageDays > 3) return null;

  if (allDone && celebrationVisible) {
    return (
      <View style={styles.celebration}>
        <Text style={styles.celebrationEmoji}>🎉</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.celebrationTitle}>You&apos;re all set!</Text>
          <Text style={styles.celebrationBody}>
            Start listing rescue bags and reach nearby customers.
          </Text>
        </View>
      </View>
    );
  }

  if (allDone) return null;

  const items: Array<{
    key: keyof PartnerOnboardingChecklist;
    title: string;
    desc: string;
    onPress: () => void;
  }> = [
    {
      key: 'profile_photo',
      title: 'Add cover photo',
      desc: 'Upload a photo of your restaurant',
      onPress: () => router.push('/partner/edit-business'),
    },
    {
      key: 'business_description',
      title: 'Complete business profile',
      desc: 'Add description, hours, and address',
      onPress: () => router.push('/partner/edit-business'),
    },
    {
      key: 'first_bag_listed',
      title: 'List your first rescue bag',
      desc: "Add today's surplus and go live",
      onPress: () => router.push('/partner/add-bag'),
    },
    {
      key: 'bank_details',
      title: 'Set up billing',
      desc: 'Know how to pay your subscription',
                    onPress: () => {
                      if (!checklist.bank_details) {
                        void markBankDetailsDone();
                      }
                      router.push('/(tabs)/partner/subscription');
                    },
    },
  ];

  const progressPct = (completedCount / 4) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🚀 Get started</Text>
          <Text style={styles.headerSubtitle}>Complete your profile</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCircleText}>
            {completedCount}/4
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {items.map((item, index) => {
        const done = checklist[item.key];
        const isLast = index === items.length - 1;
        return (
          <Pressable
            key={item.key}
            onPress={done ? undefined : item.onPress}
            style={[styles.itemRow, !isLast && styles.itemBorder]}>
            <View style={[styles.check, done ? styles.checkDone : styles.checkTodo]}>
              {done ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, done && styles.itemTitleDone]}>{item.title}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
            {!done ? <Text style={styles.itemArrow}>→</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    marginBottom: Spacing.lg,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#D85A30',
    shadowColor: '#D85A30',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#D85A30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAECE7',
  },
  progressCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D85A30',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0EDE8',
    marginTop: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D85A30',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkTodo: {
    backgroundColor: Palette.white,
    borderColor: '#E5E7EB',
  },
  checkMark: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  itemTitleDone: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  itemDesc: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  itemArrow: {
    fontSize: 13,
    color: '#D85A30',
    fontWeight: '700',
  },
  celebration: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 24,
  },
  celebrationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  celebrationBody: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
});
