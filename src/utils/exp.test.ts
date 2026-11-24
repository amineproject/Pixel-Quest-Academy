import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUEST_CATEGORIES,
  applyCollectiveGradePatch,
  buildAcademicPeriodLabel,
  calculateExpEarned,
  computeDashboardAnalytics,
  computeHeroesQuestProgress,
  doesTargetMatchDungeon,
  escapeCsvCell,
  formatChapterLabel,
  formatTargetDungeonsSummary,
  getGmLevelProgress,
  getGuildLeaderboard,
  getHeroAchievements,
  getHeroLevelProgress,
  getHeroTotalExp,
  getQuestCategoryMeta,
  getScopedHeroLeaderboardInputs,
  getSeasonLabel,
  getShortSeasonLabel,
  getWeeklyGuildLeaderboard,
  groupQuestsByCategory,
  isContentVisibleToHero,
  isQuestAssignedToHero,
  maskHeroName,
  normalizeQuestCategory,
  parseTargetDungeonIds,
  resolveScoreFromDraft,
  sanitizeScoreDraftInput,
  serializeTargetDungeonIds,
  sortQuestsByCategory,
  syncHeroesRealmsWithDungeonUpdate,
} from './exp';
import * as XLSX from 'xlsx';
import {
  loadOfflineContentSnapshot,
  saveOfflineContentSnapshot,
} from './offlineCache';
import {
  buildAssessmentColumnHeaders,
  buildGradesFromImportEntries,
  parseAssessmentExcelFile,
} from './exportRecap';
import {
  filterSemesterReportData,
  generateEraArchiveBundle,
  mergeEraArchiveIntoState,
  parseAndValidateEraArchive,
  pruneEraFromState,
} from './archiveAndReport';
import { AcademyState, ActiveQuest, Dungeon, ExpGrade, HeroStudent, Realm } from '../types/lms';

const sampleHeroes: HeroStudent[] = [
  {
    id: 'h1',
    name: 'Arga Pratama',
    username: 'arga',
    studentCode: '1001',
    dungeonId: 'd1',
    avatar: 'knight',
    heroClass: 'Knight',
    active: true,
    joinedDate: '2026-01-01',
    hasPin: true,
  },
  {
    id: 'h2',
    name: 'Bima Sakti',
    username: 'bima',
    studentCode: '1002',
    dungeonId: 'd1',
    avatar: 'mage',
    heroClass: 'Mage',
    active: true,
    joinedDate: '2026-01-01',
  },
  {
    id: 'h3',
    name: 'Citra Dewi',
    username: 'citra',
    studentCode: '1003',
    dungeonId: 'd1',
    avatar: 'ranger',
    heroClass: 'Ranger',
    active: false,
    joinedDate: '2026-01-01',
  },
  {
    id: 'h4',
    name: 'Alya Nadhifa',
    username: 'alya',
    studentCode: '1004',
    dungeonId: 'd1',
    avatar: 'alchemist',
    heroClass: 'Alchemist',
    active: true,
    joinedDate: '2026-01-01',
  },
];

const sampleQuests: ActiveQuest[] = [
  {
    id: 'q1',
    title: 'Quest 1',
    realmId: 'r1',
    dungeonId: 'd1',
    difficulty: 'Normal',
    maxExp: 100,
    deadline: '2026-01-10',
    instructions: 'Quest pertama',
  },
  {
    id: 'q2',
    title: 'Quest 2',
    realmId: 'r2',
    dungeonId: 'd1',
    difficulty: 'Elite',
    maxExp: 200,
    deadline: '2026-01-15',
    instructions: 'Quest kedua',
  },
  {
    id: 'q3',
    title: 'Quest 3',
    realmId: 'r1',
    dungeonId: 'd1',
    difficulty: 'Boss',
    maxExp: 300,
    deadline: '2026-01-20',
    instructions: 'Quest ketiga',
  },
  {
    id: 'q4',
    title: 'Quest 4',
    realmId: 'r2',
    dungeonId: 'd1',
    difficulty: 'Normal',
    maxExp: 100,
    deadline: '2026-01-25',
    instructions: 'Quest keempat',
  },
  {
    id: 'q5',
    title: 'Quest 5',
    realmId: 'r3',
    dungeonId: 'd1',
    difficulty: 'Normal',
    maxExp: 100,
    deadline: '2026-01-30',
    instructions: 'Quest kelima',
  },
];

describe('XP & Level Calculation', () => {
  it('calculates scaled EXP earned and clamps invalid score/maxExp inputs', () => {
    assert.equal(calculateExpEarned(85, 200), 170);
    assert.equal(calculateExpEarned(120, 150), 150);
    assert.equal(calculateExpEarned(-10, 150), 0);
    assert.equal(calculateExpEarned(90, -50), 0);
  });

  it('computes Hero level progress cleanly across 250 EXP thresholds', () => {
    const lv1 = getHeroLevelProgress(0);
    assert.equal(lv1.level, 1);
    assert.equal(lv1.expIntoLevel, 0);
    assert.equal(lv1.percent, 0);
    assert.equal(lv1.title, 'Novice Initiate');

    const lv2 = getHeroLevelProgress(375);
    assert.equal(lv2.level, 2);
    assert.equal(lv2.expIntoLevel, 125);
    assert.equal(lv2.percent, 50);
    assert.equal(lv2.title, 'Apprentice Scribe');

    const safeNegative = getHeroLevelProgress(-40);
    assert.equal(safeNegative.level, 1);
    assert.equal(safeNegative.totalExp, 0);
  });

  it('computes Game Master level progress based on managed academy items', () => {
    const gm = getGmLevelProgress({
      dungeonsCount: 2,
      heroesCount: 10,
      tomesCount: 4,
      questsCount: 3,
      gradesCount: 12,
      noticesCount: 2,
    });
    // 2*50 + 10*25 + 4*40 + 3*60 + 12*15 + 2*20 = 100+250+160+180+180+40 = 910 EXP
    // 910 / 300 => level 4, remainder 10
    assert.equal(gm.totalExp, 910);
    assert.equal(gm.level, 4);
    assert.equal(gm.expIntoLevel, 10);
    assert.equal(gm.title, 'Dungeon Tactician');
  });
});

