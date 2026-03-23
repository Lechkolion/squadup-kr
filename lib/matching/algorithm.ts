import { GAMES } from '@/lib/games';

export interface ProfileForMatching {
  id: string;
  games: string[];
  play_styles: string[];
  languages: string[];
  active_hours_start: number;
  active_hours_end: number;
}

export interface GameRankForMatching {
  game_key: string;
  rank_label: string | null;
}

function getRankIndex(gameKey: string, rankLabel: string | null): number {
  if (!rankLabel) return -1;
  const game = GAMES[gameKey as keyof typeof GAMES];
  if (!game || !('ranks' in game) || game.ranks.length === 0) return -1;
  return (game.ranks as readonly string[]).indexOf(rankLabel);
}

function calcSharedGamesScore(gamesA: string[], gamesB: string[]): number {
  const setA = new Set(gamesA);
  const shared = gamesB.filter(g => setA.has(g));
  if (gamesA.length === 0 && gamesB.length === 0) return 35;
  const maxGames = Math.max(gamesA.length, gamesB.length, 1);
  return (shared.length / maxGames) * 35;
}

function calcPlayStyleScore(stylesA: string[], stylesB: string[]): number {
  const setA = new Set(stylesA);
  const matches = stylesB.filter(s => setA.has(s)).length;
  const maxStyles = Math.max(stylesA.length, stylesB.length, 1);
  return (matches / maxStyles) * 25;
}

function calcActiveHoursOverlap(startA: number, endA: number, startB: number, endB: number): number {
  // Normalize to 0-47 range to handle overnight windows
  const normalizeWindow = (start: number, end: number): [number, number] => {
    if (end <= start) return [start, end + 24];
    return [start, end];
  };

  const [sA, eA] = normalizeWindow(startA, endA);
  const [sB, eB] = normalizeWindow(startB, endB);

  const overlapStart = Math.max(sA, sB);
  const overlapEnd = Math.min(eA, eB);
  const overlap = Math.max(0, overlapEnd - overlapStart);

  // 4+ hours overlap = full 20 pts
  return Math.min(overlap / 4, 1) * 20;
}

function calcLanguageScore(langsA: string[], langsB: string[]): number {
  if (langsA.includes('both') || langsB.includes('both')) return 10;
  const setA = new Set(langsA);
  const shared = langsB.filter(l => setA.has(l));
  return shared.length > 0 ? 10 : 0;
}

function calcRankScore(
  sharedGames: string[],
  ranksA: GameRankForMatching[],
  ranksB: GameRankForMatching[]
): number {
  const multiplayerShared = sharedGames.filter(g => {
    const game = GAMES[g as keyof typeof GAMES];
    return game && game.isMultiplayer && 'ranks' in game && game.ranks.length > 0;
  });

  if (multiplayerShared.length === 0) return 5; // neutral score

  let totalScore = 0;
  for (const gameKey of multiplayerShared) {
    const rankA = ranksA.find(r => r.game_key === gameKey);
    const rankB = ranksB.find(r => r.game_key === gameKey);

    if (!rankA?.rank_label || !rankB?.rank_label) {
      totalScore += 5; // unknown ranks = neutral
      continue;
    }

    const idxA = getRankIndex(gameKey, rankA.rank_label);
    const idxB = getRankIndex(gameKey, rankB.rank_label);

    if (idxA === -1 || idxB === -1) {
      totalScore += 5;
      continue;
    }

    const diff = Math.abs(idxA - idxB);
    if (diff === 0) totalScore += 10;
    else if (diff === 1) totalScore += 5;
    // 2+ apart = 0
  }

  return totalScore / multiplayerShared.length;
}

export interface MatchResult {
  score: number;
  label: string;
  color: string;
  breakdown: {
    games: number;
    playStyle: number;
    activeHours: number;
    language: number;
    rank: number;
  };
}

export function calculateMatchScore(
  profileA: ProfileForMatching,
  profileB: ProfileForMatching,
  ranksA: GameRankForMatching[] = [],
  ranksB: GameRankForMatching[] = []
): MatchResult {
  const setA = new Set(profileA.games);
  const sharedGames = profileB.games.filter(g => setA.has(g));

  const games = calcSharedGamesScore(profileA.games, profileB.games);
  const playStyle = calcPlayStyleScore(profileA.play_styles, profileB.play_styles);
  const activeHours = calcActiveHoursOverlap(
    profileA.active_hours_start, profileA.active_hours_end,
    profileB.active_hours_start, profileB.active_hours_end
  );
  const language = calcLanguageScore(profileA.languages, profileB.languages);
  const rank = calcRankScore(sharedGames, ranksA, ranksB);

  const total = Math.round(Math.min(100, Math.max(0, games + playStyle + activeHours + language + rank)));

  let label: string;
  let color: string;
  if (total >= 90) {
    label = 'Perfect Match';
    color = 'var(--green)';
  } else if (total >= 70) {
    label = 'Great Match';
    color = 'var(--cyan)';
  } else if (total >= 50) {
    label = 'Good Match';
    color = 'var(--amber)';
  } else {
    label = 'Match';
    color = 'var(--text-muted)';
  }

  return { score: total, label, color, breakdown: { games, playStyle, activeHours, language, rank } };
}
