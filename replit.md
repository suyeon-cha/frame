# DualAlarm

A cross-device alarm app — set one alarm and it rings on two synced devices with a 1-minute offset.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/alarm-app run dev` — run the Expo app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo / React Native (expo-router)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/` (pairs.ts, devices.ts, alarms.ts)
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Backend routes: `artifacts/api-server/src/routes/` (pairs, devices, alarms, health)
- Mobile app: `artifacts/alarm-app/`
  - Screens: `app/index.tsx`, `app/onboarding.tsx`, `app/(tabs)/alarms.tsx`, `app/(tabs)/settings.tsx`, `app/alarm-edit.tsx`
  - Context: `context/AlarmContext.tsx`
  - Notification utils: `utils/notifications.ts`

## Architecture decisions

- **Device pairing via code**: devices link with a 6-character alphanumeric code rather than accounts/auth — keeps setup friction extremely low.
- **Local notifications for alarms**: each device schedules its own local notifications via expo-notifications, so alarms fire even when the app is in background. The backend just stores and syncs the alarm data.
- **1-minute secondary offset**: the secondary device (typically iPad/tablet) rings 1 minute after primary — offset is computed client-side based on device role stored in AsyncStorage.
- **Polling for sync**: alarms are fetched every 15 seconds via React Query's `refetchInterval` — lightweight alternative to WebSockets for this use case.
- **Always-dark UI**: the alarm app uses a deep navy dark theme regardless of system color scheme.

## Product

- Install on phone (primary) + tablet/iPad (secondary)
- First launch: create a pair (generates 6-char code) OR join existing pair with code
- Choose device role: Primary rings at exact alarm time, Secondary rings 1 min later
- Add/edit/delete alarms from either device — syncs across both
- Toggle alarms on/off per device
- Local notifications fire at the right time even when app is backgrounded

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- expo-clipboard and expo-notifications must be in `devDependencies` (Expo convention for all packages)
- Local notifications require permission — requested during onboarding role selection
- The EXPO_PUBLIC_DOMAIN env var must be set for the mobile app to reach the API server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
