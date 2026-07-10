# 오목 (Gomoku) Game

A React Native Gomoku (Five in a Row) app built with Expo and TypeScript. Play against AI or a friend, climb the local leaderboard, and progress from Intermediate to Expert to Master.

## Features

### Gameplay
- **15×15 board** on phones; **23×23** on tablets (size locked per game — rotation does not resize mid-play)
- **AI mode** (black, human) and **2-player** local mode
- **Intermediate AI** (score &lt; 80) and **Expert AI** (score ≥ 80), configurable pool sizes in Settings
- **Scoring**: +10 per win (minus undo penalty); reach **100** for Master celebration and a fresh run
- **Undo** (3 per game): reverts your move and the AI reply in vs-AI mode
- **Optional 15s turn timer** with mood indicator and expiry warning before random auto-move
- Win detection, draw detection, winning-line highlight, fireworks, victory/loss popups

### UI & UX
- **Korean / English** language toggle on the home screen
- Home instructions, leaderboard, settings
- Tablet **landscape layout** (sidebar + board column)
- Scrollable board on large grids

### Audio
- Stone placement, win, lose, and master (wow) sound effects
- Optional background music with volume control

### Data (local)
- **Leaderboard** stored in AsyncStorage — top (100+) and recent (&lt;100) sections, **nickname per run row**
- **Settings**: nickname, timer, AI difficulty pools, background music, language
- Score syncs to leaderboard on improvement; master threshold triggers `startFreshRun`

### Platforms
- iOS, Android, Web (Expo)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm or Yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (via `npx expo`)
- Android Studio / Xcode for native builds

## Installation

```bash
git clone <repository-url>
cd gomoku-game
npm install
```

## Running the App

```bash
npx expo start
```

- **iOS**: press `i` or scan QR with Camera
- **Android**: press `a` or scan with Expo Go
- **Web**: press `w`

Native development builds:

```bash
npx expo run:android
npx expo run:ios
```

## Project Structure

```
gomoku-game/
├── App.tsx                    # Navigation: home, game, leaderboard, settings
├── app.json                   # Expo config, runtimeVersion, OTA updates URL
├── index.ts                   # Entry point
├── scripts/
│   └── bump-runtime.js        # Sync runtimeVersion → Android strings.xml
├── assets/
│   └── sounds/                # win, lose, stone, wow, background music
└── src/
    ├── components/
    │   ├── Board.tsx          # Grid, stones, scroll/center
    │   ├── Game.tsx           # Main game orchestration
    │   ├── GameStatus.tsx     # Turn, winner, restart, undo, leaderboard
    │   ├── Stone.tsx
    │   ├── Fireworks.tsx
    │   └── VictoryPopup.tsx
    ├── constants/
    │   ├── app.ts             # APP_VERSION from app.json
    │   ├── game.ts            # Timer, player IDs, expert threshold
    │   └── scoring.ts         # Master threshold, dev test flag
    ├── hooks/
    │   ├── useGameSounds.ts   # SFX + background music
    │   ├── useGameTimer.ts    # Countdown, mood, expiry warning
    │   └── useScoreProgression.ts  # Score, expert/master, celebrations
    ├── screens/
    │   ├── InstructionScreen.tsx
    │   ├── LeaderboardScreen.tsx
    │   └── SettingsScreen.tsx
    ├── services/
    │   ├── leaderboard.ts     # Local runs, scores, nicknames
    │   └── settings.ts        # AsyncStorage user preferences
    └── utils/
        ├── aiLogic.ts         # Intermediate / Expert move selection
        ├── gameLogic.ts       # Board, win, valid moves
        └── i18n.ts            # KO / EN strings
```

## Game Rules

1. Black plays first.
2. First to connect **five** stones horizontally, vertically, or diagonally wins.
3. If the board is full with no winner, the game is a draw.
4. In AI mode, white is the AI opponent.

## Testing Master Celebration (Dev)

Verify fireworks, master popup, wow sound, and leaderboard reset without reaching 100 points.

In `src/constants/scoring.ts`:

```typescript
export const USE_TEST_MASTER_THRESHOLD = true;
export const MASTER_SCORE_THRESHOLD = USE_TEST_MASTER_THRESHOLD ? 20 : 100;
```

Reload the app. The home version line shows `TEST master @ 20`.

1. Start the app (`npx expo start` or `npx expo run:android`).
2. Play in **AI mode**.
3. Win **2 games in a row** (+10 each → 20 total).
4. Expect fireworks, master popup, wow sound, score reset to 0, and intermediate AI after ~4.5s.

Set `USE_TEST_MASTER_THRESHOLD` back to `false` before release.

## EAS OTA Workflow (Expo Updates)

Configured for EAS Update OTA delivery of JS/TS changes.

1. Check login: `eas whoami` (or `eas login`)
2. Link project (once): `eas init`
3. Ensure `app.json` has `updates.url` and `runtimeVersion`
4. Native rebuild after native changes: `eas build --platform android --profile production`
5. Install: `eas build:run --platform android` or sideload APK
6. JS-only update: `eas update --branch production --message "describe change"`
7. Bump runtime before native rebuild: `npm run bump:runtime -- 1.2.0`

### Helper scripts

- `npm run bump:runtime -- 1.2.0` — set `runtimeVersion` in `app.json` and Android `strings.xml`
- `npm run bump:runtime:from-appjson` — sync `strings.xml` from `app.json`

`scripts/bump-runtime.js` updates both `app.json` and `android/app/src/main/res/values/strings.xml`.

## License

[MIT License](LICENSE)
