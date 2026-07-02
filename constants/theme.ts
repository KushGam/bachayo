import { Palette } from '@/constants/Colors';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Type = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.3 },
  h1: { fontSize: 24, fontWeight: '600' as const, lineHeight: 30, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
} as const;

export const Motion = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

/** Single subtle shadow — floating elements only (FABs, bottom sheets). */
export const FloatingShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

export const Border = {
  width: 1,
  color: Palette.borderSubtle,
} as const;

/** Premium card chrome — warm surface, subtle border, no drop shadow */
export const CardChrome = {
  backgroundColor: Palette.surface,
  borderRadius: Radius.lg,
  borderWidth: Border.width,
  borderColor: Palette.borderSubtle,
} as const;

/** @deprecated Use FloatingShadow only on floating UI. */
export const Shadow = {
  card: {},
  button: {},
  logo: {},
  floating: FloatingShadow,
} as const;
