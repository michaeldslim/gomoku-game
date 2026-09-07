import type { Language } from '../utils/i18n';

type CareerMessages = {
  rank: Record<string, string>;
  promoted: { title: string; subtitle: string };
  ceoReached: { title: string; subtitle: string };
  progressNext: string;
  lossKeepsProgress: string;
  noProgressDifficulty: string;
  homeBadge: string;
  maxRank: string;
  modeLabel: string;
  modeDesc: string;
  rulesSnippet: string;
  screen: Record<string, string>;
  ladder: Record<string, string>;
  difficulty: Record<string, string>;
  difficultySuggest: Record<string, string>;
};

const ko: CareerMessages = {
  rank: {
    intern: '인턴',
    staff: '사원',
    assistant: '대리',
    manager: '과장',
    deputy: '차장',
    director: '부장',
    executive: '전무',
    ceo: '사장',
  },
  promoted: {
    title: '승진합니다!',
    subtitle: '{{rank}}으로 승진했습니다',
  },
  ceoReached: {
    title: '축하합니다!',
    subtitle: '사장이 되었습니다',
  },
  progressNext: '다음: {{nextRank}} ({{required}}승)',
  lossKeepsProgress: '{{rank}} · {{current}}/{{required}}승 — 진행 유지',
  noProgressDifficulty: '승진 카운트 없음 — {{minDifficulty}} 이상 필요',
  homeBadge: '{{rank}} · {{current}}/{{required}}',
  maxRank: '{{rank}} · 최고 직급',
  modeLabel: '승진 모드',
  modeDesc: 'AI 대전 승리로 직급을 올립니다',
  rulesSnippet:
    '인턴에서 시작해 AI 대전 승리로 직급을 올립니다. 연승은 필요 없고, 현재 직급에서의 누적 승리만 셉니다. 패배해도 진행은 유지됩니다. 차장부터는 Expert(80점+) · 보통 이상 AI에서 이겨야 승진 카운트가 쌓입니다.',
  screen: {
    title: '승진 현황',
    currentRank: '현재 직급',
    highestRank: '최고 직급',
    ladderTitle: '직급 사다리',
    disabledTitle: '승진 모드가 꺼져 있습니다',
    disabledBody: '설정에서 승진 모드를 켜면 직급과 승진 진행을 기록합니다.',
    enableInSettings: '설정 열기',
  },
  ladder: {
    achieved: '달성',
    current: '현재',
    locked: '미달성',
    startingRank: '시작 직급',
    requirement: '승진 조건: {{wins}}승',
    requirementDifficulty: '승진 조건: {{difficulty}} 이상 {{wins}}승',
    progressToNext: '{{current}}/{{required}}승 → {{nextRank}}',
  },
  difficulty: {
    easy: '중급 (80점 미만)',
    medium: '고급 · 보통',
    hard: '고급 · 어려움',
  },
  difficultySuggest: {
    body: '현재 {{rank}} — 승진 카운트는 {{difficulty}} AI에서만 쌓입니다.',
    action: 'Expert 풀 {{difficulty}}(으)로 변경',
    needExpert: '현재 {{rank}} — 80점 이상(Expert) + {{difficulty}} AI 필요',
  },
};

const en: CareerMessages = {
  rank: {
    intern: 'Intern',
    staff: 'Staff',
    assistant: 'Assistant Manager',
    manager: 'Manager',
    deputy: 'Deputy Director',
    director: 'Director',
    executive: 'Executive VP',
    ceo: 'CEO',
  },
  promoted: {
    title: 'Promoted!',
    subtitle: 'You are now {{rank}}',
  },
  ceoReached: {
    title: 'Congratulations!',
    subtitle: 'You are the CEO',
  },
  progressNext: 'Next: {{nextRank}} ({{required}} wins)',
  lossKeepsProgress: '{{rank}} · {{current}}/{{required}} wins — still on track',
  noProgressDifficulty: 'No promotion credit — need {{minDifficulty}}+',
  homeBadge: '{{rank}} · {{current}}/{{required}}',
  maxRank: '{{rank}} · top rank',
  modeLabel: 'Career mode',
  modeDesc: 'Climb the ranks by beating the AI',
  rulesSnippet:
    'Start as an Intern and win vs AI to climb the ladder. Wins are cumulative at your current rank — no win streak required. Losses keep your progress. From Deputy onward, wins only count at Expert (80+) Medium+ AI.',
  screen: {
    title: 'Career Progress',
    currentRank: 'Current rank',
    highestRank: 'Highest achieved',
    ladderTitle: 'Rank ladder',
    disabledTitle: 'Career mode is off',
    disabledBody: 'Turn on Career mode in Settings to track your rank and promotion progress.',
    enableInSettings: 'Open Settings',
  },
  ladder: {
    achieved: 'Achieved',
    current: 'Current',
    locked: 'Locked',
    startingRank: 'Starting rank',
    requirement: '{{wins}} wins to reach',
    requirementDifficulty: '{{wins}} wins at {{difficulty}}+ to reach',
    progressToNext: '{{current}}/{{required}} wins → {{nextRank}}',
  },
  difficulty: {
    easy: 'Intermediate (<80)',
    medium: 'Expert · Medium',
    hard: 'Expert · Hard',
  },
  difficultySuggest: {
    body: 'At {{rank}}, promotion wins only count vs {{difficulty}} AI.',
    action: 'Switch Expert pool to {{difficulty}}',
    needExpert: 'At {{rank}}, you need Expert (80+) + {{difficulty}} AI',
  },
};

const messages: Record<Language, CareerMessages> = { ko, en };

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}

function resolvePath(obj: unknown, parts: string[]): unknown {
  let node = obj;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return node;
}

export function tc(
  lang: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value = resolvePath(messages[lang], key.split('.'));
  if (typeof value !== 'string') {
    return key;
  }
  return interpolate(value, params);
}

export type CareerTranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function createCareerTranslate(lang: Language): CareerTranslateFn {
  return (key, params) => tc(lang, key, params);
}
