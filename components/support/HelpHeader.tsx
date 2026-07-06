import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, HelpCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type HelpHeaderProps = {
  paddingTop: number;
  isPartner: boolean;
};

export function HelpHeader({ paddingTop, isPartner }: HelpHeaderProps) {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            router.back();
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ChevronLeft size={20} color={Palette.white} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.responsePill}>
          <Clock size={12} color="rgba(255,255,255,0.85)" strokeWidth={2} />
          <Text style={styles.responsePillText}>Replies in 2–4 hours</Text>
        </View>
      </View>

      <View style={styles.copy}>
        <View style={styles.iconWrap}>
          <HelpCircle size={26} color={Palette.white} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>
          {isPartner ? 'Answers for you and your customers' : 'Browse FAQs or message our team'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  responsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  responsePillText: {
    ...Type.label,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  copy: {
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
