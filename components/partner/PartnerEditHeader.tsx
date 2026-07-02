import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';

type PartnerEditHeaderProps = {
  title: string;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
};

export function PartnerEditHeader({
  title,
  onSave,
  saving = false,
  saveLabel = 'Save',
}: PartnerEditHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={20} color={Palette.primary} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {onSave ? (
          <Pressable onPress={onSave} disabled={saving} hitSlop={8} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator size="small" color={Palette.white} />
            ) : (
              <Text style={styles.saveText}>{saveLabel}</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.savePlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
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
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Palette.white,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  saveBtn: {
    minWidth: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.white,
  },
  savePlaceholder: {
    width: 48,
  },
});
