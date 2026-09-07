import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';
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
import { HomePlayerPreview } from './src/components/HomePlayerPreview';
import { PhoneLandscapeWarning } from './src/components/PhoneLandscapeWarning';
import { useCareer } from './src/career/CareerProvider';
import { getCareerProgressCopy } from './src/career/careerLabels';
import InstructionScreen from './src/screens/InstructionScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CareerScreen from './src/screens/CareerScreen';
import { CareerProvider } from './src/career/CareerProvider';
import { addLeaderboardEntry, fetchStartupScore, startFreshRun } from './src/services/leaderboard';
import { defaultUserSettings, fetchUserSettings, saveUserSettings, UserSettings } from './src/services/settings';
import { APP_VERSION } from './src/constants/app';
import { MASTER_SCORE_THRESHOLD, USE_TEST_MASTER_THRESHOLD } from './src/constants/scoring';
import { createCareerTranslate } from './src/utils/careerI18n';
import { Language, t } from './src/utils/i18n';
import { colors } from './src/constants/colors';
import { useScreenLayout } from './src/hooks/useScreenLayout';

type Screen = 'home' | 'game' | 'leaderboard' | 'settings' | 'career';

interface HomePlayerPreviewWithCareerProps {
  language: Language;
  playerAvatarId: UserSettings['playerAvatarId'];
  aiAvatarId: UserSettings['aiAvatarId'];
  careerModeEnabled: boolean;
  onCareerPress: () => void;
}

function HomePlayerPreviewWithCareer({
  language,
  playerAvatarId,
  aiAvatarId,
  careerModeEnabled,
  onCareerPress,
}: HomePlayerPreviewWithCareerProps) {
  const { careerState, loaded: careerLoaded } = useCareer();
  const careerTranslate = createCareerTranslate(language);
  const careerBadge =
    careerModeEnabled && careerLoaded
      ? getCareerProgressCopy(careerTranslate, careerState).primary
      : null;

  return (
    <HomePlayerPreview
      language={language}
      playerAvatarId={playerAvatarId}
      aiAvatarId={aiAvatarId}
      careerBadge={careerBadge}
      onCareerPress={onCareerPress}
    />
  );
}

