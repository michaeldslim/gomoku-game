export type Language = 'ko' | 'en';

export interface Translations {
  // Home
  appTitle: string;
  startGame: string;
  leaderboardNav: string;
  settingsNav: string;
  loadingSettings: string;
  appVersion: string;

  // Instructions
  instructionsTitle: string;
  instructionLines: string[];
  languageLabel: string;

  // Nav
  back: string;

  // Game score / UI
  score: string;
  masterBadge: string;
  expertAutoBadge: string;
  modeLabel: string;
  settingsLabel: string;
  openSettings: string;
  aiThinking: string;
  scoreGreat: string;
  timerExpiryWarning: string;

  // GameStatus
  currentTurnBlack: string;
  currentTurnWhite: string;
  draw: string;
  blackWins: string;
  whiteWins: string;
  restartGame: string;
  undo: string;
  leaderboardBtn: string;

  // VictoryPopup
  win: string;
  lose: string;
  drawPopup: string;

  // Leaderboard
  leaderboardTitle: string;
  refresh: string;
  clear: string;
  noRecords: string;
  noEntries: string;
  noEntriesSubtext: string;
  scoreLabel: string;
  lastPlayed: string;
  started: string;
  topSection: string;
  bottomSection: string;
  nickname: string;
  resetLeaderboardTitle: string;
  resetLeaderboardMessage: string;
  cancel: string;
  reset: string;
  cleared: string;
  leaderboardCleared: string;
  error: string;
  failedClearLeaderboard: string;

  // Settings
  settingsTitle: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  nicknameHint: string;
  bgMusicLabel: string;
  bgMusicHint: string;
  on: string;
  off: string;
  volume: string;
  timerLabel: string;
  timerHint: string;
  intermediateModeLabel: string;
  intermediateModeHint: string;
  expertModeLabel: string;
  expertModeHint: string;
  expertEasy: string;
  expertMedium: string;
  expertHard: string;
  failedSaveSettings: string;
  languageSettingLabel: string;
}

