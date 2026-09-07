export type BgMusicTrackId = '1' | '2' | '3' | '4' | '5';

export const BG_MUSIC_TRACK_IDS: BgMusicTrackId[] = ['1', '2', '3', '4', '5'];

export const DEFAULT_BG_MUSIC_TRACK_ID: BgMusicTrackId = '1';

const BG_MUSIC_SOURCES: Record<BgMusicTrackId, number> = {
  '1': require('../../assets/sounds/bm-slide-1.mp3'),
  '2': require('../../assets/sounds/bm-slide-2.mp3'),
  '3': require('../../assets/sounds/bm-slide-3.mp3'),
  '4': require('../../assets/sounds/bm-slide-4.mp3'),
  '5': require('../../assets/sounds/bm-slide.mp3'),
};

export function getBgMusicSource(trackId: BgMusicTrackId): number {
  return BG_MUSIC_SOURCES[trackId];
}

export function resolveBgMusicTrackId(value: unknown): BgMusicTrackId {
  if (value === '1' || value === '2' || value === '3' || value === '4' || value === '5') {
    return value;
  }

  return DEFAULT_BG_MUSIC_TRACK_ID;
}