describe('Guild Leaderboard & Achievements', () => {
  const sampleGrades: ExpGrade[] = [
    { id: 'g1', heroId: 'h1', questId: 'q1', realmId: 'r1', score: 90, expEarned: 90, status: 'tuntas', feedback: 'Bagus', gradedDate: '2026-01-09' },
    { id: 'g2', heroId: 'h1', questId: 'q2', realmId: 'r2', score: 85, expEarned: 170, status: 'tuntas', feedback: 'Bagus', gradedDate: '2026-01-14' },
    { id: 'g3', heroId: 'h1', questId: 'q3', realmId: 'r1', score: 80, expEarned: 240, status: 'tuntas', feedback: 'Bagus', gradedDate: '2026-01-19' },
    { id: 'g4', heroId: 'h1', questId: 'q4', realmId: 'r2', score: 90, expEarned: 90, status: 'tuntas', feedback: 'Bagus', gradedDate: '2026-01-24' },
    { id: 'g5', heroId: 'h1', questId: 'q5', realmId: 'r3', score: 95, expEarned: 95, status: 'tuntas', feedback: 'Mantap', gradedDate: '2026-01-29' },
    { id: 'g6', heroId: 'h2', questId: 'q1', realmId: 'r1', score: 100, expEarned: 100, status: 'tuntas', feedback: 'Bagus', gradedDate: '2026-01-10' },
    { id: 'g7', heroId: 'h4', questId: 'q1', realmId: 'r1', score: 100, expEarned: 100, status: 'tuntas', feedback: 'Bagus', gradedDate: '2026-01-10' },
    { id: 'g8', heroId: 'h3', questId: 'q3', realmId: 'r1', score: 100, expEarned: 999, status: 'tuntas', feedback: 'Nonaktif', gradedDate: '2026-01-10' },
  ];

  it('sums EXP per hero and ranks active heroes with deterministic tie-breakers', () => {
    assert.equal(getHeroTotalExp('h1', sampleGrades), 685);
    const board = getGuildLeaderboard(sampleHeroes, sampleGrades);

    // Inactive hero h3 excluded
    assert.equal(board.length, 3);
    assert.equal(board[0].hero.id, 'h1');
    assert.equal(board[0].rank, 1);
    assert.equal(board[0].totalExp, 685);
    assert.equal(board[0].level, 3);

    // Tie at 100 EXP & 1 tuntas: Alya (h4) precedes Bima (h2) alphabetically
    assert.equal(board[1].hero.id, 'h4');
    assert.equal(board[2].hero.id, 'h2');
  });

  it('unlocks First Quest, Dungeon Master, streak, and security badges accurately', () => {
    const summary = getHeroAchievements(sampleHeroes[0], sampleQuests, sampleGrades, []);
    const badgeMap = new Map(summary.badges.map((b) => [b.id, b]));

    assert.equal(summary.badges.length, 10);
    assert.equal(badgeMap.get('first_quest')?.title, 'First Quest');
    assert.equal(badgeMap.get('first_quest')?.unlocked, true);
    assert.equal(badgeMap.get('mission_master')?.title, 'Dungeon Master');
    assert.equal(badgeMap.get('mission_master')?.unlocked, true);
    assert.equal(badgeMap.get('pin_guardian')?.unlocked, true);
    assert.equal(summary.streakCount, 5);
  });
});

describe('Content Scheduling & Offline Sync Snapshot', () => {
  const originalLocalStorage = globalThis.localStorage;
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => (key in store ? store[key] : null),
        setItem: (key: string, val: string) => {
          store[key] = String(val);
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
    });
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalLocalStorage,
      });
    } else {
      delete (globalThis as Record<string, unknown>).localStorage;
    }
  });

  it('enforces per-class and future scheduled visibility rules', () => {
    const now = new Date(2026, 2, 10, 10, 0, 0);
    assert.equal(
      isContentVisibleToHero(
        { dungeonId: 'd1', scheduledAt: '2026-03-10T09:00' },
        'd1',
        now
      ),
      true
    );
    assert.equal(
      isContentVisibleToHero(
        { dungeonId: 'd1', scheduledAt: '2026-03-10T11:00' },
        'd1',
        now
      ),
      false
    );
    assert.equal(
      isContentVisibleToHero(
        { dungeonId: 'all', scheduledAt: '__per_class__', classSchedules: { d2: '2026-03-09T08:00' } },
        'd1',
        now
      ),
      false
    );
  });

  it('persists and restores offline Tomes, Quests, and Notices snapshots', () => {
    const saved = saveOfflineContentSnapshot({
      tomes: [
        {
          id: 't1',
          title: 'Aljabar Dasar',
          realmId: 'r1',
          chapter: '1',
          summary: 'Ringkasan',
          content: 'Isi materi',
          publishedDate: '2026-03-10',
        },
      ],
      quests: sampleQuests.slice(0, 1),
      notices: [
        {
          id: 'n1',
          title: 'Pengumuman Penting',
          description: 'Selamat belajar!',
          releaseDate: '2026-03-10',
          targetDungeonId: 'all',
          priority: 'Critical',
          author: 'Game Master',
        },
      ],
    });

    assert.ok(saved?.cachedAt);
    const loaded = loadOfflineContentSnapshot();
    assert.ok(loaded);
    assert.equal(loaded.tomes.length, 1);
    assert.equal(loaded.quests.length, 1);
    assert.equal(loaded.notices.length, 1);
    assert.equal(loaded.tomes[0].title, 'Aljabar Dasar');
  });
});

describe('Hall of Fame Weekly XP, Privacy Mask & CSV Export', () => {
  it('ranks active heroes by XP earned within last 7 days with totalExp tie-breaker', () => {
    const now = new Date(2026, 2, 10, 12, 0, 0); // 2026-03-10
    const grades: ExpGrade[] = [
      { id: 'w1', heroId: 'h1', questId: 'q1', realmId: 'r1', score: 90, expEarned: 90, status: 'tuntas', feedback: 'Ok', gradedDate: '2026-02-20' }, // old (>7 days)
      { id: 'w2', heroId: 'h2', questId: 'q1', realmId: 'r1', score: 80, expEarned: 160, status: 'tuntas', feedback: 'Ok', gradedDate: '2026-03-08' }, // recent (within 7 days)
      { id: 'w3', heroId: 'h4', questId: 'q1', realmId: 'r1', score: 100, expEarned: 200, status: 'tuntas', feedback: 'Ok', gradedDate: '2026-03-10' }, // today
    ];

    const ranked = getWeeklyGuildLeaderboard(sampleHeroes, grades, now);
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].hero.id, 'h4');
    assert.equal(ranked[0].weeklyExp, 200);
    assert.equal(ranked[1].hero.id, 'h2');
    assert.equal(ranked[1].weeklyExp, 160);
    assert.equal(ranked[2].hero.id, 'h1');
    assert.equal(ranked[2].weeklyExp, 0);
    assert.equal(ranked[2].totalExp, 90);
  });

  it('masks hero names for privacy mode and escapes CSV cells cleanly', () => {
    assert.equal(maskHeroName('Arga Pratama', 1), 'A*** (Hero #1)');
    assert.equal(maskHeroName('', 4), 'Hero #4');
    assert.equal(escapeCsvCell('Bima Sakti'), 'Bima Sakti');
    assert.equal(escapeCsvCell('Kelas, A "VII"'), '"Kelas, A ""VII"""');
  });

  it('scopes student leaderboard strictly to same class and enrolled Realms', () => {
    const classPeers: HeroStudent[] = [
      { ...sampleHeroes[0], dungeonId: 'd1', enrolledRealmIds: ['r1', 'r2'] },
      { ...sampleHeroes[1], dungeonId: 'd1', enrolledRealmIds: ['r1'] },
      { ...sampleHeroes[3], dungeonId: 'd1', enrolledRealmIds: ['r3'] }, // different mapel
      {
        id: 'h5',
        name: 'Damar Kelas Lain',
        username: 'damar',
        studentCode: '2001',
        dungeonId: 'd2', // different class
        avatar: 'knight',
        heroClass: 'Knight',
        active: true,
        joinedDate: '2026-01-01',
        enrolledRealmIds: ['r1'],
      },
    ];
    const grades: ExpGrade[] = [
      { id: 'x1', heroId: 'h1', questId: 'q1', realmId: 'r1', score: 90, expEarned: 90, status: 'tuntas', feedback: 'Ok', gradedDate: '2026-03-10' },
      { id: 'x2', heroId: 'h1', questId: 'q5', realmId: 'r3', score: 100, expEarned: 500, status: 'tuntas', feedback: 'Ok', gradedDate: '2026-03-10' },
      { id: 'x3', heroId: 'h5', questId: 'q1', realmId: 'r1', score: 100, expEarned: 999, status: 'tuntas', feedback: 'Ok', gradedDate: '2026-03-10' },
    ];

    const { scopedHeroes, scopedGrades } = getScopedHeroLeaderboardInputs(
      classPeers[0],
      classPeers,
      [],
      grades,
      'all'
    );

    // Only h1 & h2 (same class d1 + shared realm r1)
    assert.deepEqual(
      scopedHeroes.map((h) => h.id),
      ['h1', 'h2']
    );
    // Only grades for r1 and r2
    assert.deepEqual(
      scopedGrades.map((g) => g.id),
      ['x1']
    );
  });
});

