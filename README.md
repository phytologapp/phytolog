# PhytoLog

An AI plant expert that knows your plants. Log a soil-moisture reading in two taps; PhytoLog learns how fast each plant dries in your home, tells you when to water, and (coming next) uses AI to identify plants, diagnose problems from photos and review your whole collection.

## Stack

- **App:** Expo (React Native) with Expo Router — one codebase for iPhone and Android
- **Data and logins:** Supabase (to be added)
- **AI:** Claude API, called from a Supabase function so the key never ships in the app (to be added)

## Where things live

- `src/app/` — screens (every file is a route)
- `src/lib/care.ts` — the care engine: watering checks, season and humidity adjustments, health score
- `src/lib/sample.ts` — sample plants shown until real logging is built
- `src/constants/theme.ts` — brand colours (light and dark)
- `assets/images/` — app icon and splash (the "Φ Leaf" mark)

## Commands

```bash
npm install
npx expo start        # run locally, open in Expo Go
npx tsc --noEmit      # typecheck
```

## Identifiers

- iOS bundle ID / Android package: `uk.co.phytolog.app`
- Expo project ID: `ce718783-457d-4b3d-a2b7-8292c052458f`
