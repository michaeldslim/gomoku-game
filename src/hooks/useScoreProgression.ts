import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { AIDifficulty } from '../utils/aiLogic';
import { MASTER_SCORE_THRESHOLD } from '../constants/scoring';
import { EXPERT_THRESHOLD, HUMAN_PLAYER, AI_PLAYER } from '../constants/game';
import { Language, t } from '../utils/i18n';

interface UseScoreProgressionOptions {
  initialScore: number;
  language: Language;
  winner: number | null;
  vsAI: boolean;
  onScoreUpdate?: (score: number) => void;
  onStartFreshRun?: (currentScore: number) => Promise<void> | void;
  undosUsedThisGameRef: MutableRefObject<number>;
  playWowSound: () => void;
}

export function useScoreProgression({
  initialScore,
  language,
  winner,
  vsAI,
  onScoreUpdate,
  onStartFreshRun,
  undosUsedThisGameRef,
  playWowSound,
}: UseScoreProgressionOptions) {
  const [totalScore, setTotalScore] = useState<number>(initialScore);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(
    initialScore >= EXPERT_THRESHOLD ? 'expert' : 'intermediate',
  );
  const [showFireworks, setShowFireworks] = useState<boolean>(false);
  const [fireworksNonce, setFireworksNonce] = useState(0);
  const [showVictoryPopup, setShowVictoryPopup] = useState<boolean>(false);
  const [popupText, setPopupText] = useState<string | undefined>(undefined);
  const [popupScoreGain, setPopupScoreGain] = useState<number | null>(null);
  const [showExpertToast, setShowExpertToast] = useState<boolean>(false);

  const prevTotalScoreRef = useRef<number>(initialScore);
  const hasMountedScoreEffectRef = useRef<boolean>(false);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expertToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const masterCelebrationPendingRef = useRef(false);
  const lastWinGainRef = useRef(0);

  const clearCelebrationTimeout = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
  };

  const clearExpertToastTimeout = () => {
    if (expertToastTimeoutRef.current) {
      clearTimeout(expertToastTimeoutRef.current);
      expertToastTimeoutRef.current = null;
    }
  };

  const showExpertSwitchToast = () => {
    clearExpertToastTimeout();
    setShowExpertToast(true);
    expertToastTimeoutRef.current = setTimeout(() => {
      setShowExpertToast(false);
      expertToastTimeoutRef.current = null;
    }, 2500);
  };

  const launchFireworks = () => {
    setFireworksNonce((n) => n + 1);
    setShowFireworks(true);
  };

  const dismissFireworks = () => {
    setShowFireworks(false);
  };

  const resetCelebration = () => {
    clearCelebrationTimeout();
    clearExpertToastTimeout();
    dismissFireworks();
    setShowVictoryPopup(false);
    setPopupText(undefined);
    setPopupScoreGain(null);
    setShowExpertToast(false);
    masterCelebrationPendingRef.current = false;
    lastWinGainRef.current = 0;
  };

  useEffect(() => {
    setTotalScore(initialScore);
    prevTotalScoreRef.current = initialScore;
    masterCelebrationPendingRef.current = false;
    setAiDifficulty(initialScore >= EXPERT_THRESHOLD ? 'expert' : 'intermediate');
  }, [initialScore]);

  const awardHumanWin = useCallback(() => {
    const gained = Math.max(0, 10 - undosUsedThisGameRef.current);
    setTotalScore((prev) => {
      const actualGained = Math.min(gained, MASTER_SCORE_THRESHOLD - prev);
      lastWinGainRef.current = actualGained;
      const next = prev + actualGained;
      if (next >= MASTER_SCORE_THRESHOLD && prev < MASTER_SCORE_THRESHOLD) {
        masterCelebrationPendingRef.current = true;
      }
      if (next >= EXPERT_THRESHOLD && prev < EXPERT_THRESHOLD) {
        setAiDifficulty('expert');
      }
      return next;
    });
  }, [undosUsedThisGameRef]);

  useEffect(() => {
    if (winner !== HUMAN_PLAYER) return;
    if (totalScore >= MASTER_SCORE_THRESHOLD || masterCelebrationPendingRef.current) return;
    clearCelebrationTimeout();
    launchFireworks();
    setPopupText(undefined);
    setPopupScoreGain(lastWinGainRef.current > 0 ? lastWinGainRef.current : null);
    setShowVictoryPopup(true);
    popupTimeoutRef.current = setTimeout(() => {
      dismissFireworks();
      setShowVictoryPopup(false);
      setPopupScoreGain(null);
      popupTimeoutRef.current = null;
    }, 3000);
    return () => {
      clearCelebrationTimeout();
    };
  }, [winner, totalScore]);

  useEffect(() => {
    if (winner !== 0) return;
    clearCelebrationTimeout();
    dismissFireworks();
    setPopupText(undefined);
    setPopupScoreGain(null);
    setShowVictoryPopup(true);
    popupTimeoutRef.current = setTimeout(() => {
      setShowVictoryPopup(false);
      popupTimeoutRef.current = null;
    }, 3000);
    return () => {
      clearCelebrationTimeout();
    };
  }, [winner]);

  useEffect(() => {
    if (winner !== AI_PLAYER) return;
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    setShowVictoryPopup(true);
    popupTimeoutRef.current = setTimeout(() => {
      setShowVictoryPopup(false);
      popupTimeoutRef.current = null;
    }, 3000);
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, [winner]);

  useEffect(() => {
    if (!hasMountedScoreEffectRef.current) {
      hasMountedScoreEffectRef.current = true;
      prevTotalScoreRef.current = totalScore;
      return;
    }

    const crossedMaster =
      masterCelebrationPendingRef.current ||
      (totalScore >= MASTER_SCORE_THRESHOLD && prevTotalScoreRef.current < MASTER_SCORE_THRESHOLD);

    const crossedExpert =
      totalScore >= EXPERT_THRESHOLD &&
      prevTotalScoreRef.current < EXPERT_THRESHOLD &&
      !crossedMaster;

    if (crossedExpert) {
      showExpertSwitchToast();
    }

    if (crossedMaster && totalScore >= MASTER_SCORE_THRESHOLD) {
      masterCelebrationPendingRef.current = false;
      clearCelebrationTimeout();
      launchFireworks();
      setPopupText(t(language, 'scoreGreat'));
      setPopupScoreGain(null);
      setShowVictoryPopup(true);
      popupTimeoutRef.current = setTimeout(() => {
        void (async () => {
          try {
            await onStartFreshRun?.(MASTER_SCORE_THRESHOLD);
          } catch {
            // Ignore leaderboard sync errors
          }
          dismissFireworks();
          setShowVictoryPopup(false);
          setPopupText(undefined);
          setTotalScore(0);
          setAiDifficulty('intermediate');
          popupTimeoutRef.current = null;
        })();
      }, 4500);
      playWowSound();
    }

    if (totalScore > prevTotalScoreRef.current && onScoreUpdate) {
      onScoreUpdate(totalScore);
    }
    prevTotalScoreRef.current = totalScore;
  }, [totalScore, onScoreUpdate, onStartFreshRun, language, playWowSound]);

  const isMaster = totalScore >= MASTER_SCORE_THRESHOLD;
  const isExpert = totalScore >= EXPERT_THRESHOLD;
  const seg1Fill = Math.min(1, totalScore / EXPERT_THRESHOLD);
  const seg2Fill =
    isExpert && MASTER_SCORE_THRESHOLD > EXPERT_THRESHOLD
      ? Math.min(1, (totalScore - EXPERT_THRESHOLD) / (MASTER_SCORE_THRESHOLD - EXPERT_THRESHOLD))
      : 0;

  return {
    totalScore,
    setTotalScore,
    aiDifficulty,
    setAiDifficulty,
    isMaster,
    isExpert,
    seg1Fill,
    seg2Fill,
    showFireworks,
    fireworksNonce,
    showVictoryPopup,
    popupText,
    popupScoreGain,
    showExpertToast,
    awardHumanWin,
    resetCelebration,
    masterCelebrationPendingRef,
  };
}
