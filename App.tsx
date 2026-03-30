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
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import { fetchUserScore, upsertScore } from './src/services/leaderboard';

type Screen = 'home' | 'game' | 'leaderboard';

function AppContent() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const prevScreenRef = useRef<Screen>('home');
  const [userBestScore, setUserBestScore] = useState<number>(0);

  const goToLeaderboard = useCallback((from: Screen) => {
    prevScreenRef.current = from;
    setScreen('leaderboard');
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserScore(user.id).then(setUserBestScore);
    } else {
      setUserBestScore(0);
    }
  }, [user?.id]);

  const handleScoreUpdate = useCallback(
    async (newScore: number) => {
      if (!user) return;
      setUserBestScore(newScore);
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Player';
      await upsertScore(user.id, displayName, user.email ?? '', newScore);
    },
    [user]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#457B9D" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (screen === 'game' || (screen === 'leaderboard' && prevScreenRef.current === 'game')) {
    return (
      <SafeAreaView style={styles.container}>
        <Game
          initialScore={userBestScore}
          onScoreUpdate={handleScoreUpdate}
          onExit={() => setScreen('home')}
          onLeaderboard={user ? () => goToLeaderboard('game') : undefined}
        />
        {screen === 'leaderboard' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LeaderboardScreen
              currentUserId={user?.id}
              onBack={() => setScreen('game')}
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
          currentUserId={user?.id}
          onBack={() => setScreen('home')}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Home screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>오목 (Gomoku)</Text>
      </View>

      {/* Auth section - logged in state stays at top */}
      {user && (
        <View style={styles.authSection}>
          <View style={styles.userRow}>
            <Text style={styles.userName} numberOfLines={1}>
              👤 {user.user_metadata?.full_name || user.email}
            </Text>
            <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.startContainer}
        contentContainerStyle={styles.startContainerContent}
        showsVerticalScrollIndicator
      >
        <Text style={styles.sectionTitle}>게임 방법</Text>
        <Text style={styles.instructions}>
          1. 흑돌이 먼저 시작합니다.{"\n"}
          2. 번갈아 빈 칸에 돌을 놓습니다.{"\n"}
          3. 가로, 세로, 대각선 중 한 방향으로 먼저 5개를 연결하면 승리합니다.{"\n"}
          4. 보드가 다 찼는데 승자가 없으면 무승부입니다.{"\n"}
          5. 플레이 보드는 가로·세로 방향으로 스크롤할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>How to Play</Text>
        <Text style={styles.instructions}>
          1. Black always goes first.{"\n"}
          2. Players take turns placing stones on empty intersections.{"\n"}
          3. Connect 5 stones in a row horizontally, vertically, or diagonally to win.{"\n"}
          4. If the board is full with no winner, the game ends in a draw.{"\n"}
          5. The play board can be scrolled horizontally and vertically.
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={() => setScreen('game')}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.leaderboardButton} onPress={() => goToLeaderboard('home')}>
            <Text style={styles.leaderboardButtonText}>🏅 리더보드</Text>
          </TouchableOpacity>
        )}

        {!user && (
          <TouchableOpacity onPress={signInWithGoogle} style={[styles.googleButton, { marginTop: 10 }]}>
            <Text style={styles.googleButtonText}>Google 로그인</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
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
  authSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    color: '#1D3557',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  signOutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#457B9D',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
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
  },
  leaderboardButtonText: {
    color: '#92650A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
