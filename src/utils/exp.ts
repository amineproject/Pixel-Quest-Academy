import {
  ActiveQuest,
  Dungeon,
  ExpGrade,
  GradeStatus,
  HeroStudent,
  Realm,
} from '../types/lms';

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

export interface DeadlineUrgency {
  daysRemaining: number;
  isOverdue: boolean;
  isUrgent: boolean;
  label: string;
}

export function getDeadlineUrgency(deadlineIso: string): DeadlineUrgency {
  if (!deadlineIso || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineIso)) {
    return {
      daysRemaining: 999,
      isOverdue: false,
      isUrgent: false,
      label: '-',
    };
  }
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = deadlineIso.split('-').map((n) => parseInt(n, 10));
  const targetUtc = Date.UTC(y, m - 1, d);
  const diffDays = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      daysRemaining: diffDays,
      isOverdue: true,
      isUrgent: true,
      label: `Terlewat ${Math.abs(diffDays)} hari`,
    };
  }
  if (diffDays === 0) {
    return {
      daysRemaining: 0,
      isOverdue: false,
      isUrgent: true,
      label: 'Tenggat Hari Ini!',
    };
  }
  if (diffDays === 1) {
    return {
      daysRemaining: 1,
      isOverdue: false,
      isUrgent: true,
      label: 'Besok (1 hari lagi)',
    };
  }
  if (diffDays === 2) {
    return {
      daysRemaining: 2,
      isOverdue: false,
      isUrgent: true,
      label: '2 hari lagi',
    };
  }
  return {
    daysRemaining: diffDays,
    isOverdue: false,
    isUrgent: false,
    label: `${diffDays} hari lagi`,
  };
}

export interface HeroAchievementBadge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressLabel: string;
  tone: 'gold' | 'cyan' | 'emerald' | 'magenta';
}

export interface HeroAchievementSummary {
  streakCount: number;
  onTimeCount: number;
  tuntasCount: number;
  unlockedCount: number;
  badges: HeroAchievementBadge[];
}

export function getHeroAchievements(
  hero: HeroStudent,
  quests: ActiveQuest[],
  grades: ExpGrade[],
  _realms: Realm[]
): HeroAchievementSummary {
  const heroGrades = grades.filter((g) => g.heroId === hero.id);
  const questMap = new Map(quests.map((q) => [q.id, q]));

  const tuntasGrades = heroGrades.filter(
    (g) => getEffectiveGradeStatus(g) === 'tuntas'
  );
  const remidialCount = heroGrades.filter(
    (g) => getEffectiveGradeStatus(g) === 'remidial'
  ).length;

  const isGradeOnTime = (g: ExpGrade): boolean => {
    const q = questMap.get(g.questId);
    if (!q?.deadline || !g.gradedDate) return true;
    return g.gradedDate <= q.deadline;
  };

  const onTimeCount = tuntasGrades.filter(isGradeOnTime).length;

  // Compute current uninterrupted streak across chronological graded tasks
  const orderedQuests = [...quests]
    .filter((q) => heroGrades.some((g) => g.questId === q.id))
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));

  let streakCount = 0;
  for (let i = orderedQuests.length - 1; i >= 0; i--) {
    const q = orderedQuests[i];
    const g = heroGrades.find((gr) => gr.questId === q.id);
    if (g && getEffectiveGradeStatus(g) === 'tuntas' && isGradeOnTime(g)) {
      streakCount++;
    } else if (g && getEffectiveGradeStatus(g) !== 'proses') {
      break;
    }
  }
  // Also allow streak from tuntas grades without matching quest entries if orderedQuests is empty
  if (orderedQuests.length === 0 && onTimeCount > 0) {
    streakCount = onTimeCount;
  }

  const completedRealms = new Set(tuntasGrades.map((g) => g.realmId)).size;
  const hasSecuredAccount = Boolean(hero.username?.trim()) && Boolean(hero.hasPin);

  const badges: HeroAchievementBadge[] = [
    {
      id: 'first_quest',
      title: 'Langkah Pertama',
      description: 'Menyelesaikan minimal 1 tugas hingga berstatus Tuntas.',
      unlocked: tuntasGrades.length >= 1,
      progressLabel: `${Math.min(1, tuntasGrades.length)}/1`,
      tone: 'cyan',
    },
    {
      id: 'ontime_streak',
      title: 'Rajin Tepat Waktu',
      description: 'Mencapai streak minimal 2 tugas Tuntas sebelum tenggat.',
      unlocked: streakCount >= 2 || onTimeCount >= 2,
      progressLabel: `${Math.min(2, Math.max(streakCount, onTimeCount))}/2`,
      tone: 'gold',
    },
    {
      id: 'no_remidial',
      title: 'Bebas Remidial',
      description: 'Minimal 2 tugas Tuntas dengan catatan 0 tugas Remidial.',
      unlocked: tuntasGrades.length >= 2 && remidialCount === 0,
      progressLabel:
        remidialCount > 0 ? 'Ada Remidial' : `${Math.min(2, tuntasGrades.length)}/2`,
      tone: 'emerald',
    },
    {
      id: 'realm_explorer',
      title: 'Penjelajah Mapel',
      description: 'Menuntaskan tugas pada minimal 2 mata pelajaran berbeda.',
      unlocked: completedRealms >= 2,
      progressLabel: `${Math.min(2, completedRealms)}/2`,
      tone: 'cyan',
    },
    {
      id: 'mission_master',
      title: 'Penakluk Misi',
      description: 'Mengoleksi minimal 5 tugas dengan status Tuntas.',
      unlocked: tuntasGrades.length >= 5,
      progressLabel: `${Math.min(5, tuntasGrades.length)}/5`,
      tone: 'gold',
    },
    {
      id: 'pin_guardian',
      title: 'Penjaga Akun',
      description: 'Mengaktifkan Username unik dan PIN Rahasia siswa.',
      unlocked: hasSecuredAccount,
      progressLabel: hasSecuredAccount ? 'Aktif' : 'Belum',
      tone: 'magenta',
    },
  ];

  return {
    streakCount: Math.max(streakCount, onTimeCount > 0 ? 1 : 0),
    onTimeCount,
    tuntasCount: tuntasGrades.length,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    badges,
  };
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
