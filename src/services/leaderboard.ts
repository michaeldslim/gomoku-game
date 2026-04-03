import AsyncStorage from '@react-native-async-storage/async-storage';

const LEADERBOARD_STORAGE_KEY = 'gomoku_local_leaderboard_v1';
const LEADERBOARD_MAX_ENTRIES = 50;

interface LocalLeaderboardRecord {
  id: string;
  score: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  score: number;
  createdAt: string;
  date: string;
}

const formatDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const readRecords = async (): Promise<LocalLeaderboardRecord[]> => {
  const raw = await AsyncStorage.getItem(LEADERBOARD_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LocalLeaderboardRecord =>
        typeof item?.id === 'string' &&
        typeof item?.score === 'number' &&
        typeof item?.createdAt === 'string'
    );
  } catch {
    return [];
  }
};

const writeRecords = async (records: LocalLeaderboardRecord[]): Promise<void> => {
  await AsyncStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(records));
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const records = await readRecords();
  const sorted = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sorted.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    score: row.score,
    createdAt: row.createdAt,
    date: formatDate(row.createdAt),
  }));
}

export async function addLeaderboardEntry(score: number): Promise<void> {
  if (score <= 0) return;

  const records = await readRecords();
  const latest = records[0];

  let next: LocalLeaderboardRecord[];

  // Same run: score is increasing, so override latest score only.
  if (latest && score > latest.score) {
    next = [{ ...latest, score }, ...records.slice(1)];
  } else {
    // New run (e.g. after fireworks reset to 0, next win starts from a lower score).
    const now = new Date().toISOString();
    const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    next = [{ id, score, createdAt: now }, ...records];
  }

  next = next.slice(0, LEADERBOARD_MAX_ENTRIES);

  await writeRecords(next);
}
