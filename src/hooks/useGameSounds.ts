import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { MASTER_SCORE_THRESHOLD } from '../constants/scoring';
import { AI_PLAYER } from '../constants/game';

interface UseGameSoundsOptions {
  bgMusicEnabled: boolean;
  bgMusicVolume: number;
  winner: number | null;
  vsAI: boolean;
  totalScore: number;
}

export function useGameSounds({
  bgMusicEnabled,
  bgMusicVolume,
  winner,
  vsAI,
  totalScore,
}: UseGameSoundsOptions) {
  const winSoundRef = useRef<Audio.Sound | null>(null);
  const loseSoundRef = useRef<Audio.Sound | null>(null);
  const stoneSoundRef = useRef<Audio.Sound | null>(null);
  const wowSoundRef = useRef<Audio.Sound | null>(null);
  const bgMusicRef = useRef<Audio.Sound | null>(null);
  const lastPlayedWinnerRef = useRef<number | null>(null);
  const soundsReadyRef = useRef<boolean>(false);
  const soundsReadyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveSoundsReadyRef = useRef<(() => void) | null>(null);

  if (!soundsReadyPromiseRef.current) {
    soundsReadyPromiseRef.current = new Promise<void>((resolve) => {
      resolveSoundsReadyRef.current = resolve;
    });
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const winResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/win.mp3'),
          { shouldPlay: false },
        );
        const loseResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/lose.mp3'),
          { shouldPlay: false },
        );
        const stoneResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/stone.mp3'),
          { shouldPlay: false },
        );
        const wowResult = await Audio.Sound.createAsync(
          require('../../assets/sounds/wow.mp3'),
          { shouldPlay: false },
        );

        if (cancelled) {
          await winResult.sound.unloadAsync();
          await loseResult.sound.unloadAsync();
          await stoneResult.sound.unloadAsync();
          await wowResult.sound.unloadAsync();
          return;
        }

        winSoundRef.current = winResult.sound;
        loseSoundRef.current = loseResult.sound;
        stoneSoundRef.current = stoneResult.sound;
        wowSoundRef.current = wowResult.sound;

        try {
          await stoneResult.sound.setVolumeAsync(0);
          await stoneResult.sound.setPositionAsync(0);
          await stoneResult.sound.playAsync();
          await new Promise((r) => setTimeout(r, 300));
          await stoneResult.sound.pauseAsync();
        } catch {
          // Ignore warm-up errors
        } finally {
          try {
            await stoneResult.sound.setVolumeAsync(1);
            await stoneResult.sound.setPositionAsync(0);
          } catch {
            // Ignore
          }
        }

        soundsReadyRef.current = true;
        resolveSoundsReadyRef.current?.();
        resolveSoundsReadyRef.current = null;

        try {
          const bgResult = await Audio.Sound.createAsync(
            require('../../assets/sounds/bm.mp3'),
            { shouldPlay: bgMusicEnabled, isLooping: true, volume: bgMusicVolume },
          );

          if (cancelled) {
            await bgResult.sound.stopAsync();
            await bgResult.sound.unloadAsync();
            return;
          }

          bgMusicRef.current = bgResult.sound;
        } catch {
          // Background music failed to load
        }
      } catch {
        // Ignore sound loading errors
      }
    })();

    return () => {
      cancelled = true;
      void (async () => {
        try {
          if (winSoundRef.current) await winSoundRef.current.unloadAsync();
          if (loseSoundRef.current) await loseSoundRef.current.unloadAsync();
          if (stoneSoundRef.current) await stoneSoundRef.current.unloadAsync();
          if (wowSoundRef.current) await wowSoundRef.current.unloadAsync();
          if (bgMusicRef.current) {
            await bgMusicRef.current.stopAsync();
            await bgMusicRef.current.unloadAsync();
          }
        } catch {
          // Ignore unload errors
        } finally {
          winSoundRef.current = null;
          loseSoundRef.current = null;
          stoneSoundRef.current = null;
          wowSoundRef.current = null;
          bgMusicRef.current = null;
          soundsReadyRef.current = false;
          soundsReadyPromiseRef.current = null;
          resolveSoundsReadyRef.current = null;
        }
      })();
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        if (!bgMusicRef.current) return;
        if (bgMusicEnabled) {
          await bgMusicRef.current.setVolumeAsync(bgMusicVolume);
          await bgMusicRef.current.playAsync();
        } else {
          await bgMusicRef.current.pauseAsync();
        }
      } catch {
        // Ignore
      }
    })();
  }, [bgMusicEnabled, bgMusicVolume]);

  useEffect(() => {
    if (winner === null || winner === 0) {
      lastPlayedWinnerRef.current = winner;
      return;
    }

    if (lastPlayedWinnerRef.current === winner) {
      return;
    }

    lastPlayedWinnerRef.current = winner;

    void (async () => {
      try {
        const shouldPlayLose = vsAI && winner === AI_PLAYER;
        const soundToPlay = shouldPlayLose
          ? loseSoundRef.current
          : totalScore >= MASTER_SCORE_THRESHOLD
            ? wowSoundRef.current
            : winSoundRef.current;

        if (!soundToPlay) return;

        await soundToPlay.setPositionAsync(0);
        await soundToPlay.playAsync();
      } catch {
        // Ignore playback errors
      }
    })();
  }, [winner, vsAI, totalScore]);

  const playStoneSound = () => {
    void (async () => {
      try {
        if (!soundsReadyRef.current && soundsReadyPromiseRef.current) {
          await soundsReadyPromiseRef.current;
        }
        if (!stoneSoundRef.current) return;
        await stoneSoundRef.current.replayAsync();
      } catch {
        // Ignore playback errors
      }
    })();
  };

  const playWowSound = () => {
    void (async () => {
      try {
        if (!wowSoundRef.current) return;
        await wowSoundRef.current.setPositionAsync(0);
        await wowSoundRef.current.playAsync();
      } catch {
        // Ignore playback errors
      }
    })();
  };

  const resetWinnerSound = () => {
    lastPlayedWinnerRef.current = null;
  };

  return { playStoneSound, playWowSound, resetWinnerSound };
}