describe('Academic Era & Season Formatting', () => {
  it('formats Season labels and Era + Season report periods consistently', () => {
    assert.equal(getSeasonLabel('ganjil'), 'Season 1 (Ganjil)');
    assert.equal(getSeasonLabel('genap'), 'Season 2 (Genap)');
    assert.equal(getShortSeasonLabel('ganjil'), 'Season 1 · Ganjil');
    assert.equal(getShortSeasonLabel('genap'), 'Season 2 · Genap');
    assert.equal(
      buildAcademicPeriodLabel('2026/2027', 'ganjil'),
      'Era 2026/2027 — Season 1 (Ganjil)'
    );
    assert.equal(
      buildAcademicPeriodLabel('2026/2027', 'all'),
      'Era 2026/2027 — Semua Season (1 Tahun)'
    );
  });
});

describe('Multi-Class Notice Targeting & Exclusion', () => {
  it('serializes and parses all, single, and multiple target dungeon IDs cleanly', () => {
    assert.deepEqual(parseTargetDungeonIds('all'), []);
    assert.deepEqual(parseTargetDungeonIds('d1'), ['d1']);
    assert.deepEqual(parseTargetDungeonIds('d1, d2, d1'), ['d1', 'd2']);
    assert.equal(serializeTargetDungeonIds([], 5), 'all');
    assert.equal(serializeTargetDungeonIds(['d1'], 5), 'd1');
    assert.equal(serializeTargetDungeonIds(['d1', 'd3'], 5), 'd1,d3');
    assert.equal(serializeTargetDungeonIds(['d1', 'd2', 'd3'], 3), 'all');
  });

  it('shows all-class notices to every class and hides targeted notices from unselected classes', () => {
    const now = new Date(2026, 2, 10, 10, 0, 0);
    const allClassNotice = { targetDungeonId: 'all', scheduledAt: '' };
    const multiClassNotice = { targetDungeonId: 'd1,d3', scheduledAt: '' };

    assert.equal(isContentVisibleToHero(allClassNotice, 'd1', now), true);
    assert.equal(isContentVisibleToHero(allClassNotice, 'd2', now), true);
    assert.equal(isContentVisibleToHero(allClassNotice, '', now), true);

    assert.equal(isContentVisibleToHero(multiClassNotice, 'd1', now), true);
    assert.equal(isContentVisibleToHero(multiClassNotice, 'd3', now), true);
    assert.equal(isContentVisibleToHero(multiClassNotice, 'd2', now), false);
    assert.equal(isContentVisibleToHero(multiClassNotice, '', now), false);
  });
});

describe('RPG Quest Categories', () => {
  it('supports Main, Party, Special, and Knowledge Quest metadata cleanly', () => {
    assert.equal(QUEST_CATEGORIES.length, 4);
    assert.equal(normalizeQuestCategory(undefined), 'Main');
    assert.equal(normalizeQuestCategory('Party'), 'Party');
    assert.equal(normalizeQuestCategory('  party  '), 'Party');
    assert.equal(normalizeQuestCategory('Party Quest'), 'Party');
    assert.equal(normalizeQuestCategory('Special'), 'Special');
    assert.equal(normalizeQuestCategory('SPECIAL QUEST'), 'Special');
    assert.equal(normalizeQuestCategory('Knowledge'), 'Knowledge');
    assert.equal(normalizeQuestCategory('knowledge quest'), 'Knowledge');
    assert.equal(getQuestCategoryMeta('Party').label, 'Party Quest');
    assert.equal(
      getQuestCategoryMeta('Knowledge').description,
      'Misi eksplorasi pengetahuan'
    );
  });

  it('sorts and groups quests strictly by Main, Party, Special, Knowledge order', () => {
    const unsorted: ActiveQuest[] = [
      { ...sampleQuests[0], id: 'qk', title: 'Quest 06: Riset', category: 'Knowledge' },
      { ...sampleQuests[0], id: 'qm2', title: 'Quest 02: Utama B', category: 'Main' },
      { ...sampleQuests[0], id: 'qs', title: 'Quest 05: Khusus', category: 'Special' },
      { ...sampleQuests[0], id: 'qp', title: 'Quest 03: Kelompok', category: 'Party' },
      { ...sampleQuests[0], id: 'qm1', title: 'Quest 01: Utama A', category: undefined },
    ];

    const sorted = sortQuestsByCategory(unsorted);
    assert.deepEqual(
      sorted.map((q) => q.id),
      ['qm1', 'qm2', 'qp', 'qs', 'qk']
    );

    const grouped = groupQuestsByCategory(unsorted);
    assert.deepEqual(
      grouped.map((g) => g.meta.label),
      ['Main Quest', 'Party Quest', 'Special Quest', 'Knowledge Quest']
    );
    assert.deepEqual(
      grouped[0].items.map((q) => q.id),
      ['qm1', 'qm2']
    );
  });
});

describe('Multi-Class Quest/Tome Targeting & Chapter Formatting', () => {
  const sampleDungeons: Dungeon[] = [
    { id: 'd1', name: 'Kelas VII-A', guildCode: 'VII-A', tier: 'Kelas VII', capacity: 32, description: 'Kelas 7A', realmIds: ['r1'] },
    { id: 'd2', name: 'Kelas VII-B', guildCode: 'VII-B', tier: 'Kelas VII', capacity: 32, description: 'Kelas 7B', realmIds: ['r1'] },
    { id: 'd3', name: 'Kelas VIII-A', guildCode: 'VIII-A', tier: 'Kelas VIII', capacity: 32, description: 'Kelas 8A', realmIds: ['r2'] },
  ];

  it('matches all, single, and comma-separated multi-class IDs accurately', () => {
    assert.equal(doesTargetMatchDungeon('all', 'd1'), true);
    assert.equal(doesTargetMatchDungeon('all', 'd3'), true);
    assert.equal(doesTargetMatchDungeon(undefined, 'd2'), true);

    assert.equal(doesTargetMatchDungeon('d1', 'd1'), true);
    assert.equal(doesTargetMatchDungeon('d1', 'd2'), false);

    assert.equal(doesTargetMatchDungeon('d1,d3', 'd1'), true);
    assert.equal(doesTargetMatchDungeon('d1,d3', 'd3'), true);
    assert.equal(doesTargetMatchDungeon('d1,d3', 'd2'), false);
    assert.equal(doesTargetMatchDungeon('d1,d3', ''), false);
  });

  it('formats multi-class target summaries and Quest Bab/Chapter/Teks labels cleanly', () => {
    assert.equal(formatTargetDungeonsSummary('all', sampleDungeons), 'Semua Kelas');
    assert.equal(formatTargetDungeonsSummary('d1', sampleDungeons), 'VII-A — Kelas VII-A');
    assert.equal(
      formatTargetDungeonsSummary('d1,d3', sampleDungeons),
      '2 Kelas (VII-A, VIII-A)'
    );

    assert.equal(formatChapterLabel(''), 'Bab 1');
    assert.equal(formatChapterLabel('2'), 'Bab 2');
    assert.equal(formatChapterLabel('Bab 3'), 'Bab 3');
    assert.equal(formatChapterLabel('Teks Prosedur'), 'Teks Prosedur');
  });
});

