export type NameDisplayMode = 'full' | 'first' | 'initials' | 'anonymous';

export type PrivacySettings = {
  show_phone?: boolean;
  show_full_name?: boolean;
  name_display?: NameDisplayMode | string;
};

export const DEFAULT_PRIVACY_SETTINGS: Required<
  Pick<PrivacySettings, 'show_phone' | 'show_full_name' | 'name_display'>
> = {
  show_phone: true,
  show_full_name: true,
  name_display: 'full',
};

const VALID_NAME_DISPLAY: NameDisplayMode[] = ['full', 'first', 'initials', 'anonymous'];

export function normalizePrivacySettings(
  value: PrivacySettings | null | undefined,
): Required<typeof DEFAULT_PRIVACY_SETTINGS> {
  const nameDisplay = (value?.name_display as NameDisplayMode | undefined) ?? 'full';
  return {
    show_phone: value?.show_phone ?? true,
    show_full_name: value?.show_full_name ?? nameDisplay === 'full',
    name_display: VALID_NAME_DISPLAY.includes(nameDisplay as NameDisplayMode)
      ? nameDisplay
      : 'full',
  };
}

/** Stable short code for anonymous display, e.g. A3F2 */
export function getAnonymousCode(userId?: string | null): string {
  if (!userId) return 'GUEST';
  const hex = userId.replace(/-/g, '').slice(-4).toUpperCase();
  return hex || 'GUEST';
}

export function getAnonymousDisplayName(userId?: string | null): string {
  return `Customer #${getAnonymousCode(userId)}`;
}

export function getDisplayName(profile: {
  id?: string | null;
  full_name?: string | null;
  privacy_settings?: PrivacySettings | null;
} | null | undefined): string {
  if (!profile) return 'Customer';
  const setting = profile.privacy_settings?.name_display || 'full';
  const fullName = profile.full_name?.trim() || 'Customer';
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Customer';

  switch (setting) {
    case 'full':
      return fullName;
    case 'first':
      return firstName;
    case 'initials':
      if (parts.length >= 2) {
        return parts.map((p) => `${p[0]?.toUpperCase() ?? ''}.`).join('');
      }
      return `${firstName[0]?.toUpperCase() ?? 'C'}.`;
    case 'anonymous':
      return getAnonymousDisplayName(profile.id);
    default:
      return fullName;
  }
}

export function getDisplayPhone(profile: {
  phone?: string | null;
  privacy_settings?: PrivacySettings | null;
} | null | undefined): string | null {
  if (!profile) return null;
  const showPhone = profile.privacy_settings?.show_phone ?? true;
  if (!showPhone) return null;
  return profile.phone?.trim() || null;
}

export function getMaskedPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 6) return phone;
  const first = clean.slice(0, 2);
  const last = clean.slice(-3);
  const masked = 'X'.repeat(Math.max(clean.length - 5, 1));
  return `${first}${masked}${last}`;
}
