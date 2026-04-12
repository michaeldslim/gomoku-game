import AsyncStorage from '@react-native-async-storage/async-storage';

const LEADERBOARD_STORAGE_KEY = 'gomoku_local_leaderboard_v1';
const LEADERBOARD_MAX_ENTRIES = 50;

interface LocalLeaderboardRecord {
  id: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface LegacyLocalLeaderboardRecord {
  id: string;
  score: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  score: number;
  createdAt: string;
  playedAt: string;
  date: string;
}

const formatDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isSameStartedAndPlayedDay = (record: LocalLeaderboardRecord): boolean => {
  return formatDate(record.createdAt) === formatDate(record.updatedAt);
};

const readRecords = async (): Promise<LocalLeaderboardRecord[]> => {
  const raw = await AsyncStorage.getItem(LEADERBOARD_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((item): LocalLeaderboardRecord | null => {
        if (
          typeof item?.id !== 'string' ||
          typeof item?.score !== 'number' ||
          typeof item?.createdAt !== 'string'
        ) {
          return null;
        }

        const legacyRecord = item as LegacyLocalLeaderboardRecord;
        const updatedAt = typeof item?.updatedAt === 'string' ? item.updatedAt : legacyRecord.createdAt;

        return {
          id: legacyRecord.id,
          score: legacyRecord.score,
          createdAt: legacyRecord.createdAt,
          updatedAt,
        };
      })
      .filter((item): item is LocalLeaderboardRecord => item !== null);

    return normalized;
  } catch {
    return [];
  }
};

const writeRecords = async (records: LocalLeaderboardRecord[]): Promise<void> => {
  await AsyncStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(records));
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const records = await readRecords();
  const sorted = [...records].sort((a, b) => b.score - a.score);

  return sorted.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    score: row.score,
    createdAt: row.createdAt,
    playedAt: row.updatedAt,
    date: formatDate(row.updatedAt),
  }));
}

export async function fetchStartupScore(): Promise<number> {
  const records = await readRecords();
  const latest = records[0];

  if (!latest) return 0;
  if (latest.score >= 100) return 0;

  return Math.max(0, Math.floor(latest.score));
}

export async function clearLeaderboard(): Promise<void> {
  await AsyncStorage.removeItem(LEADERBOARD_STORAGE_KEY);
}

export async function addLeaderboardEntry(score: number): Promise<void> {
  if (score <= 0) return;

  const records = await readRecords();
  const latest = records[0];
  const now = new Date().toISOString();

  let next: LocalLeaderboardRecord[];

  // Overwrite latest whenever started date and last played date are the same.
  if (latest && isSameStartedAndPlayedDay(latest)) {
    next = [{ ...latest, score, updatedAt: now }, ...records.slice(1)];
  } else {
    // Otherwise, create a new run entry for the new score.
    const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    next = [{ id, score, createdAt: now, updatedAt: now }, ...records];
  }

  next = next.slice(0, LEADERBOARD_MAX_ENTRIES);

  await writeRecords(next);
}

export async function startFreshRun(currentScore: number): Promise<void> {
  const records = await readRecords();
  const latest = records[0];
  const now = new Date().toISOString();
  const normalizedScore = Math.max(0, Math.floor(currentScore));

  if (!latest) {
    return;
  }

  const newRun: LocalLeaderboardRecord = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    score: 0,
    createdAt: now,
    updatedAt: now,
  };

  let next: LocalLeaderboardRecord[];

  const finalizedLatest: LocalLeaderboardRecord = {
    ...latest,
    score: normalizedScore,
    updatedAt: now,
  };

  if (isSameStartedAndPlayedDay(latest)) {
    next = [finalizedLatest, ...records.slice(1)];
  } else {
    next = [newRun, finalizedLatest, ...records.slice(1)];
  }

  await writeRecords(next.slice(0, LEADERBOARD_MAX_ENTRIES));
}
