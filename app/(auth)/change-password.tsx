import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { Palette } from '@/constants/Colors';
import { signInWithEmail } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Confirm your new password.');
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email;
    if (!email) {
      setLoading(false);
      Alert.alert('Not available', 'Password change is only available for email accounts.');
      return;
    }

    const { error: verifyError } = await signInWithEmail(email, currentPassword);
    if (verifyError) {
      setLoading(false);
      Alert.alert('Incorrect password', 'Your current password is incorrect.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    Alert.alert('Password updated', 'Your password has been changed.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Change password</Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Enter your current password, then choose a new one.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Current password"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Repeat new password"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        <Button
          label={loading ? 'Saving...' : 'Update password'}
          onPress={() => void handleSave()}
          loading={loading}
          disabled={!currentPassword || !newPassword || !confirmPassword || loading}
        />
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
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 4,
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
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
});