function AppContent() {
  // Phones → portrait lock. Tablets (Galaxy Tab primary QA) → unlock for landscape HUD.
  useEffect(() => {
    (async () => {
      const deviceType = await Device.getDeviceTypeAsync();
      if (deviceType === Device.DeviceType.TABLET) {
        await ScreenOrientation.unlockAsync();
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    })();
  }, []);

  const [screen, setScreen] = useState<Screen>('home');
  const [startupScore, setStartupScore] = useState(0);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const prevScreenRef = useRef<Screen>('home');
  const settingsFromRef = useRef<'home' | 'game'>('home');
  const careerFromRef = useRef<Screen>('home');

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

  const handleLeaderboardBackFromGame = useCallback(async () => {
    const score = await fetchStartupScore();
    setStartupScore(score);
    setScreen('game');
  }, []);

  const goToSettings = useCallback((from: 'home' | 'game') => {
    settingsFromRef.current = from;
    setScreen('settings');
  }, []);

  const goToCareer = useCallback((from: Screen) => {
    careerFromRef.current = from;
    setScreen('career');
  }, []);

  const handleCareerBack = useCallback(() => {
    setScreen(careerFromRef.current === 'game' ? 'game' : 'home');
  }, []);

  const handleScoreUpdate = useCallback(
    async (newScore: number) => {
      await addLeaderboardEntry(newScore);
      setStartupScore(newScore);
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

  const handleApplyExpertPool = useCallback(async (pool: number) => {
    const saved = await saveUserSettings({ ...settings, expertTopPool: pool });
    setSettings(saved);
  }, [settings]);

  const handleSettingsBack = useCallback(() => {
    setScreen(settingsFromRef.current);
  }, []);

  const { isTabletLandscape, menuHorizontalInset } = useScreenLayout();

  const withOrientationGuide = (node: React.ReactNode) => (
    <>
      {node}
      <PhoneLandscapeWarning language={settings.language} />
    </>
  );

  const renderScreen = () => {
  if (
    screen === 'game' ||
    (screen === 'leaderboard' && prevScreenRef.current === 'game') ||
    (screen === 'settings' && settingsFromRef.current === 'game')
  ) {
    return withOrientationGuide(
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
          language={settings.language}
          bgMusicEnabled={settings.bgMusicEnabled}
          bgMusicVolume={settings.bgMusicVolume}
          bgMusicTrackId={settings.bgMusicTrackId}
          playerAvatarId={settings.playerAvatarId}
          aiAvatarId={settings.aiAvatarId}
          careerModeEnabled={settings.careerModeEnabled}
          onCareer={() => goToCareer('game')}
        />
        {screen === 'leaderboard' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LeaderboardScreen
              onBack={() => void handleLeaderboardBackFromGame()}
              language={settings.language}
            />
          </View>
        )}
        {screen === 'settings' && settingsFromRef.current === 'game' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <SettingsScreen
              initialSettings={settings}
              onSave={handleSaveSettings}
              onBack={handleSettingsBack}
              onOpenCareer={() => goToCareer('game')}
            />
          </View>
        )}
        <StatusBar style="auto" />
      </SafeAreaView>,
    );
  }

  if (screen === 'leaderboard') {
    return withOrientationGuide(
      <View style={styles.container}>
        <LeaderboardScreen
          onBack={() => setScreen('home')}
          language={settings.language}
        />
        <StatusBar style="auto" />
      </View>,
    );
  }

  if (screen === 'settings') {
    return withOrientationGuide(
      <View style={styles.container}>
        <SettingsScreen
          initialSettings={settings}
          onSave={handleSaveSettings}
          onBack={handleSettingsBack}
          onOpenCareer={() => goToCareer('home')}
        />
        <StatusBar style="auto" />
      </View>,
    );
  }

  if (screen === 'career') {
    return withOrientationGuide(
      <CareerScreen
        language={settings.language}
        careerModeEnabled={settings.careerModeEnabled}
        playerAvatarId={settings.playerAvatarId}
        expertTopPool={settings.expertTopPool}
        currentScore={startupScore}
        onBack={handleCareerBack}
        onOpenSettings={() => {
          settingsFromRef.current = careerFromRef.current === 'game' ? 'game' : 'home';
          setScreen('settings');
        }}
        onApplyExpertPool={(pool) => void handleApplyExpertPool(pool)}
      />,
    );
  }

  // Home screen
  const lang = settings.language;
  return withOrientationGuide(
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.homeFrame,
          isTabletLandscape && { paddingHorizontal: menuHorizontalInset },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t(lang, 'appTitle')}</Text>
        </View>

      <ScrollView
        style={[styles.startContainer, isTabletLandscape && styles.startContainerWide]}
        contentContainerStyle={styles.startContainerContent}
        showsVerticalScrollIndicator
      >
        <HomePlayerPreviewWithCareer
          language={lang}
          playerAvatarId={settings.playerAvatarId}
          aiAvatarId={settings.aiAvatarId}
          careerModeEnabled={settings.careerModeEnabled}
          onCareerPress={() => goToCareer('home')}
        />

        <InstructionScreen language={lang} standalone={false} />

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartGame}
          disabled={isStartingGame}
        >
          {isStartingGame ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.startButtonText}>{t(lang, 'startGame')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaderboardButton} onPress={() => goToLeaderboard('home')}>
          <Text style={styles.leaderboardButtonText}>{t(lang, 'leaderboardNav')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => goToSettings('home')}
          disabled={!settingsLoaded}
        >
          <Text style={styles.settingsButtonText}>
            {settingsLoaded ? t(lang, 'settingsNav') : t(lang, 'loadingSettings')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          {t(lang, 'appVersion')}{APP_VERSION}
          {USE_TEST_MASTER_THRESHOLD ? ` · TEST master @ ${MASTER_SCORE_THRESHOLD}` : ''}
        </Text>
      </ScrollView>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>,
  );
  };

  return (
    <CareerProvider careerModeEnabled={settings.careerModeEnabled}>
      {renderScreen()}
    </CareerProvider>
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
    backgroundColor: colors.background,
  },
  homeFrame: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  startContainerWide: {
    marginHorizontal: 0,
  },
  startContainerContent: {
    padding: 8,
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
    backgroundColor: colors.button,
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
  versionText: {
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
  },
});
