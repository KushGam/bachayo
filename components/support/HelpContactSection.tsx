import { ChevronRight, Mail, MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { SUPPORT_SUBJECTS, type SupportSubject } from '@/constants/supportFaq';
import { hapticButtonPress } from '@/lib/haptics';

type HelpContactSectionProps = {
  subject: SupportSubject | null;
  message: string;
  email: string;
  submitting: boolean;
  messageMax: number;
  onSubjectChange: (subject: SupportSubject) => void;
  onMessageChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onSubmit: () => void;
  onEmailPress: () => void;
  onWhatsAppPress: () => void;
  supportEmail: string;
};

export function HelpContactSection({
  subject,
  message,
  email,
  submitting,
  messageMax,
  onSubjectChange,
  onMessageChange,
  onEmailChange,
  onSubmit,
  onEmailPress,
  onWhatsAppPress,
  supportEmail,
}: HelpContactSectionProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Contact us</Text>
        <Text style={styles.title}>Still need help?</Text>
        <Text style={styles.subtitle}>Send a message — we read every one</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Topic</Text>
        <View style={styles.subjectRow}>
          {SUPPORT_SUBJECTS.map((option) => {
            const active = subject === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  void hapticButtonPress();
                  onSubjectChange(option);
                }}
                style={[styles.subjectChip, active && styles.subjectChipActive]}>
                <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="Message"
          value={message}
          onChangeText={(text) => onMessageChange(text.slice(0, messageMax))}
          placeholder="Describe your issue…"
          multiline
          textAlignVertical="top"
          style={styles.messageInput}
        />
        <Text style={styles.charCount}>
          {message.length}/{messageMax}
        </Text>

        <TextField
          label="Your email"
          value={email}
          onChangeText={onEmailChange}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          label={submitting ? 'Sending…' : 'Send message'}
          onPress={onSubmit}
          loading={submitting}
          size="md"
          style={styles.submitButton}
          disabled={!subject || !message.trim() || !email.trim()}
        />
      </View>

      <View style={styles.channelsCard}>
        <Pressable
          onPress={onEmailPress}
          style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]}>
          <View style={[styles.channelIcon, styles.channelIconEmail]}>
            <Mail size={18} color={Palette.primary} strokeWidth={2} />
          </View>
          <View style={styles.channelCopy}>
            <Text style={styles.channelLabel}>Email us</Text>
            <Text style={styles.channelHint}>{supportEmail}</Text>
          </View>
          <ChevronRight size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          onPress={onWhatsAppPress}
          style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]}>
          <View style={[styles.channelIcon, styles.channelIconWhatsapp]}>
            <MessageCircle size={18} color="#25D366" strokeWidth={2} />
          </View>
          <View style={styles.channelCopy}>
            <Text style={styles.channelLabel}>WhatsApp</Text>
            <Text style={styles.channelHint}>Chat with our team</Text>
          </View>
          <ChevronRight size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  eyebrow: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  formCard: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  fieldLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 2,
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  subjectChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  subjectChipActive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primary,
  },
  subjectChipText: {
    ...Type.caption,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  subjectChipTextActive: {
    color: Palette.primaryDark,
    fontWeight: '700',
  },
  messageInput: {
    height: 120,
    paddingTop: Spacing.sm,
  },
  charCount: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'right',
    marginTop: -4,
    marginBottom: Spacing.xs,
  },
  submitButton: {
    height: 52,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  channelsCard: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderSubtle,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIconEmail: {
    backgroundColor: Palette.primaryLight,
  },
  channelIconWhatsapp: {
    backgroundColor: '#ECFDF5',
  },
  channelCopy: {
    flex: 1,
    gap: 2,
  },
  channelLabel: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  channelHint: {
    ...Type.label,
    color: Palette.textSecondary,
  },
});
