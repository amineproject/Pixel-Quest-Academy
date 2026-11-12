import { Dungeon, ExpGrade, HeroStudent } from '../types/lms';

export type LetterRank = 'S' | 'A' | 'B' | 'C' | 'D';

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

export function sortDungeonsAlphabetically<T extends { name: string; guildCode?: string }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const nameDiff = (a.name || '').localeCompare(b.name || '', 'id', {
      numeric: true,
      sensitivity: 'base',
    });
    if (nameDiff !== 0) return nameDiff;
    return (a.guildCode || '').localeCompare(b.guildCode || '', 'id', {
      numeric: true,
      sensitivity: 'base',
    });
  });
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
