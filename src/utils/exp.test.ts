import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpEarned,
  escapeCsvCell,
  getGmLevelProgress,
  getGuildLeaderboard,
  getHeroAchievements,
  getHeroLevelProgress,
  getHeroTotalExp,
  getScopedHeroLeaderboardInputs,
  getWeeklyGuildLeaderboard,
  isContentVisibleToHero,
  maskHeroName,
} from './exp';
import {
  loadOfflineContentSnapshot,
  saveOfflineContentSnapshot,
} from './offlineCache';
import { ActiveQuest, ExpGrade, HeroStudent } from '../types/lms';

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

