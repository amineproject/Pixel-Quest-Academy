import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  Printer,
  Users,
} from 'lucide-react';
import { AcademyState, SeasonId } from '../../types/lms';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import {
  PixelButton,
  PixelEmptyState,
  PixelFieldLabel,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  buildAcademicPeriodLabel,
  doesTargetMatchDungeon,
  escapeCsvCell,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
  getHeroLevelProgress,
  getHeroTotalExp,
  getRankFromScore,
  sortDungeonsAlphabetically,
} from '../../utils/exp';
import {
  downloadSemesterReportExcel,
  filterSemesterReportData,
} from '../../utils/archiveAndReport';

interface GmGuildChroniclesProps {
  /** Full academy state across all academic years so archived years can also be printed. */
  state: AcademyState;
  /** Active Era + Season state used for the quick overview & CSV export tab. */
  eraState?: AcademyState;
}

type ChroniclesTab = 'report' | 'overview';

export const GmGuildChronicles: React.FC<GmGuildChroniclesProps> = ({
  state,
  eraState,
}) => {
  const overviewState = eraState || state;

  const academicYears = useMemo(
    () => state.academicYears || [],
    [state.academicYears]
  );
  const defaultEraId =
    academicYears.find((y) => y.isActive)?.id || academicYears[0]?.id || '';
  const defaultSeason: SeasonId =
    state.settings.activeSeason === 'genap' ? 'genap' : 'ganjil';

  const [activeTab, setActiveTab] = useState<ChroniclesTab>('report');

  // State for Printable Semester Report
  const [reportEraId, setReportEraId] = useState<string>(defaultEraId);
  const [reportSeason, setReportSeason] = useState<SeasonId | 'all'>(
    defaultSeason
  );
  const [reportDungeonId, setReportDungeonId] = useState<string>('all');
  const [reportRealmId, setReportRealmId] = useState<string>('all');
  const [includeGeneralTomes, setIncludeGeneralTomes] = useState<boolean>(true);
  const [showDetailedQuestMatrix, setShowDetailedQuestMatrix] =
    useState<boolean>(true);

  const effectiveEraId = academicYears.some((y) => y.id === reportEraId)
    ? reportEraId
    : defaultEraId;

  const eraDungeons = useMemo(() => {
    const fallbackLegacyEraId =
      academicYears.find((y) => y.id === 'era-2026-2027')?.id ||
      academicYears[0]?.id ||
      'era-2026-2027';
    return sortDungeonsAlphabetically(
      state.dungeons.filter(
        (d) => (d.academicYearId || fallbackLegacyEraId) === effectiveEraId
      )
    );
  }, [state.dungeons, academicYears, effectiveEraId]);

  const effectiveDungeonId =
    reportDungeonId === 'all' ||
    eraDungeons.some((d) => d.id === reportDungeonId)
      ? reportDungeonId
      : 'all';

  const sortedRealms = useMemo(
    () =>
      [...state.realms].sort((a, b) =>
        a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
      ),
    [state.realms]
  );

  const report = useMemo(
    () =>
      filterSemesterReportData(state, {
        academicYearId: effectiveEraId,
        season: reportSeason,
        dungeonId: effectiveDungeonId,
        realmId: reportRealmId,
        includeGeneralTomes,
      }),
    [
      state,
      effectiveEraId,
      reportSeason,
      effectiveDungeonId,
      reportRealmId,
      includeGeneralTomes,
    ]
  );

  // State for Quick Overview & CSV tab (scoped to Active Era + Season)
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(
        overviewState.dungeons,
        selectedTier,
        selectedDungeonIds
      ),
    [overviewState.dungeons, selectedTier, selectedDungeonIds]
  );

  const selectedSingleDungeon =
    scope.isFiltered && scope.activeDungeons.length === 1
      ? scope.activeDungeons[0]
      : null;

  const dungeonMap = useMemo(
    () => new Map(overviewState.dungeons.map((d) => [d.id, d])),
    [overviewState.dungeons]
  );

  const {
    classHeroes,
    activeHeroes,
    questSelesaiCount,
    totalAssignedSlots,
    completionPercent,
    averageScore,
    averageExp,
    heroSummaries,
  } = useMemo(() => {
    const filteredHeroes = scope.isFiltered
      ? overviewState.heroes.filter((h) =>
          scope.activeDungeonIdSet.has(h.dungeonId)
        )
      : overviewState.heroes;
    const active = filteredHeroes.filter((h) => h.active);

    const gradeMap = new Map(
      overviewState.grades.map((g) => [`${g.heroId}__${g.questId}`, g])
    );

    let totalExpSum = 0;
    let totalTuntasActive = 0;
    let totalAssignedActive = 0;
    let totalEarnedScoreActive = 0;

    const summaries = filteredHeroes
      .map((hero) => {
        const exp = getHeroTotalExp(hero.id, overviewState.grades);
        const lvl = getHeroLevelProgress(exp);
        const allowedRealms = getHeroEffectiveRealmIds(
          hero,
          overviewState.dungeons
        );

        let assignedCount = 0;
        let selesai = 0;
        let scoredSum = 0;
        let gradedCount = 0;

        overviewState.quests.forEach((quest) => {
          const grade = gradeMap.get(`${hero.id}__${quest.id}`);
          const isRealmAllowed =
            !allowedRealms || allowedRealms.includes(quest.realmId);
          const isQuestForDungeon = doesTargetMatchDungeon(
            quest.dungeonId,
            hero.dungeonId
          );
          const isClassScheduled =
            quest.scheduledAt !== '__per_class__' ||
            Boolean(quest.classSchedules?.[hero.dungeonId]) ||
            Boolean(grade);

          if (!isRealmAllowed || !isQuestForDungeon || !isClassScheduled) {
            return;
          }

          assignedCount++;
          const status = getEffectiveGradeStatus(grade);
          if (status === 'tuntas') {
            selesai++;
          }
          if (grade && status !== 'belum') {
            scoredSum += Math.max(0, Math.min(100, Number(grade.score) || 0));
            gradedCount++;
          }
        });

        const avgScore =
          assignedCount > 0 ? Math.round(scoredSum / assignedCount) : 0;
        const rank =
          assignedCount > 0 && gradedCount > 0
            ? getRankFromScore(avgScore)
            : '-';

        if (hero.active) {
          totalExpSum += exp;
          totalTuntasActive += selesai;
          totalAssignedActive += assignedCount;
          totalEarnedScoreActive += scoredSum;
        }

        return {
          hero,
          exp,
          level: lvl.level,
          title: lvl.title,
          selesai,
          assignedCount,
          avgScore,
          rank,
        };
      })
      .sort(
        (a, b) =>
          b.exp - a.exp || a.hero.name.localeCompare(b.hero.name, 'id')
      );

    const pct =
      totalAssignedActive > 0
        ? Math.min(
            100,
            Math.round((totalTuntasActive / totalAssignedActive) * 100)
          )
        : 0;
    const avgScoreOverall =
      totalAssignedActive > 0
        ? Math.round(totalEarnedScoreActive / totalAssignedActive)
        : 0;
    const avgExp =
      active.length > 0 ? Math.round(totalExpSum / active.length) : 0;

    return {
      classHeroes: filteredHeroes,
      activeHeroes: active,
      questSelesaiCount: totalTuntasActive,
      totalAssignedSlots: totalAssignedActive,
      completionPercent: pct,
      averageScore: avgScoreOverall,
      averageExp: avgExp,
      heroSummaries: summaries,
    };
  }, [
    overviewState.heroes,
    overviewState.dungeons,
    overviewState.grades,
    overviewState.quests,
    scope,
  ]);

  const activeEra =
    overviewState.academicYears?.find((y) => y.isActive) ||
    overviewState.academicYears?.[0];
  const activeSeason = overviewState.settings.activeSeason || 'ganjil';
  const periodLabel = buildAcademicPeriodLabel(activeEra?.name, activeSeason);

  const handleExportCsv = () => {
    const header = [
      'No',
      'Nama Hero',
      'Kode Siswa / NIM',
      'Kelas (Dungeon)',
      'Periode (Era & Season)',
      'Level',
      'Gelar',
      'Total EXP',
      'Tugas Diberikan',
      'Quest Selesai',
      'Rata-rata Nilai',
      'Predikat',
      'Status Akun',
    ];

    const lines = [
      header.map(escapeCsvCell).join(','),
      ...heroSummaries.map((row, idx) => {
        const dng = dungeonMap.get(row.hero.dungeonId);
        return [
          idx + 1,
          row.hero.name,
          row.hero.studentCode,
          dng ? `${dng.guildCode} - ${dng.name} (${dng.tier})` : 'Tanpa Kelas',
          periodLabel,
          `Lv.${row.level}`,
          row.title,
          row.exp,
          row.assignedCount,
          row.selesai,
          row.avgScore,
          row.rank,
          row.hero.active ? 'Aktif' : 'Nonaktif',
        ]
          .map(escapeCsvCell)
          .join(',');
      }),
    ];

    const csvContent = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const slug = selectedSingleDungeon
      ? selectedSingleDungeon.guildCode
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
      : scope.activeSelectedDungeonIds.length > 1
        ? 'multi-kelas'
        : selectedTier !== 'all'
          ? selectedTier.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          : 'semua-kelas';
    const eraSlug = activeEra?.name
      ? `-${activeEra.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : '';
    const link = document.createElement('a');
    link.href = url;
    link.download = `guild-chronicles-${slug}${eraSlug}-season-${activeSeason}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="no-print print:hidden space-y-3">
        <PixelSectionTitle
          title="Guild Chronicles & Laporan"
          subtitle="Cetak laporan semester lengkap (Materi, Tugas, & Nilai) tiap Tahun Pelajaran atau lihat statistik cepat"
          action={
            activeTab === 'report' ? (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <PixelButton
                  type="button"
                  variant="primary"
                  onClick={handlePrintReport}
                  className="flex-1 sm:flex-initial"
                >
                  <Printer size={15} />
                  <span>Cetak / PDF</span>
                </PixelButton>
                <PixelButton
                  type="button"
                  variant="warning"
                  onClick={() => downloadSemesterReportExcel(report)}
                  className="flex-1 sm:flex-initial"
                >
                  <FileSpreadsheet size={15} />
                  <span>Unduh Excel</span>
                </PixelButton>
              </div>
            ) : (
              <PixelButton
                type="button"
                variant="warning"
                onClick={handleExportCsv}
                disabled={heroSummaries.length === 0}
                className="w-full sm:w-auto"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </PixelButton>
            )
          }
        />

        {/* Mode Switch Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`pixel-btn min-h-[40px] px-3.5 py-2 font-pixel-ui text-[11px] flex items-center gap-2 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
            }`}
          >
            <Printer size={15} />
            <span>Laporan &amp; Cetak Semester</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pixel-btn min-h-[40px] px-3.5 py-2 font-pixel-ui text-[11px] flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
            }`}
          >
            <BarChart3 size={15} />
            <span>Statistik Ringkas &amp; CSV</span>
          </button>
        </div>
      </div>

      {activeTab === 'report' ? (
        <div className="space-y-4">
          {/* Report Filter Controls */}
          <ThemedPanelCard className="no-print print:hidden p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Filter
                size={15}
                className="text-[var(--accent-warning)] shrink-0"
              />
              <h3 className="font-pixel-ui text-[11.5px] uppercase text-[var(--accent-warning)]">
                Filter Periode &amp; Cakupan Laporan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <PixelFieldLabel htmlFor="rep-era">
                  Tahun Pelajaran (Era)
                </PixelFieldLabel>
                <PixelSelect
                  id="rep-era"
                  value={effectiveEraId}
                  onChange={(e) => {
                    setReportEraId(e.target.value);
                    setReportDungeonId('all');
                  }}
                >
                  {academicYears.map((era) => (
                    <option key={era.id} value={era.id}>
                      {era.name}
                      {era.isActive ? ' (Aktif)' : ' (Arsip)'}
                    </option>
                  ))}
                </PixelSelect>
              </div>

              <div>
                <PixelFieldLabel htmlFor="rep-season">Semester</PixelFieldLabel>
                <PixelSelect
                  id="rep-season"
                  value={reportSeason}
                  onChange={(e) =>
                    setReportSeason(e.target.value as SeasonId | 'all')
                  }
                >
                  <option value="ganjil">Semester 1 (Ganjil)</option>
                  <option value="genap">Semester 2 (Genap)</option>
                  <option value="all">Ganjil &amp; Genap (1 Tahun)</option>
                </PixelSelect>
              </div>

              <div>
                <PixelFieldLabel htmlFor="rep-dungeon">
                  Kelas / Rombel
                </PixelFieldLabel>
                <PixelSelect
                  id="rep-dungeon"
                  value={effectiveDungeonId}
                  onChange={(e) => setReportDungeonId(e.target.value)}
                >
                  <option value="all">
                    Semua Kelas ({eraDungeons.length})
                  </option>
                  {eraDungeons.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.guildCode} — {d.name} ({d.tier})
                    </option>
                  ))}
                </PixelSelect>
              </div>

              <div>
                <PixelFieldLabel htmlFor="rep-realm">
                  Mata Pelajaran
                </PixelFieldLabel>
                <PixelSelect
                  id="rep-realm"
                  value={reportRealmId}
                  onChange={(e) => setReportRealmId(e.target.value)}
                >
                  <option value="all">Semua Mata Pelajaran</option>
                  {sortedRealms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </option>
                  ))}
                </PixelSelect>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[var(--border-pixel)]/30 text-[13px]">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--text-primary)] font-medium">
                <input
                  type="checkbox"
                  checked={includeGeneralTomes}
                  onChange={(e) => setIncludeGeneralTomes(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent-success)]"
                />
                <span>Sertakan materi umum / lintas semester</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--text-primary)] font-medium">
                <input
                  type="checkbox"
                  checked={showDetailedQuestMatrix}
                  onChange={(e) => setShowDetailedQuestMatrix(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent-success)]"
                />
                <span>Tampilkan tabel rincian skor per tugas</span>
              </label>
            </div>
          </ThemedPanelCard>

          {/* Formal Printable Paper Sheet */}
          <div
            id="printable-semester-report"
            className="print-report-sheet bg-white text-slate-900 border-2 border-[var(--border-pixel)] rounded-[var(--card-radius)] p-4 sm:p-6 shadow-[4px_4px_0_0_var(--shadow-ink)] space-y-5"
          >
            {/* Header / Kop Laporan */}
            <header className="border-b-2 border-slate-900 pb-3.5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                    Pixel Quest Academy · Dokumen Akademik Resmi
                  </p>
                  <h2 className="text-[18px] sm:text-[20px] font-extrabold text-slate-950 tracking-tight leading-snug">
                    LAPORAN PEMBELAJARAN SEMESTER
                  </h2>
                  <p className="text-[13.5px] font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                    <CalendarDays size={14} className="shrink-0 text-slate-700" />
                    <span>{report.periodTitle}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right text-[12px] text-slate-600 shrink-0">
                  <p>Tanggal Cetak:</p>
                  <p className="font-bold text-slate-900">{report.printedAt}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-slate-300 text-[12.5px]">
                <p>
                  <span className="text-slate-600">Guru / Game Master:</span>{' '}
                  <strong className="text-slate-950">{report.gmName}</strong>
                </p>
                <p>
                  <span className="text-slate-600">Kelas / Rombel:</span>{' '}
                  <strong className="text-slate-950">{report.classLabel}</strong>
                </p>
                <p>
                  <span className="text-slate-600">Jabatan / Bidang:</span>{' '}
                  <strong className="text-slate-950">
                    {[report.gmTitle, report.gmSpecialty]
                      .filter(Boolean)
                      .join(' · ') || '-'}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-600">Mata Pelajaran:</span>{' '}
                  <strong className="text-slate-950">{report.realmLabel}</strong>
                </p>
              </div>
            </header>

            {/* Executive Summary Grid */}
            <section className="print-avoid-break grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="border border-slate-300 bg-slate-50 p-2.5 rounded">
                <p className="text-[10.5px] uppercase font-bold text-slate-600">
                  Jumlah Kelas
                </p>
                <p className="text-[18px] font-extrabold text-slate-900 tabular-nums">
                  {report.summary.totalClasses}
                </p>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-2.5 rounded">
                <p className="text-[10.5px] uppercase font-bold text-slate-600">
                  Siswa Aktif
                </p>
                <p className="text-[18px] font-extrabold text-slate-900 tabular-nums">
                  {report.summary.activeHeroes}
                  <span className="text-[11px] font-normal text-slate-600">
                    /{report.summary.totalHeroes}
                  </span>
                </p>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-2.5 rounded">
                <p className="text-[10.5px] uppercase font-bold text-slate-600">
                  Materi (Tomes)
                </p>
                <p className="text-[18px] font-extrabold text-slate-900 tabular-nums">
                  {report.summary.totalTomes}
                </p>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-2.5 rounded">
                <p className="text-[10.5px] uppercase font-bold text-slate-600">
                  Tugas (Quests)
                </p>
                <p className="text-[18px] font-extrabold text-slate-900 tabular-nums">
                  {report.summary.totalQuests}
                </p>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-2.5 rounded">
                <p className="text-[10.5px] uppercase font-bold text-slate-600">
                  Ketuntasan
                </p>
                <p className="text-[18px] font-extrabold text-emerald-700 tabular-nums">
                  {report.summary.completionPercent}%
                </p>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-2.5 rounded">
                <p className="text-[10.5px] uppercase font-bold text-slate-600">
                  Rata-rata Nilai
                </p>
                <p className="text-[18px] font-extrabold text-indigo-700 tabular-nums">
                  {report.summary.averageScore}
                </p>
              </div>
            </section>

            {/* Section A: Materi Pembelajaran (Tomes) */}
            <section className="space-y-2">
              <h3 className="text-[13.5px] font-extrabold uppercase tracking-wide text-slate-900 border-b border-slate-400 pb-1 flex items-center gap-1.5">
                <BookOpen size={15} className="shrink-0" />
                <span>
                  A. Rekap Materi Pembelajaran ({report.tomes.length})
                </span>
              </h3>
              {report.tomes.length === 0 ? (
                <p className="text-[12.5px] text-slate-600 italic py-2">
                  Tidak ada materi pembelajaran yang tercatat pada filter periode ini.
                </p>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-400 px-2 py-1.5 text-center w-9">
                          No
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Mapel
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Bab
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Judul Materi
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Ringkasan
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Target Kelas
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Tgl Terbit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.tomes.map((row) => (
                        <tr key={row.tome.id}>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                            {row.no}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                            {row.realmName}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {row.chapterLabel}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-950">
                            {row.tome.title}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-slate-700">
                            {row.tome.summary || '-'}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">
                            {row.targetLabel}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {row.publishedLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section B: Tugas Pembelajaran (Quests) */}
            <section className="space-y-2">
              <h3 className="text-[13.5px] font-extrabold uppercase tracking-wide text-slate-900 border-b border-slate-400 pb-1 flex items-center gap-1.5">
                <ClipboardList size={15} className="shrink-0" />
                <span>
                  B. Rekap Tugas Pembelajaran ({report.quests.length})
                </span>
              </h3>
              {report.quests.length === 0 ? (
                <p className="text-[12.5px] text-slate-600 italic py-2">
                  Tidak ada tugas yang tercatat pada filter periode ini.
                </p>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-400 px-2 py-1.5 text-center w-9">
                          No
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Mapel
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Kategori
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Judul Tugas
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Tingkat
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Max EXP
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Tenggat
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Target Kelas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.quests.map((row) => (
                        <tr key={row.quest.id}>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                            {row.no}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                            {row.realmName}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {row.categoryLabel}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-950">
                            {row.quest.title}
                            {row.quest.chapter ? (
                              <span className="block text-[11px] font-normal text-slate-600">
                                Topik: {row.quest.chapter}
                              </span>
                            ) : null}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {row.quest.difficulty}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                            +{row.quest.maxExp}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {row.deadlineLabel}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">
                            {row.targetLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section C: Rekapitulasi Nilai & Ketuntasan Siswa */}
            <section className="space-y-2">
              <div className="border-b border-slate-400 pb-1 space-y-0.5">
                <h3 className="text-[13.5px] font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                  <Award size={15} className="shrink-0" />
                  <span>
                    C. Rekapitulasi Nilai &amp; Ketuntasan Siswa (
                    {report.studentRows.length})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600">
                  Rumus Rata-rata = Total Nilai Diperoleh &divide; Jumlah Tugas yang Diterima Siswa (menyesuaikan jumlah tugas per kelas &amp; mapel).
                </p>
              </div>
              {report.studentRows.length === 0 ? (
                <p className="text-[12.5px] text-slate-600 italic py-2">
                  Belum ada data siswa pada kelas atau mata pelajaran yang dipilih.
                </p>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-400 px-2 py-1.5 text-center w-9">
                          No
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          NIS
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Nama Siswa
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">
                          Kelas
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Tugas
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Tuntas
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Proses
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Remidial
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Belum
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Rata-rata
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Predikat
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">
                          Total EXP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.studentRows.map((row) => (
                        <tr key={row.hero.id}>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                            {row.no}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap tabular-nums">
                            {row.hero.studentCode}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-950">
                            {row.hero.name}
                            {!row.hero.active && (
                              <span className="ml-1 text-[10.5px] font-normal text-rose-700">
                                (Nonaktif)
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {row.dungeonCode !== '-'
                              ? row.dungeonCode
                              : row.dungeonName}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums font-semibold text-slate-800">
                            {row.assignedCount}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums font-semibold text-emerald-800">
                            {row.tuntasCount}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                            {row.prosesCount}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums text-rose-700">
                            {row.remidialCount}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums text-slate-600">
                            {row.belumCount}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums font-bold">
                            {row.avgScore}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                            {row.rank}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                            {row.totalExp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section D: Detailed Quest Score Matrix */}
            {showDetailedQuestMatrix &&
              report.rawQuests.length > 0 &&
              report.studentRows.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[13.5px] font-extrabold uppercase tracking-wide text-slate-900 border-b border-slate-400 pb-1">
                    D. Rincian Skor per Tugas ({report.rawQuests.length} Tugas)
                  </h3>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900">
                          <th className="border border-slate-400 px-1.5 py-1 text-center w-8">
                            No
                          </th>
                          <th className="border border-slate-400 px-2 py-1 text-left min-w-[140px]">
                            Nama Siswa
                          </th>
                          {report.rawQuests.map((q, qIdx) => (
                            <th
                              key={q.id}
                              className="border border-slate-400 px-1.5 py-1 text-center min-w-[78px]"
                              title={q.title}
                            >
                              T{qIdx + 1}: {q.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.studentRows.map((row) => (
                          <tr key={row.hero.id}>
                            <td className="border border-slate-300 px-1.5 py-1 text-center tabular-nums">
                              {row.no}
                            </td>
                            <td className="border border-slate-300 px-2 py-1 font-semibold">
                              {row.hero.name}
                            </td>
                            {row.cells.map((cell) => (
                              <td
                                key={cell.questId}
                                className="border border-slate-300 px-1.5 py-1 text-center tabular-nums"
                              >
                                {cell.displayText}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

            {/* Signature Footer */}
            <footer className="print-avoid-break pt-6 flex justify-end">
              <div className="w-64 text-center text-[12.5px] space-y-14">
                <div>
                  <p className="text-slate-600">{report.printedAt}</p>
                  <p className="font-bold text-slate-950">
                    Mengetahui, Guru Pengampu / Game Master
                  </p>
                </div>
                <div className="border-t border-slate-800 pt-1">
                  <p className="font-bold text-slate-950">{report.gmName}</p>
                  <p className="text-[11px] text-slate-600">{report.gmTitle}</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        <div className="no-print print:hidden space-y-4">
          {/* Tingkat & Dungeon Filter */}
          <ThemedPanelCard className="p-3.5">
            <TierDungeonFilter
              idPrefix="chronicles"
              dungeons={overviewState.dungeons}
              selectedTier={selectedTier}
              onChangeTier={setSelectedTier}
              selectedDungeonIds={selectedDungeonIds}
              onChangeDungeonIds={setSelectedDungeonIds}
              allTotalCount={overviewState.heroes.length}
              getTierCount={(tierDungeons) => {
                const set = new Set(tierDungeons.map((d) => d.id));
                return overviewState.heroes.filter((h) =>
                  set.has(h.dungeonId)
                ).length;
              }}
            />
          </ThemedPanelCard>

          {/* 3 Big Parchment Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ThemedPanelCard className="p-4 space-y-1.5 bg-[var(--surface-tint)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-pixel-ui text-[11px] uppercase text-[var(--text-secondary)]">
                  Quest Selesai
                </span>
                <CheckCircle2
                  size={17}
                  className="text-[var(--accent-success)] shrink-0"
                />
              </div>
              <p className="font-pixel-display text-[16px] sm:text-[18px] leading-tight text-[var(--accent-success)] tabular-nums">
                {questSelesaiCount}
                <span className="text-[12px] font-normal text-[var(--text-secondary)]">
                  /{totalAssignedSlots}
                </span>
              </p>
              <p className="text-[12.5px] sm:text-[13px] text-[var(--text-secondary)]">
                Tingkat ketuntasan:{' '}
                <strong className="text-[var(--text-primary)]">
                  {completionPercent}%
                </strong>
              </p>
            </ThemedPanelCard>

            <ThemedPanelCard className="p-4 space-y-1.5 bg-[var(--surface-tint)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-pixel-ui text-[11px] uppercase text-[var(--text-secondary)]">
                  Rata-rata Nilai &amp; EXP
                </span>
                <Award
                  size={17}
                  className="text-[var(--accent-warning)] shrink-0"
                />
              </div>
              <p className="font-pixel-display text-[16px] sm:text-[18px] leading-tight text-[var(--accent-warning)] tabular-nums">
                {averageScore}
              </p>
              <p className="text-[12.5px] sm:text-[13px] text-[var(--text-secondary)]">
                Nilai &divide; tugas diberikan ·{' '}
                <strong className="text-[var(--text-primary)]">
                  {averageExp} EXP
                </strong>
              </p>
            </ThemedPanelCard>

            <ThemedPanelCard className="p-4 space-y-1.5 bg-[var(--surface-tint)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-pixel-ui text-[11px] uppercase text-[var(--text-secondary)]">
                  Heroes Aktif
                </span>
                <Users
                  size={17}
                  className="text-[var(--accent-primary)] shrink-0"
                />
              </div>
              <p className="font-pixel-display text-[16px] sm:text-[18px] leading-tight text-[var(--accent-primary)] tabular-nums">
                {activeHeroes.length}
              </p>
              <p className="text-[12.5px] sm:text-[13px] text-[var(--text-secondary)]">
                Dari {classHeroes.length} terdaftar
                {selectedSingleDungeon
                  ? ` (Kap. ${selectedSingleDungeon.capacity})`
                  : ''}
              </p>
            </ThemedPanelCard>
          </div>

          {/* Simple Class Roster Summary List */}
          {heroSummaries.length === 0 ? (
            <PixelEmptyState
              title="Belum Ada Data Kelas"
              description="Tambahkan Heroes pada Dungeon yang dipilih untuk melihat ringkasan statistiknya."
              compact
            />
          ) : (
            <ThemedPanelCard className="p-3.5 sm:p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-pixel-display text-[13px] text-[var(--text-primary)]">
                  Ringkasan Heroes ({heroSummaries.length})
                </h3>
                <p className="text-[11.5px] text-[var(--text-secondary)]">
                  Nilai rata-rata = Nilai diperoleh &divide; tugas diterima
                </p>
              </div>
              <div className="space-y-2">
                {heroSummaries.map((item, idx) => {
                  const dng = dungeonMap.get(item.hero.dungeonId);
                  return (
                    <div
                      key={item.hero.id}
                      className="pixel-box-inset p-3 flex flex-col min-[460px]:flex-row min-[460px]:items-center justify-between gap-2 text-[13.5px]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text-primary)] truncate">
                          {idx + 1}. {item.hero.name}
                        </p>
                        <p className="text-[12px] text-[var(--text-secondary)] truncate">
                          {dng ? `${dng.name} (${dng.tier})` : 'Tanpa Kelas'} ·
                          Lv.{item.level} · {item.selesai}/{item.assignedCount}{' '}
                          Tugas Tuntas · Rata-rata: {item.avgScore} ({item.rank})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-pixel-display text-[12.5px] text-[var(--accent-warning)] tabular-nums">
                          {item.exp} EXP
                        </span>
                        {!item.hero.active && (
                          <span className="px-2 py-0.5 text-[11px] border border-rose-700 bg-rose-50 text-rose-900 font-semibold">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ThemedPanelCard>
          )}
        </div>
      )}
    </div>
  );
};
