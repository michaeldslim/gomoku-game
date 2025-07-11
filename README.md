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
   cd GomokuGame
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
