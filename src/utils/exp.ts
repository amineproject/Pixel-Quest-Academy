import {
  ActiveQuest,
  Dungeon,
  ExpGrade,
  GradeStatus,
  HeroStudent,
  QuestCategory,
  Realm,
  SeasonId,
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

/**
 * Computes numeric EXP earned from a 0-100 score scaled against a quest's max EXP.
 * @param score Raw numeric score (clamped 0..100).
 * @param maxExp Maximum EXP reward configured for the quest.
 */
export function calculateExpEarned(score: number, maxExp: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round((clamped / 100) * Math.max(0, maxExp));
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

const GM_LEVEL_TITLES = [
  'Guild Steward',
  'Scroll Keeper',
  'Quest Architect',
  'Dungeon Tactician',
  'Grand Mentor',
  'Archmage Educator',
  'Academy Legend',
];

/**
 * Computes a Hero's RPG level, title, and progress bar toward the next level.
 * Every 250 EXP unlocks a new Hero level.
 */
export function getHeroLevelProgress(totalExp: number): LevelProgress {
  const safeExp = Math.max(0, Number.isFinite(totalExp) ? totalExp : 0);
  const expPerLevel = 250;
  const level = Math.max(1, Math.floor(safeExp / expPerLevel) + 1);
  const expIntoLevel = safeExp % expPerLevel;
  const percent = Math.min(100, Math.round((expIntoLevel / expPerLevel) * 100));
  const titleIndex = Math.min(LEVEL_TITLES.length - 1, level - 1);

  return {
    level,
    totalExp: safeExp,
    expIntoLevel,
    expForNextLevel: expPerLevel,
    percent,
    title: LEVEL_TITLES[titleIndex],
  };
}

/**
 * Computes a Game Master's progression level and XP bar from active academy stewardship.
 */
export function getGmLevelProgress(metrics: {
  dungeonsCount: number;
  heroesCount: number;
  tomesCount: number;
  questsCount: number;
  gradesCount: number;
  noticesCount: number;
}): LevelProgress {
  const totalExp =
    Math.max(0, metrics.dungeonsCount) * 50 +
    Math.max(0, metrics.heroesCount) * 25 +
    Math.max(0, metrics.tomesCount) * 40 +
    Math.max(0, metrics.questsCount) * 60 +
    Math.max(0, metrics.gradesCount) * 15 +
    Math.max(0, metrics.noticesCount) * 20;
  const expPerLevel = 300;
  const level = Math.max(1, Math.floor(totalExp / expPerLevel) + 1);
  const expIntoLevel = totalExp % expPerLevel;
  const percent = Math.min(100, Math.round((expIntoLevel / expPerLevel) * 100));
  const titleIndex = Math.min(GM_LEVEL_TITLES.length - 1, level - 1);

  return {
    level,
    totalExp,
    expIntoLevel,
    expForNextLevel: expPerLevel,
    percent,
    title: GM_LEVEL_TITLES[titleIndex],
  };
}

/**
 * Sums total EXP earned by a specific Hero across all graded entries.
 */
export function getHeroTotalExp(heroId: string, grades: ExpGrade[]): number {
  return grades
    .filter((g) => g.heroId === heroId)
    .reduce((sum, g) => sum + (Number(g.expEarned) || 0), 0);
}

export interface GuildLeaderboardEntry {
  rank: number;
  hero: HeroStudent;
  totalExp: number;
  level: number;
  title: string;
  tuntasCount: number;
}

/**
 * Builds a sorted Guild Leaderboard ranking Heroes by total EXP descending,
 * breaking ties by completed quests count and alphabetical name.
 */
export function getGuildLeaderboard(
  heroes: HeroStudent[],
  grades: ExpGrade[]
): GuildLeaderboardEntry[] {
  const activeHeroes = heroes.filter((h) => h.active);
  const ranked = activeHeroes
    .map((hero) => {
      const heroGrades = grades.filter((g) => g.heroId === hero.id);
      const totalExp = heroGrades.reduce(
        (sum, g) => sum + (Number(g.expEarned) || 0),
        0
      );
      const tuntasCount = heroGrades.filter(
        (g) => getEffectiveGradeStatus(g) === 'tuntas'
      ).length;
      const lvl = getHeroLevelProgress(totalExp);
      return {
        hero,
        totalExp,
        level: lvl.level,
        title: lvl.title,
        tuntasCount,
      };
    })
    .sort((a, b) => {
      if (b.totalExp !== a.totalExp) return b.totalExp - a.totalExp;
      if (b.tuntasCount !== a.tuntasCount) return b.tuntasCount - a.tuntasCount;
      return a.hero.name.localeCompare(b.hero.name, 'id', { sensitivity: 'base' });
    });

  return ranked.map((entry, idx) => ({
    rank: idx + 1,
    ...entry,
  }));
}

export interface WeeklyLeaderboardEntry extends GuildLeaderboardEntry {
  weeklyExp: number;
}

/**
 * Computes Heroes ranked by EXP earned within the last 7 days (weekly XP),
 * breaking ties by total EXP, completed quest count, and name.
 */
export function getWeeklyGuildLeaderboard(
  heroes: HeroStudent[],
  grades: ExpGrade[],
  now: Date = new Date()
): WeeklyLeaderboardEntry[] {
  const activeHeroes = heroes.filter((h) => h.active);
  const cutoffMs =
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
    6 * 24 * 60 * 60 * 1000;
  const endOfTodayMs =
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) +
    24 * 60 * 60 * 1000 -
    1;

  const ranked = activeHeroes
    .map((hero) => {
      const heroGrades = grades.filter((g) => g.heroId === hero.id);
      const totalExp = heroGrades.reduce(
        (sum, g) => sum + (Number(g.expEarned) || 0),
        0
      );
      const weeklyExp = heroGrades.reduce((sum, g) => {
        const dt = parseLocalDateTime(g.gradedDate);
        if (!dt) return sum;
        const utcMs = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
        if (utcMs >= cutoffMs && utcMs <= endOfTodayMs) {
          return sum + (Number(g.expEarned) || 0);
        }
        return sum;
      }, 0);
      const tuntasCount = heroGrades.filter(
        (g) => getEffectiveGradeStatus(g) === 'tuntas'
      ).length;
      const lvl = getHeroLevelProgress(totalExp);
      return {
        hero,
        weeklyExp,
        totalExp,
        level: lvl.level,
        title: lvl.title,
        tuntasCount,
      };
    })
    .sort((a, b) => {
      if (b.weeklyExp !== a.weeklyExp) return b.weeklyExp - a.weeklyExp;
      if (b.totalExp !== a.totalExp) return b.totalExp - a.totalExp;
      if (b.tuntasCount !== a.tuntasCount) return b.tuntasCount - a.tuntasCount;
      return a.hero.name.localeCompare(b.hero.name, 'id', { sensitivity: 'base' });
    });

  return ranked.map((entry, idx) => ({
    rank: idx + 1,
    ...entry,
  }));
}

/**
 * Masks a Hero's full name for privacy mode on the Hall of Fame leaderboard.
 */
export function maskHeroName(name: string, rank: number): string {
  const clean = (name || '').trim();
  if (!clean) return `Hero #${rank}`;
  const firstChar = clean.charAt(0).toUpperCase();
  return `${firstChar}*** (Hero #${rank})`;
}

/**
 * Filters peer Heroes and EXP grades strictly to the logged-in Hero's own class (Dungeon)
 * and the Realms (Mapel) they are enrolled in, preventing students from other classes
 * or unrelated subjects from appearing in student leaderboards.
 */
export function getScopedHeroLeaderboardInputs(
  currentHero: HeroStudent,
  allHeroes: HeroStudent[],
  dungeons: Dungeon[],
  grades: ExpGrade[],
  selectedRealmId: string = 'all'
): {
  scopedHeroes: HeroStudent[];
  scopedGrades: ExpGrade[];
  allowedRealmIds: string[] | null;
} {
  const myRealms = getHeroEffectiveRealmIds(currentHero, dungeons);
  const targetRealms =
    selectedRealmId !== 'all'
      ? [selectedRealmId]
      : myRealms && myRealms.length > 0
        ? myRealms
        : null;

  const targetRealmSet = targetRealms ? new Set(targetRealms) : null;

  const scopedHeroes = allHeroes.filter((peer) => {
    if (!peer.active || peer.dungeonId !== currentHero.dungeonId) {
      return false;
    }
    if (!targetRealmSet) {
      return true;
    }
    const peerRealms = getHeroEffectiveRealmIds(peer, dungeons);
    if (!peerRealms || peerRealms.length === 0) {
      return true;
    }
    return peerRealms.some((rid) => targetRealmSet.has(rid));
  });

  const scopedHeroIdSet = new Set(scopedHeroes.map((h) => h.id));
  const scopedGrades = grades.filter(
    (g) =>
      scopedHeroIdSet.has(g.heroId) &&
      (!targetRealmSet || targetRealmSet.has(g.realmId))
  );

  return {
    scopedHeroes,
    scopedGrades,
    allowedRealmIds: myRealms,
  };
}

/**
 * Safely escapes a single CSV field cell according to RFC 4180.
 */
export function escapeCsvCell(value: string | number | undefined | null): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

/**
 * Evaluates a Hero's 10 achievement badges and on-time completion streak.
 */
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
      title: 'First Quest',
      description: 'Menyelesaikan tugas pertama hingga berstatus Tuntas.',
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
      title: 'Dungeon Master',
      description: 'Menguasai dungeon dengan menuntaskan minimal 5 tugas kelas.',
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

export function parseTargetDungeonIds(targetDungeonId?: string): string[] {
  const raw = (targetDungeonId || '').trim();
  if (!raw || raw === 'all') return [];
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && s !== 'all');
  return Array.from(new Set(parts));
}