describe('computeDashboardAnalytics', () => {
  const analyticsDungeons: Dungeon[] = [
    { id: 'd1', name: 'Kelas VII-A', guildCode: 'VII-A', tier: 'Kelas VII', capacity: 32, description: 'Kelas 7A' },
    { id: 'd2', name: 'Kelas VII-B', guildCode: 'VII-B', tier: 'Kelas VII', capacity: 32, description: 'Kelas 7B' },
    { id: 'd3', name: 'Kelas VIII-A', guildCode: 'VIII-A', tier: 'Kelas VIII', capacity: 32, description: 'Kelas 8A' },
  ];

  const analyticsHeroes: HeroStudent[] = [
    { id: 'ha1', name: 'Siswa Satu', username: 's1', studentCode: '101', dungeonId: 'd1', avatar: 'knight', heroClass: 'Knight', active: true, joinedDate: '2026-01-01' },
    { id: 'ha2', name: 'Siswa Dua', username: 's2', studentCode: '102', dungeonId: 'd1', avatar: 'mage', heroClass: 'Mage', active: true, joinedDate: '2026-01-01' },
    { id: 'ha3', name: 'Siswa Tiga', username: 's3', studentCode: '103', dungeonId: 'd2', avatar: 'ranger', heroClass: 'Ranger', active: true, joinedDate: '2026-01-01' },
    { id: 'ha4', name: 'Siswa Nonaktif', username: 's4', studentCode: '104', dungeonId: 'd3', avatar: 'scholar', heroClass: 'Scholar', active: false, joinedDate: '2026-01-01' },
  ];

  it('computes status distribution, rank buckets, and per-class/mapel/category metrics accurately', () => {
    const realms: Realm[] = [
      { id: 'r1', name: 'Bahasa Indonesia', code: 'BIN', icon: 'book', accentColor: '#15803d', description: '' },
      { id: 'r2', name: 'IPA Terpadu', code: 'IPA', icon: 'flask', accentColor: '#0284c7', description: '' },
    ];
    const quests: ActiveQuest[] = [
      {
        id: 'q1',
        realmId: 'r1',
        dungeonId: 'd1',
        title: 'Quest Utama',
        instructions: '',
        deadline: '2026-12-01',
        maxExp: 100,
        difficulty: 'Normal',
        category: 'Main',
      },
      {
        id: 'q2',
        realmId: 'r2',
        dungeonId: 'all',
        title: 'Quest Kelompok',
        instructions: '',
        deadline: '2026-12-02',
        maxExp: 100,
        difficulty: 'Elite',
        category: 'Party',
      },
    ];
    const grades: ExpGrade[] = [
      { id: 'g1', heroId: 'ha1', questId: 'q1', realmId: 'r1', score: 95, expEarned: 95, status: 'tuntas', feedback: '', gradedDate: '2026-11-10' },
      { id: 'g2', heroId: 'ha2', questId: 'q1', realmId: 'r1', score: 60, expEarned: 60, status: 'remidial', feedback: '', gradedDate: '2026-11-10' },
      { id: 'g3', heroId: 'ha1', questId: 'q2', realmId: 'r2', score: 85, expEarned: 85, status: 'tuntas', feedback: '', gradedDate: '2026-11-11' },
      { id: 'g4', heroId: 'ha3', questId: 'q2', realmId: 'r2', score: 75, expEarned: 75, status: 'proses', feedback: '', gradedDate: '2026-11-11' },
    ];

    const result = computeDashboardAnalytics({
      dungeons: analyticsDungeons,
      heroes: analyticsHeroes,
      quests,
      grades,
      realms,
    });

    // Expected active slots:
    // q1 (d1 only): ha1, ha2 => 2 slots (1 tuntas, 1 remidial)
    // q2 (all): ha1 (d1), ha2 (d1), ha3 (d2) => 3 slots (1 tuntas, 1 belum, 1 proses)
    // ha4 is inactive so excluded
    // Total = 5 slots: tuntas=2, proses=1, remidial=1, belum=1
    assert.equal(result.status.totalSlots, 5);
    assert.equal(result.status.tuntas, 2);
    assert.equal(result.status.proses, 1);
    assert.equal(result.status.remidial, 1);
    assert.equal(result.status.belum, 1);
    assert.equal(result.status.completionPercent, 40);
    assert.equal(result.status.gradedCount, 4);
    assert.equal(result.status.averageScore, 79); // (95+60+85+75)/4 = 78.75 -> 79

    const rankMap = new Map(result.ranks.map((r) => [r.rank, r.count]));
    assert.equal(rankMap.get('S'), 1); // 95
    assert.equal(rankMap.get('A'), 1); // 85
    assert.equal(rankMap.get('B'), 1); // 75
    assert.equal(rankMap.get('C'), 1); // 60
    assert.equal(rankMap.get('D'), 0);

    // Filtered by realm r1
    const r1Only = computeDashboardAnalytics({
      dungeons: analyticsDungeons,
      heroes: analyticsHeroes,
      quests,
      grades,
      realms,
      selectedRealmId: 'r1',
    });
    assert.equal(r1Only.status.totalSlots, 2);
    assert.equal(r1Only.status.tuntas, 1);
    assert.equal(r1Only.status.remidial, 1);
    assert.equal(r1Only.byRealm.length, 1);
  });
});

