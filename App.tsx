import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Game from './src/components/Game';
import InstructionScreen from './src/screens/InstructionScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { addLeaderboardEntry, fetchStartupScore, startFreshRun } from './src/services/leaderboard';
import { defaultUserSettings, fetchUserSettings, saveUserSettings, UserSettings } from './src/services/settings';

type Language = 'ko' | 'en';
type Screen = 'home' | 'game' | 'leaderboard' | 'settings';

const labelsByLanguage: Record<Language, {
  title: string;
  startGame: string;
  leaderboard: string;
  settings: string;
  instructionButton: string;
  instructionSummary: string;
  loadingSettings: string;
}> = {
  ko: {
    title: '오목 (Gomoku)',
    startGame: '게임 시작',
    leaderboard: '🏅 리더보드',
    settings: '⚙️ 설정',
    instructionButton: '설명',
    instructionSummary: '설명 페이지로 이동하여 게임 방법을 확인하세요.',
    loadingSettings: '설정 로딩 중...',
  },
  en: {
    title: 'Gomoku',
    startGame: 'Start Game',
    leaderboard: '🏅 Leaderboard',
    settings: '⚙️ Settings',
    instructionButton: 'Instructions',
    instructionSummary: 'Open the instructions page and toggle language for rules.',
    loadingSettings: 'Loading settings...',
  },
};

function AppContent() {
  const [screen, setScreen] = useState<Screen>('home');
  const [language, setLanguage] = useState<Language>('ko');
  const [startupScore, setStartupScore] = useState(0);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const prevScreenRef = useRef<Screen>('home');
  const settingsFromRef = useRef<'home' | 'game'>('home');

  useEffect(() => {
    void (async () => {
      try {
        const stored = await fetchUserSettings();
        setSettings(stored);
      } finally {
        setSettingsLoaded(true);
      }
    })();
  }, []);

  const goToLeaderboard = useCallback((from: Screen) => {
    prevScreenRef.current = from;
    setScreen('leaderboard');
  }, []);

  const goToSettings = useCallback((from: 'home' | 'game') => {
    settingsFromRef.current = from;
    setScreen('settings');
  }, []);

  const handleScoreUpdate = useCallback(
    async (newScore: number) => {
      await addLeaderboardEntry(newScore);
    },
    []
  );

  const handleStartFreshRun = useCallback(async (currentScore: number) => {
    await startFreshRun(currentScore);
    setStartupScore(0);
  }, []);

  const handleStartGame = useCallback(async () => {
    setIsStartingGame(true);
    const initial = await fetchStartupScore();
    setStartupScore(initial);
    setScreen('game');
    setIsStartingGame(false);
  }, []);

  const handleSaveSettings = useCallback(async (next: UserSettings) => {
    const saved = await saveUserSettings(next);
    setSettings(saved);
  }, []);

  const handleSettingsBack = useCallback(() => {
    setScreen(settingsFromRef.current);
  }, []);

  if (
    screen === 'game' ||
    (screen === 'leaderboard' && prevScreenRef.current === 'game') ||
    (screen === 'settings' && settingsFromRef.current === 'game')
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <Game
          initialScore={startupScore}
          onScoreUpdate={handleScoreUpdate}
          onStartFreshRun={handleStartFreshRun}
          onLeaderboard={() => goToLeaderboard('game')}
          onSettings={() => goToSettings('game')}
          timerEnabled={settings.timerEnabled}
          intermediateTopPoolSize={settings.intermediateTopPoolSize}
          expertTopPool={settings.expertTopPool}
        />
        {screen === 'leaderboard' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LeaderboardScreen
              onBack={() => setScreen('game')}
            />
          </View>
        )}
        {screen === 'settings' && settingsFromRef.current === 'game' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <SettingsScreen
              initialSettings={settings}
              onSave={handleSaveSettings}
              onBack={handleSettingsBack}
            />
          </View>
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (screen === 'leaderboard') {
    return (
      <View style={styles.container}>
        <LeaderboardScreen
          onBack={() => setScreen('home')}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (screen === 'settings') {
    return (
      <View style={styles.container}>
        <SettingsScreen
          initialSettings={settings}
          onSave={handleSaveSettings}
          onBack={handleSettingsBack}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Home screen
  const labels = labelsByLanguage[language];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{labels.title}</Text>
      </View>

      <ScrollView
        style={styles.startContainer}
        contentContainerStyle={styles.startContainerContent}
        showsVerticalScrollIndicator
      >
        <InstructionScreen language={language} onLanguageChange={setLanguage} standalone={false} />

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartGame}
          disabled={isStartingGame}
        >
          {isStartingGame ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.startButtonText}>{labels.startGame}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaderboardButton} onPress={() => goToLeaderboard('home')}>
          <Text style={styles.leaderboardButtonText}>{labels.leaderboard}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => goToSettings('home')}
          disabled={!settingsLoaded}
        >
          <Text style={styles.settingsButtonText}>
            {settingsLoaded ? labels.settings : labels.loadingSettings}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFE7',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  startContainer: {
    flex: 1,
    marginTop: 4,
    marginHorizontal: 14,
    marginBottom: 16,
    backgroundColor: '#F3EFE7',
    borderRadius: 12,
  },
  startContainerContent: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 18,
  },
  startButton: {
    marginTop: 10,
    backgroundColor: '#457B9D',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  leaderboardButton: {
    marginTop: 10,
    backgroundColor: '#F0E6D3',
    borderWidth: 1.5,
    borderColor: '#D4A853',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  leaderboardButtonText: {
    color: '#92650A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    marginTop: 10,
    backgroundColor: '#E9F5FF',
    borderWidth: 1.5,
    borderColor: '#457B9D',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  settingsButtonText: {
    color: '#1D4E89',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
