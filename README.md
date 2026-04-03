# 오목 (Gomoku) Game

A React Native implementation of the classic Gomoku (Five in a Row) game using Expo and TypeScript.

## Game Description

Gomoku, also called Five in a Row, is a traditional board game played on a 15×15 grid. Players take turns placing stones (black and white) on the board, with the goal of getting five stones in a row horizontally, vertically, or diagonally.

## Features

- 15×15 game board
- Turn-based gameplay (black goes first)
- Win detection (5 in a row)
- Game status display in Korean
- Restart game functionality
- Cross-platform (iOS, Android, Web)

## Prerequisites

Before running the project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or newer)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For Android: Android Studio and Android SDK
- For iOS: Xcode (Mac only)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

## Running the App

### Using Expo Go

The easiest way to run the app is using Expo Go:

1. Start the development server:
   ```
   npx expo start
   ```

2. Run on different platforms:
   - For iOS: Press `i` in the terminal or scan the QR code using the Camera app
   - For Android: Press `a` in the terminal or scan the QR code using the Expo Go app
   - For web: Press `w` in the terminal

### Building Native Apps

#### Android

1. Start the development build:
   ```
   npx expo run:android
   ```

2. For a production build:
   ```
   npx expo build:android
   ```

#### iOS (Mac only)

1. Start the development build:
   ```
   npx expo run:ios
   ```

2. For a production build:
   ```
   npx expo build:ios
   ```

## Project Structure

```
GomokuGame/
├── App.tsx              # Main application entry point
├── src/
│   ├── components/      # React components
│   │   ├── Board.tsx    # Game board component
│   │   ├── Game.tsx     # Main game logic component
│   │   ├── GameStatus.tsx # Game status display
│   │   └── Stone.tsx    # Stone component (black/white)
│   └── utils/
│       └── gameLogic.ts # Game rules and logic
├── assets/              # Images, fonts, etc.
└── ...
```

## Game Rules

1. Black always goes first
2. Players take turns placing stones on the board
3. The first player to get 5 stones in a row (horizontally, vertically, or diagonally) wins
4. If the board is filled completely with no winner, the game is a draw

## License

[MIT License](LICENSE)

## EAS OTA Workflow (Expo Updates)

This project is configured to use EAS Update (OTA) for delivering JS/TS changes to installed apps. The steps below cover common scenarios and exact commands.

1) Check Expo login
```bash
eas whoami
```
If not logged in:
```bash
eas logout
eas login
```

2) One-time project linking (if needed)
```bash
cd /path/to/gomoku-game
eas init
```

3) app.json (one-time)
- Ensure `updates.url` is set to `https://u.expo.dev/YOUR_PROJECT_ID` and `runtimeVersion` is present. Example:
```json
"updates": { "url": "https://u.expo.dev/YOUR_PROJECT_ID" },
"runtimeVersion": "1.0.0"
```

4) Install & configure `expo-updates` (one-time)
```bash
npx expo install expo-updates
```

5) Build-time env vars (do not commit secrets)
- Add only the environment variables your app currently uses to `eas.json` production profile under `env`.
- If `eas.json` contains secrets, add it to `.gitignore`:
```bash
echo "eas.json" >> .gitignore
```

6) Initial native build / rebuild after native changes
```bash
eas build --platform android --profile production
```

7) Install APK on devices
Option A (automatic, connected devices):
```bash
eas build:run --platform android
```
Run it once per device (select device each time).

Option B (manual sideload):
```bash
# download the APK from EAS build link
adb install -r path/to/app.apk
```

8) Push JS-only OTA update (no reinstall needed)
```bash
eas update --branch production --message "describe change"
```

9) Native change workflow (when adding native package or changing native config)
- Bump runtime version in both files before building:
   - `app.json`: `"runtimeVersion": "1.1.0"`
   - `android/app/src/main/res/values/strings.xml`: `<string name="expo_runtime_version">1.1.0</string>`
- Then rebuild and reinstall:
```bash
eas build --platform android --profile production
eas build:run --platform android
```

10) Reinstall a previous build (no rebuild)
```bash
eas build:run --platform android
# choose a previous build from the list
```

11) Housekeeping notes
- Use one package manager (yarn or npm). Remove other lockfiles: `rm package-lock.json` if using yarn.
- Add `.expo/` to `.gitignore`.
- After changing Expo password: `eas logout && eas login`.
- If builds queue: check https://expo.dev/accounts/<your-account>/builds and cancel old builds or wait.

If you want, I can add a small helper script to automatically bump `strings.xml` when `runtimeVersion` in `app.json` changes, or add an `npm` script to run `eas update` with a prompt for a message.

## Helper scripts added

Added `bump-runtime.js` — Node script that:
- Accepts a version arg (`node scripts/bump-runtime.js 1.1.0`)
- If no arg provided, reads `expo.runtimeVersion` from `app.json` and updates `strings.xml`
- Writes back `app.json` with updated `runtimeVersion` and updates/inserts `<string name="expo_runtime_version">` in `strings.xml`

Added npm scripts in `package.json`:
- `npm run bump:runtime -- 1.2.0` — set both files to `1.2.0`
- `npm run bump:runtime:from-appjson` — read `app.json` and sync `strings.xml`

Use these before a native rebuild to keep runtime versions in sync.
