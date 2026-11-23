import * as XLSX from 'xlsx';
import {
  AcademicYear,
  AcademyState,
  ActiveQuest,
  AncientTome,
  Dungeon,
  ExpGrade,
  GradeStatus,
  HeroStudent,
  QuestNotice,
  Realm,
  SeasonId,
} from '../types/lms';
import { DEFAULT_ERA_ID, DEFAULT_SEASON_ID } from '../data/seedData';
import {
  doesTargetMatchDungeon,
  formatChapterLabel,
  formatRetroDate,
  formatTargetDungeonsSummary,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
  getQuestCategoryMeta,
  getRankFromScore,
  normalizeQuestCategory,
  parseTargetDungeonIds,
  sortDungeonsAlphabetically,
  sortQuestsByCategory,
} from './exp';
import { formatStatusLabel } from './exportRecap';

export interface SemesterReportFilter {
  academicYearId: string;
  season: SeasonId | 'all';
  dungeonId: string; // 'all' | specific dungeonId
  realmId: string; // 'all' | specific realmId
  includeGeneralTomes?: boolean;
}

export interface ReportTomeRow {
  no: number;
  tome: AncientTome;
  realmName: string;
  realmCode: string;
  chapterLabel: string;
  targetLabel: string;
  publishedLabel: string;
  eraTagLabel: string;
}

export interface ReportQuestRow {
  no: number;
  quest: ActiveQuest;
  realmName: string;
  realmCode: string;
  categoryLabel: string;
  targetLabel: string;
  deadlineLabel: string;
  seasonLabel: string;
}

export interface ReportStudentCell {
  questId: string;
  enrolled: boolean;
  status: GradeStatus | null;
  score: number | null;
  expEarned: number;
  feedback: string;
  displayText: string;
}

export interface ReportStudentRow {
  no: number;
  hero: HeroStudent;
  dungeonCode: string;
  dungeonName: string;
  cells: ReportStudentCell[];
  tuntasCount: number;
  prosesCount: number;
  remidialCount: number;
  belumCount: number;
  avgScore: number;
  rank: string;
  totalExp: number;
}

export interface SemesterReportData {
  academicYear?: AcademicYear;
  eraName: string;
  season: SeasonId | 'all';
  seasonLabel: string;
  periodTitle: string;
  classLabel: string;
  realmLabel: string;
  gmName: string;
  gmTitle: string;
  gmSpecialty: string;
  printedAt: string;
  tomes: ReportTomeRow[];
  quests: ReportQuestRow[];
  rawQuests: ActiveQuest[];
  studentRows: ReportStudentRow[];
  summary: {
    totalClasses: number;
    totalHeroes: number;
    activeHeroes: number;
    totalTomes: number;
    totalQuests: number;
    totalGradeRecords: number;
    tuntasCount: number;
    prosesCount: number;
    remidialCount: number;
    belumCount: number;
    completionPercent: number;
    averageScore: number;
  };
}

export function resolveFallbackLegacyEraId(academicYears?: AcademicYear[]): string {
  const list = academicYears || [];
  if (list.some((y) => y.id === DEFAULT_ERA_ID)) return DEFAULT_ERA_ID;
  return list[0]?.id || DEFAULT_ERA_ID;
}

