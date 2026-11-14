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
  const activeRealmGoal = Math.max(
    2,
    Math.min(
      3,
      new Set(quests.map((q) => q.realmId).filter(Boolean)).size || 3
    )
  );
  const eliteBossTuntas = tuntasGrades.filter((g) => {
    const q = questMap.get(g.questId);
    return q && (q.difficulty === 'Elite' || q.difficulty === 'Boss');
  }).length;
  const legendTarget = quests.length >= 3 && quests.length < 8 ? quests.length : 8;
  const hasSecuredAccount = Boolean(hero.username?.trim()) && Boolean(hero.hasPin);
  const computedStreak = Math.max(streakCount, onTimeCount > 0 ? 1 : 0);

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
      unlocked: computedStreak >= 2 || onTimeCount >= 2,
      progressLabel: `${Math.min(2, Math.max(computedStreak, onTimeCount))}/2`,
      tone: 'gold',
    },
    {
      id: 'streak_master',
      title: 'Kilat Konsisten 3x',
      description: 'Menjaga streak 3 tugas Tuntas tepat waktu berturut-turut.',
      unlocked: computedStreak >= 3 || onTimeCount >= 3,
      progressLabel: `${Math.min(3, Math.max(computedStreak, onTimeCount))}/3`,
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
      id: 'all_rounder',
      title: 'Bintang Lintas Mapel',
      description: `Menuntaskan tugas di minimal ${activeRealmGoal} mata pelajaran berbeda.`,
      unlocked: completedRealms >= activeRealmGoal,
      progressLabel: `${Math.min(activeRealmGoal, completedRealms)}/${activeRealmGoal}`,
      tone: 'emerald',
    },
    {
      id: 'elite_slayer',
      title: 'Penakluk Elite / Boss',
      description: 'Menyelesaikan minimal 1 tugas tingkat Elite atau Boss hingga Tuntas.',
      unlocked: eliteBossTuntas >= 1,
      progressLabel: `${Math.min(1, eliteBossTuntas)}/1`,
      tone: 'magenta',
    },
    {
      id: 'mission_master',
      title: 'Penakluk 5 Misi',
      description: 'Mengoleksi minimal 5 tugas dengan status Tuntas.',
      unlocked: tuntasGrades.length >= 5,
      progressLabel: `${Math.min(5, tuntasGrades.length)}/5`,
      tone: 'gold',
    },
    {
      id: 'academy_legend',
      title: 'Legenda Akademi',
      description: `Menuntaskan ${legendTarget} tugas atau menuntaskan seluruh misi kelas.`,
      unlocked: tuntasGrades.length >= legendTarget,
      progressLabel: `${Math.min(legendTarget, tuntasGrades.length)}/${legendTarget}`,
      tone: 'magenta',
    },
    {
      id: 'pin_guardian',
      title: 'Penjaga Akun',
      description: 'Mengaktifkan Username unik dan PIN Rahasia siswa.',
      unlocked: hasSecuredAccount,
      progressLabel: hasSecuredAccount ? 'Aktif' : 'Belum',
      tone: 'emerald',
    },
  ];

  return {
    streakCount: computedStreak,
    onTimeCount,
    tuntasCount: tuntasGrades.length,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    badges,
  };
}

export function formatChapterLabel(chapter: string | number | undefined | null): string {
  const raw = String(chapter ?? '').trim();
  if (!raw) return 'Bab 1';
  if (/^\d+$/.test(raw)) return `Bab ${raw}`;
  return raw;
}

export function parseLocalDateTime(value?: string): Date | null {
  if (!value || value === '__per_class__') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!match) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hour = match[4] ? parseInt(match[4], 10) : 0;
  const minute = match[5] ? parseInt(match[5], 10) : 0;
  const second = match[6] ? parseInt(match[6], 10) : 0;
  return new Date(year, month, day, hour, minute, second);
}

