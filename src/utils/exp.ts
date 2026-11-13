import { Dungeon, ExpGrade, GradeStatus, HeroStudent } from '../types/lms';

export type LetterRank = 'S' | 'A' | 'B' | 'C' | 'D';

export function getEffectiveGradeStatus(grade?: ExpGrade): GradeStatus {
  if (!grade) return 'belum';
  if (
    grade.status === 'tuntas' ||
    grade.status === 'belum' ||
    grade.status === 'proses' ||
    grade.status === 'remidial'
  ) {
    return grade.status;
  }
  return grade.score >= 70 ? 'tuntas' : 'remidial';
}

export function getRankFromScore(score: number): LetterRank {
  if (score >= 92) return 'S';
  if (score >= 82) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

export function calculateExpEarned(score: number, maxExp: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round((clamped / 100) * maxExp);
}

export interface LevelProgress {
  level: number;
  totalExp: number;
  expIntoLevel: number;
  expForNextLevel: number;
  percent: number;
  title: string;
}

const LEVEL_TITLES = [
  'Novice Initiate',
  'Apprentice Scribe',
  'Dungeon Explorer',
  'Rune Seeker',
  'Arcane Vanguard',
  'Master Adventurer',
  'Grand Champion',
];

export function getHeroLevelProgress(totalExp: number): LevelProgress {
  const expPerLevel = 250;
  const level = Math.max(1, Math.floor(totalExp / expPerLevel) + 1);
  const expIntoLevel = totalExp % expPerLevel;
  const percent = Math.min(100, Math.round((expIntoLevel / expPerLevel) * 100));
  const titleIndex = Math.min(LEVEL_TITLES.length - 1, level - 1);

  return {
    level,
    totalExp,
    expIntoLevel,
    expForNextLevel: expPerLevel,
    percent,
    title: LEVEL_TITLES[titleIndex],
  };
}

export function getHeroTotalExp(heroId: string, grades: ExpGrade[]): number {
  return grades
    .filter((g) => g.heroId === heroId)
    .reduce((sum, g) => sum + g.expEarned, 0);
}

export function formatRetroDate(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const year = parts[0];
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return isoDate;
  }
  return `${day} ${months[monthIndex]} ${year}`;
}

const ROMAN_MAP: Record<string, string> = {
  XII: '012',
  XI: '011',
  X: '010',
  IX: '009',
  VIII: '008',
  VII: '007',
  VI: '006',
  V: '005',
  IV: '004',
  III: '003',
  II: '002',
  I: '001',
};

export function normalizeClassSortKey(text: string): string {
  return (text || '')
    .trim()
    .replace(/\b(XII|XI|IX|VIII|VII|VI|IV|V|III|II|X|I)(?=\s|$|-|_|\/)/gi, (match) => {
      const upper = match.toUpperCase();
      return ROMAN_MAP[upper] || match;
    })
    .toLowerCase();
}

export function compareClassText(a: string, b: string): number {
  return normalizeClassSortKey(a).localeCompare(normalizeClassSortKey(b), 'id', {
    numeric: true,
    sensitivity: 'base',
  });
}

export function sortDungeonsAlphabetically<
  T extends { name: string; guildCode?: string; tier?: string }
>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const tierDiff = compareClassText(a.tier || '', b.tier || '');
    if (tierDiff !== 0) return tierDiff;
    const codeDiff = compareClassText(a.guildCode || '', b.guildCode || '');
    if (codeDiff !== 0) return codeDiff;
    return (a.name || '').localeCompare(b.name || '', 'id', {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

export function groupDungeonsByTier<T extends { name: string; guildCode?: string; tier?: string }>(
  list: T[]
): { tier: string; items: T[] }[] {
  const sorted = sortDungeonsAlphabetically(list);
  const groups: { tier: string; items: T[] }[] = [];
  sorted.forEach((d) => {
    const tierLabel = (d.tier || 'Lainnya').trim() || 'Lainnya';
    const existing = groups.find(
      (g) => g.tier.toLowerCase() === tierLabel.toLowerCase()
    );
    if (existing) {
      existing.items.push(d);
    } else {
      groups.push({ tier: tierLabel, items: [d] });
    }
  });
  return groups;
}

export function getHeroEffectiveRealmIds(
  hero: HeroStudent,
  dungeons: Dungeon[]
): string[] | null {
  if (hero.enrolledRealmIds && hero.enrolledRealmIds.length > 0) {
    return hero.enrolledRealmIds;
  }
  const dungeon = dungeons.find((d) => d.id === hero.dungeonId);
  if (dungeon?.realmIds && dungeon.realmIds.length > 0) {
    return dungeon.realmIds;
  }
  return null;
}

export function normalizeExternalUrl(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatLinkDisplay(raw?: string): string {
  const safe = normalizeExternalUrl(raw);
  if (!safe) return '';
  try {
    const parsed = new URL(safe);
    const shortPath = parsed.pathname === '/' ? '' : parsed.pathname;
    const combined = `${parsed.hostname}${shortPath}`;
    return combined.length > 44 ? `${combined.slice(0, 41)}...` : combined;
  } catch {
    return safe.length > 44 ? `${safe.slice(0, 41)}...` : safe;
  }
}
