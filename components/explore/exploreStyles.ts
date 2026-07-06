import { Platform, StyleSheet } from 'react-native';

import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing } from '@/constants/theme';

export const exploreStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Palette.surfaceMuted,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  markerPin: {
    minWidth: 52,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Palette.white,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  markerPrice: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.lg + 8,
    borderTopRightRadius: Radius.lg + 8,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Palette.borderSubtle,
    ...FloatingShadow,
  },
  sheetDragZone: {
    paddingBottom: Spacing.xs,
  },
  sheetBody: {
    flex: 1,
    minHeight: 0,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginBottom: Spacing.md,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    minHeight: 0,
  },
});
