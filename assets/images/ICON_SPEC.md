# LastBag App Icon — Design Spec

Official mark: **shopping bag + ribbon** (see `lastbag-icon.svg`).

Regenerate PNG assets used by Expo splash / store icons:

```bash
python3 scripts/generate-icons.py
```

## Assets

| Asset | Notes |
|-------|--------|
| `icon.png` | 1024×1024 square, terracotta + bag (no rounded corners) |
| `splash-mark.png` | Transparent bag mark for splash on `#D85A30` |
| `logo-mark.png` | Rounded tile for in-app |
| `android-icon-*` | Adaptive icon layers |
| `favicon.png` | 48×48 |

## Expo

Paths in `app.json`: `expo.icon`, `expo.splash`, `expo-splash-screen` plugin.

After regenerating, restart with cache clear:

```bash
npx expo start -c
```