export function inferSeasonFromIsoDate(isoDate?: string): SeasonId | null {
  const match = String(isoDate || '')
    .trim()
    .match(/^\d{4}-(\d{2})-\d{2}/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  // Kalender akademik Indonesia: Jul–Des = Ganjil, Jan–Jun = Genap
  return month >= 7 ? 'ganjil' : 'genap';
}

export function formatIndonesianSemesterLabel(season: SeasonId | 'all'): string {
  if (season === 'all') return 'Semester Ganjil & Genap (1 Tahun Pelajaran)';
  return season === 'genap' ? 'Semester 2 (Genap)' : 'Semester 1 (Ganjil)';
}

function isTomeInReportPeriod(
  tome: AncientTome,
  academicYear: AcademicYear | undefined,
  academicYearId: string,
  fallbackLegacyEraId: string,
  season: SeasonId | 'all',
  includeGeneralTomes: boolean
): boolean {
  if (tome.academicYearId) {
    if (tome.academicYearId !== academicYearId) return false;
    if (season !== 'all' && tome.season && tome.season !== season) return false;
    return true;
  }

  // Untagged legacy/curriculum tome
  const pubDate = (tome.publishedDate || '').trim();
  const hasEraRange = Boolean(academicYear?.startDate && academicYear?.endDate);
  const inDateRange =
    hasEraRange && pubDate
      ? pubDate >= academicYear!.startDate && pubDate <= academicYear!.endDate
      : academicYearId === fallbackLegacyEraId;

  if (!inDateRange && !includeGeneralTomes) {
    return false;
  }

  if (!inDateRange && includeGeneralTomes) {
    // Allow untagged general tomes if user opted in
    if (season === 'all') return true;
    const inferred = tome.season || inferSeasonFromIsoDate(pubDate);
    return !inferred || inferred === season || includeGeneralTomes;
  }

  if (season === 'all') return true;
  const effectiveSeason = tome.season || inferSeasonFromIsoDate(pubDate);
  if (!effectiveSeason) return true;
  if (effectiveSeason === season) return true;
  return includeGeneralTomes;
}

export function filterSemesterReportData(
  state: AcademyState,
  filter: SemesterReportFilter
): SemesterReportData {
  const academicYears = state.academicYears || [];
  const fallbackLegacyEraId = resolveFallbackLegacyEraId(academicYears);
  const selectedEra =
    academicYears.find((y) => y.id === filter.academicYearId) || academicYears[0];
  const targetEraId = selectedEra?.id || filter.academicYearId || fallbackLegacyEraId;
  const includeGeneralTomes = filter.includeGeneralTomes ?? true;

  const isInEra = (itemEraId?: string) =>
    (itemEraId || fallbackLegacyEraId) === targetEraId;
  const isInSeason = (itemSeason?: SeasonId) =>
    filter.season === 'all' || (itemSeason || DEFAULT_SEASON_ID) === filter.season;

  const eraDungeons = sortDungeonsAlphabetically(
    state.dungeons.filter((d) => isInEra(d.academicYearId))
  );
  const eraDungeonIdSet = new Set(eraDungeons.map((d) => d.id));
  const selectedDungeon =
    filter.dungeonId === 'all'
      ? undefined
      : eraDungeons.find((d) => d.id === filter.dungeonId);
  const selectedRealm =
    filter.realmId === 'all'
      ? undefined
      : state.realms.find((r) => r.id === filter.realmId);

  const realmMap = new Map(state.realms.map((r) => [r.id, r]));
  const dungeonOrder = new Map(eraDungeons.map((d, idx) => [d.id, idx]));

  // 1. Filter Heroes in Era & Class (and Mapel if filtered)
  const heroesInScope = state.heroes
    .filter((h) => {
      if (filter.dungeonId !== 'all') {
        if (h.dungeonId !== filter.dungeonId) return false;
      } else {
        // Include heroes assigned to any dungeon in this Era (or heroes who have grades in this Era)
        const inEraDungeon = eraDungeonIdSet.has(h.dungeonId);
        if (!inEraDungeon) return false;
      }
      if (filter.realmId !== 'all') {
        const allowedRealms = getHeroEffectiveRealmIds(h, eraDungeons);
        if (allowedRealms && !allowedRealms.includes(filter.realmId)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const idxA = dungeonOrder.get(a.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      const idxB = dungeonOrder.get(b.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
    });

  // 2. Filter Tomes (Materi)
  const filteredTomes = state.tomes
    .filter((t) => {
      if (filter.realmId !== 'all' && t.realmId !== filter.realmId) return false;
      if (
        !isTomeInReportPeriod(
          t,
          selectedEra,
          targetEraId,
          fallbackLegacyEraId,
          filter.season,
          includeGeneralTomes
        )
      ) {
        return false;
      }

      if (filter.dungeonId !== 'all') {
        const matchesTarget = doesTargetMatchDungeon(t.targetDungeonId, filter.dungeonId);
        if (!matchesTarget) return false;
        if (
          selectedDungeon?.realmIds &&
          selectedDungeon.realmIds.length > 0 &&
          t.realmId &&
          !selectedDungeon.realmIds.includes(t.realmId)
        ) {
          return false;
        }
      } else if (parseTargetDungeonIds(t.targetDungeonId).length > 0) {
        // If targeted to specific dungeon IDs, make sure at least one belongs to this Era (or none if curriculum spans)
        const targetIds = parseTargetDungeonIds(t.targetDungeonId);
        const touchesEraDungeon = targetIds.some((id) => eraDungeonIdSet.has(id));
        if (!touchesEraDungeon && t.academicYearId !== targetEraId) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const rA = realmMap.get(a.realmId)?.name || '';
      const rB = realmMap.get(b.realmId)?.name || '';
      const rCmp = rA.localeCompare(rB, 'id', { sensitivity: 'base' });
      if (rCmp !== 0) return rCmp;
      const chapCmp = String(a.chapter || '').localeCompare(String(b.chapter || ''), 'id', {
        numeric: true,
        sensitivity: 'base',
      });
      if (chapCmp !== 0) return chapCmp;
      return a.title.localeCompare(b.title, 'id', { numeric: true, sensitivity: 'base' });
    });

  const tomeRows: ReportTomeRow[] = filteredTomes.map((t, idx) => {
    const realm = realmMap.get(t.realmId);
    return {
      no: idx + 1,
      tome: t,
      realmName: realm?.name || 'Umum',
      realmCode: realm?.code || '-',
      chapterLabel: formatChapterLabel(t.chapter),
      targetLabel: formatTargetDungeonsSummary(
        t.targetDungeonId,
        eraDungeons.length > 0 ? eraDungeons : state.dungeons,
        'Semua Kelas'
      ),
      publishedLabel: formatRetroDate(t.publishedDate),
      eraTagLabel: t.academicYearId ? 'Khusus Era' : 'Materi Kurikulum',
    };
  });

  // 3. Filter Quests (Tugas)
  const rawQuestsFiltered = state.quests.filter((q) => {
    if (!isInEra(q.academicYearId)) return false;
    if (!isInSeason(q.season)) return false;
    if (filter.realmId !== 'all' && q.realmId !== filter.realmId) return false;
    if (filter.dungeonId !== 'all') {
      const matchDungeon = doesTargetMatchDungeon(q.dungeonId, filter.dungeonId);
      const dungeonAllowsRealm =
        !selectedDungeon?.realmIds ||
        selectedDungeon.realmIds.length === 0 ||
        selectedDungeon.realmIds.includes(q.realmId);
      const hasGradeInClass = state.grades.some(
        (g) => g.questId === q.id && heroesInScope.some((h) => h.id === g.heroId)
      );
      return (matchDungeon && dungeonAllowsRealm) || hasGradeInClass;
    }
    return true;
  });

  const rawQuests = sortQuestsByCategory(rawQuestsFiltered);
  const questRows: ReportQuestRow[] = rawQuests.map((q, idx) => {
    const realm = realmMap.get(q.realmId);
    return {
      no: idx + 1,
      quest: q,
      realmName: realm?.name || 'Umum',
      realmCode: realm?.code || '-',
      categoryLabel: getQuestCategoryMeta(q.category).label,
      targetLabel: formatTargetDungeonsSummary(
        q.dungeonId,
        eraDungeons.length > 0 ? eraDungeons : state.dungeons,
        'Semua Kelas'
      ),
      deadlineLabel: formatRetroDate(q.deadline),
      seasonLabel: q.season === 'genap' ? 'Genap' : 'Ganjil',
    };
  });

  // 4. Build Grade Matrix & Student Summaries
  const gradeMap = new Map<string, ExpGrade>();
  state.grades.forEach((g) => {
    gradeMap.set(`${g.heroId}__${g.questId}`, g);
  });

  let totalTuntas = 0;
  let totalProses = 0;
  let totalRemidial = 0;
  let totalBelum = 0;
  let totalGradedScoreSum = 0;
  let totalGradedScoreCount = 0;
  let totalGradeRecords = 0;

  const studentRows: ReportStudentRow[] = heroesInScope.map((hero, idx) => {
    const dng = eraDungeons.find((d) => d.id === hero.dungeonId);
    const allowedRealms = getHeroEffectiveRealmIds(hero, eraDungeons);

    let tuntasCount = 0;
    let prosesCount = 0;
    let remidialCount = 0;
    let belumCount = 0;
    let scoredSum = 0;
    let scoredCount = 0;
    let totalExp = 0;

    const cells: ReportStudentCell[] = rawQuests.map((quest) => {
      const grade = gradeMap.get(`${hero.id}__${quest.id}`);
      const isRealmAllowed =
        !allowedRealms || allowedRealms.includes(quest.realmId);
      const isQuestForDungeon = doesTargetMatchDungeon(
        quest.dungeonId,
        hero.dungeonId
      );
      const enrolled = isRealmAllowed && isQuestForDungeon;

      if (!enrolled) {
        return {
          questId: quest.id,
          enrolled: false,
          status: null,
          score: null,
          expEarned: 0,
          feedback: '',
          displayText: '-',
        };
      }

      const status = getEffectiveGradeStatus(grade);
      if (status === 'tuntas') {
        tuntasCount++;
        totalTuntas++;
      } else if (status === 'proses') {
        prosesCount++;
        totalProses++;
      } else if (status === 'remidial') {
        remidialCount++;
        totalRemidial++;
      } else {
        belumCount++;
        totalBelum++;
      }

      const score = grade ? (status === 'belum' ? 0 : grade.score) : 0;
      const expEarned = grade ? (status === 'belum' ? 0 : grade.expEarned) : 0;

      if (grade && status !== 'belum') {
        totalGradeRecords++;
        scoredSum += grade.score;
        scoredCount++;
        totalGradedScoreSum += grade.score;
        totalGradedScoreCount++;
        totalExp += grade.expEarned;
      }

      const statusText = formatStatusLabel(status);
      const displayText =
        grade && status !== 'belum' ? `${score} (${statusText})` : statusText;

      return {
        questId: quest.id,
        enrolled: true,
        status,
        score: grade && status !== 'belum' ? score : null,
        expEarned,
        feedback: grade?.feedback || '',
        displayText,
      };
    });

    const avgScore = scoredCount > 0 ? Math.round(scoredSum / scoredCount) : 0;
    const rank = scoredCount > 0 ? getRankFromScore(avgScore) : '-';

    return {
      no: idx + 1,
      hero,
      dungeonCode: dng ? dng.guildCode : '-',
      dungeonName: dng ? dng.name : 'Tanpa Kelas',
      cells,
      tuntasCount,
      prosesCount,
      remidialCount,
      belumCount,
      avgScore,
      rank,
      totalExp,
    };
  });

  const totalSlots = totalTuntas + totalProses + totalRemidial + totalBelum;
  const completionPercent =
    totalSlots > 0 ? Math.min(100, Math.round((totalTuntas / totalSlots) * 100)) : 0;
  const averageScore =
    totalGradedScoreCount > 0
      ? Math.round(totalGradedScoreSum / totalGradedScoreCount)
      : 0;

  const eraName = selectedEra?.name || targetEraId;
  const seasonLabel = formatIndonesianSemesterLabel(filter.season);

  return {
    academicYear: selectedEra,
    eraName,
    season: filter.season,
    seasonLabel,
    periodTitle: `Tahun Pelajaran ${eraName} — ${seasonLabel}`,
    classLabel: selectedDungeon
      ? `${selectedDungeon.guildCode} — ${selectedDungeon.name} (${selectedDungeon.tier})`
      : `Semua Kelas (${eraDungeons.length} Rombel)`,
    realmLabel: selectedRealm
      ? `${selectedRealm.code} — ${selectedRealm.name}`
      : 'Semua Mata Pelajaran',
    gmName: state.gmProfile.name || 'Game Master',
    gmTitle: state.gmProfile.title || 'Guru Pengampu',
    gmSpecialty: state.gmProfile.specialty || '',
    printedAt: new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    tomes: tomeRows,
    quests: questRows,
    rawQuests,
    studentRows,
    summary: {
      totalClasses: selectedDungeon ? 1 : eraDungeons.length,
      totalHeroes: heroesInScope.length,
      activeHeroes: heroesInScope.filter((h) => h.active).length,
      totalTomes: tomeRows.length,
      totalQuests: questRows.length,
      totalGradeRecords,
      tuntasCount: totalTuntas,
      prosesCount: totalProses,
      remidialCount: totalRemidial,
      belumCount: totalBelum,
      completionPercent,
      averageScore,
    },
  };
}

function sanitizeSlug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function downloadSemesterReportExcel(report: SemesterReportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan
  const summarySheetRows = [
    ['LAPORAN PEMBELAJARAN SEMESTER — PIXEL QUEST ACADEMY'],
    ['Tahun Pelajaran', report.eraName],
    ['Semester', report.seasonLabel],
    ['Kelas / Rombel', report.classLabel],
    ['Mata Pelajaran', report.realmLabel],
    ['Guru / Game Master', report.gmName],
    ['Jabatan / Bidang', [report.gmTitle, report.gmSpecialty].filter(Boolean).join(' · ')],
    ['Tanggal Ekspor', report.printedAt],
    [],
    ['RINGKASAN STATISTIK'],
    ['Jumlah Kelas', report.summary.totalClasses],
    ['Jumlah Siswa (Aktif)', `${report.summary.totalHeroes} (${report.summary.activeHeroes} aktif)`],
    ['Jumlah Materi (Tomes)', report.summary.totalTomes],
    ['Jumlah Tugas (Quests)', report.summary.totalQuests],
    ['Slot Nilai Tuntas', report.summary.tuntasCount],
    ['Slot Proses Dinilai', report.summary.prosesCount],
    ['Slot Remidial', report.summary.remidialCount],
    ['Slot Belum Dikerjakan', report.summary.belumCount],
    ['Persentase Ketuntasan', `${report.summary.completionPercent}%`],
    ['Rata-rata Nilai', report.summary.averageScore],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetRows);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Materi
  const tomeHeaders = [
    'No',
    'Mapel',
    'Bab / Chapter',
    'Judul Materi',
    'Ringkasan',
    'Target Kelas',
    'Tanggal Terbit',
    'Tautan',
  ];
  const tomeRows = report.tomes.map((row) => [
    row.no,
    `${row.realmCode} — ${row.realmName}`,
    row.chapterLabel,
    row.tome.title,
    row.tome.summary || '-',
    row.targetLabel,
    row.publishedLabel,
    row.tome.linkUrl || '-',
  ]);
  const wsTomes = XLSX.utils.aoa_to_sheet([tomeHeaders, ...tomeRows]);
  wsTomes['!cols'] = [
    { wch: 5 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 38 },
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTomes, 'Materi_Tomes');

  // Sheet 3: Tugas
  const questHeaders = [
    'No',
    'Mapel',
    'Kategori',
    'Judul Tugas',
    'Bab / Topik',
    'Tingkat',
    'Max EXP',
    'Semester',
    'Tenggat',
    'Target Kelas',
  ];
  const questRows = report.quests.map((row) => [
    row.no,
    `${row.realmCode} — ${row.realmName}`,
    row.categoryLabel,
    row.quest.title,
    row.quest.chapter ? formatChapterLabel(row.quest.chapter) : '-',
    row.quest.difficulty,
    row.quest.maxExp,
    row.seasonLabel,
    row.deadlineLabel,
    row.targetLabel,
  ]);
  const wsQuests = XLSX.utils.aoa_to_sheet([questHeaders, ...questRows]);
  wsQuests['!cols'] = [
    { wch: 5 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsQuests, 'Tugas_Quests');

  // Sheet 4: Rekap Nilai
  const questColTitles = report.rawQuests.map((q) => q.title);
  const gradeHeaders = [
    'No',
    'NIS / Kode',
    'Nama Siswa',
    'Kelas',
    ...questColTitles,
    'Tuntas',
    'Proses',
    'Remidial',
    'Belum',
    'Rata-rata Nilai',
    'Predikat',
    'Total EXP',
  ];
  const gradeRows = report.studentRows.map((row) => [
    row.no,
    row.hero.studentCode,
    row.hero.name,
    row.dungeonCode !== '-' ? row.dungeonCode : row.dungeonName,
    ...row.cells.map((c) => {
      if (!c.enrolled) return '-';
      if (c.status === 'tuntas' || c.status === 'remidial') {
        return c.score ?? 0;
      }
      if (c.status === 'proses') return 'Proses';
      return 'Belum';
    }),
    row.tuntasCount,
    row.prosesCount,
    row.remidialCount,
    row.belumCount,
    row.avgScore,
    row.rank,
    row.totalExp,
  ]);
  const wsGrades = XLSX.utils.aoa_to_sheet([gradeHeaders, ...gradeRows]);
  wsGrades['!cols'] = [
    { wch: 5 },
    { wch: 13 },
    { wch: 24 },
    { wch: 13 },
    ...questColTitles.map((t) => ({ wch: Math.max(16, Math.min(30, t.length + 4)) })),
    { wch: 9 },
    { wch: 9 },
    { wch: 10 },
    { wch: 9 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGrades, 'Rekap_Nilai');

  const eraSlug = sanitizeSlug(report.eraName) || 'tp';
  const seasonSlug = report.season;
  const classSlug = sanitizeSlug(report.classLabel) || 'semua-kelas';
  const datePart = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(
    wb,
    `laporan-semester-${eraSlug}-${seasonSlug}-${classSlug}-${datePart}.xlsx`
  );
}

// ============================================================================
// Manajemen Arsip Tahun Pelajaran (Generate -> Prune -> Upload / Restore)
// ============================================================================

export interface EraArchiveBundleV1 {
  format: 'pixel_quest_era_archive';
  version: 1;
  exportedAt: string;
  academicYear: AcademicYear;
  dungeons: Dungeon[];
  quests: ActiveQuest[];
  notices: QuestNotice[];
  tomes: AncientTome[];
  grades: ExpGrade[];
  heroesSnapshot: HeroStudent[];
  realmsSnapshot: Realm[];
  counts: {
    dungeons: number;
    quests: number;
    notices: number;
    tomes: number;
    grades: number;
    heroes: number;
    realms: number;
  };
}

export function generateEraArchiveBundle(
  state: AcademyState,
  academicYearId: string
): EraArchiveBundleV1 | null {
  const academicYears = state.academicYears || [];
  const targetEra = academicYears.find((y) => y.id === academicYearId);
  if (!targetEra) return null;

  const fallbackLegacyEraId = resolveFallbackLegacyEraId(academicYears);
  const isInEra = (itemEraId?: string) =>
    (itemEraId || fallbackLegacyEraId) === academicYearId;

  const eraDungeons = state.dungeons.filter((d) => isInEra(d.academicYearId));
  const eraDungeonIdSet = new Set(eraDungeons.map((d) => d.id));

  const eraQuests = state.quests.filter((q) => isInEra(q.academicYearId));
  const eraQuestIdSet = new Set(eraQuests.map((q) => q.id));

  const eraNotices = state.notices.filter((n) => isInEra(n.academicYearId));

  // Include tomes explicitly tagged to this Era OR matching its date window
  const eraTomes = state.tomes.filter((t) => {
    if (t.academicYearId) return t.academicYearId === academicYearId;
    if (targetEra.startDate && targetEra.endDate && t.publishedDate) {
      return (
        t.publishedDate >= targetEra.startDate &&
        t.publishedDate <= targetEra.endDate
      );
    }
    return academicYearId === fallbackLegacyEraId;
  });

  const eraGrades = state.grades.filter((g) => eraQuestIdSet.has(g.questId));
  const gradeHeroIdSet = new Set(eraGrades.map((g) => g.heroId));

  // Snapshot heroes who belong to Era dungeons or appear in Era grades (strip raw PIN)
  const heroesSnapshot = state.heroes
    .filter((h) => eraDungeonIdSet.has(h.dungeonId) || gradeHeroIdSet.has(h.id))
    .map(({ pin: _pin, ...rest }) => rest);

  // Snapshot realms referenced by Era items
  const referencedRealmIds = new Set<string>();
  eraDungeons.forEach((d) =>
    (d.realmIds || []).forEach((rid) => referencedRealmIds.add(rid))
  );
  eraQuests.forEach((q) => {
    if (q.realmId) referencedRealmIds.add(q.realmId);
  });
  eraTomes.forEach((t) => {
    if (t.realmId) referencedRealmIds.add(t.realmId);
  });
  eraGrades.forEach((g) => {
    if (g.realmId) referencedRealmIds.add(g.realmId);
  });

  const realmsSnapshot = state.realms.filter(
    (r) => referencedRealmIds.size === 0 || referencedRealmIds.has(r.id)
  );

  return {
    format: 'pixel_quest_era_archive',
    version: 1,
    exportedAt: new Date().toISOString(),
    academicYear: { ...targetEra },
    dungeons: eraDungeons,
    quests: eraQuests,
    notices: eraNotices,
    tomes: eraTomes,
    grades: eraGrades,
    heroesSnapshot,
    realmsSnapshot,
    counts: {
      dungeons: eraDungeons.length,
      quests: eraQuests.length,
      notices: eraNotices.length,
      tomes: eraTomes.length,
      grades: eraGrades.length,
      heroes: heroesSnapshot.length,
      realms: realmsSnapshot.length,
    },
  };
}

export function triggerEraArchiveDownload(bundle: EraArchiveBundleV1): string {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const eraSlug = sanitizeSlug(bundle.academicYear.name) || bundle.academicYear.id;
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `arsip-tp-${eraSlug}-${datePart}.json`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export function parseAndValidateEraArchive(rawText: string):
  | { ok: true; bundle: EraArchiveBundleV1 }
  | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'File JSON arsip tidak valid.' };
    }
    if (parsed.format !== 'pixel_quest_era_archive' || parsed.version !== 1) {
      return {
        ok: false,
        error:
          'Format file tidak dikenali. Gunakan file arsip .json yang diunduh dari Pixel Quest Academy.',
      };
    }
    if (
      !parsed.academicYear ||
      typeof parsed.academicYear.id !== 'string' ||
      typeof parsed.academicYear.name !== 'string'
    ) {
      return {
        ok: false,
        error: 'Metadata Tahun Pelajaran pada file arsip tidak lengkap.',
      };
    }
    const dungeons = Array.isArray(parsed.dungeons) ? parsed.dungeons : [];
    const quests = Array.isArray(parsed.quests) ? parsed.quests : [];
    const notices = Array.isArray(parsed.notices) ? parsed.notices : [];
    const tomes = Array.isArray(parsed.tomes) ? parsed.tomes : [];
    const grades = Array.isArray(parsed.grades) ? parsed.grades : [];
    const heroesSnapshot = Array.isArray(parsed.heroesSnapshot)
      ? parsed.heroesSnapshot
      : [];
    const realmsSnapshot = Array.isArray(parsed.realmsSnapshot)
      ? parsed.realmsSnapshot
      : [];

    const bundle: EraArchiveBundleV1 = {
      format: 'pixel_quest_era_archive',
      version: 1,
      exportedAt: String(parsed.exportedAt || new Date().toISOString()),
      academicYear: parsed.academicYear,
      dungeons,
      quests,
      notices,
      tomes,
      grades,
      heroesSnapshot,
      realmsSnapshot,
      counts: {
        dungeons: dungeons.length,
        quests: quests.length,
        notices: notices.length,
        tomes: tomes.length,
        grades: grades.length,
        heroes: heroesSnapshot.length,
        realms: realmsSnapshot.length,
      },
    };
    return { ok: true, bundle };
  } catch {
    return {
      ok: false,
      error: 'Gagal membaca file arsip. Pastikan file berupa JSON yang utuh.',
    };
  }
}

function mergeById<T extends { id: string }>(
  existing: T[],
  incoming: T[],
  transformIncoming?: (item: T) => T
): { merged: T[]; addedCount: number } {
  const existingIds = new Set(existing.map((x) => x.id));
  const additions: T[] = [];
  incoming.forEach((raw) => {
    if (!raw?.id || existingIds.has(raw.id)) return;
    existingIds.add(raw.id);
    additions.push(transformIncoming ? transformIncoming(raw) : raw);
  });
  return {
    merged: additions.length > 0 ? [...existing, ...additions] : existing,
    addedCount: additions.length,
  };
}

export interface MergeArchiveSummary {
  eraName: string;
  eraAdded: boolean;
  addedDungeons: number;
  addedHeroes: number;
  addedRealms: number;
  addedTomes: number;
  addedQuests: number;
  addedNotices: number;
  addedGrades: number;
}

export function mergeEraArchiveIntoState(
  currentState: AcademyState,
  bundle: EraArchiveBundleV1
): { nextState: AcademyState; summary: MergeArchiveSummary } {
  const currentYears = currentState.academicYears || [];
  const eraAlreadyExists = currentYears.some(
    (y) => y.id === bundle.academicYear.id
  );
  // Keep currently active Era active when importing an archived Era!
  const restoredEra: AcademicYear = {
    ...bundle.academicYear,
    isActive: currentYears.length === 0 ? true : false,
  };
  const nextAcademicYears = eraAlreadyExists
    ? currentYears
    : [...currentYears, restoredEra];

  const eraId = bundle.academicYear.id;

  const realmsRes = mergeById(currentState.realms, bundle.realmsSnapshot);
  const dungeonsRes = mergeById(currentState.dungeons, bundle.dungeons, (d) => ({
    ...d,
    academicYearId: d.academicYearId || eraId,
  }));
  const heroesRes = mergeById(currentState.heroes, bundle.heroesSnapshot);
  const tomesRes = mergeById(currentState.tomes, bundle.tomes, (t) => ({
    ...t,
    academicYearId: t.academicYearId || eraId,
  }));
  const questsRes = mergeById(currentState.quests, bundle.quests, (q) => ({
    ...q,
    category: normalizeQuestCategory(q.category),
    academicYearId: q.academicYearId || eraId,
    season: q.season || DEFAULT_SEASON_ID,
  }));
  const noticesRes = mergeById(currentState.notices, bundle.notices, (n) => ({
    ...n,
    academicYearId: n.academicYearId || eraId,
    season: n.season || DEFAULT_SEASON_ID,
  }));
  const gradesRes = mergeById(currentState.grades, bundle.grades);

  return {
    nextState: {
      ...currentState,
      academicYears: nextAcademicYears,
      realms: realmsRes.merged,
      dungeons: dungeonsRes.merged,
      heroes: heroesRes.merged,
      tomes: tomesRes.merged,
      quests: questsRes.merged,
      notices: noticesRes.merged,
      grades: gradesRes.merged,
    },
    summary: {
      eraName: bundle.academicYear.name,
      eraAdded: !eraAlreadyExists,
      addedDungeons: dungeonsRes.addedCount,
      addedHeroes: heroesRes.addedCount,
      addedRealms: realmsRes.addedCount,
      addedTomes: tomesRes.addedCount,
      addedQuests: questsRes.addedCount,
      addedNotices: noticesRes.addedCount,
      addedGrades: gradesRes.addedCount,
    },
  };
}

export interface PruneEraResult {
  ok: boolean;
  error?: string;
  nextState: AcademyState;
  removedIds: {
    eraId: string;
    eraName: string;
    dungeonIds: string[];
    questIds: string[];
    noticeIds: string[];
    tomeIds: string[];
    gradeIds: string[];
    heroIds: string[];
  };
}

export function pruneEraFromState(
  currentState: AcademyState,
  academicYearId: string,
  options?: { pruneHeroesInEra?: boolean }
): PruneEraResult {
  const academicYears = currentState.academicYears || [];
  const targetEra = academicYears.find((y) => y.id === academicYearId);
  if (!targetEra) {
    return {
      ok: false,
      error: 'Tahun pelajaran yang dipilih tidak ditemukan.',
      nextState: currentState,
      removedIds: {
        eraId: academicYearId,
        eraName: '',
        dungeonIds: [],
        questIds: [],
        noticeIds: [],
        tomeIds: [],
        gradeIds: [],
        heroIds: [],
      },
    };
  }
  if (targetEra.isActive) {
    return {
      ok: false,
      error:
        'Tahun pelajaran yang sedang aktif tidak dapat dibersihkan. Alihkan ke tahun pelajaran baru terlebih dahulu.',
      nextState: currentState,
      removedIds: {
        eraId: academicYearId,
        eraName: targetEra.name,
        dungeonIds: [],
        questIds: [],
        noticeIds: [],
        tomeIds: [],
        gradeIds: [],
        heroIds: [],
      },
    };
  }

  const fallbackLegacyEraId = resolveFallbackLegacyEraId(academicYears);
  const isInTargetEra = (itemEraId?: string) =>
    (itemEraId || fallbackLegacyEraId) === academicYearId;

  const removedDungeons = currentState.dungeons.filter((d) =>
    isInTargetEra(d.academicYearId)
  );
  const removedDungeonSet = new Set(removedDungeons.map((d) => d.id));

  const removedQuests = currentState.quests.filter((q) =>
    isInTargetEra(q.academicYearId)
  );
  const removedQuestSet = new Set(removedQuests.map((q) => q.id));

  const removedNotices = currentState.notices.filter((n) =>
    isInTargetEra(n.academicYearId)
  );
  const removedNoticeSet = new Set(removedNotices.map((n) => n.id));

  // Only remove Tomes explicitly bound to the pruned academicYearId so shared curriculum stays safe
  const removedTomes = currentState.tomes.filter(
    (t) => t.academicYearId === academicYearId
  );
  const removedTomeSet = new Set(removedTomes.map((t) => t.id));

  const removedGrades = currentState.grades.filter((g) =>
    removedQuestSet.has(g.questId)
  );
  const removedGradeSet = new Set(removedGrades.map((g) => g.id));

  const pruneHeroes = Boolean(options?.pruneHeroesInEra);
  const removedHeroIds = pruneHeroes
    ? currentState.heroes
        .filter((h) => removedDungeonSet.has(h.dungeonId))
        .map((h) => h.id)
    : [];
  const removedHeroSet = new Set(removedHeroIds);

  const nextHeroes = pruneHeroes
    ? currentState.heroes.filter((h) => !removedHeroSet.has(h.id))
    : currentState.heroes.map((h) =>
        removedDungeonSet.has(h.dungeonId) ? { ...h, dungeonId: '' } : h
      );

  const nextState: AcademyState = {
    ...currentState,
    academicYears: academicYears.filter((y) => y.id !== academicYearId),
    dungeons: currentState.dungeons.filter((d) => !removedDungeonSet.has(d.id)),
    quests: currentState.quests.filter((q) => !removedQuestSet.has(q.id)),
    notices: currentState.notices.filter((n) => !removedNoticeSet.has(n.id)),
    tomes: currentState.tomes.filter((t) => !removedTomeSet.has(t.id)),
    grades: currentState.grades.filter(
      (g) => !removedGradeSet.has(g.id) && !removedHeroSet.has(g.heroId)
    ),
    heroes: nextHeroes,
  };

  return {
    ok: true,
    nextState,
    removedIds: {
      eraId: academicYearId,
      eraName: targetEra.name,
      dungeonIds: Array.from(removedDungeonSet),
      questIds: Array.from(removedQuestSet),
      noticeIds: Array.from(removedNoticeSet),
      tomeIds: Array.from(removedTomeSet),
      gradeIds: Array.from(removedGradeSet),
      heroIds: removedHeroIds,
    },
  };
}