describe('applyCollectiveGradePatch', () => {
  it('applies collective status, score, and teacher notes flexibly without clobbering untouched fields', () => {
    const baseScores = { h1: 90, h2: 65, h3: 80 };
    const baseStatuses = { h1: 'tuntas', h2: 'remidial', h3: 'proses' } as const;
    const baseNotes = { h1: 'Bagus', h2: 'Perlu latihan', h3: '' };

    // 1. Apply collective note only (keep scores & statuses)
    const noteOnly = applyCollectiveGradePatch({
      targetHeroIds: ['h1', 'h3'],
      currentScores: baseScores,
      currentStatuses: { ...baseStatuses },
      currentNotes: baseNotes,
      patch: { scoreInput: '', statusInput: 'keep', noteInput: 'Sudah dicek GM' },
    });
    assert.deepEqual(noteOnly.nextScores, { h1: 90, h2: 65, h3: 80 });
    assert.deepEqual(noteOnly.nextStatuses, { h1: 'tuntas', h2: 'remidial', h3: 'proses' });
    assert.deepEqual(noteOnly.nextNotes, {
      h1: 'Sudah dicek GM',
      h2: 'Perlu latihan',
      h3: 'Sudah dicek GM',
    });

    // 2. Apply collective status 'belum' -> forces score 0 for targeted heroes
    const markBelum = applyCollectiveGradePatch({
      targetHeroIds: ['h2'],
      currentScores: baseScores,
      currentStatuses: { ...baseStatuses },
      currentNotes: baseNotes,
      patch: { scoreInput: '', statusInput: 'belum', noteInput: 'Belum mengumpulkan' },
    });
    assert.equal(markBelum.nextScores.h2, 0);
    assert.equal(markBelum.nextStatuses.h2, 'belum');
    assert.equal(markBelum.nextNotes.h2, 'Belum mengumpulkan');
    assert.equal(markBelum.nextScores.h1, 90);

    // 3. Apply score + explicit status ('proses') + clearNote
    const scoreAndStatus = applyCollectiveGradePatch({
      targetHeroIds: ['h1', 'h2'],
      currentScores: baseScores,
      currentStatuses: { ...baseStatuses },
      currentNotes: baseNotes,
      patch: { scoreInput: '88', statusInput: 'proses', noteInput: '', clearNote: true },
    });
    assert.equal(scoreAndStatus.nextScores.h1, 88);
    assert.equal(scoreAndStatus.nextStatuses.h1, 'proses');
    assert.equal(scoreAndStatus.nextNotes.h1, '');
    assert.equal(scoreAndStatus.nextScores.h2, 88);
    assert.equal(scoreAndStatus.nextStatuses.h2, 'proses');
    assert.equal(scoreAndStatus.nextNotes.h2, '');
  });
});

describe('Excel Assessment Export & Import Disambiguation', () => {
  it('disambiguates duplicate quest titles in headers and resolves per-class quests on upload without clobbering feedback', async () => {
    const dungeons: Dungeon[] = [
      { id: 'd_e', name: 'The Scroll of Lexicon', guildCode: 'VIII-E', tier: 'Kelas VIII', capacity: 32, description: '' },
      { id: 'd_g', name: 'The Hall of Rhetoric', guildCode: 'VIII-G', tier: 'Kelas VIII', capacity: 32, description: '' },
    ];
    const heroes: HeroStudent[] = [
      { id: 'h_g1', name: 'Adinda Putri', username: 'adinda', studentCode: '7039', dungeonId: 'd_g', avatar: 'knight', heroClass: 'Knight', active: true, joinedDate: '2026-01-01' },
    ];
    const quests: ActiveQuest[] = [
      { id: 'q5_e', realmId: 'r1', dungeonId: 'd_e', title: 'Quest 05: Master Promosi', instructions: '', deadline: '2026-12-01', maxExp: 200, difficulty: 'Normal' },
      { id: 'q5_g', realmId: 'r1', dungeonId: 'd_g', title: 'Quest 05: Master Promosi', instructions: '', deadline: '2026-12-01', maxExp: 200, difficulty: 'Normal' },
    ];
    const existingGrades: ExpGrade[] = [
      { id: 'grd-1', heroId: 'h_g1', questId: 'q5_g', realmId: 'r1', score: 75, expEarned: 150, status: 'tuntas', feedback: 'Pertahankan!', gradedDate: '2026-11-10' },
    ];

    // 1. Verify header disambiguation
    const headers = buildAssessmentColumnHeaders(quests, dungeons);
    assert.deepEqual(headers, [
      'Quest 05: Master Promosi [VIII-E]',
      'Quest 05: Master Promosi [VIII-G]',
    ]);

    // 2. Simulate uploading an Excel sheet with duplicate "Quest 05: Master Promosi" column headers
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Quest 05: Master Promosi', 'Quest 05: Master Promosi'],
      [1, '7039', 'Adinda Putri', 'VIII-G', '', 92],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Tabel_Penilaian');
    const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const mockFile = new File([arrayBuffer], 'test-penilaian.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const mockState: AcademyState = {
      gmProfile: { name: 'GM', title: 'Guru', specialty: 'BIN', avatar: 'guild_master' },
      settings: { theme: 'sunny_quest', crtScanlines: false, soundEnabled: false, academicTerm: '2026/2027' },
      dungeons,
      heroes,
      notices: [],
      realms: [{ id: 'r1', name: 'Bahasa Indonesia', code: 'BIN', icon: 'book', accentColor: '#15803d', description: '' }],
      tomes: [],
      quests,
      grades: existingGrades,
    };

    const parsed = await parseAssessmentExcelFile(mockFile, mockState);
    assert.equal(parsed.matchedQuestColumns.length, 1);
    assert.equal(parsed.entries.length, 1);
    assert.equal(parsed.entries[0].questId, 'q5_g');
    assert.equal(parsed.entries[0].score, 92);

    // 3. Re-importing updates existing grade id & score while preserving feedback
    const builtGrades = buildGradesFromImportEntries(parsed.entries, existingGrades);
    assert.equal(builtGrades[0].id, 'grd-1');
    assert.equal(builtGrades[0].score, 92);
    assert.equal(builtGrades[0].feedback, 'Pertahankan!');
  });
});