export function serializeTargetDungeonIds(
  selectedIds: string[],
  totalDungeonsCount?: number
): string {
  const unique = Array.from(
    new Set(
      (selectedIds || [])
        .map((s) => s.trim())
        .filter((s) => Boolean(s) && s !== 'all')
    )
  );
  if (
    unique.length === 0 ||
    (typeof totalDungeonsCount === 'number' &&
      totalDungeonsCount > 0 &&
      unique.length >= totalDungeonsCount)
  ) {
    return 'all';
  }
  return unique.join(',');
}

export function doesTargetMatchDungeon(
  targetDungeonId: string | undefined,
  dungeonId?: string
): boolean {
  const targetIds = parseTargetDungeonIds(targetDungeonId);
  if (targetIds.length === 0) return true;
  if (!dungeonId) return false;
  return targetIds.includes(dungeonId);
}

export function formatTargetDungeonsSummary(
  targetDungeonId: string | undefined,
  dungeons: Dungeon[],
  allLabel = 'Semua Kelas'
): string {
  const targetIds = parseTargetDungeonIds(targetDungeonId);
  if (targetIds.length === 0) return allLabel;
  if (targetIds.length === 1) {
    const found = dungeons.find((d) => d.id === targetIds[0]);
    return found ? `${found.guildCode} — ${found.name}` : targetIds[0];
  }
  const codes = targetIds.map((id) => {
    const found = dungeons.find((d) => d.id === id);
    return found?.guildCode || id;
  });
  const preview =
    codes.length <= 3
      ? codes.join(', ')
      : `${codes.slice(0, 3).join(', ')} +${codes.length - 3}`;
  return `${targetIds.length} Kelas (${preview})`;
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
  const targetIds = parseTargetDungeonIds(target);
  const perClassOnly = item.scheduledAt === '__per_class__';
  const classSchedules = item.classSchedules || {};

  if (targetIds.length > 0 && (!heroDungeonId || !targetIds.includes(heroDungeonId))) {
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

/**
 * Checks strictly whether a Quest belongs to a Hero's enrolled Realms (Mapel),
 * target class (Dungeon), and release schedule. Existing grades never bypass
 * Realm or class enrollment boundaries.
 */
export function isQuestAssignedToHero(
  quest: ActiveQuest,
  hero: HeroStudent,
  dungeons: Dungeon[],
  options?: {
    now?: Date;
    hasGrade?: boolean;
  }
): boolean {
  const allowedRealmIds = getHeroEffectiveRealmIds(hero, dungeons);
  if (allowedRealmIds && !allowedRealmIds.includes(quest.realmId)) {
    return false;
  }

  const schedule = getEffectiveScheduleForClass(quest, hero.dungeonId);
  if (!schedule.targeted) {
    return false;
  }

  if (options?.hasGrade) {
    return true;
  }

  if (!schedule.releaseTime) {
    return true;
  }

  const now = options?.now ?? new Date();
  return schedule.releaseTime.getTime() <= now.getTime();
}

/**
 * Synchronizes heroes' enrolledRealmIds when a class (Dungeon) updates its realmIds,
 * removing subjects that were unchecked from the class so stale enrollments do not linger.
 */
export function syncHeroesRealmsWithDungeonUpdate(
  heroes: HeroStudent[],
  prevDungeon: Dungeon | undefined,
  nextDungeon: Dungeon
): { nextHeroes: HeroStudent[]; changedHeroes: HeroStudent[] } {
  if (!prevDungeon) {
    return { nextHeroes: heroes, changedHeroes: [] };
  }

  const prevRealms = prevDungeon.realmIds || [];
  const nextRealms = nextDungeon.realmIds || [];
  const prevSet = new Set(prevRealms);
  const nextSet = new Set(nextRealms);

  const removedRealms = prevRealms.filter((id) => !nextSet.has(id));
  const sameSizeAndItems =
    prevRealms.length === nextRealms.length &&
    prevRealms.every((id) => nextSet.has(id));

  if (sameSizeAndItems && prevRealms.length > 0) {
    return { nextHeroes: heroes, changedHeroes: [] };
  }

  const changedHeroes: HeroStudent[] = [];
  const nextHeroes = heroes.map((h) => {
    if (h.dungeonId !== nextDungeon.id) return h;
    const current = h.enrolledRealmIds || [];
    if (current.length === 0) {
      return h;
    }

    let updated: string[] = current;
    const currentSet = new Set(current);
    const matchedPrevExactly =
      prevRealms.length > 0 &&
      current.length === prevRealms.length &&
      current.every((id) => prevSet.has(id));

    if (matchedPrevExactly) {
      updated = [...nextRealms];
    } else if (removedRealms.length > 0) {
      const removedSet = new Set(removedRealms);
      updated = current.filter((id) => !removedSet.has(id));
    } else if (prevRealms.length === 0 && nextRealms.length > 0) {
      updated = current.filter((id) => nextSet.has(id));
    }

    const isDifferent =
      updated.length !== current.length ||
      updated.some((id, idx) => id !== current[idx]);
    if (!isDifferent) return h;

    const updatedHero: HeroStudent = {
      ...h,
      enrolledRealmIds: updated,
    };
    changedHeroes.push(updatedHero);
    return updatedHero;
  });

  return { nextHeroes, changedHeroes };
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

export function getSeasonLabel(season?: SeasonId | 'all'): string {
  if (season === 'all') return 'Semua Season (1 Tahun)';
  return season === 'genap' ? 'Season 2 (Genap)' : 'Season 1 (Ganjil)';
}

export function getShortSeasonLabel(season?: SeasonId | 'all'): string {
  if (season === 'all') return 'Semua Season';
  return season === 'genap' ? 'Season 2 · Genap' : 'Season 1 · Ganjil';
}

export function buildAcademicPeriodLabel(
  eraName?: string,
  season?: SeasonId | 'all'
): string {
  const cleanEra = (eraName || '').trim();
  const seasonLabel = getSeasonLabel(season);
  return cleanEra ? `Era ${cleanEra} — ${seasonLabel}` : seasonLabel;
}

export interface QuestCategoryMeta {
  id: QuestCategory;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
}

export const QUEST_CATEGORIES: QuestCategoryMeta[] = [
  {
    id: 'Main',
    label: 'Main Quest',
    shortLabel: 'MAIN QUEST',
    description: 'Tugas utama yang wajib diselesaikan (individu)',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-800',
  },
  {
    id: 'Party',
    label: 'Party Quest',
    shortLabel: 'PARTY QUEST',
    description: 'Misi yang dikerjakan secara berkelompok',
    badgeClass: 'bg-sky-100 text-sky-950 border-sky-800',
  },
  {
    id: 'Special',
    label: 'Special Quest',
    shortLabel: 'SPECIAL QUEST',
    description: 'Misi khusus atau alternatif',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-800',
  },
  {
    id: 'Knowledge',
    label: 'Knowledge Quest',
    shortLabel: 'KNOWLEDGE QUEST',
    description: 'Misi eksplorasi pengetahuan',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-800',
  },
];

export function normalizeQuestCategory(raw?: string | null): QuestCategory {
  const clean = String(raw || '').trim().toLowerCase();
  if (clean === 'party' || clean === 'party quest') return 'Party';
  if (clean === 'special' || clean === 'special quest') return 'Special';
  if (clean === 'knowledge' || clean === 'knowledge quest') return 'Knowledge';
  return 'Main';
}

export function getQuestCategoryMeta(
  category?: QuestCategory | string | null
): QuestCategoryMeta {
  const normalized = normalizeQuestCategory(category);
  return (
    QUEST_CATEGORIES.find((item) => item.id === normalized) ||
    QUEST_CATEGORIES[0]
  );
}

const QUEST_CATEGORY_ORDER = new Map<QuestCategory, number>(
  QUEST_CATEGORIES.map((c, idx) => [c.id, idx])
);

export function sortQuestsByCategory<
  T extends {
    category?: QuestCategory | string | null;
    title?: string;
    chapter?: string;
    deadline?: string;
  }
>(quests: T[]): T[] {
  return [...quests].sort((a, b) => {
    const orderA = QUEST_CATEGORY_ORDER.get(normalizeQuestCategory(a.category)) ?? 99;
    const orderB = QUEST_CATEGORY_ORDER.get(normalizeQuestCategory(b.category)) ?? 99;
    if (orderA !== orderB) return orderA - orderB;

    const titleDiff = (a.title || '').localeCompare(b.title || '', 'id', {
      numeric: true,
      sensitivity: 'base',
    });
    if (titleDiff !== 0) return titleDiff;

    const chapDiff = (a.chapter || '').localeCompare(b.chapter || '', 'id', {
      numeric: true,
      sensitivity: 'base',
    });
    if (chapDiff !== 0) return chapDiff;

    return (a.deadline || '').localeCompare(b.deadline || '');
  });
}

export function groupQuestsByCategory<
  T extends {
    category?: QuestCategory | string | null;
    title?: string;
    chapter?: string;
    deadline?: string;
  }
>(quests: T[]): { meta: QuestCategoryMeta; items: T[] }[] {
  const sorted = sortQuestsByCategory(quests);
  return QUEST_CATEGORIES.map((meta) => ({
    meta,
    items: sorted.filter((q) => normalizeQuestCategory(q.category) === meta.id),
  })).filter((group) => group.items.length > 0);
}

export interface DashboardStatusBreakdown {
  tuntas: number;
  proses: number;
  remidial: number;
  belum: number;
  totalSlots: number;
  gradedCount: number;
  completionPercent: number;
  averageScore: number;
}

export interface DashboardRankBucket {
  rank: LetterRank;
  label: string;
  rangeLabel: string;
  count: number;
  percent: number;
}

export interface DashboardComparisonRow {
  id: string;
  label: string;
  subLabel?: string;
  heroCount?: number;
  questCount?: number;
  totalSlots: number;
  tuntasCount: number;
  prosesCount: number;
  remidialCount: number;
  belumCount: number;
  completionPercent: number;
  gradedCount: number;
  averageScore: number;
}

export interface DashboardAnalytics {
  status: DashboardStatusBreakdown;
  ranks: DashboardRankBucket[];
  byClass: DashboardComparisonRow[];
  byRealm: DashboardComparisonRow[];
  byCategory: DashboardComparisonRow[];
}

interface MutableAgg {
  totalSlots: number;
  tuntasCount: number;
  prosesCount: number;
  remidialCount: number;
  belumCount: number;
  gradedCount: number;
  scoreSum: number;
  questIds: Set<string>;
}

function createMutableAgg(): MutableAgg {
  return {
    totalSlots: 0,
    tuntasCount: 0,
    prosesCount: 0,
    remidialCount: 0,
    belumCount: 0,
    gradedCount: 0,
    scoreSum: 0,
    questIds: new Set<string>(),
  };
}

function finalizeAgg(
  id: string,
  label: string,
  agg: MutableAgg,
  extra?: { subLabel?: string; heroCount?: number; questCount?: number }
): DashboardComparisonRow {
  const completionPercent =
    agg.totalSlots > 0
      ? Math.min(100, Math.round((agg.tuntasCount / agg.totalSlots) * 100))
      : 0;
  const averageScore =
    agg.gradedCount > 0 ? Math.round(agg.scoreSum / agg.gradedCount) : 0;

  return {
    id,
    label,
    subLabel: extra?.subLabel,
    heroCount: extra?.heroCount,
    questCount: extra?.questCount ?? agg.questIds.size,
    totalSlots: agg.totalSlots,
    tuntasCount: agg.tuntasCount,
    prosesCount: agg.prosesCount,
    remidialCount: agg.remidialCount,
    belumCount: agg.belumCount,
    completionPercent,
    gradedCount: agg.gradedCount,
    averageScore,
  };
}

export function computeDashboardAnalytics(params: {
  dungeons: Dungeon[];
  heroes: HeroStudent[];
  quests: ActiveQuest[];
  grades: ExpGrade[];
  realms: Realm[];
  scopedDungeonIds?: Set<string> | null;
  selectedRealmId?: string;
}): DashboardAnalytics {
  const {
    dungeons,
    heroes,
    quests,
    grades,
    realms,
    scopedDungeonIds = null,
    selectedRealmId = 'all',
  } = params;

  const scopedDungeons = sortDungeonsAlphabetically(
    scopedDungeonIds
      ? dungeons.filter((d) => scopedDungeonIds.has(d.id))
      : dungeons
  );

  const activeHeroes = heroes.filter(
    (h) => h.active && (!scopedDungeonIds || scopedDungeonIds.has(h.dungeonId))
  );

  const scopedQuests = quests.filter((q) => {
    if (selectedRealmId !== 'all' && q.realmId !== selectedRealmId) {
      return false;
    }
    if (!scopedDungeonIds) return true;
    const targetIds = parseTargetDungeonIds(q.dungeonId);
    if (targetIds.length === 0) return true;
    return targetIds.some((id) => scopedDungeonIds.has(id));
  });

  // Index grades by heroId__questId (keep latest if duplicates exist)
  const gradeMap = new Map<string, ExpGrade>();
  grades.forEach((g) => {
    gradeMap.set(`${g.heroId}__${g.questId}`, g);
  });

  const overallAgg = createMutableAgg();
  const rankCounts: Record<LetterRank, number> = {
    S: 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  const classAggMap = new Map<string, MutableAgg>();
  scopedDungeons.forEach((d) => classAggMap.set(d.id, createMutableAgg()));

  const heroCountByDungeon = new Map<string, number>();
  activeHeroes.forEach((h) => {
    heroCountByDungeon.set(
      h.dungeonId,
      (heroCountByDungeon.get(h.dungeonId) || 0) + 1
    );
  });

  const scopedRealms =
    selectedRealmId !== 'all'
      ? realms.filter((r) => r.id === selectedRealmId)
      : realms;
  const realmAggMap = new Map<string, MutableAgg>();
  scopedRealms.forEach((r) => realmAggMap.set(r.id, createMutableAgg()));

  const categoryAggMap = new Map<QuestCategory, MutableAgg>();
  QUEST_CATEGORIES.forEach((c) => categoryAggMap.set(c.id, createMutableAgg()));

  // Track quest counts per realm & category within scope even if 0 active heroes
  scopedQuests.forEach((q) => {
    const rAgg = realmAggMap.get(q.realmId);
    if (rAgg) rAgg.questIds.add(q.id);
    const cat = normalizeQuestCategory(q.category);
    const cAgg = categoryAggMap.get(cat);
    if (cAgg) cAgg.questIds.add(q.id);
  });

  const pushSlot = (
    agg: MutableAgg | undefined,
    status: GradeStatus,
    score: number | null,
    questId: string
  ) => {
    if (!agg) return;
    agg.totalSlots++;
    agg.questIds.add(questId);
    if (status === 'tuntas') agg.tuntasCount++;
    else if (status === 'proses') agg.prosesCount++;
    else if (status === 'remidial') agg.remidialCount++;
    else agg.belumCount++;

    if (score !== null) {
      agg.gradedCount++;
      agg.scoreSum += score;
    }
  };

  activeHeroes.forEach((hero) => {
    const allowedRealms = getHeroEffectiveRealmIds(hero, dungeons);
    scopedQuests.forEach((quest) => {
      if (!doesTargetMatchDungeon(quest.dungeonId, hero.dungeonId)) {
        return;
      }
      if (
        quest.realmId &&
        allowedRealms &&
        !allowedRealms.includes(quest.realmId)
      ) {
        return;
      }

      const grade = gradeMap.get(`${hero.id}__${quest.id}`);
      const status: GradeStatus = grade
        ? getEffectiveGradeStatus(grade)
        : 'belum';
      const hasScore = Boolean(grade && status !== 'belum');
      const numericScore = hasScore
        ? Math.max(0, Math.min(100, Number(grade?.score ?? 0)))
        : null;

      if (numericScore !== null) {
        const rank = getRankFromScore(numericScore);
        rankCounts[rank]++;
      }

      pushSlot(overallAgg, status, numericScore, quest.id);
      pushSlot(classAggMap.get(hero.dungeonId), status, numericScore, quest.id);
      pushSlot(realmAggMap.get(quest.realmId), status, numericScore, quest.id);
      pushSlot(
        categoryAggMap.get(normalizeQuestCategory(quest.category)),
        status,
        numericScore,
        quest.id
      );
    });
  });

  const totalGradedForRank =
    rankCounts.S + rankCounts.A + rankCounts.B + rankCounts.C + rankCounts.D;

  const rankMeta: { rank: LetterRank; label: string; rangeLabel: string }[] = [
    { rank: 'S', label: 'Rank S', rangeLabel: '92–100' },
    { rank: 'A', label: 'Rank A', rangeLabel: '82–91' },
    { rank: 'B', label: 'Rank B', rangeLabel: '70–81' },
    { rank: 'C', label: 'Rank C', rangeLabel: '55–69' },
    { rank: 'D', label: 'Rank D', rangeLabel: '< 55' },
  ];

  const ranks: DashboardRankBucket[] = rankMeta.map((item) => {
    const count = rankCounts[item.rank];
    return {
      ...item,
      count,
      percent:
        totalGradedForRank > 0
          ? Math.round((count / totalGradedForRank) * 100)
          : 0,
    };
  });

  const byClass: DashboardComparisonRow[] = scopedDungeons.map((d) =>
    finalizeAgg(d.id, d.name, classAggMap.get(d.id) || createMutableAgg(), {
      subLabel: `${d.guildCode} · ${d.tier}`,
      heroCount: heroCountByDungeon.get(d.id) || 0,
    })
  );

  const byRealm: DashboardComparisonRow[] = scopedRealms.map((r) =>
    finalizeAgg(r.id, r.name, realmAggMap.get(r.id) || createMutableAgg(), {
      subLabel: r.code,
    })
  );

  const byCategory: DashboardComparisonRow[] = QUEST_CATEGORIES.map((c) =>
    finalizeAgg(
      c.id,
      c.label,
      categoryAggMap.get(c.id) || createMutableAgg(),
      { subLabel: c.description }
    )
  );

  return {
    status: {
      tuntas: overallAgg.tuntasCount,
      proses: overallAgg.prosesCount,
      remidial: overallAgg.remidialCount,
      belum: overallAgg.belumCount,
      totalSlots: overallAgg.totalSlots,
      gradedCount: overallAgg.gradedCount,
      completionPercent:
        overallAgg.totalSlots > 0
          ? Math.min(
              100,
              Math.round((overallAgg.tuntasCount / overallAgg.totalSlots) * 100)
            )
          : 0,
      averageScore:
        overallAgg.gradedCount > 0
          ? Math.round(overallAgg.scoreSum / overallAgg.gradedCount)
          : 0,
    },
    ranks,
    byClass,
    byRealm,
    byCategory,
  };
}

export interface CollectiveGradePatch {
  scoreInput: string;
  statusInput: GradeStatus | 'keep';
  noteInput: string;
  clearNote?: boolean;
}

export function applyCollectiveGradePatch(params: {
  targetHeroIds: string[];
  currentScores: Record<string, number>;
  currentStatuses: Record<string, GradeStatus>;
  currentNotes: Record<string, string>;
  patch: CollectiveGradePatch;
}): {
  nextScores: Record<string, number>;
  nextStatuses: Record<string, GradeStatus>;
  nextNotes: Record<string, string>;
} {
  const {
    targetHeroIds,
    currentScores,
    currentStatuses,
    currentNotes,
    patch,
  } = params;

  const nextScores = { ...currentScores };
  const nextStatuses = { ...currentStatuses };
  const nextNotes = { ...currentNotes };

  const rawScoreTrimmed = (patch.scoreInput || '').trim();
  const hasScoreUpdate =
    rawScoreTrimmed !== '' && Number.isFinite(Number(rawScoreTrimmed));
  const parsedScore = hasScoreUpdate
    ? Math.max(0, Math.min(100, Math.round(Number(rawScoreTrimmed))))
    : null;

  const trimmedNote = (patch.noteInput || '').trim();
  const hasNoteUpdate = Boolean(patch.clearNote) || trimmedNote !== '';

  targetHeroIds.forEach((heroId) => {
    const prevScore = currentScores[heroId] ?? 80;
    const prevStatus = currentStatuses[heroId] ?? 'tuntas';

    let finalScore = prevScore;
    let finalStatus = prevStatus;

    if (patch.statusInput !== 'keep') {
      finalStatus = patch.statusInput;
      if (parsedScore !== null) {
        finalScore = finalStatus === 'belum' ? 0 : parsedScore;
      } else if (finalStatus === 'belum') {
        finalScore = 0;
      } else if (finalStatus === 'tuntas' && prevScore === 0) {
        finalScore = 80;
      }
    } else if (parsedScore !== null) {
      finalScore = parsedScore;
      finalStatus = parsedScore >= 70 ? 'tuntas' : 'remidial';
    }

    nextScores[heroId] = finalScore;
    nextStatuses[heroId] = finalStatus;

    if (patch.clearNote) {
      nextNotes[heroId] = '';
    } else if (hasNoteUpdate) {
      nextNotes[heroId] = trimmedNote;
    }
  });

  return {
    nextScores,
    nextStatuses,
    nextNotes,
  };
}

export interface ParsedScoreDraft {
  inputValue: string;
  numericScore: number | null;
}

/**
 * Sanitizes free-form score text input for mobile/desktop grading (0..100).
 * Keeps empty string as '' with numericScore = null so mobile Backspace works smoothly
 * without snapping back to 0 mid-edit.
 */
export function sanitizeScoreDraftInput(rawValue: string): ParsedScoreDraft {
  const digitsOnly = String(rawValue ?? '').replace(/[^\d]/g, '');
  if (!digitsOnly) {
    return { inputValue: '', numericScore: null };
  }
  const parsed = parseInt(digitsOnly, 10);
  if (!Number.isFinite(parsed)) {
    return { inputValue: '', numericScore: null };
  }
  const clamped = Math.max(0, Math.min(100, parsed));
  return {
    inputValue: String(clamped),
    numericScore: clamped,
  };
}

/**
 * Resolves a final numeric 0..100 score from a possibly-empty draft input string.
 */
export function resolveScoreFromDraft(
  draftInput: string | undefined,
  fallbackScore: number = 0
): number {
  const trimmed = String(draftInput ?? '').trim();
  if (!trimmed) {
    return Math.max(0, Math.min(100, Math.round(fallbackScore)));
  }
  const parsed = sanitizeScoreDraftInput(trimmed);
  if (parsed.numericScore === null) {
    return Math.max(0, Math.min(100, Math.round(fallbackScore)));
  }
  return parsed.numericScore;
}

export interface HeroQuestProgressItem {
  quest: ActiveQuest;
  realm?: Realm;
  status: GradeStatus;
  hasGradeRecord: boolean;
  isCompleted: boolean;
  isScheduledFuture: boolean;
  score: number | null;
  expEarned: number;
  feedback: string;
  gradedDate: string;
}

export interface HeroQuestProgressSummary {
  hero: HeroStudent;
  dungeon?: Dungeon;
  items: HeroQuestProgressItem[];
  totalQuests: number;
  tuntasCount: number;
  prosesCount: number;
  remidialCount: number;
  belumCount: number;
  unfinishedCount: number;
  completionPercent: number;
  averageScore: number;
  totalExp: number;
  isAllDone: boolean;
}

/**
 * Computes per-student quest completion progress across all assigned quests
 * (strictly respecting class targeting, per-class schedules, and student enrolled subjects).
 */
export function computeHeroesQuestProgress(params: {
  heroes: HeroStudent[];
  quests: ActiveQuest[];
  grades: ExpGrade[];
  dungeons: Dungeon[];
  realms: Realm[];
  realmId?: string;
  scopedDungeonIds?: Set<string> | null;
  now?: Date;
}): HeroQuestProgressSummary[] {
  const {
    heroes,
    quests,
    grades,
    dungeons,
    realms,
    realmId = 'all',
    scopedDungeonIds = null,
    now = new Date(),
  } = params;

  const sortedDungeons = sortDungeonsAlphabetically(dungeons);
  const dungeonOrder = new Map(sortedDungeons.map((d, idx) => [d.id, idx]));
  const dungeonMap = new Map(dungeons.map((d) => [d.id, d]));
  const realmMap = new Map(realms.map((r) => [r.id, r]));

  const sortedQuests = sortQuestsByCategory(
    quests.filter((q) => realmId === 'all' || q.realmId === realmId)
  );

  const gradeMap = new Map<string, ExpGrade>();
  grades.forEach((g) => {
    gradeMap.set(`${g.heroId}__${g.questId}`, g);
  });

  const activeHeroes = heroes
    .filter(
      (h) =>
        h.active && (!scopedDungeonIds || scopedDungeonIds.has(h.dungeonId))
    )
    .sort((a, b) => {
      const idxA = dungeonOrder.get(a.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      const idxB = dungeonOrder.get(b.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
    });

  return activeHeroes.map((hero) => {
    const allowedRealms = getHeroEffectiveRealmIds(hero, dungeons);
    const items: HeroQuestProgressItem[] = [];

    let tuntasCount = 0;
    let prosesCount = 0;
    let remidialCount = 0;
    let belumCount = 0;
    let scoredSum = 0;
    let scoredCount = 0;
    let totalExp = 0;

    sortedQuests.forEach((quest) => {
      const grade = gradeMap.get(`${hero.id}__${quest.id}`);
      if (!doesTargetMatchDungeon(quest.dungeonId, hero.dungeonId)) {
        return;
      }
      if (
        quest.scheduledAt === '__per_class__' &&
        !quest.classSchedules?.[hero.dungeonId] &&
        !grade
      ) {
        return;
      }
      if (
        quest.realmId &&
        allowedRealms &&
        !allowedRealms.includes(quest.realmId)
      ) {
        return;
      }

      const effSchedule = getEffectiveScheduleForClass(quest, hero.dungeonId);
      const isScheduledFuture = Boolean(
        effSchedule.releaseTime &&
          effSchedule.releaseTime.getTime() > now.getTime()
      );

      const status: GradeStatus = grade ? getEffectiveGradeStatus(grade) : 'belum';
      const hasScore = Boolean(grade && status !== 'belum');
      const score = hasScore
        ? Math.max(0, Math.min(100, Number(grade?.score ?? 0)))
        : null;
      const expEarned = hasScore ? Number(grade?.expEarned ?? 0) : 0;

      if (status === 'tuntas') tuntasCount++;
      else if (status === 'proses') prosesCount++;
      else if (status === 'remidial') remidialCount++;
      else belumCount++;

      if (score !== null) {
        scoredCount++;
        scoredSum += score;
      }
      totalExp += expEarned;

      items.push({
        quest,
        realm: realmMap.get(quest.realmId),
        status,
        hasGradeRecord: Boolean(grade),
        isCompleted: status === 'tuntas',
        isScheduledFuture,
        score,
        expEarned,
        feedback: grade?.feedback || '',
        gradedDate: grade?.gradedDate || '',
      });
    });

    const totalQuests = items.length;
    const unfinishedCount = belumCount + remidialCount + prosesCount;
    const completionPercent =
      totalQuests > 0
        ? Math.min(100, Math.round((tuntasCount / totalQuests) * 100))
        : 0;
    const averageScore = scoredCount > 0 ? Math.round(scoredSum / scoredCount) : 0;

    return {
      hero,
      dungeon: dungeonMap.get(hero.dungeonId),
      items,
      totalQuests,
      tuntasCount,
      prosesCount,
      remidialCount,
      belumCount,
      unfinishedCount,
      completionPercent,
      averageScore,
      totalExp,
      isAllDone: totalQuests > 0 && unfinishedCount === 0,
    };
  });
}



