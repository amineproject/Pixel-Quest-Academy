import React, { useMemo } from 'react';
import {
  AcademyState,
  GmMenuId,
} from '../../types/lms';
import { PixelAvatar, PixelCoin, PixelStar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelLinkButton,
  PixelSectionTitle,
} from '../../components/PixelUI';
import {
  ThemedNoticeCard,
  ThemedPanelCard,
} from '../../components/ThemePrimitives';
import {
  doesTargetMatchDungeon,
  formatRetroDate,
  getGmLevelProgress,
  getHeroTotalExp,
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
 * Game Master HQ / Tavern Hall dashboard displaying GM level/XP progression,
 * live academy stats, and Tavern Highlights.
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

  const gmName = state?.gmProfile?.name?.trim() || 'Game Master';
  const gmTitle = state?.gmProfile?.title?.trim() || 'Guild Overseer';
  const gmAvatar = state?.gmProfile?.avatar || 'guild_master';
  const academicTerm =
    state?.settings?.academicTerm?.trim() || 'Tahun Ajaran Aktif';

  const {
    activeHeroes,
    pendingQuestsCount,
    topHero,
    latestNotice,
    gmLevel,
    hasAnyAcademyData,
  } = useMemo(() => {
    const activeCount = heroes.filter((h) => Boolean(h?.active)).length;

    // Quests that have at least one active Hero without a 'tuntas' grade yet
    const waitingQuests = quests.filter((q) => {
      const targetHeroes = heroes.filter(
        (h) => h.active && doesTargetMatchDungeon(q.dungeonId, h.dungeonId)
      );
      if (targetHeroes.length === 0) return true;
      return targetHeroes.some((h) => {
        const g = grades.find((gr) => gr.heroId === h.id && gr.questId === q.id);
        return !g || (g.status !== 'tuntas' && (g.status || (g.score >= 70 ? 'tuntas' : 'remidial')) !== 'tuntas');
      });
    }).length;

    const sortedTopHero =
      heroes.length > 0
        ? [...heroes].sort(
            (a, b) =>
              getHeroTotalExp(b.id, grades) - getHeroTotalExp(a.id, grades)
          )[0]
        : undefined;

    const sortedNotices = [...notices].sort((a, b) =>
      (b.releaseDate || '').localeCompare(a.releaseDate || '')
    );

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
      topHero: sortedTopHero,
      latestNotice: sortedNotices[0],
      gmLevel: levelProgress,
      hasAnyAcademyData:
        heroes.length > 0 ||
        dungeons.length > 0 ||
        quests.length > 0 ||
        notices.length > 0,
    };
  }, [heroes, dungeons.length, tomes.length, quests, grades, notices]);

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
      {/* GM Identity Banner + Level Bar + 4 Live Stat Cards */}
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

        {/* 4 Live KPI Counters (Item 2.1: Heroes aktif, Quests menunggu, Notice terbaru, Last sync) */}
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5 pt-1 min-w-0">
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
              <span className="truncate">NOTICE TERBARU</span>
              <span className="shrink-0 text-[13px]" aria-hidden="true">📜</span>
            </p>
            <p className="font-pixel-display text-[13px] sm:text-[14px] text-[var(--text-primary)] truncate mt-1.5">
              {latestNotice
                ? `${notices.length} · ${formatRetroDate(latestNotice.releaseDate)}`
                : '0 Notice'}
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

      {/* Top Hero & Recent Broadcast Snapshot */}
      <section className="space-y-3 min-w-0">
        <PixelSectionTitle title="Tavern Highlights" />

        {!topHero && !latestNotice ? (
          <PixelEmptyChest
            title="Tavern Highlights Masih Kosong!"
            description="Belum ada data Heroes atau Notice terbaru untuk ditampilkan di aula ini."
            action={
              <PixelButton
                type="button"
                size="sm"
                variant="warning"
                onClick={() => onNavigate('heroes')}
              >
                Kelola Heroes
              </PixelButton>
            }
          />
        ) : (
          <>
            {topHero && (
              <ThemedPanelCard className="p-3.5 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PixelAvatar
                    avatar={topHero.avatar || 'knight'}
                    size={40}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
                      TOP EXP HERO
                    </p>
                    <p className="text-[14.5px] font-bold text-[var(--text-primary)] truncate">
                      {topHero.name || 'Hero'}
                    </p>
                    <p className="text-[12.5px] text-[var(--text-secondary)] truncate">
                      {topHero.heroClass || 'Adventurer'} ·{' '}
                      <span className="font-semibold text-[var(--accent-warning)] tabular-nums">
                        {getHeroTotalExp(topHero.id, grades)} EXP
                      </span>
                    </p>
                  </div>
                </div>
                <PixelButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  onClick={() => onNavigate('exp_loot')}
                  className="shrink-0"
                >
                  Grade
                </PixelButton>
              </ThemedPanelCard>
            )}

            {latestNotice && (
              <ThemedNoticeCard
                speaker={`Latest Notice · ${latestNotice.priority || 'INFO'}`}
                metaRight={formatRetroDate(latestNotice.releaseDate)}
                footer={
                  latestNotice.linkUrl ? (
                    <div className="pt-1 border-t border-[var(--border-pixel)]/30">
                      <PixelLinkButton
                        url={latestNotice.linkUrl}
                        label="Buka Tautan"
                        compact
                      />
                    </div>
                  ) : undefined
                }
              >
                <h3 className="text-[14px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
                  {latestNotice.title || 'Pengumuman Guild'}
                </h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
                  {latestNotice.description || '-'}
                </p>
              </ThemedNoticeCard>
            )}
          </>
        )}
      </section>
    </div>
  );
});

GmDashboard.displayName = 'GmDashboard';