describe('Strict Student Subject & Class Quest Isolation', () => {
  const realms: Realm[] = [
    { id: 'rlm-inf', name: 'Informatika', code: 'INF', icon: 'bolt', accentColor: '#0284c7', description: '' },
    { id: 'rlm-bin', name: 'Bahasa Indonesia', code: 'BIN', icon: 'book', accentColor: '#15803d', description: '' },
  ];

  const dungeons: Dungeon[] = [
    { id: 'd-8a', name: 'Kelas VIII-A', guildCode: 'VIII-A', tier: 'Kelas VIII', capacity: 32, description: '', realmIds: ['rlm-inf', 'rlm-bin'] },
    { id: 'd-8b', name: 'Kelas VIII-B', guildCode: 'VIII-B', tier: 'Kelas VIII', capacity: 32, description: '', realmIds: ['rlm-bin'] },
  ];

  const heroInformatika: HeroStudent = {
    id: 'h-inf',
    name: 'Siswa Informatika',
    username: 'sinf1',
    studentCode: '8001',
    dungeonId: 'd-8a',
    avatar: 'knight',
    heroClass: 'Knight',
    active: true,
    joinedDate: '2026-01-01',
    enrolledRealmIds: ['rlm-inf'],
  };

  const heroBahasa: HeroStudent = {
    id: 'h-bin',
    name: 'Siswa Bahasa',
    username: 'sbin1',
    studentCode: '8002',
    dungeonId: 'd-8a',
    avatar: 'scholar',
    heroClass: 'Scholar',
    active: true,
    joinedDate: '2026-01-01',
    enrolledRealmIds: ['rlm-bin'],
  };

  const qInfAll: ActiveQuest = {
    id: 'q-inf',
    realmId: 'rlm-inf',
    dungeonId: 'all',
    title: 'Tugas Algoritma',
    instructions: '',
    deadline: '2026-12-10',
    maxExp: 200,
    difficulty: 'Normal',
  };

  const qBinAll: ActiveQuest = {
    id: 'q-bin',
    realmId: 'rlm-bin',
    dungeonId: 'all',
    title: 'Tugas Teks Deskripsi',
    instructions: '',
    deadline: '2026-12-10',
    maxExp: 200,
    difficulty: 'Normal',
  };

  const qInfOtherClass: ActiveQuest = {
    id: 'q-inf-8b',
    realmId: 'rlm-inf',
    dungeonId: 'd-8b',
    title: 'Tugas Khusus 8B',
    instructions: '',
    deadline: '2026-12-10',
    maxExp: 200,
    difficulty: 'Normal',
  };

  it('isolates quests strictly to each student enrolled subject even if stale grades exist', () => {
    // Student enrolled in Informatika sees Informatika only, never Bahasa Indonesia (even with hasGrade: true)
    assert.equal(isQuestAssignedToHero(qInfAll, heroInformatika, dungeons), true);
    assert.equal(isQuestAssignedToHero(qBinAll, heroInformatika, dungeons), false);
    assert.equal(isQuestAssignedToHero(qBinAll, heroInformatika, dungeons, { hasGrade: true }), false);
    assert.equal(isQuestAssignedToHero(qInfOtherClass, heroInformatika, dungeons, { hasGrade: true }), false);

    // Vice versa: student enrolled in Bahasa Indonesia sees Bahasa Indonesia only, never Informatika
    assert.equal(isQuestAssignedToHero(qBinAll, heroBahasa, dungeons), true);
    assert.equal(isQuestAssignedToHero(qInfAll, heroBahasa, dungeons), false);
    assert.equal(isQuestAssignedToHero(qInfAll, heroBahasa, dungeons, { hasGrade: true }), false);
  });

  it('syncs hero enrolledRealmIds when a class removes a subject', () => {
    const prevDungeon: Dungeon = { ...dungeons[0], realmIds: ['rlm-inf', 'rlm-bin'] };
    const nextDungeon: Dungeon = { ...dungeons[0], realmIds: ['rlm-inf'] };
    const heroes: HeroStudent[] = [
      { ...heroInformatika, id: 'h-both', enrolledRealmIds: ['rlm-inf', 'rlm-bin'] },
      { ...heroInformatika, id: 'h-only-inf', enrolledRealmIds: ['rlm-inf'] },
    ];

    const { nextHeroes, changedHeroes } = syncHeroesRealmsWithDungeonUpdate(
      heroes,
      prevDungeon,
      nextDungeon
    );

    assert.equal(changedHeroes.length, 1);
    assert.equal(changedHeroes[0].id, 'h-both');
    assert.deepEqual(nextHeroes[0].enrolledRealmIds, ['rlm-inf']);
    assert.deepEqual(nextHeroes[1].enrolledRealmIds, ['rlm-inf']);
  });

  it('skips Excel grade import entries for subjects a student is not enrolled in', async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Tugas Algoritma', 'Tugas Teks Deskripsi'],
      [1, '8001', 'Siswa Informatika', 'VIII-A', 90, 85],
      [2, '8002', 'Siswa Bahasa', 'VIII-A', 75, 95],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Tabel_Penilaian');
    const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const mockFile = new File([arrayBuffer], 'mixed-subjects.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const mockState: AcademyState = {
      gmProfile: { name: 'GM', title: 'Guru', specialty: 'Akademik', avatar: 'guild_master' },
      settings: { theme: 'sunny_quest', crtScanlines: false, soundEnabled: false, academicTerm: '2026/2027' },
      dungeons,
      heroes: [heroInformatika, heroBahasa],
      notices: [],
      realms,
      tomes: [],
      quests: [qInfAll, qBinAll],
      grades: [],
    };

    const parsed = await parseAssessmentExcelFile(mockFile, mockState);
    assert.equal(parsed.entries.length, 2);
    assert.deepEqual(
      parsed.entries.map((e) => ({ heroId: e.heroId, questId: e.questId, score: e.score })),
      [
        { heroId: 'h-inf', questId: 'q-inf', score: 90 },
        { heroId: 'h-bin', questId: 'q-bin', score: 95 },
      ]
    );
  });
});

describe('Mobile/Desktop Score Draft Input Sanitization', () => {
  it('allows clearing the input via backspace without snapping back to 0 mid-edit', () => {
    assert.deepEqual(sanitizeScoreDraftInput(''), {
      inputValue: '',
      numericScore: null,
    });
    assert.deepEqual(sanitizeScoreDraftInput('abc'), {
      inputValue: '',
      numericScore: null,
    });
  });

  it('strips non-numeric characters, trims leading zeros, and clamps between 0 and 100', () => {
    assert.deepEqual(sanitizeScoreDraftInput('0'), {
      inputValue: '0',
      numericScore: 0,
    });
    assert.deepEqual(sanitizeScoreDraftInput('085'), {
      inputValue: '85',
      numericScore: 85,
    });
    assert.deepEqual(sanitizeScoreDraftInput('92a'), {
      inputValue: '92',
      numericScore: 92,
    });
    assert.deepEqual(sanitizeScoreDraftInput('105'), {
      inputValue: '100',
      numericScore: 100,
    });
  });

  it('resolves empty draft back to fallback score and clamps valid drafts', () => {
    assert.equal(resolveScoreFromDraft('', 80), 80);
    assert.equal(resolveScoreFromDraft(undefined, 75), 75);
    assert.equal(resolveScoreFromDraft('94', 80), 94);
    assert.equal(resolveScoreFromDraft('120', 80), 100);
  });
});

