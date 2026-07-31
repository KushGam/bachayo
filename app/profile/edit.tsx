import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimePickerSheet } from '@/components/partner/TimePickerSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { FOOD_PREFERENCE_OPTIONS } from '@/constants/foodPreferences';
import { Palette } from '@/constants/Colors';
import { getInitials } from '@/lib/helpers';
import { getProfileAvatarUrl } from '@/lib/images';
import { clearPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { uploadAvatar } from '@/lib/upload';
import { useAuthStore } from '@/store/useAuthStore';

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  home_area: string | null;
  city_id: string | null;
  area_id: string | null;
  food_preferences: string[] | null;
};

type FormSnapshot = {
  fullName: string;
  email: string;
  dobIso: string | null;
  foodPreferences: string[];
  avatarUrl: string | null;
  avatarRemoved: boolean;
  pendingAvatarUri: string | null;
};

function getDobLimits() {
  const max = new Date();
  max.setFullYear(max.getFullYear() - 18);
  max.setHours(12, 0, 0, 0);
  const min = new Date();
  min.setFullYear(min.getFullYear() - 100);
  min.setHours(12, 0, 0, 0);
  return { min, max };
}

function parseDob(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDobDisplay(value: Date | null) {
  if (!value) return 'DD / MM / YYYY';
  const dd = String(value.getDate()).padStart(2, '0');
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const yyyy = value.getFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
}

function toIsoDate(value: Date | null) {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((item, index) => item === sortedB[index]);
}

function formatPhoneDisplay(phone: string | null | undefined) {
  if (!phone) return 'Not set';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+977 ${digits.slice(-10)}`;
  }
  return phone;
}

function ProfileEditSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Skeleton width="100%" height={24} borderRadius={8} />
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginTop: 24, alignSelf: 'center' }} />
      </View>
      <View style={{ padding: 16, gap: 16 }}>
        <Skeleton height={180} borderRadius={16} />
        <Skeleton height={120} borderRadius={16} />
        <Skeleton height={160} borderRadius={16} />
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reset } = useAuthStore();
  const { min: minDob, max: maxDob } = useMemo(() => getDobLimits(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPasswordAuth, setHasPasswordAuth] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [initial, setInitial] = useState<FormSnapshot | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | null>(null);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const displayAvatarUri = avatarRemoved
    ? null
    : pendingAvatarUri ?? getProfileAvatarUrl(avatarUrl);

  const hasChanges = useMemo(() => {
    if (!initial) return false;
    const current: FormSnapshot = {
      fullName: fullName.trim(),
      email: email.trim(),
      dobIso: toIsoDate(dob),
      foodPreferences,
      avatarUrl,
      avatarRemoved,
      pendingAvatarUri,
    };
    return (
      current.fullName !== initial.fullName ||
      current.dobIso !== initial.dobIso ||
      !arraysEqual(current.foodPreferences, initial.foodPreferences) ||
      current.avatarRemoved !== initial.avatarRemoved ||
      current.pendingAvatarUri !== initial.pendingAvatarUri
    );
  }, [
    initial,
    fullName,
    email,
    dob,
    foodPreferences,
    avatarUrl,
    avatarRemoved,
    pendingAvatarUri,
  ]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user;
    if (!sessionUser) {
      router.replace('/(auth)/login');
      return;
    }

    setUserId(sessionUser.id);
    const identities = sessionUser.identities ?? [];
    setHasPasswordAuth(identities.some((identity) => identity.provider === 'email'));
    setIsGoogleAuth(identities.some((identity) => identity.provider === 'google'));

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      Alert.alert('Could not load profile', error?.message ?? 'Profile not found');
      return;
    }

    const profile = data as ProfileRow;
    const parsedDob = parseDob(profile.date_of_birth);
    const prefs = profile.food_preferences ?? [];

    setFullName(profile.full_name ?? '');
    setEmail(profile.email ?? sessionUser.email ?? '');
    setPhone(profile.phone);
    setDob(parsedDob);
    setFoodPreferences(prefs);
    setAvatarUrl(profile.avatar_url);
    setPendingAvatarUri(null);
    setAvatarRemoved(false);

    setInitial({
      fullName: profile.full_name?.trim() ?? '',
      email: (profile.email ?? sessionUser.email ?? '').trim(),
      dobIso: profile.date_of_birth,
      foodPreferences: prefs,
      avatarUrl: profile.avatar_url,
      avatarRemoved: false,
      pendingAvatarUri: null,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const pickImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow access to continue.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });

    if (result.canceled || !result.assets[0]) return;
    setPendingAvatarUri(result.assets[0].uri);
    setAvatarRemoved(false);
  };

  const showAvatarActions = () => {
    const hasPhoto = Boolean(displayAvatarUri);
    const options = ['Take photo', 'Choose from library'];
    const destructiveIndex = hasPhoto ? 2 : undefined;
    if (hasPhoto) options.push('Remove photo');
    options.push('Cancel');

    const handleSelection = (index: number) => {
      if (index === 0) void pickImage('camera');
      else if (index === 1) void pickImage('library');
      else if (hasPhoto && index === 2) {
        setPendingAvatarUri(null);
        setAvatarRemoved(true);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: destructiveIndex,
        },
        handleSelection,
      );
      return;
    }

    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: () => void pickImage('camera') },
      { text: 'Choose from library', onPress: () => void pickImage('library') },
      ...(hasPhoto
        ? [
            {
              text: 'Remove photo',
              style: 'destructive' as const,
              onPress: () => {
                setPendingAvatarUri(null);
                setAvatarRemoved(true);
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!userId || !hasChanges) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError('Full name is required');
      return;
    }
    setNameError(null);
    setSaving(true);

    try {
      let nextAvatarUrl = avatarUrl;
      if (avatarRemoved) {
        nextAvatarUrl = null;
      } else if (pendingAvatarUri) {
        nextAvatarUrl = await uploadAvatar(userId, pendingAvatarUri);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          date_of_birth: toIsoDate(dob),
          food_preferences: foodPreferences.length > 0 ? foodPreferences : null,
          avatar_url: nextAvatarUrl,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', userId);

      if (error) throw error;

      setAvatarUrl(nextAvatarUrl);
      setPendingAvatarUri(null);
      setAvatarRemoved(false);
      setInitial({
        fullName: trimmedName,
        email: email.trim(),
        dobIso: toIsoDate(dob),
        foodPreferences,
        avatarUrl: nextAvatarUrl,
        avatarRemoved: false,
        pendingAvatarUri: null,
      });

      setToast({ type: 'success', message: 'Profile updated ✓' });
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setToast({ type: 'error', message: 'Failed to save — try again' });
      console.error('[profile/edit] save failed:', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'Are you sure? This will permanently delete your account and all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: () => {
            setDeleteConfirmText('');
            setDeleteModalOpen(true);
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    if (!userId || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      // Clear first: if RLS silently blocks the delete, the row survives and
      // would otherwise keep pushing to whoever next uses this device.
      await clearPushToken(userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      await supabase.auth.signOut();
      reset();
      setDeleteModalOpen(false);
      router.replace('/(auth)/welcome');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete account';
      Alert.alert('Delete failed', message);
    } finally {
      setDeleting(false);
    }
  };

  const togglePreference = (key: string) => {
    setFoodPreferences((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <ProfileEditSkeleton topInset={insets.top} />
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <Pressable
            onPress={() => void handleSave()}
            disabled={!hasChanges || saving}
            hitSlop={8}
            style={{ opacity: !hasChanges || saving ? 0.5 : 1 }}>
            {saving ? (
              <ActivityIndicator size="small" color={Palette.white} />
            ) : (
              <Text style={[styles.headerAction, styles.headerActionBold]}>Save</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {displayAvatarUri ? (
              <Image source={{ uri: displayAvatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials(fullName || 'User')}</Text>
            )}
          </View>
          <Pressable onPress={showAvatarActions} style={styles.avatarEditBtn}>
            <Camera size={14} color={Palette.primary} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Personal info</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (text.trim()) setNameError(null);
              }}
              placeholder="Your full name"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.input,
                focusedField === 'name' && styles.inputFocused,
                nameError && styles.inputError,
              ]}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              value={email}
              editable={false}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, styles.inputReadOnly]}
            />
            <Text style={styles.fieldSubtext}>
              {isGoogleAuth
                ? 'You sign in with Google. This email is managed by your Google account.'
                : 'Email is linked to your sign-in method and cannot be edited here.'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <Pressable
              onPress={() => setDobPickerOpen(true)}
              style={({ pressed }) => [styles.pressableField, pressed && { opacity: 0.9 }]}>
              <Text style={[styles.pressableFieldText, !dob && styles.placeholderText]}>
                {formatDobDisplay(dob)}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Food preferences</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Dietary preferences</Text>
          <Text style={styles.fieldSubtext}>Helps us show you relevant bags</Text>
          <View style={styles.chipWrap}>
            {FOOD_PREFERENCE_OPTIONS.map((option) => {
              const selected = foodPreferences.includes(option.key);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => togglePreference(option.key)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.profileLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.accountRow}>
            <View style={styles.accountCopy}>
              <Text style={styles.accountLabel}>Phone</Text>
              <Text style={styles.accountValue}>{formatPhoneDisplay(phone)}</Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Change phone number',
                  "To change your phone number, you'll need to verify a new number via OTP",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Change number', onPress: () => router.push('/(auth)/change-phone') },
                  ],
                )
              }>
              <Text style={styles.linkAction}>Change →</Text>
            </Pressable>
          </View>

          {hasPasswordAuth ? (
            <View style={[styles.accountRow, styles.accountRowBorder]}>
              <View style={styles.accountCopy}>
                <Text style={styles.accountLabel}>Password</Text>
                <Text style={styles.accountValue}>••••••••</Text>
              </View>
              <Pressable onPress={() => router.push('/(auth)/change-password')}>
                <Text style={styles.linkAction}>Change →</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.deleteRow,
              styles.accountRowBorder,
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={styles.deleteLabel}>Delete my account</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TimePickerSheet
        visible={dobPickerOpen}
        title="Date of birth"
        mode="date"
        value={dob ?? maxDob}
        minimumDate={minDob}
        maximumDate={maxDob}
        onClose={() => setDobPickerOpen(false)}
        onChange={(date) => setDob(date)}
      />

      {toast ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutUp.duration(180)}
          style={[
            styles.toast,
            { top: insets.top + 8 },
            toast.type === 'error' && styles.toastError,
          ]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      ) : null}

      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Type DELETE to confirm</Text>
            <Text style={styles.modalBody}>
              This permanently deletes your profile and signs you out. This cannot be undone.
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setDeleteModalOpen(false)}
                style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void confirmDeleteAccount()}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                style={[
                  styles.modalDeleteBtn,
                  (deleteConfirmText !== 'DELETE' || deleting) && { opacity: 0.5 },
                ]}>
                {deleting ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Text style={styles.modalDeleteText}>Permanently delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    backgroundColor: '#D85A30',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    fontSize: 15,
    color: Palette.white,
    minWidth: 52,
  },
  headerActionBold: {
    fontWeight: '600',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Palette.white,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 24,
    width: 80,
    height: 80,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.white,
  },
  avatarEditBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  fieldSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
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
  inputFocused: {
    borderColor: '#D85A30',
    backgroundColor: Palette.white,
  },
  inputReadOnly: {
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  inputError: {
    borderColor: '#E24B4A',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  pressableField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  pressableFieldText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: Palette.white,
  },
  chipSelected: {
    borderColor: '#D85A30',
    backgroundColor: '#FAECE7',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#993C1D',
    fontWeight: '600',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  accountRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE8',
    marginTop: 8,
    paddingTop: 12,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  accountValue: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  linkAction: {
    fontSize: 13,
    color: '#D85A30',
    fontWeight: '600',
  },
  deleteRow: {
    paddingVertical: 8,
  },
  deleteLabel: {
    fontSize: 14,
    color: '#E24B4A',
    fontWeight: '500',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.white,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    color: Palette.white,
    fontWeight: '600',
  },
});
