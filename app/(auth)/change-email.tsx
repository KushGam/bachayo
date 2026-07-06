import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { Palette } from '@/constants/Colors';
import { normalizeEmail } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = normalizeEmail(newEmail);
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const currentEmail = sessionData.session?.user?.email;

    if (!userId) {
      setLoading(false);
      Alert.alert('Not signed in', 'Please log in again.');
      return;
    }

    if (currentEmail && normalizeEmail(currentEmail) === trimmed) {
      setLoading(false);
      Alert.alert('Same email', 'That is already your email address.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setLoading(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    await supabase.from('profiles').update({ email: trimmed }).eq('id', userId);

    Alert.alert(
      'Check your inbox',
      'We sent a confirmation link to your new email address. Your login email will update after you confirm.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Change email</Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Enter your new email. Supabase will send a confirmation link before the change takes
          effect.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>New email address</Text>
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <Button label="Send confirmation" onPress={() => void handleSave()} loading={loading} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  back: {
    fontSize: 15,
    color: Palette.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
});
