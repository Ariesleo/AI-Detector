# Veritas — Mobile/Web App

Expo (React Native) client for the AI Content Detection backend. One codebase → iOS, Android, web.

## Run

```bash
cd mobile
npm install

# Start the backend first (see ../backend/README.md), then:
npx expo start            # press w for web, scan QR for phone (Expo Go)
```

**Physical device:** your phone can't reach `localhost`. Point the app at your machine's LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000 npx expo start
```

## Structure

```
app/
  _layout.tsx          root stack (loads settings before render)
  onboarding.tsx       first-launch carousel — the "honesty contract"
  analyzing.tsx        staged forensic progress (animated scanner) + error state
  report/[id].tsx      verdict panel, evidence, verify-further links, detailed mode
  (tabs)/
    _layout.tsx        bottom tabs: Analyze · History · Settings
    index.tsx          home: hero, dropzone, library/camera pickers
    history.tsx        locally persisted past checks
    settings.tsx       server address, default mode, clear history, about
components/
  ui.tsx               design-system primitives (Screen, Card, Button, Chip…)
  VerdictCard.tsx      verdict gradient panel + animated confidence bar + tally
  EvidenceRow.tsx      signal row: direction icon, weight dots, explanation
  LayerCard.tsx        layer diagnostics (status, note, raw values)
lib/
  theme.ts             dark design tokens + verdict/direction/layer semantics
  types.ts             mirrors backend models — keep in sync
  api.ts               multipart upload; URL: settings → env → localhost
  store.ts             session state (pending image, report handoff)
  storage.ts           AsyncStorage: onboarding flag, settings, 50-entry history
```

All PRODUCT_SPEC UX states are handled: empty/selected home, staged analyzing,
all five verdicts, zero-evidence reports, skipped layers (with reason), cached
results, server-unreachable error with recovery actions, and empty history.

## Production builds

```bash
npm i -g eas-cli
eas build --platform all     # app-store binaries (free tier queues)
npx expo export -p web       # static web bundle → host on Vercel/Netlify
```

## Roadmap

- Share-intent ("share image to Veritas" from any app) via `expo-share-intent` — needs a
  dev build (config plugin), not supported in Expo Go.
- Auth + persistent history once Supabase lands in the backend.