export const translations: Record<Language, Translations> = {
  ko: {
    // Home
    appTitle: '오목 (Gomoku)',
    startGame: '게임 시작',
    leaderboardNav: '🏅 리더보드',
    settingsNav: '⚙️ 설정',
    loadingSettings: '설정 로딩 중...',
    appVersion: 'v',

    // Instructions
    instructionsTitle: '게임 방법',
    instructionLines: [
      '1. 흑돌이 먼저 시작합니다.',
      '2. 가로, 세로, 대각선으로 먼저 5개를 연결하면 승리합니다.',
      '3. 보드가 가득 차도 승자가 없으면 무승부입니다.',
      '4. 보드는 가로/세로 방향으로 스크롤할 수 있습니다.',
      '5. 설정에서 15초 턴 타이머를 활성화하여 턴 시간을 제한할 수 있습니다.',
      '6. 점수가 80 이상이면 자동으로 Expert 모드로 전환됩니다.',
    ],
    languageLabel: '언어 선택',

    // Nav
    back: '뒤로',

    // Game score / UI
    score: '점수',
    masterBadge: '🏆 마스터',
    expertAutoBadge: '고급 자동 전환',
    modeLabel: '모드',
    settingsLabel: '설정',
    openSettings: '⚙️ 열기',
    aiThinking: 'AI 생각 중...',
    scoreGreat: '참 잘했어요!',
    timerExpiryWarning: '시간 초과 — 곧 임의 위치에 둡니다',

    // GameStatus
    currentTurnBlack: '현재 차례: 흑돌(⚫)',
    currentTurnWhite: '현재 차례: 백돌(⚪)',
    draw: '무승부!',
    blackWins: '흑돌(⚫) 승리!',
    whiteWins: '백돌(⚪) 승리!',
    restartGame: '게임 다시 시작',
    undo: '무르기',
    leaderboardBtn: '리더보드',

    // VictoryPopup
    win: '승!',
    lose: '패!',
    drawPopup: '무승부',

    // Leaderboard
    leaderboardTitle: '🏅 리더보드',
    refresh: '새로고침',
    clear: '삭제',
    noRecords: '기록 없음',
    noEntries: '아직 기록이 없습니다.',
    noEntriesSubtext: '게임에서 승리하여 첫 번째 플레이어가 되세요!',
    scoreLabel: '점수',
    lastPlayed: '마지막 플레이',
    started: '시작일',
    topSection: '🏆 TOP (100+)',
    bottomSection: '🎯 BOTTOM (<100)',
    nickname: '닉네임',
    resetLeaderboardTitle: '리더보드 초기화',
    resetLeaderboardMessage: '저장된 모든 로컬 리더보드 점수를 삭제할까요?',
    cancel: '취소',
    reset: '초기화',
    cleared: '삭제됨',
    leaderboardCleared: '리더보드 데이터가 삭제되었습니다.',
    error: '오류',
    failedClearLeaderboard: '리더보드를 삭제하지 못했습니다. 다시 시도해 주세요.',

    // Settings
    settingsTitle: '⚙️ 설정',
    nicknameLabel: '닉네임',
    nicknamePlaceholder: '닉네임을 입력하세요',
    nicknameHint: '향후 프로필/리더보드 표시에 사용됩니다.',
    bgMusicLabel: '배경 음악',
    bgMusicHint: '게임 중 배경 음악을 재생합니다.',
    on: 'ON',
    off: 'OFF',
    volume: '볼륨',
    timerLabel: '타이머',
    timerHint: '플레이어 차례가 시작되면 15초의 제한 시간이 적용됩니다.',
    intermediateModeLabel: '중급 모드 풀 (점수 < 80)',
    intermediateModeHint: '1 = 가장 어려움, 5 = 가장 쉬움',
    expertModeLabel: '고급 모드 풀 (점수 >= 80)',
    expertModeHint: '하나 선택: 쉬움, 보통, 어려움',
    expertEasy: '쉬움',
    expertMedium: '보통',
    expertHard: '어려움',
    failedSaveSettings: '설정을 저장하지 못했습니다. 다시 시도해 주세요.',
    languageSettingLabel: '언어',
  },
  en: {
    // Home
    appTitle: 'Gomoku',
    startGame: 'Start Game',
    leaderboardNav: '🏅 Leaderboard',
    settingsNav: '⚙️ Settings',
    loadingSettings: 'Loading settings...',
    appVersion: 'v',

    // Instructions
    instructionsTitle: 'How to Play',
    instructionLines: [
      '1. Black always goes first.',
      '2. Connect 5 stones in a row horizontally, vertically, or diagonally to win.',
      '3. If the board is full with no winner, the game is a draw.',
      '4. The board can be scrolled horizontally and vertically.',
      '5. You can enable a 15-second turn timer in Settings to limit each turn.',
      '6. When a score reaches 80 or higher, the game will switch to Expert mode.',
    ],
    languageLabel: 'Language',

    // Nav
    back: 'Back',

    // Game score / UI
    score: 'Score',
    masterBadge: '🏆 Master',
    expertAutoBadge: 'Expert Auto-Switch',
    modeLabel: 'Mode',
    settingsLabel: 'Settings',
    openSettings: '⚙️ Open',
    aiThinking: 'AI thinking...',
    scoreGreat: 'You did great!',
    timerExpiryWarning: 'Time up soon — random move next',

    // GameStatus
    currentTurnBlack: 'Turn: Black(⚫)',
    currentTurnWhite: 'Turn: White(⚪)',
    draw: 'Draw!',
    blackWins: 'Black(⚫) Wins!',
    whiteWins: 'White(⚪) Wins!',
    restartGame: 'Restart',
    undo: 'Undo',
    leaderboardBtn: 'Leaderboard',

    // VictoryPopup
    win: 'Win!',
    lose: 'Lose!',
    drawPopup: 'Draw',

    // Leaderboard
    leaderboardTitle: '🏅 Leaderboard',
    refresh: 'Refresh',
    clear: 'Clear',
    noRecords: 'No records',
    noEntries: 'No records yet.',
    noEntriesSubtext: 'Win a game to be the first player!',
    scoreLabel: 'Score',
    lastPlayed: 'Last Played',
    started: 'Started',
    topSection: '🏆 TOP (100+)',
    bottomSection: '🎯 BOTTOM (<100)',
    nickname: 'Nickname',
    resetLeaderboardTitle: 'Reset Leaderboard',
    resetLeaderboardMessage: 'Delete all saved local leaderboard scores?',
    cancel: 'Cancel',
    reset: 'Reset',
    cleared: 'Cleared',
    leaderboardCleared: 'Leaderboard data has been removed.',
    error: 'Error',
    failedClearLeaderboard: 'Failed to clear leaderboard. Please try again.',

    // Settings
    settingsTitle: '⚙️ Settings',
    nicknameLabel: 'Nickname',
    nicknamePlaceholder: 'Your nickname',
    nicknameHint: 'Used for future profile/leaderboard labeling.',
    bgMusicLabel: 'Background Music',
    bgMusicHint: 'Play background music during the game.',
    on: 'ON',
    off: 'OFF',
    volume: 'Volume',
    timerLabel: 'Timer',
    timerHint: 'Enable 15-second turn timer for human turns.',
    intermediateModeLabel: 'Intermediate Mode Pool (Score < 80)',
    intermediateModeHint: '1 = hardest, 5 = easier',
    expertModeLabel: 'Expert Mode Pool (Score >= 80)',
    expertModeHint: 'Select one: Easy, Medium, Hard',
    expertEasy: 'Easy',
    expertMedium: 'Medium',
    expertHard: 'Hard',
    failedSaveSettings: 'Failed to save settings. Please try again.',
    languageSettingLabel: 'Language',
  },
};

export function t(lang: Language, key: keyof Omit<Translations, 'instructionLines'>): string {
  return translations[lang][key] as string;
}
