import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppMark } from '@/components/brand/AppMark';
import { Palette } from '@/constants/Colors';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
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
        <Text style={styles.title}>About Bachayo</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.logoWrap}>
          <AppMark size="md" />
        </View>
        <Text style={styles.tagline}>
          Rescue surplus food. Save money. Reduce waste.
        </Text>
        <Text style={styles.description}>
          Bachayo connects you with restaurants, cafes, bakeries, and marts selling surplus food at
          rescue prices — helping you save money while keeping good food out of the bin.
        </Text>
        <Text style={styles.version}>Version {APP_VERSION}</Text>
        <Text style={styles.footer}>Made with ❤️ in Nepal 🇳🇵</Text>
      </View>
    </View>
  );
}

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
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  logoWrap: {
    marginBottom: 24,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  version: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  footer: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
});