export function formatScheduleDateTime(value?: string): string {
  const dt = parseLocalDateTime(value);
  if (!dt) return '';
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const dd = dt.getDate();
  const mm = months[dt.getMonth()] || '';
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${dd} ${mm} ${yyyy}, ${hh}:${min}`;
}

export interface SchedulableItem {
  targetDungeonId?: string;
  dungeonId?: string;
  scheduledAt?: string;
  classSchedules?: Record<string, string>;
}

export function getEffectiveScheduleForClass(
  item: SchedulableItem,
  heroDungeonId?: string
): { targeted: boolean; releaseTime: Date | null; rawSchedule: string } {
  const target = item.targetDungeonId || item.dungeonId || 'all';
  const perClassOnly = item.scheduledAt === '__per_class__';
  const classSchedules = item.classSchedules || {};

  if (target !== 'all' && heroDungeonId !== target) {
    return { targeted: false, releaseTime: null, rawSchedule: '' };
  }

  if (heroDungeonId && classSchedules[heroDungeonId]) {
    const raw = classSchedules[heroDungeonId];
    return {
      targeted: true,
      releaseTime: parseLocalDateTime(raw),
      rawSchedule: raw,
    };
  }

  if (perClassOnly) {
    // Mode per-kelas aktif, dan kelas siswa tidak ada di jadwal -> tidak ditayangkan ke kelas ini
    return { targeted: false, releaseTime: null, rawSchedule: '' };
  }

  if (item.scheduledAt) {
    return {
      targeted: true,
      releaseTime: parseLocalDateTime(item.scheduledAt),
      rawSchedule: item.scheduledAt,
    };
  }

  return { targeted: true, releaseTime: null, rawSchedule: '' };
}

export function isContentVisibleToHero(
  item: SchedulableItem,
  heroDungeonId?: string,
  now: Date = new Date()
): boolean {
  const eff = getEffectiveScheduleForClass(item, heroDungeonId);
  if (!eff.targeted) return false;
  if (!eff.releaseTime) return true;
  return eff.releaseTime.getTime() <= now.getTime();
}

export function getScheduleStatusSummary(
  item: SchedulableItem,
  dungeons: Dungeon[],
  now: Date = new Date()
): { isScheduledFuture: boolean; label: string } {
  const classSchedules = item.classSchedules || {};
  const entries = Object.entries(classSchedules).filter(([, v]) => Boolean(v));
  const perClassOnly = item.scheduledAt === '__per_class__';

  if (perClassOnly || entries.length > 0) {
    const upcomingCount = entries.filter(([, dtStr]) => {
      const d = parseLocalDateTime(dtStr);
      return d && d.getTime() > now.getTime();
    }).length;
    const summaryParts = entries.slice(0, 3).map(([dId, dtStr]) => {
      const dng = dungeons.find((d) => d.id === dId);
      const code = dng?.guildCode || dId;
      return `${code}: ${formatScheduleDateTime(dtStr)}`;
    });
    const more = entries.length > 3 ? ` (+${entries.length - 3} kelas)` : '';
    return {
      isScheduledFuture: upcomingCount > 0 || (perClassOnly && entries.length === 0),
      label:
        entries.length === 0
          ? 'Per-Kelas (Belum ada kelas dipilih)'
          : `Jadwal Kelas · ${summaryParts.join(' | ')}${more}`,
    };
  }

  if (item.scheduledAt && item.scheduledAt !== '__per_class__') {
    const dt = parseLocalDateTime(item.scheduledAt);
    if (dt && dt.getTime() > now.getTime()) {
      return {
        isScheduledFuture: true,
        label: `Terjadwal: ${formatScheduleDateTime(item.scheduledAt)}`,
      };
    }
    return {
      isScheduledFuture: false,
      label: `Tayang sejak ${formatScheduleDateTime(item.scheduledAt)}`,
    };
  }

  return { isScheduledFuture: false, label: 'Langsung Tayang' };
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
