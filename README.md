# Instructor App

A mobile app for driving schools: lesson scheduling, student management, and per-student
progress tracking against a DVSA-style syllabus. Built with [Expo](https://expo.dev)
(React Native + TypeScript, expo-router) and designed instructor-first — each device works
standalone and offline with a local SQLite database.

## Features

- **Schedule** — week strip with lesson-day dots, day view of lessons, filter by instructor,
  book/edit/cancel lessons (time, duration, type, pickup location, notes, status).
- **Students** — searchable list, profiles with contact details, pickup address, test date,
  status (active / passed / paused), and notes.
- **Progress tracking** — a seeded syllabus (Basics, Junctions, Manoeuvres, Independent
  driving, Advanced) with a 5-level scale per skill (Introduced → Independent) and an
  overall progress bar per student.
- **Multi-instructor** — instructors with names/colors managed in Settings; students and
  lessons are instructor-aware, so a shared cloud backend can be added later without
  remodelling the data.

## Architecture

- `src/app/` — screens (expo-router file-based routing; `(tabs)/` holds the three tabs,
  `student/` and `lesson/` hold the stack/modal screens).
- `src/db/` — SQLite layer: [schema.ts](src/db/schema.ts) (migrations + syllabus seed),
  [queries.ts](src/db/queries.ts) (all SQL), [use-query.ts](src/db/use-query.ts)
  (refetch-on-focus hook).
- `src/components/` — shared UI (forms, chips, lesson card, tab bars).
- Data is stored on-device via `expo-sqlite` (`instructor-app.db`); web builds use the
  wa-sqlite WASM backend (see [metro.config.js](metro.config.js)).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

Then open it on a phone with [Expo Go](https://expo.dev/go) (scan the QR code), in an
[Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/) /
[iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), or press `w` for the web preview.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```
