import React, { useMemo, useState } from 'react';
import {
  AcademyState,
  GmMenuId,
} from '../../types/lms';
import { PixelAvatar, PixelCoin, PixelStar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelFieldLabel,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import {
  ComparisonHorizontalBarChart,
  RankHistogramChart,
  StatusDonutChart,
} from '../../components/DashboardCharts';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  computeDashboardAnalytics,
  doesTargetMatchDungeon,
  getGmLevelProgress,
} from '../../utils/exp';

export interface GmDashboardProps {
  /** Current academy data state. */
  state: AcademyState;
  /** Navigation handler switching to a GM sub-module. */
  onNavigate: (menu: GmMenuId) => void;
  /** Formatted timestamp string of the last completed sync (e.g. "14:22"). */
  lastSyncTimeLabel?: string | null;
  /** Live sync status indicator. */
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

/**
 * Game Master HQ dashboard displaying GM level/XP progression,
 * live academy KPIs, and interactive graphic reports (status donut,
 * rank histogram, and class/subject/quest-category comparison bars).
 */
export const GmDashboard: React.FC<GmDashboardProps> = React.memo(({
  state,
  onNavigate,
  lastSyncTimeLabel = null,
  syncStatus = 'idle',
}) => {
  const heroes = state?.heroes ?? [];
  const dungeons = state?.dungeons ?? [];
  const quests = state?.quests ?? [];
  const tomes = state?.tomes ?? [];
  const grades = state?.grades ?? [];
  const notices = state?.notices ?? [];
  const realms = state?.realms ?? [];

  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<string>('all');

  const gmName = state?.gmProfile?.name?.trim() || 'Game Master';
  const gmTitle = state?.gmProfile?.title?.trim() || 'Guild Overseer';
  const gmAvatar = state?.gmProfile?.avatar || 'guild_master';
  const academicTerm =
    state?.settings?.academicTerm?.trim() || 'Tahun Ajaran Aktif';

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(dungeons, selectedTier, selectedDungeonIds),
    [dungeons, selectedTier, selectedDungeonIds]
  );

  const {
    activeHeroes,
    pendingQuestsCount,
    gmLevel,
    hasAnyAcademyData,
  } = useMemo(() => {
    const activeCount = heroes.filter((h) => Boolean(h?.active)).length;

    const waitingQuests = quests.filter((q) => {
      const targetHeroes = heroes.filter(
        (h) => h.active && doesTargetMatchDungeon(q.dungeonId, h.dungeonId)
      );
      if (targetHeroes.length === 0) return true;
      return targetHeroes.some((h) => {
        const g = grades.find((gr) => gr.heroId === h.id && gr.questId === q.id);
        return (
          !g ||
          (g.status !== 'tuntas' &&
            (g.status || (g.score >= 70 ? 'tuntas' : 'remidial')) !== 'tuntas')
        );
      });
    }).length;

    const levelProgress = getGmLevelProgress({
      dungeonsCount: dungeons.length,
      heroesCount: heroes.length,
      tomesCount: tomes.length,
      questsCount: quests.length,
      gradesCount: grades.length,
      noticesCount: notices.length,
    });

    return {
      activeHeroes: activeCount,
      pendingQuestsCount: waitingQuests,
      gmLevel: levelProgress,
      hasAnyAcademyData:
        heroes.length > 0 ||
        dungeons.length > 0 ||
        quests.length > 0,
    };
  }, [heroes, dungeons.length, tomes.length, quests, grades, notices.length]);

  const analytics = useMemo(
    () =>
      computeDashboardAnalytics({
        dungeons,
        heroes,
        quests,
        grades,
        realms,
        scopedDungeonIds: scope.isFiltered ? scope.activeDungeonIdSet : null,
        selectedRealmId,
      }),
    [
      dungeons,
      heroes,
      quests,
      grades,
      realms,
      scope.isFiltered,
      scope.activeDungeonIdSet,
      selectedRealmId,
    ]
  );

  const overallCompletion = useMemo(
    () =>
      computeDashboardAnalytics({
        dungeons,
        heroes,
        quests,
        grades,
        realms,
      }).status,
    [dungeons, heroes, quests, grades, realms]
  );

  const syncLabel =
    syncStatus === 'syncing'
      ? 'Syncing...'
      : syncStatus === 'error'
        ? 'Perlu Retry'
        : lastSyncTimeLabel
          ? `✓ ${lastSyncTimeLabel}`
          : 'Lokal';

  return (
    <div className="space-y-5 min-w-0 w-full">
      {/* GM Identity Banner + Level Bar + 4 Live Academic KPI Cards */}
      <ThemedPanelCard className="space-y-3 comic-halftone min-w-0">
        <div className="flex items-center gap-3 min-w-0 pt-1">
          <PixelAvatar
            avatar={gmAvatar}
            size={52}
            className="shrink-0 animate-pixel-bounce"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-warning)] min-w-0">
                <PixelStar size={12} className="shrink-0" />
                <span className="truncate">GUILD MASTER ONLINE</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--comic-gold)] border border-[var(--border-pixel)] font-pixel-ui text-[10px] font-bold text-[#09090f] shrink-0 tabular-nums">
                GM Lv.{gmLevel.level}
              </span>
            </div>
            <h2 className="font-pixel-display text-[12px] sm:text-[13px] text-[var(--text-primary)] break-words [overflow-wrap:anywhere]">
              {gmName}
            </h2>
            <p className="text-[12.5px] text-[var(--text-secondary)] break-words [overflow-wrap:anywhere]">
              {gmTitle} · {academicTerm}
            </p>
            <div className="pt-0.5">
              <PixelExpBar
                percent={gmLevel.percent}
                labelLeft={`XP ${gmLevel.title}`}
                labelRight={`${gmLevel.expIntoLevel}/${gmLevel.expForNextLevel} XP`}
                color="var(--accent-primary)"
              />
            </div>
          </div>
        </div>

        {/* 4 Live KPI Counters (No Notice / Pengumuman clutter) */}
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 min-w-0">
          <div className="pixel-box-inset p-3 min-w-0 overflow-hidden">
            <p className="font-pixel-ui text-[10px] sm:text-[10.5px] text-[var(--text-muted)] flex items-center justify-between gap-1 min-w-0">
              <span className="truncate">HEROES AKTIF</span>
              <PixelStar size={14} className="shrink-0 text-[var(--accent-success)]" />
            </p>
            <p className="font-pixel-display text-[14.5px] sm:text-[16px] text-[var(--accent-success)] tabular-nums truncate mt-1.5">
              {activeHeroes}/{heroes.length}
            </p>
          </div>
          <div className="pixel-box-inset p-3 min-w-0 overflow-hidden">
            <p className="font-pixel-ui text-[10px] sm:text-[10.5px] text-[var(--text-muted)] flex items-center justify-between gap-1 min-w-0">
              <span className="truncate">QUESTS MENUNGGU</span>
              <span className="shrink-0 text-[13px]" aria-hidden="true">⚔️</span>
            </p>
            <p className="font-pixel-display text-[14.5px] sm:text-[16px] text-[var(--accent-warning)] tabular-nums truncate mt-1.5">
              {pendingQuestsCount}/{quests.length}
            </p>
          </div>
          <div className="pixel-box-inset p-3 min-w-0 overflow-hidden">
            <p className="font-pixel-ui text-[10px] sm:text-[10.5px] text-[var(--text-muted)] flex items-center justify-between gap-1 min-w-0">
              <span className="truncate">KETUNTASAN</span>
              <span className="shrink-0 text-[13px]" aria-hidden="true">📊</span>
            </p>
            <p className="font-pixel-display text-[14.5px] sm:text-[16px] text-[var(--accent-primary)] tabular-nums truncate mt-1.5">
              {overallCompletion.completionPercent}% · Skor {overallCompletion.averageScore}
            </p>
          </div>
          <div className="pixel-box-inset p-3 min-w-0 overflow-hidden">
            <p className="font-pixel-ui text-[10px] sm:text-[10.5px] text-[var(--text-muted)] flex items-center justify-between gap-1 min-w-0">
              <span className="truncate">LAST SYNC</span>
              <PixelCoin size={14} className="shrink-0 animate-coin-shine" />
            </p>
            <p className="font-pixel-display text-[13.5px] sm:text-[14.5px] text-[#0369a1] tabular-nums truncate mt-1.5">
              {syncLabel}
            </p>
          </div>
        </div>

        {!hasAnyAcademyData && (
          <div className="pixel-box-inset p-3 flex flex-wrap items-center justify-between gap-2.5 min-w-0">
            <p className="text-[12.5px] text-[var(--text-secondary)] leading-snug min-w-0 flex-1 break-words">
              Guild masih kosong — belum ada Dungeons, Heroes, atau Quests yang tercatat.
            </p>
            <PixelButton
              type="button"
              size="sm"
              variant="primary"
              onClick={() => onNavigate('dungeons')}
            >
              + Buat Dungeon
            </PixelButton>
          </div>
        )}
      </ThemedPanelCard>

      {/* Academic Graphical Reports Section */}
      <section className="space-y-3.5 min-w-0">
        <PixelSectionTitle
          title="Laporan Grafik Akademik"
          subtitle="Ringkasan visual ketuntasan, sebaran nilai S–D, dan perbandingan antar kelas/mapel"
          action={
            hasAnyAcademyData ? (
              <div className="flex flex-wrap items-center gap-2">
                <PixelButton
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigate('exp_loot')}
                >
                  Buka Penilaian
                </PixelButton>
                <PixelButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  onClick={() => onNavigate('guild_chronicles')}
                >
                  Statistik Lengkap
                </PixelButton>
              </div>
            ) : undefined
          }
        />

        {!hasAnyAcademyData ? (
          <PixelEmptyChest
            title="Laporan Grafik Belum Tersedia"
            description="Tambahkan kelas, siswa, dan tugas terlebih dahulu agar grafik perkembangan dan nilai muncul di sini."
            action={
              <PixelButton
                type="button"
                size="sm"
                variant="warning"
                onClick={() => onNavigate('active_quests')}
              >
                Kelola Tugas
              </PixelButton>
            }
          />
        ) : (
          <>
            {/* Interactive Filter Toolbar */}
            <ThemedPanelCard className="p-3.5">
              <TierDungeonFilter
                idPrefix="hq-chart"
                dungeons={dungeons}
                selectedTier={selectedTier}
                onChangeTier={setSelectedTier}
                selectedDungeonIds={selectedDungeonIds}
                onChangeDungeonIds={setSelectedDungeonIds}
                allTotalCount={heroes.length}
                getTierCount={(tierDungeons) => {
                  const set = new Set(tierDungeons.map((d) => d.id));
                  return heroes.filter((h) => set.has(h.dungeonId)).length;
                }}
                extraLeftSlot={
                  <div>
                    <PixelFieldLabel htmlFor="hq-chart-realm">
                      Filter Mata Pelajaran
                    </PixelFieldLabel>
                    <PixelSelect
                      id="hq-chart-realm"
                      value={selectedRealmId}
                      onChange={(e) => setSelectedRealmId(e.target.value)}
                      aria-label="Filter Mata Pelajaran"
                    >
                      <option value="all">
                        Semua Mapel ({realms.length})
                      </option>
                      {realms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} — {r.name}
                        </option>
                      ))}
                    </PixelSelect>
                  </div>
                }
              />
            </ThemedPanelCard>

            {/* Row 1: Donut Chart + Vertical Rank Histogram */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 min-w-0">
              <StatusDonutChart status={analytics.status} />
              <RankHistogramChart
                ranks={analytics.ranks}
                gradedCount={analytics.status.gradedCount}
              />
            </div>

            {/* Row 2: Full-width Horizontal Bar Chart (Per Kelas / Per Mapel / Per Kategori) */}
            <ComparisonHorizontalBarChart analytics={analytics} />
          </>
        )}
      </section>
    </div>
  );
});

GmDashboard.displayName = 'GmDashboard';