describe('Semester Report & Academic Year Archive Lifecycle', () => {
  const sampleState: AcademyState = {
    gmProfile: {
      name: 'Amin Wayudi, S.Pd.',
      title: 'Guild Master',
      specialty: 'Informatika & Bahasa',
      avatar: 'guild_master',
    },
    settings: {
      theme: 'sunny_quest',
      crtScanlines: false,
      soundEnabled: false,
      academicTerm: 'Era 2026/2027 — Season 1 (Ganjil)',
      activeSeason: 'ganjil',
    },
    academicYears: [
      {
        id: 'era-2025-2026',
        name: '2025/2026',
        startDate: '2025-07-14',
        endDate: '2026-06-20',
        isActive: false,
      },
      {
        id: 'era-2026-2027',
        name: '2026/2027',
        startDate: '2026-07-13',
        endDate: '2027-06-25',
        isActive: true,
      },
    ],
    realms: [
      {
        id: 'rlm-inf',
        name: 'Informatika',
        code: 'INF-8',
        icon: 'bolt',
        accentColor: '#3B82F6',
        description: '',
      },
      {
        id: 'rlm-bin',
        name: 'Bahasa Indonesia',
        code: 'BIN-8',
        icon: 'flask',
        accentColor: '#10B981',
        description: '',
      },
    ],
    dungeons: [
      {
        id: 'd-2025-8a',
        name: 'Kelas VIII-A (2025)',
        tier: 'Kelas VIII',
        guildCode: 'VIII-A-25',
        capacity: 30,
        description: '',
        realmIds: ['rlm-inf'],
        academicYearId: 'era-2025-2026',
      },
      {
        id: 'd-2026-8a',
        name: 'Kelas VIII-A (2026)',
        tier: 'Kelas VIII',
        guildCode: 'VIII-A-26',
        capacity: 30,
        description: '',
        realmIds: ['rlm-inf', 'rlm-bin'],
        academicYearId: 'era-2026-2027',
      },
    ],
    heroes: [
      {
        id: 'h-2025-1',
        name: 'Alumni 2025',
        username: 'alm25',
        studentCode: '25001',
        dungeonId: 'd-2025-8a',
        avatar: 'knight',
        heroClass: 'Knight',
        active: true,
        joinedDate: '2025-07-15',
        enrolledRealmIds: ['rlm-inf'],
        pin: '1234',
      },
      {
        id: 'h-2026-1',
        name: 'Siswa Aktif 2026',
        username: 'sis26',
        studentCode: '26001',
        dungeonId: 'd-2026-8a',
        avatar: 'mage',
        heroClass: 'Mage',
        active: true,
        joinedDate: '2026-07-15',
        enrolledRealmIds: ['rlm-inf'],
      },
    ],
    tomes: [
      {
        id: 'tm-2025-gjl',
        realmId: 'rlm-inf',
        title: 'Algoritma Dasar 2025',
        chapter: 'Bab 1',
        summary: 'Materi ganjil 2025',
        content: 'Isi materi',
        publishedDate: '2025-08-10',
        academicYearId: 'era-2025-2026',
        season: 'ganjil',
      },
      {
        id: 'tm-2025-gnp',
        realmId: 'rlm-inf',
        title: 'Jaringan Komputer 2025',
        chapter: 'Bab 4',
        summary: 'Materi genap 2025',
        content: 'Isi materi',
        publishedDate: '2026-02-10',
        academicYearId: 'era-2025-2026',
        season: 'genap',
      },
      {
        id: 'tm-umum',
        realmId: 'rlm-inf',
        title: 'Panduan Umum Literasi Digital',
        chapter: 'Bab 0',
        summary: 'Materi lintas tahun',
        content: 'Isi panduan',
        publishedDate: '2026-07-15',
      },
    ],
    quests: [
      {
        id: 'q-2025-gjl',
        realmId: 'rlm-inf',
        dungeonId: 'd-2025-8a',
        title: 'Tugas Flowchart 2025',
        instructions: 'Buat flowchart',
        deadline: '2025-09-01',
        maxExp: 200,
        difficulty: 'Normal',
        category: 'Main',
        academicYearId: 'era-2025-2026',
        season: 'ganjil',
      },
      {
        id: 'q-2025-gnp',
        realmId: 'rlm-inf',
        dungeonId: 'd-2025-8a',
        title: 'Tugas Topologi 2025',
        instructions: 'Gambar topologi',
        deadline: '2026-03-01',
        maxExp: 250,
        difficulty: 'Elite',
        category: 'Main',
        academicYearId: 'era-2025-2026',
        season: 'genap',
      },
      {
        id: 'q-2026-gjl',
        realmId: 'rlm-inf',
        dungeonId: 'd-2026-8a',
        title: 'Tugas Python 2026',
        instructions: 'Tulis kode',
        deadline: '2026-09-10',
        maxExp: 200,
        difficulty: 'Normal',
        category: 'Main',
        academicYearId: 'era-2026-2027',
        season: 'ganjil',
      },
    ],
    notices: [
      {
        id: 'n-2025-1',
        title: 'Pengumuman 2025',
        description: 'Info 2025',
        priority: 'Medium',
        targetDungeonId: 'd-2025-8a',
        releaseDate: '2025-08-01',
        author: 'GM',
        academicYearId: 'era-2025-2026',
        season: 'ganjil',
      },
    ],
    grades: [
      {
        id: 'g-2025-1',
        heroId: 'h-2025-1',
        questId: 'q-2025-gjl',
        realmId: 'rlm-inf',
        score: 90,
        expEarned: 180,
        status: 'tuntas',
        feedback: 'Mantap',
        gradedDate: '2025-09-02',
      },
      {
        id: 'g-2026-1',
        heroId: 'h-2026-1',
        questId: 'q-2026-gjl',
        realmId: 'rlm-inf',
        score: 88,
        expEarned: 176,
        status: 'tuntas',
        feedback: 'Bagus',
        gradedDate: '2026-09-11',
      },
    ],
  };

  it('filters semester report accurately across Era, Season, Class, and Subject', () => {
    const repGanjil2025 = filterSemesterReportData(sampleState, {
      academicYearId: 'era-2025-2026',
      season: 'ganjil',
      dungeonId: 'all',
      realmId: 'all',
      includeGeneralTomes: false,
    });

    assert.equal(repGanjil2025.eraName, '2025/2026');
    assert.deepEqual(
      repGanjil2025.tomes.map((t) => t.tome.id),
      ['tm-2025-gjl']
    );
    assert.deepEqual(
      repGanjil2025.quests.map((q) => q.quest.id),
      ['q-2025-gjl']
    );
    assert.equal(repGanjil2025.studentRows.length, 1);
    assert.equal(repGanjil2025.studentRows[0].hero.id, 'h-2025-1');
    assert.equal(repGanjil2025.studentRows[0].avgScore, 90);
    assert.equal(repGanjil2025.summary.completionPercent, 100);

    const repFull2025 = filterSemesterReportData(sampleState, {
      academicYearId: 'era-2025-2026',
      season: 'all',
      dungeonId: 'd-2025-8a',
      realmId: 'rlm-inf',
      includeGeneralTomes: true,
    });
    assert.equal(repFull2025.quests.length, 2);
    assert.ok(repFull2025.tomes.some((t) => t.tome.id === 'tm-2025-gnp'));
    assert.ok(repFull2025.tomes.some((t) => t.tome.id === 'tm-umum'));
  });

  it('prevents pruning active Era, then cleanly prunes and restores an inactive Era via JSON bundle', () => {
    const blocked = pruneEraFromState(sampleState, 'era-2026-2027');
    assert.equal(blocked.ok, false);

    // 1. Generate & validate JSON archive
    const bundle = generateEraArchiveBundle(sampleState, 'era-2025-2026');
    assert.ok(bundle);
    assert.equal(bundle.counts.dungeons, 1);
    assert.equal(bundle.counts.quests, 2);
    assert.equal(bundle.counts.grades, 1);
    // PIN is stripped from archive export for privacy
    assert.equal(bundle.heroesSnapshot[0].pin, undefined);

    const parsed = parseAndValidateEraArchive(JSON.stringify(bundle));
    assert.equal(parsed.ok, true);
    if (!('bundle' in parsed)) return;

    // 2. Prune inactive 2025/2026 Era
    const pruned = pruneEraFromState(sampleState, 'era-2025-2026', {
      pruneHeroesInEra: true,
    });
    assert.equal(pruned.ok, true);
    assert.equal(pruned.nextState.academicYears?.length, 1);
    assert.equal(pruned.nextState.dungeons.length, 1);
    assert.equal(pruned.nextState.quests.length, 1);
    assert.equal(pruned.nextState.grades.length, 1);
    // Shared untagged tome remains preserved; active hero remains untouched
    assert.ok(pruned.nextState.tomes.some((t) => t.id === 'tm-umum'));
    assert.deepEqual(
      pruned.nextState.heroes.map((h) => h.id),
      ['h-2026-1']
    );

    // 3. Re-upload & restore without duplicating active data or changing active Era
    const restored = mergeEraArchiveIntoState(pruned.nextState, parsed.bundle);
    assert.equal(restored.summary.eraAdded, true);
    assert.equal(restored.summary.addedDungeons, 1);
    assert.equal(restored.summary.addedQuests, 2);
    assert.equal(restored.summary.addedGrades, 1);
    assert.equal(
      restored.nextState.academicYears?.find((y) => y.id === 'era-2026-2027')?.isActive,
      true
    );
    assert.equal(
      restored.nextState.academicYears?.find((y) => y.id === 'era-2025-2026')?.isActive,
      false
    );

    // 4. Re-importing same bundle is idempotent
    const secondImport = mergeEraArchiveIntoState(restored.nextState, parsed.bundle);
    assert.equal(secondImport.summary.addedDungeons, 0);
    assert.equal(secondImport.summary.addedQuests, 0);
    assert.equal(secondImport.summary.addedGrades, 0);
  });
});

