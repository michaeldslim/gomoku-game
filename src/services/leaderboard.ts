import AsyncStorage from '@react-native-async-storage/async-storage';
import { MASTER_SCORE_THRESHOLD } from '../constants/scoring';
import { fetchUserSettings } from './settings';

const LEADERBOARD_STORAGE_KEY = 'gomoku_local_leaderboard_v1';
const LEADERBOARD_MAX_ENTRIES = 50;

interface LocalLeaderboardRecord {
  id: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  userHandle?: string;
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
  userHandle: string;
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

const recordUpdatedAtMs = (record: LocalLeaderboardRecord): number => {
  const ts = new Date(record.updatedAt).getTime();
  return Number.isFinite(ts) ? ts : 0;
};

/** Active run = most recently played entry (by updatedAt), not array index. */
const getLatestRecord = (records: LocalLeaderboardRecord[]): LocalLeaderboardRecord | undefined => {
  if (records.length === 0) return undefined;

  return records.reduce((latest, current) =>
    recordUpdatedAtMs(current) > recordUpdatedAtMs(latest) ? current : latest
  );
};

const withoutRecord = (
  records: LocalLeaderboardRecord[],
  target: LocalLeaderboardRecord
): LocalLeaderboardRecord[] => records.filter((record) => record.id !== target.id);

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
          userHandle: typeof item?.userHandle === 'string' ? item.userHandle.trim().slice(0, 24) : undefined,
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
    userHandle: row.userHandle?.trim() ?? '',
  }));
}

export async function fetchStartupScore(): Promise<number> {
  const records = await readRecords();
  const latest = getLatestRecord(records);

  if (!latest) return 0;
  if (latest.score >= MASTER_SCORE_THRESHOLD) return 0;

  return Math.max(0, Math.floor(latest.score));
}

export async function clearLeaderboard(): Promise<void> {
  await AsyncStorage.removeItem(LEADERBOARD_STORAGE_KEY);
}

export async function addLeaderboardEntry(score: number): Promise<void> {
  if (score <= 0) return;

  const records = await readRecords();
  const latest = getLatestRecord(records);
  const now = new Date().toISOString();
  const { userHandle } = await fetchUserSettings();
  const snapshotHandle = userHandle.trim().slice(0, 24);

  let next: LocalLeaderboardRecord[];

  // Overwrite latest whenever started date and last played date are the same.
  if (latest && isSameStartedAndPlayedDay(latest)) {
    const updated: LocalLeaderboardRecord = { ...latest, score, updatedAt: now };
    next = [updated, ...withoutRecord(records, latest)];
  } else {
    // Otherwise, create a new run entry for the new score.
    const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    next = [{ id, score, createdAt: now, updatedAt: now, userHandle: snapshotHandle }, ...records];
  }

  next = next.slice(0, LEADERBOARD_MAX_ENTRIES);

  await writeRecords(next);
}

export async function startFreshRun(currentScore: number): Promise<void> {
  const records = await readRecords();
  const latest = getLatestRecord(records);
  const now = new Date().toISOString();
  const normalizedScore = Math.max(0, Math.floor(currentScore));
  const { userHandle } = await fetchUserSettings();
  const snapshotHandle = userHandle.trim().slice(0, 24);

  if (!latest) {
    return;
  }

  const newRun: LocalLeaderboardRecord = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    score: 0,
    createdAt: now,
    updatedAt: now,
    userHandle: snapshotHandle,
  };

  let next: LocalLeaderboardRecord[];

  const finalizedLatest: LocalLeaderboardRecord = {
    ...latest,
    score: normalizedScore,
    updatedAt: now,
  };

  const rest = withoutRecord(records, latest);

  // Master completion always starts a new active run so later wins don't overwrite the score.
  if (normalizedScore >= MASTER_SCORE_THRESHOLD || !isSameStartedAndPlayedDay(latest)) {
    next = [newRun, finalizedLatest, ...rest];
  } else {
    next = [finalizedLatest, ...rest];
  }

  await writeRecords(next.slice(0, LEADERBOARD_MAX_ENTRIES));
}
