import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchLeaderboard, LeaderboardEntry } from '../services/leaderboard';

interface Props {
  currentUserId?: string;
  onBack: () => void;
}

export default function LeaderboardScreen({ currentUserId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.user_id === currentUserId;
    const rankEmoji = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}.`;
    return (
      <View style={[styles.row, isMe && styles.myRow]}>
        <Text style={[styles.rank, isMe && styles.myText]}>{rankEmoji}</Text>
        <Text style={[styles.name, isMe && styles.myText]} numberOfLines={1}>
          {item.display_name}
          {isMe ? ' (나)' : ''}
        </Text>
        <View style={[styles.scorePill, item.score >= 100 && styles.masterPill]}>
          <Text style={[styles.scoreText, item.score >= 100 && styles.masterScoreText]}>
            {item.score >= 100 ? '🏆 ' : ''}{item.score}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏅 리더보드</Text>
        <TouchableOpacity onPress={load} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#457B9D" style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 기록이 없습니다.</Text>
          <Text style={styles.emptySubtext}>게임에서 승리하여 첫 번째 플레이어가 되세요!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
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
    padding: 4,
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
  refreshButton: {
    padding: 4,
  },
  refreshText: {
    fontSize: 20,
    color: '#457B9D',
  },
  loader: {
    marginTop: 60,
  },
  list: {
    padding: 16,
    gap: 8,
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
  myRow: {
    backgroundColor: '#EBF4FA',
    borderWidth: 1.5,
    borderColor: '#457B9D',
  },
  rank: {
    width: 36,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C757D',
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: '#212529',
    marginRight: 8,
  },
  myText: {
    color: '#1D3557',
    fontWeight: '700',
  },
  scorePill: {
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
