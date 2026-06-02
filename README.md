# Habit Grid

Black-and-white monthly habit tracker built with Expo, React Native, and local notifications.

## Run locally

```bash
npm install
npm run ios
npm run android
npm run web
```

Local daily reminders use `expo-notifications`. For real iOS and Android notification testing, use a development or release build rather than relying only on the web preview.

## MVP scope

- 30-day monthly grid with one row per habit.
- Tap-to-toggle checkboxes with saved local state.
- Add custom habit rows.
- Previous and next month navigation.
- Light and dark grayscale themes.
- Daily reminder scheduling for iOS and Android.
- Free limit of 3 habit rows with a one-time lifetime unlock for unlimited rows.

## Pricing

- Free: 3 habit rows, dark mode, month navigation, and daily reminder.
- Habit Grid Plus: $4.99 lifetime unlock for unlimited habit rows and future updates.
- No subscription.

The current unlock button is a local preview placeholder. Before App Store / Google Play release, wire it to real in-app purchases.

## Differentiation

Habit Grid is not trying to be a streak game, coaching platform, or social network. The product wedge is a calm, private, black-and-white monthly habit ledger: all habits and all 30 days are visible in a spreadsheet-like sheet.

## 7-day ship checklist

1. Day 1: Smoke test the grid, row creation, month navigation, persistence, and theme toggle.
2. Day 2: Build iOS and Android development builds with EAS or `npx expo run:ios` / `npx expo run:android`.
3. Day 3: Test notification permission prompts and daily reminder scheduling on physical devices.
4. Day 4: Validate app icons and create final store screenshots.
5. Day 5: Add privacy policy text, support email, and store listing copy.
6. Day 6: Submit TestFlight and Google Play internal testing builds.
7. Day 7: Fix review feedback, cut release build, and submit.