describe('Per-Student Quest Completion Progress (Menu Penilaian)', () => {
  const progDungeons: Dungeon[] = [
    {
      id: 'd-8a',
      name: 'Kelas VIII-A',
      tier: 'Kelas VIII',
      guildCode: '8A',
      capacity: 30,
      description: '',
      realmIds: ['r-inf', 'r-bin'],
    },
    {
      id: 'd-8b',
      name: 'Kelas VIII-B',
      tier: 'Kelas VIII',
      guildCode: '8B',
      capacity: 30,
      description: '',
      realmIds: ['r-inf'],
    },
  ];
  const progRealms: Realm[] = [
    { id: 'r-inf', name: 'Informatika', code: 'INF', icon: 'bolt', accentColor: '#2563eb', description: '' },
    { id: 'r-bin', name: 'Bahasa Indonesia', code: 'BIN', icon: 'book', accentColor: '#d97706', description: '' },
  ];
  const progHeroes: HeroStudent[] = [
    {
      id: 'st-1',
      name: 'Rafi Akbar',
      username: 'rafi',
      studentCode: '2001',
      dungeonId: 'd-8a',
      avatar: 'knight',
      heroClass: 'Knight',
      active: true,
      joinedDate: '2026-07-01',
    },
    {
      id: 'st-2',
      name: 'Sinta Kirana',
      username: 'sinta',
      studentCode: '2002',
      dungeonId: 'd-8a',
      avatar: 'mage',
      heroClass: 'Mage',
      active: true,
      joinedDate: '2026-07-01',
      enrolledRealmIds: ['r-inf'],
    },
    {
      id: 'st-3',
      name: 'Budi Nonaktif',
      username: 'budi',
      studentCode: '2003',
      dungeonId: 'd-8a',
      avatar: 'ranger',
      heroClass: 'Ranger',
      active: false,
      joinedDate: '2026-07-01',
    },
  ];
  const progQuests: ActiveQuest[] = [
    {
      id: 'pq-1',
      realmId: 'r-inf',
      dungeonId: 'all',
      title: 'Tugas Algoritma',
      instructions: 'Kerjakan',
      deadline: '2026-08-10',
      maxExp: 100,
      difficulty: 'Normal',
      category: 'Main',
    },
    {
      id: 'pq-2',
      realmId: 'r-inf',
      dungeonId: 'd-8a',
      title: 'Praktik Flowchart',
      instructions: 'Buat bagan',
      deadline: '2026-08-15',
      maxExp: 100,
      difficulty: 'Elite',
      category: 'Party',
    },
    {
      id: 'pq-3',
      realmId: 'r-bin',
      dungeonId: 'all',
      title: 'Teks LHO',
      instructions: 'Tulis laporan',
      deadline: '2026-08-20',
      maxExp: 100,
      difficulty: 'Normal',
      category: 'Main',
    },
    {
      id: 'pq-4-perclass-other',
      realmId: 'r-inf',
      dungeonId: 'all',
      title: 'Khusus 8B Per-Kelas',
      instructions: 'Hanya 8B',
      deadline: '2026-08-25',
      maxExp: 100,
      difficulty: 'Normal',
      category: 'Special',
      scheduledAt: '__per_class__',
      classSchedules: { 'd-8b': '2026-08-01T08:00' },
    },
  ];
  const progGrades: ExpGrade[] = [
    {
      id: 'gr-1',
      heroId: 'st-1',
      questId: 'pq-1',
      realmId: 'r-inf',
      score: 90,
      expEarned: 90,
      status: 'tuntas',
      feedback: 'Bagus',
      gradedDate: '2026-08-05',
    },
    {
      id: 'gr-2',
      heroId: 'st-1',
      questId: 'pq-2',
      realmId: 'r-inf',
      score: 55,
      expEarned: 55,
      status: 'remidial',
      feedback: 'Perbaiki cabang',
      gradedDate: '2026-08-06',
    },
    {
      id: 'gr-3',
      heroId: 'st-2',
      questId: 'pq-1',
      realmId: 'r-inf',
      score: 85,
      expEarned: 85,
      status: 'tuntas',
      feedback: '',
      gradedDate: '2026-08-05',
    },
    {
      id: 'gr-4',
      heroId: 'st-2',
      questId: 'pq-2',
      realmId: 'r-inf',
      score: 95,
      expEarned: 95,
      status: 'tuntas',
      feedback: '',
      gradedDate: '2026-08-06',
    },
  ];

  it('computes completed vs unfinished tasks per student accurately across subjects and classes', () => {
    const allSummary = computeHeroesQuestProgress({
      heroes: progHeroes,
      quests: progQuests,
      grades: progGrades,
      dungeons: progDungeons,
      realms: progRealms,
      now: new Date('2026-08-08T10:00:00'),
    });

    // Inactive student Budi excluded
    assert.equal(allSummary.length, 2);

    const rafi = allSummary.find((s) => s.hero.id === 'st-1')!;
    // Rafi gets pq-1 (tuntas), pq-2 (remidial), pq-3 (ungraded -> belum); excludes pq-4 (per-class 8B only)
    assert.equal(rafi.totalQuests, 3);
    assert.equal(rafi.tuntasCount, 1);
    assert.equal(rafi.remidialCount, 1);
    assert.equal(rafi.belumCount, 1);
    assert.equal(rafi.unfinishedCount, 2);
    assert.equal(rafi.completionPercent, 33);
    assert.equal(rafi.isAllDone, false);

    const sinta = allSummary.find((s) => s.hero.id === 'st-2')!;
    // Sinta only enrolled in r-inf, so pq-3 (r-bin) is excluded -> 2/2 tuntas (100%)
    assert.equal(sinta.totalQuests, 2);
    assert.equal(sinta.tuntasCount, 2);
    assert.equal(sinta.unfinishedCount, 0);
    assert.equal(sinta.completionPercent, 100);
    assert.equal(sinta.isAllDone, true);

    // Filter strictly to r-inf
    const infOnly = computeHeroesQuestProgress({
      heroes: progHeroes,
      quests: progQuests,
      grades: progGrades,
      dungeons: progDungeons,
      realms: progRealms,
      realmId: 'r-inf',
      now: new Date('2026-08-08T10:00:00'),
    });
    const rafiInf = infOnly.find((s) => s.hero.id === 'st-1')!;
    assert.equal(rafiInf.totalQuests, 2);
    assert.equal(rafiInf.belumCount, 0);
    assert.equal(rafiInf.remidialCount, 1);
  });
});





