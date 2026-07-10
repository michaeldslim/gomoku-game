import { useEffect, useState } from 'react';
import { AI_PLAYER, TIMER_DURATION } from '../constants/game';

interface UseGameTimerOptions {
  timerEnabled: boolean;
  winner: number | null;
  vsAI: boolean;
  currentPlayer: number;
  aiThinking: boolean;
  onTimeUp: () => void;
}

export function useGameTimer({
  timerEnabled,
  winner,
  vsAI,
  currentPlayer,
  aiThinking,
  onTimeUp,
}: UseGameTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (
      timerEnabled &&
      winner === null &&
      timerActive &&
      !(vsAI && currentPlayer === AI_PLAYER && !aiThinking)
    ) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval!);
            onTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPlayer, winner, timerActive, vsAI, aiThinking, timerEnabled, onTimeUp]);

  useEffect(() => {
    setTimeLeft(TIMER_DURATION);
    setTimerActive(timerEnabled && !(vsAI && currentPlayer === AI_PLAYER) && winner === null);
  }, [currentPlayer, winner, timerEnabled, vsAI]);

  const isAITurnForTimer = vsAI && currentPlayer === AI_PLAYER;
  const showMoodTimer = winner === null && timerEnabled;
  const showTimerWarning =
    showMoodTimer && !isAITurnForTimer && timerActive && timeLeft > 0 && timeLeft <= 3;

  const timerMood =
    timeLeft > 10
      ? { emoji: '🙂', bg: '#DCFCE7', text: '#166534' }
      : timeLeft > 6
        ? { emoji: '😐', bg: '#FEF9C3', text: '#854D0E' }
        : timeLeft > 3
          ? { emoji: '😰', bg: '#FFEDD5', text: '#9A3412' }
          : { emoji: '😭', bg: '#FEE2E2', text: '#991B1B' };

  const resetTimerForHumanTurn = () => {
    setTimeLeft(TIMER_DURATION);
    setTimerActive(timerEnabled);
  };

  const resetTimerForTurn = (isHumanTurn: boolean) => {
    setTimeLeft(TIMER_DURATION);
    setTimerActive(timerEnabled && isHumanTurn);
  };

  const pauseTimer = () => setTimerActive(false);

  return {
    timeLeft,
    timerActive,
    setTimerActive,
    isAITurnForTimer,
    showMoodTimer,
    showTimerWarning,
    timerMood,
    resetTimerForHumanTurn,
    resetTimerForTurn,
    pauseTimer,
    TIMER_DURATION,
  };
}
