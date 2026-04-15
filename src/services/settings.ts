import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPERT_TOP_POOL_EASY, EXPERT_TOP_POOL_HARD } from '../utils/aiLogic';

const SETTINGS_STORAGE_KEY = 'gomoku_settings_v1';

export const INTERMEDIATE_TOP_POOL_MIN = 1;
export const INTERMEDIATE_TOP_POOL_MAX = 5;
export const DEFAULT_INTERMEDIATE_TOP_POOL_SIZE = 4;
export const DEFAULT_EXPERT_TOP_POOL = EXPERT_TOP_POOL_EASY;
export const DEFAULT_TIMER_ENABLED = false;

export interface UserSettings {
  userHandle: string;
  timerEnabled: boolean;
  intermediateTopPoolSize: number;
  expertTopPool: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeIntermediateTopPoolSize = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_INTERMEDIATE_TOP_POOL_SIZE;
  }

  return clamp(Math.floor(value), INTERMEDIATE_TOP_POOL_MIN, INTERMEDIATE_TOP_POOL_MAX);
};

const normalizeExpertTopPool = (value: unknown): number => {
  if (value !== 1 && value !== 2 && value !== 3) {
    return DEFAULT_EXPERT_TOP_POOL;
  }

  return value;
};

const normalizeUserHandle = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, 24);
};

const normalizeTimerEnabled = (value: unknown): boolean => {
  if (typeof value !== 'boolean') {
    return DEFAULT_TIMER_ENABLED;
  }

  return value;
};

const normalizeSettings = (raw: unknown): UserSettings => {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  return {
    userHandle: normalizeUserHandle(source.userHandle),
    timerEnabled: normalizeTimerEnabled(source.timerEnabled),
    intermediateTopPoolSize: normalizeIntermediateTopPoolSize(source.intermediateTopPoolSize),
    expertTopPool: clamp(normalizeExpertTopPool(source.expertTopPool), EXPERT_TOP_POOL_HARD, EXPERT_TOP_POOL_EASY),
  };
};

export const defaultUserSettings = (): UserSettings => ({
  userHandle: '',
  timerEnabled: DEFAULT_TIMER_ENABLED,
  intermediateTopPoolSize: DEFAULT_INTERMEDIATE_TOP_POOL_SIZE,
  expertTopPool: DEFAULT_EXPERT_TOP_POOL,
});

export async function fetchUserSettings(): Promise<UserSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return defaultUserSettings();

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultUserSettings();
  }
}

export async function saveUserSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await fetchUserSettings();
  const next = normalizeSettings({ ...current, ...partial });
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  return next;
}
