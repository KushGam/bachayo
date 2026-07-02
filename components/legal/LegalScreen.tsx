import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';

type LegalScreenProps = {
  title: string;
  lastUpdated?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
};

export function LegalScreen({
  title,
  lastUpdated,
  subtitle,
  children,
  contentStyle,
  footer,
}: LegalScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={20} color={Palette.primary} strokeWidth={2.5} />
          </Pressable>
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {lastUpdated ? (
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, contentStyle]}>
        {children}
      </ScrollView>

      {footer}
    </View>
  );
}

type LegalSectionProps = {
  title?: string;
  children: React.ReactNode;
};

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <View style={styles.section}>
      {title ? <Text style={legalStyles.sectionHeading}>{title}</Text> : null}
      {typeof children === 'string' ? (
        <Text style={legalStyles.bodyText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function LegalParagraph({ children }: { children: string }) {
  return <Text style={legalStyles.bodyText}>{children}</Text>;
}

export const legalStyles = StyleSheet.create({
  sectionHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  leadHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Palette.white,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 48,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  section: {
    gap: 0,
  },
});
