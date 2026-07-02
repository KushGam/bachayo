export const Palette = {
  /** Main brand / CTAs */
  primary: '#D85A30',
  /** Headers, pressed states */
  primaryDark: '#993C1D',
  /** Deepest accent */
  primaryDarker: '#712B13',
  /** Light tints — badges, subtle highlights */
  primaryLight: '#F8F0EC',
  /** Mid-light tint */
  primaryLightAlt: '#F0DDD4',
  /** Mid tone */
  primaryMid: '#E8A088',

  /** @deprecated Use primaryDark */
  darkGreen: '#993C1D',
  /** @deprecated Use primaryLight */
  lightGreenBg: '#F8F0EC',

  /** App canvas — warm linen */
  background: '#F5F3EF',
  /** Cards, sheets, inputs */
  surface: '#FFFCFA',
  /** Slightly recessed areas */
  surfaceMuted: '#EDE9E3',
  imagePlaceholder: '#E8E4DD',

  amber: '#C9922A',
  urgency: '#B85C42',

  textPrimary: '#1C1917',
  textSecondary: '#6B6560',
  textTertiary: '#9C9590',
  /** @deprecated Use textSecondary */
  textMuted: '#6B6560',

  white: '#FFFFFF',
  /** Warm hairline borders on cards */
  border: '#E8E4DE',
  borderSubtle: '#F0EDE8',

  /** Status — muted, never alarm-red in UI chrome */
  success: '#3D6B4F',
  successBg: '#EAF2EC',
  warning: '#8A6A1E',
  warningBg: '#FAF5E8',
  danger: '#9E4A3C',
  dangerBorder: '#D4A59C',
  dangerText: '#7A3A30',
  dangerSoft: '#F5EBE8',

  /** Brand-tinted overlays */
  overlay: {
    heroEnd: 'rgba(153, 60, 29, 0.92)',
    heroMid: 'rgba(153, 60, 29, 0.4)',
    heroSoft: 'rgba(216, 90, 48, 0.08)',
    heroStrong: 'rgba(153, 60, 29, 0.85)',
    border: 'rgba(216, 90, 48, 0.1)',
  },
} as const;

const Colors = {
  light: {
    text: Palette.textPrimary,
    textMuted: Palette.textSecondary,
    background: Palette.background,
    card: Palette.surface,
    tint: Palette.primary,
    accent: Palette.amber,
    lightGreenBg: Palette.primaryLight,
    tabIconDefault: Palette.textSecondary,
    tabIconSelected: Palette.primary,
  },
  dark: {
    text: Palette.white,
    textMuted: Palette.textTertiary,
    background: '#1A1816',
    card: '#262320',
    tint: Palette.primary,
    accent: Palette.amber,
    lightGreenBg: Palette.primaryDarker,
    tabIconDefault: Palette.textTertiary,
    tabIconSelected: Palette.primaryMid,
  },
};

export default Colors;
