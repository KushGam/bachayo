export const Palette = {
  primary: '#1D9E75',
  lightGreenBg: '#E1F5EE',
  amber: '#EF9F27',
  textPrimary: '#1A1A1A',
  textMuted: '#6B7280',
  background: '#F9F9F7',
  white: '#FFFFFF',
} as const;

const Colors = {
  light: {
    text: Palette.textPrimary,
    textMuted: Palette.textMuted,
    background: Palette.background,
    card: Palette.white,
    tint: Palette.primary,
    accent: Palette.amber,
    lightGreenBg: Palette.lightGreenBg,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: Palette.primary,
  },
  dark: {
    text: Palette.white,
    textMuted: '#9CA3AF',
    background: '#111827',
    card: '#1F2937',
    tint: Palette.primary,
    accent: Palette.amber,
    lightGreenBg: '#134E3A',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: Palette.primary,
  },
};

export default Colors;
