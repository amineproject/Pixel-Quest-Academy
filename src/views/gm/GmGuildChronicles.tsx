import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Download, Users } from 'lucide-react';
import { AcademyState } from '../../types/lms';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import {
  PixelButton,
  PixelEmptyState,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  buildAcademicPeriodLabel,
  escapeCsvCell,
  getEffectiveGradeStatus,
  getHeroLevelProgress,
  getHeroTotalExp,
} from '../../utils/exp';

interface GmGuildChroniclesProps {
  state: AcademyState;
}

/**
 * Menu 2: Guild Chronicles (Statistik Kelas) — Game Master only.
 * Displays 3 big parchment stat cards (Quest Selesai, Rata-rata EXP, Heroes Aktif),
 * Dungeon filter, and one-click CSV export without heavy charts.
 */
export const GmGuildChronicles: React.FC<GmGuildChroniclesProps> = ({ state }) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(state.dungeons, selectedTier, selectedDungeonIds),
    [state.dungeons, selectedTier, selectedDungeonIds]
  );

  const selectedSingleDungeon =
    scope.isFiltered && scope.activeDungeons.length === 1
      ? scope.activeDungeons[0]
      : null;

  const dungeonMap = useMemo(
    () => new Map(state.dungeons.map((d) => [d.id, d])),
    [state.dungeons]
  );

  const {
    classHeroes,
    activeHeroes,
    questSelesaiCount,
    completionPercent,
    averageExp,
    heroSummaries,
  } = useMemo(() => {
    const filteredHeroes = scope.isFiltered
      ? state.heroes.filter((h) => scope.activeDungeonIdSet.has(h.dungeonId))
      : state.heroes;
    const active = filteredHeroes.filter((h) => h.active);
    const activeIds = new Set(active.map((h) => h.id));

    const classGrades = state.grades.filter((g) => activeIds.has(g.heroId));
    const tuntasCount = classGrades.filter(
      (g) => getEffectiveGradeStatus(g) === 'tuntas'
    ).length;

    const relevantQuests = state.quests.filter(
      (q) =>
        !scope.isFiltered ||
        q.dungeonId === 'all' ||
        scope.activeDungeonIdSet.has(q.dungeonId)
    );
    const possibleCompletions = active.length * relevantQuests.length;
    const pct =
      possibleCompletions > 0
        ? Math.min(100, Math.round((tuntasCount / possibleCompletions) * 100))
        : 0;

    let totalExpSum = 0;
    const summaries = filteredHeroes
      .map((hero) => {
        const exp = getHeroTotalExp(hero.id, state.grades);
        if (hero.active) totalExpSum += exp;
        const lvl = getHeroLevelProgress(exp);
        const selesai = state.grades.filter(
          (g) => g.heroId === hero.id && getEffectiveGradeStatus(g) === 'tuntas'
        ).length;
        return {
          hero,
          exp,
          level: lvl.level,
          title: lvl.title,
          selesai,
        };
      })
      .sort((a, b) => b.exp - a.exp || a.hero.name.localeCompare(b.hero.name, 'id'));

    const avgExp =
      active.length > 0 ? Math.round(totalExpSum / active.length) : 0;

    return {
      classHeroes: filteredHeroes,
      activeHeroes: active,
      questSelesaiCount: tuntasCount,
      completionPercent: pct,
      averageExp: avgExp,
      heroSummaries: summaries,
    };
  }, [state.heroes, state.grades, state.quests, scope]);

  const activeEra =
    state.academicYears?.find((y) => y.isActive) || state.academicYears?.[0];
  const activeSeason = state.settings.activeSeason || 'ganjil';
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
      'Quest Selesai',
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
          row.selesai,
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
      ? selectedSingleDungeon.guildCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')
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

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Guild Chronicles"
        subtitle={`Statistik & ekspor CSV untuk ${periodLabel}`}
        action={
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
        }
      />

      {/* Tingkat & Dungeon Filter */}
      <ThemedPanelCard className="p-3.5">
        <TierDungeonFilter
          idPrefix="chronicles"
          dungeons={state.dungeons}
          selectedTier={selectedTier}
          onChangeTier={setSelectedTier}
          selectedDungeonIds={selectedDungeonIds}
          onChangeDungeonIds={setSelectedDungeonIds}
          allTotalCount={state.heroes.length}
          getTierCount={(tierDungeons) => {
            const set = new Set(tierDungeons.map((d) => d.id));
            return state.heroes.filter((h) => set.has(h.dungeonId)).length;
          }}
        />
      </ThemedPanelCard>

      {/* 3 Big Parchment Stat Cards (No Heavy Charts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ThemedPanelCard className="p-4 space-y-2 bg-[var(--surface-tint)]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-pixel-ui text-[11px] uppercase text-[var(--text-secondary)]">
              Quest Selesai
            </span>
            <CheckCircle2 size={18} className="text-[var(--accent-success)] shrink-0" />
          </div>
          <p className="font-pixel-display text-[22px] sm:text-[26px] text-[var(--accent-success)] tabular-nums">
            {questSelesaiCount}
          </p>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Tingkat ketuntasan: <strong className="text-[var(--text-primary)]">{completionPercent}%</strong>
          </p>
        </ThemedPanelCard>

        <ThemedPanelCard className="p-4 space-y-2 bg-[var(--surface-tint)]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-pixel-ui text-[11px] uppercase text-[var(--text-secondary)]">
              Rata-rata EXP
            </span>
            <Award size={18} className="text-[var(--accent-warning)] shrink-0" />
          </div>
          <p className="font-pixel-display text-[22px] sm:text-[26px] text-[var(--accent-warning)] tabular-nums">
            {averageExp}
          </p>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Rata-rata per Hero aktif
          </p>
        </ThemedPanelCard>

        <ThemedPanelCard className="p-4 space-y-2 bg-[var(--surface-tint)]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-pixel-ui text-[11px] uppercase text-[var(--text-secondary)]">
              Heroes Aktif
            </span>
            <Users size={18} className="text-[var(--accent-primary)] shrink-0" />
          </div>
          <p className="font-pixel-display text-[22px] sm:text-[26px] text-[var(--accent-primary)] tabular-nums">
            {activeHeroes.length}
          </p>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Dari {classHeroes.length} terdaftar
            {selectedSingleDungeon ? ` (Kap. ${selectedSingleDungeon.capacity})` : ''}
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
          <h3 className="font-pixel-display text-[13px] text-[var(--text-primary)]">
            Ringkasan Heroes ({heroSummaries.length})
          </h3>
          <div className="space-y-2">
            {heroSummaries.map((item, idx) => {
              const dng = dungeonMap.get(item.hero.dungeonId);
              return (
                <div
                  key={item.hero.id}
                  className="pixel-box-inset p-3 flex flex-col min-[460px]:flex-row min-[460px]:items-center justify-between gap-2 text-[16px]"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--text-primary)] truncate">
                      {idx + 1}. {item.hero.name}
                    </p>
                    <p className="text-[14px] text-[var(--text-secondary)] truncate">
                      {dng ? `${dng.name} (${dng.tier})` : 'Tanpa Kelas'} · Lv.{item.level} · {item.selesai} Quest Tuntas
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-pixel-display text-[13px] text-[var(--accent-warning)] tabular-nums">
                      {item.exp} EXP
                    </span>
                    {!item.hero.active && (
                      <span className="px-2 py-0.5 text-[12px] border border-rose-700 bg-rose-50 text-rose-900 font-semibold">
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
  );
};
