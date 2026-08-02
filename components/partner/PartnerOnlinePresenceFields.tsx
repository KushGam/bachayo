import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Palette } from '@/constants/Colors';

type SocialFieldProps = {
  emoji: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

function SocialField({
  emoji,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: SocialFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={styles.input}
        />
      </View>
    </View>
  );
}

export type PartnerOnlinePresenceValues = {
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
};

type PartnerOnlinePresenceFieldsProps = {
  values: PartnerOnlinePresenceValues;
  onChange: (patch: Partial<PartnerOnlinePresenceValues>) => void;
  /** When true, use edit-profile card spacing (no signup shell margins). */
  compact?: boolean;
};

export function PartnerOnlinePresenceFields({
  values,
  onChange,
  compact = false,
}: PartnerOnlinePresenceFieldsProps) {
  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      <Text style={styles.sectionLabel}>ONLINE PRESENCE (Optional)</Text>

      <SocialField
        emoji="🌐"
        label="Website"
        value={values.website}
        onChangeText={(website) => onChange({ website })}
        placeholder="https://yourwebsite.com"
        keyboardType="url"
      />
      <SocialField
        emoji="📘"
        label="Facebook"
        value={values.facebook}
        onChangeText={(facebook) => onChange({ facebook })}
        placeholder="facebook.com/yourpage"
      />
      <SocialField
        emoji="📸"
        label="Instagram"
        value={values.instagram}
        onChangeText={(instagram) => onChange({ instagram })}
        placeholder="@yourhandle"
      />
      <SocialField
        emoji="💬"
        label="WhatsApp"
        value={values.whatsapp}
        onChangeText={(whatsapp) =>
          onChange({ whatsapp: whatsapp.replace(/[^\d]/g, '').slice(0, 10) })
        }
        placeholder="98XXXXXXXX"
        keyboardType="phone-pad"
      />

      <Text style={styles.helper}>
        Help customers find and connect with your restaurant online.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionCompact: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    marginBottom: 10,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Palette.white,
    gap: 10,
  },
  emoji: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  helper: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 16,
  },
});
