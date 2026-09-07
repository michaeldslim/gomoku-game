import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { BM_MP3 } from '../constants/app';
import { AI_PLAYER } from '../constants/game';
import { MASTER_SCORE_THRESHOLD } from '../constants/scoring';

const WIN_SOUND = require('../../assets/sounds/win.mp3');
const LOSE_SOUND = require('../../assets/sounds/lose.mp3');
const STONE_SOUND = require('../../assets/sounds/stone.mp3');
const WOW_SOUND = require('../../assets/sounds/wow.mp3');

interface UseGameSoundsOptions {
  bgMusicEnabled: boolean;
  bgMusicVolume: number;
  winner: number | null;
  vsAI: boolean;
  totalScore: number;
}

async function replay(player: AudioPlayer) {
  try {
    await player.seekTo(0);
  } catch {
    // seek can fail if the player is still buffering
  }

  player.play();
}

export function useGameSounds({
  bgMusicEnabled,
  bgMusicVolume,
  winner,
  vsAI,
  totalScore,
}: UseGameSoundsOptions) {
  const winPlayer = useAudioPlayer(WIN_SOUND);
  const losePlayer = useAudioPlayer(LOSE_SOUND);
  const stonePlayer = useAudioPlayer(STONE_SOUND);
  const wowPlayer = useAudioPlayer(WOW_SOUND);
  const bgMusicPlayer = useAudioPlayer(BM_MP3);
  const stoneStatus = useAudioPlayerStatus(stonePlayer);
  const bgMusicStatus = useAudioPlayerStatus(bgMusicPlayer);

  const lastPlayedWinnerRef = useRef<number | null>(null);
  const androidWarmedUpRef = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || androidWarmedUpRef.current || !stoneStatus.isLoaded) {
      return;
    }

    androidWarmedUpRef.current = true;

    void (async () => {
      try {
        stonePlayer.volume = 0;
        stonePlayer.play();
        await new Promise((resolve) => setTimeout(resolve, 300));
        stonePlayer.pause();
        await stonePlayer.seekTo(0);
      } catch {
        // Ignore warm-up errors.
      } finally {
        stonePlayer.volume = 1;
      }
    })();
  }, [stonePlayer, stoneStatus.isLoaded]);

  useEffect(() => {
    bgMusicPlayer.loop = true;
    bgMusicPlayer.volume = bgMusicVolume;

    if (!bgMusicEnabled) {
      bgMusicPlayer.pause();
      return;
    }

    if (bgMusicStatus.isLoaded && !bgMusicStatus.playing) {
      bgMusicPlayer.play();
    }
  }, [
    bgMusicEnabled,
    bgMusicVolume,
    bgMusicPlayer,
    bgMusicStatus.isLoaded,
    bgMusicStatus.playing,
  ]);

  useEffect(() => {
    if (winner === null || winner === 0) {
      lastPlayedWinnerRef.current = winner;
      return;
    }

    if (lastPlayedWinnerRef.current === winner) {
      return;
    }

    lastPlayedWinnerRef.current = winner;

    const shouldPlayLose = vsAI && winner === AI_PLAYER;
    const player = shouldPlayLose
      ? losePlayer
      : totalScore >= MASTER_SCORE_THRESHOLD
        ? wowPlayer
        : winPlayer;

    void replay(player);
  }, [winner, vsAI, totalScore, losePlayer, wowPlayer, winPlayer]);

  const playStoneSound = useCallback(() => {
    void replay(stonePlayer);
  }, [stonePlayer]);

  const playWowSound = useCallback(() => {
    void replay(wowPlayer);
  }, [wowPlayer]);

  const resetWinnerSound = useCallback(() => {
    lastPlayedWinnerRef.current = null;
  }, []);

  return { playStoneSound, playWowSound, resetWinnerSound };
}
