import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearLeaderboard, fetchLeaderboard, LeaderboardEntry } from '../services/leaderboard';
import { fetchUserSettings } from '../services/settings';

interface Props {
  onBack: () => void;
}

export default function LeaderboardScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userHandle, setUserHandle] = useState('');
  const [loading, setLoading] = useState(true);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const topEntries = entries.filter((item) => item.score >= 100);
  const bottomEntries = entries.filter((item) => {
    if (item.score >= 100) return false;
    const ts = new Date(item.playedAt).getTime();
    return Number.isFinite(ts) && ts >= oneWeekAgo;
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [data, settings] = await Promise.all([fetchLeaderboard(), fetchUserSettings()]);
    setEntries(data);
    setUserHandle(settings.userHandle.trim());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResetLeaderboard = useCallback(() => {
    Alert.alert('Reset Leaderboard', 'Delete all saved local leaderboard scores?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setLoading(true);
              await clearLeaderboard();
              await load();
              Alert.alert('Cleared', 'Leaderboard data has been removed.');
            } catch {
              setLoading(false);
              Alert.alert('Error', 'Failed to clear leaderboard. Please try again.');
            }
          })();
        },
      },
    ]);
  }, [load]);

  const getScoreBadge = (score: number): string => {
    if (score >= 100) return '🏆';
    if (score >= 90) return '😎';
    if (score >= 80) return '😄';
    if (score >= 70) return '🙂';
    if (score >= 60) return '😊';
    if (score >= 50) return '😌';
    if (score >= 40) return '😐';
    if (score >= 30) return '😕';
    if (score >= 20) return '😣';
    if (score >= 10) return '😅';
    return '😶';
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const rankEmoji = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}.`;
    return (
      <View style={styles.row}>
        <Text style={styles.rank}>{rankEmoji}</Text>
        <View style={styles.infoCol}>
          <Text style={styles.scoreLine}>Score: {item.score}</Text>
          <Text style={styles.dateLine}>Last Played: {item.date}</Text>
          <Text style={styles.dateLine}>Started: {item.createdAt.slice(0, 10)}</Text>
        </View>
        <View style={[styles.scorePill, item.score >= 100 && styles.masterPill]}>
          <Text style={[styles.scoreText, item.score >= 100 && styles.masterScoreText]}>
            {getScoreBadge(item.score)}
          </Text>
        </View>
      </View>
    );
  };

  const renderSection = (title: string, data: LeaderboardEntry[]) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.sectionEmpty}>기록 없음</Text>
      ) : (
        data.map((item) => (
          <View key={item.id} style={styles.sectionRowWrapper}>
            {renderItem({ item })}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}> 
        <TouchableOpacity onPress={onBack} style={[styles.toggleChip, styles.backButton]}>
          <Text style={styles.toggleChipText}>뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏅 리더보드</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={load} style={[styles.toggleChip, styles.actionButton]}>
            <Text style={[styles.toggleChipText, styles.refreshText]}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResetLeaderboard} style={[styles.toggleChip, styles.actionButton]}>
            <Text style={[styles.toggleChipText, styles.resetText]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#457B9D" style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 기록이 없습니다.</Text>
          <Text style={styles.emptySubtext}>게임에서 승리하여 첫 번째 플레이어가 되세요!</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator
        >
          {userHandle.length > 0 && (
            <View style={styles.handleCard}>
              <Text style={styles.handleLabel}>Nickname</Text>
              <Text style={styles.handleValue}>{userHandle}</Text>
            </View>
          )}
          {renderSection('🏆 TOP (100+)', topEntries)}
          {renderSection('🎯 BOTTOM (<100)', bottomEntries)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD8CE',
  },
  backButton: {
    marginRight: 6,
  },
  backText: {
    fontSize: 15,
    color: '#457B9D',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 8,
  },
  resetText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    color: '#C2410C',
  },
  refreshText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    color: '#457B9D',
  },

  toggleChip: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleChipActive: {
    backgroundColor: '#457B9D',
    borderColor: '#457B9D',
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  loader: {
    marginTop: 60,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  handleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  handleLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  handleValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  sectionEmpty: {
    fontSize: 13,
    color: '#6C757D',
    paddingVertical: 6,
  },
  sectionRowWrapper: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  rank: {
    width: 36,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C757D',
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  scoreLine: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '600',
  },
  dateLine: {
    marginTop: 2,
    fontSize: 13,
    color: '#6C757D',
  },
  scorePill: {
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
  },
  masterScoreText: {
    color: '#D97706',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
  },
});
