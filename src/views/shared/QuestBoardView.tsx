import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  Sword,
  Send,
} from 'lucide-react';
import {
  AcademyState,
  ActiveQuest,
  GmMenuId,
  HeroStudent,
  QuestCategory,
  UserRole,
} from '../../types/lms';
import {
  QuestCategoryBadge,
  getQuestCategoryIcon,
} from '../../components/QuestCategoryBadge';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import { PixelRealmGlyph } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyState,
  PixelFieldLabel,
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import { WoodenQuestBoard } from '../../components/WoodenQuestBoard';
import {
  QUEST_CATEGORIES,
  doesTargetMatchDungeon,
  formatChapterLabel,
  formatRetroDate,
  formatTargetDungeonsSummary,
  getDeadlineUrgency,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
  getQuestCategoryMeta,
  isContentVisibleToHero,
  normalizeQuestCategory,
  parseTargetDungeonIds,
} from '../../utils/exp';

export type QuestBoardFilter = 'all' | 'pending' | 'done';
export type SubmissionBadgeStatus = 'belum' | 'dikumpulkan' | 'terlambat' | 'selesai';

interface QuestBoardViewProps {
  state: AcademyState;
  role: UserRole;
  hero?: HeroStudent;
  onNavigateGm?: (menu: GmMenuId) => void;
}

const STATUS_BADGE_MAP: Record<
  SubmissionBadgeStatus,
  { label: string; className: string }
> = {
  selesai: {
    label: 'Selesai',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-800',
  },
  dikumpulkan: {
    label: 'Dikumpulkan',
    className: 'bg-sky-100 text-sky-900 border-sky-800',
  },
  terlambat: {
    label: 'Terlambat',
    className: 'bg-rose-100 text-rose-900 border-rose-800',
  },
  belum: {
    label: 'Belum',
    className: 'bg-amber-100 text-amber-950 border-amber-800',
  },
};

function resolveHeroQuestSubmissionStatus(
  heroId: string,
  quest: ActiveQuest,
  grades: AcademyState['grades']
): SubmissionBadgeStatus {
  const grade = grades.find((g) => g.heroId === heroId && g.questId === quest.id);
  const urgency = getDeadlineUrgency(quest.deadline);

  if (!grade) {
    return urgency.isOverdue ? 'terlambat' : 'belum';
  }

  const eff = getEffectiveGradeStatus(grade);
  if (eff === 'tuntas') return 'selesai';
  if (eff === 'proses') return 'dikumpulkan';
  if (eff === 'remidial') return 'dikumpulkan';
  return urgency.isOverdue ? 'terlambat' : 'belum';
}

/**
 * Lightweight Quest Board list view shared between Game Master (Admin) and Hero (Student).
 * Provides simple status filters (Semua / Belum / Selesai) and deadline countdowns.
 */
export const QuestBoardView: React.FC<QuestBoardViewProps> = ({
  state,
  role,
  hero,
  onNavigateGm,
}) => {
  const isGm = role === UserRole.GAME_MASTER;
  const [filter, setFilter] = useState<QuestBoardFilter>('all');
  const [selectedRealmId, setSelectedRealmId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | QuestCategory>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [detailQuest, setDetailQuest] = useState<ActiveQuest | null>(null);

  const gmScope = useMemo(
    () =>
      resolveTierDungeonScope(state.dungeons, selectedTier, selectedDungeonIds),
    [state.dungeons, selectedTier, selectedDungeonIds]
  );

  const realmMap = useMemo(
    () => new Map(state.realms.map((r) => [r.id, r])),
    [state.realms]
  );
  const dungeonMap = useMemo(
    () => new Map(state.dungeons.map((d) => [d.id, d])),
    [state.dungeons]
  );

  const heroRealmIds = useMemo(() => {
    if (!hero) return null;
    return getHeroEffectiveRealmIds(hero, state.dungeons);
  }, [hero, state.dungeons]);

  const enrolledRealms = useMemo(() => {
    if (isGm || !hero) return state.realms;
    if (heroRealmIds && heroRealmIds.length > 0) {
      const allowedSet = new Set(heroRealmIds);
      return state.realms.filter((r) => allowedSet.has(r.id));
    }
    return state.realms;
  }, [isGm, hero, heroRealmIds, state.realms]);

  const activeRealmFilter = useMemo(() => {
    if (isGm || selectedRealmId === 'all') return 'all';
    return enrolledRealms.some((r) => r.id === selectedRealmId)
      ? selectedRealmId
      : 'all';
  }, [isGm, selectedRealmId, enrolledRealms]);

  const rows = useMemo(() => {
    const baseQuests = isGm
      ? state.quests.filter((q) => {
          if (!gmScope.isFiltered) return true;
          const targetIds = parseTargetDungeonIds(q.dungeonId);
          if (targetIds.length > 0) {
            return gmScope.activeDungeons.some((d) => targetIds.includes(d.id));
          }
          return gmScope.activeDungeons.some((d) => {
            if (q.scheduledAt === '__per_class__') {
              return Boolean(q.classSchedules?.[d.id]);
            }
            return (
              !d.realmIds ||
              d.realmIds.length === 0 ||
              d.realmIds.includes(q.realmId)
            );
          });
        })
      : hero
        ? state.quests.filter((q) => {
            if (!isContentVisibleToHero(q, hero.dungeonId)) return false;
            if (heroRealmIds && heroRealmIds.length > 0) {
              return heroRealmIds.includes(q.realmId);
            }
            return true;
          })
        : [];

    const sorted = [...baseQuests].sort((a, b) =>
      (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')
    );

    return sorted.map((quest) => {
      const urgency = getDeadlineUrgency(quest.deadline);

      if (!isGm && hero) {
        const personalStatus = resolveHeroQuestSubmissionStatus(
          hero.id,
          quest,
          state.grades
        );
        const isDone = personalStatus === 'selesai' || personalStatus === 'dikumpulkan';
        return {
          quest,
          urgency,
          personalStatus,
          isDone,
          counts: null as null | {
            total: number;
            belum: number;
            dikumpulkan: number;
            terlambat: number;
            selesai: number;
          },
          targetHeroes: [] as HeroStudent[],
        };
      }

      const targetHeroes = state.heroes.filter(
        (h) =>
          h.active &&
          doesTargetMatchDungeon(quest.dungeonId, h.dungeonId) &&
          (!gmScope.isFiltered || gmScope.activeDungeonIdSet.has(h.dungeonId))
      );

      let belum = 0;
      let dikumpulkan = 0;
      let terlambat = 0;
      let selesai = 0;

      targetHeroes.forEach((h) => {
        const st = resolveHeroQuestSubmissionStatus(h.id, quest, state.grades);
        if (st === 'belum') belum++;
        else if (st === 'dikumpulkan') dikumpulkan++;
        else if (st === 'terlambat') terlambat++;
        else if (st === 'selesai') selesai++;
      });

      const isDone =
        targetHeroes.length > 0 && belum === 0 && terlambat === 0;

      return {
        quest,
        urgency,
        personalStatus: null as SubmissionBadgeStatus | null,
        isDone,
        counts: {
          total: targetHeroes.length,
          belum,
          dikumpulkan,
          terlambat,
          selesai,
        },
        targetHeroes,
      };
    });
  }, [
    isGm,
    state.quests,
    state.heroes,
    state.grades,
    gmScope,
    hero,
    heroRealmIds,
  ]);

  const questCountByRealm = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      map.set(r.quest.realmId, (map.get(r.quest.realmId) || 0) + 1);
    });
    return map;
  }, [rows]);

  const realmScopedRows = useMemo(() => {
    return rows.filter((r) => {
      if (!isGm && activeRealmFilter !== 'all' && r.quest.realmId !== activeRealmFilter) {
        return false;
      }
      if (
        selectedCategory !== 'all' &&
        normalizeQuestCategory(r.quest.category) !== selectedCategory
      ) {
        return false;
      }
      return true;
    });
  }, [rows, isGm, activeRealmFilter, selectedCategory]);

  const categoryCountMap = useMemo(() => {
    const map = new Map<QuestCategory, number>();
    rows.forEach((r) => {
      if (!isGm && activeRealmFilter !== 'all' && r.quest.realmId !== activeRealmFilter) {
        return;
      }
      const cat = normalizeQuestCategory(r.quest.category);
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return map;
  }, [rows, isGm, activeRealmFilter]);

  const filteredRows = useMemo(() => {
    if (filter === 'pending') return realmScopedRows.filter((r) => !r.isDone);
    if (filter === 'done') return realmScopedRows.filter((r) => r.isDone);
    return realmScopedRows;
  }, [realmScopedRows, filter]);

  const filterOptions: { id: QuestBoardFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: realmScopedRows.length },
    { id: 'pending', label: 'Belum', count: realmScopedRows.filter((r) => !r.isDone).length },
    { id: 'done', label: 'Selesai', count: realmScopedRows.filter((r) => r.isDone).length },
  ];

  const detailRow = detailQuest
    ? rows.find((r) => r.quest.id === detailQuest.id) || null
    : null;

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Quest Board"
        subtitle={
          isGm
            ? 'Pantau status pengumpulan tugas seluruh Quest secara ringkas'
            : 'Daftar tugas aktif kelas beserta hitung mundur tenggat dan status pribadimu'
        }
      />

      {/* Filter Bar */}
      <ThemedPanelCard className="p-3.5 space-y-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status quest">
          {filterOptions.map((opt) => {
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(opt.id)}
                className={`pixel-btn min-h-[44px] px-4 py-2 text-[14px] font-semibold inline-flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <span>{opt.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-black/15 text-[12px] tabular-nums">
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        {!isGm && enrolledRealms.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-pixel)]/30 space-y-1.5">
            <PixelFieldLabel>Filter Mapel yang Diikuti</PixelFieldLabel>
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 pixel-scroll"
              role="tablist"
              aria-label="Filter mapel yang diikuti"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeRealmFilter === 'all'}
                onClick={() => setSelectedRealmId('all')}
                className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[9.5px] sm:text-[10px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRealmFilter === 'all'
                    ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <span>Semua Mapel</span>
                <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10px] tabular-nums">
                  {rows.length}
                </span>
              </button>
              {enrolledRealms.map((realm) => {
                const selected = activeRealmFilter === realm.id;
                const count = questCountByRealm.get(realm.id) || 0;
                return (
                  <button
                    key={realm.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSelectedRealmId(realm.id)}
                    className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[9.5px] sm:text-[10px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <PixelRealmGlyph
                      icon={realm.icon}
                      color={selected ? '#1A1C2C' : realm.accentColor}
                      size={15}
                    />
                    <span>{realm.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10px] tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isGm && (
          <TierDungeonFilter
            idPrefix="qb"
            dungeons={state.dungeons}
            selectedTier={selectedTier}
            onChangeTier={setSelectedTier}
            selectedDungeonIds={selectedDungeonIds}
            onChangeDungeonIds={setSelectedDungeonIds}
          />
        )}

        {/* RPG Quest Category Filter */}
        <div className="pt-2 border-t border-[var(--border-pixel)]/30 space-y-1.5">
          <PixelFieldLabel>Filter Kategori Quest</PixelFieldLabel>
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 pixel-scroll"
            role="tablist"
            aria-label="Filter kategori quest"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
              className={`pixel-btn min-h-[36px] px-3 font-pixel-ui text-[9.5px] whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
              }`}
            >
              Semua Kategori
            </button>
            {QUEST_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const cnt = categoryCountMap.get(cat.id) || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={cat.description}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`pixel-btn min-h-[36px] px-3 font-pixel-ui text-[9.5px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  {getQuestCategoryIcon(cat.id, 13)}
                  <span>{cat.label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10px] tabular-nums">
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </ThemedPanelCard>

      {/* Lightweight Quest List */}
      {filteredRows.length === 0 ? (
        <PixelEmptyState
          title="Belum Ada Quest di Daftar Ini"
          description={
            activeRealmFilter !== 'all'
              ? 'Belum ada tugas untuk mata pelajaran dan status yang dipilih.'
              : filter === 'pending'
                ? 'Semua tugas sudah dikumpulkan atau diselesaikan!'
                : filter === 'done'
                  ? 'Belum ada tugas yang berstatus selesai.'
                  : 'Belum ada Quest yang ditugaskan saat ini.'
          }
          action={
            activeRealmFilter !== 'all' ? (
              <PixelButton
                type="button"
                size="sm"
                variant="neutral"
                onClick={() => setSelectedRealmId('all')}
              >
                Tampilkan Semua Mapel
              </PixelButton>
            ) : undefined
          }
          compact
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map(({ quest, urgency, personalStatus, counts }) => {
            const realm = realmMap.get(quest.realmId);
            const targetIds = parseTargetDungeonIds(quest.dungeonId);
            const targetSummary = formatTargetDungeonsSummary(
              quest.dungeonId,
              state.dungeons,
              'Semua Kelas'
            );
            const singleDungeon =
              targetIds.length === 1 ? dungeonMap.get(targetIds[0]) : undefined;
            const chapterText = quest.chapter?.trim()
              ? formatChapterLabel(quest.chapter)
              : '';

            return (
              <WoodenQuestBoard
                key={quest.id}
                urgent={urgency.isOverdue}
                bannerTitle={
                  realm
                    ? `${chapterText ? `${chapterText} · ` : ''}${realm.code} · ${realm.name}`
                    : `${chapterText ? `${chapterText} · ` : ''}QUEST BOARD`
                }
                bannerRight={
                  !isGm && personalStatus ? (
                    <span
                      className={`px-2.5 py-0.5 rounded border font-pixel-ui text-[11px] font-bold inline-flex items-center gap-1 ${STATUS_BADGE_MAP[personalStatus].className}`}
                    >
                      {personalStatus === 'selesai' && <CheckCircle2 size={13} />}
                      {personalStatus === 'dikumpulkan' && <Send size={13} />}
                      {personalStatus === 'terlambat' && <AlertTriangle size={13} />}
                      {personalStatus === 'belum' && <Sword size={13} />}
                      {STATUS_BADGE_MAP[personalStatus].label}
                    </span>
                  ) : undefined
                }
                stats={[
                  { label: 'EXP', value: `+${quest.maxExp}`, tone: 'warning' },
                  {
                    label: 'TENGGAT',
                    value: urgency.label,
                    tone: urgency.isOverdue
                      ? 'danger'
                      : urgency.isUrgent
                        ? 'warning'
                        : 'default',
                  },
                  {
                    label: 'KELAS',
                    value: targetSummary,
                  },
                ]}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <QuestCategoryBadge category={quest.category} compact />
                      {chapterText && (
                        <span className="px-2 py-0.5 text-[10.5px] font-bold border border-[#3d1b0c]/50 bg-[#fff7eb] text-[#45230e]">
                          {chapterText}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-[#563018]">
                        {getQuestCategoryMeta(quest.category).description}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailQuest(quest)}
                      className="text-left text-[16px] sm:text-[17px] font-bold text-[#261006] hover:text-[#7c2d12] leading-snug break-words cursor-pointer block w-full"
                    >
                      {quest.title}
                    </button>

                    <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#45230e]">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock size={15} className="shrink-0 text-[#6d2e17]" />
                        <span>Batas: {formatRetroDate(quest.deadline)}</span>
                      </span>
                      {targetIds.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[13.5px] font-semibold">
                            {singleDungeon ? singleDungeon.name : targetSummary}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => setDetailQuest(quest)}
                    >
                      <Eye size={15} />
                      <span>{isGm ? 'Cek Status' : 'Detail'}</span>
                    </PixelButton>
                  </div>
                </div>

                {/* Admin submission breakdown strip */}
                {isGm && counts && (
                  <div className="pt-2.5 border-t border-[#3d1b0c]/20 flex flex-wrap items-center gap-2 text-[13.5px]">
                    <span className="px-2.5 py-1 rounded border border-[#78350f] bg-[#fef3c7] text-[#451a03] font-bold tabular-nums">
                      Belum: {counts.belum}
                    </span>
                    <span className="px-2.5 py-1 rounded border border-[#075985] bg-[#e0f2fe] text-[#0c4a6e] font-bold tabular-nums">
                      Dikumpulkan: {counts.dikumpulkan + counts.selesai}
                    </span>
                    <span className="px-2.5 py-1 rounded border border-[#9f1239] bg-[#ffe4e6] text-[#881337] font-bold tabular-nums">
                      Terlambat: {counts.terlambat}
                    </span>
                    <span className="text-[13px] font-semibold text-[#563018] ml-auto tabular-nums">
                      Total Hero Target: {counts.total}
                    </span>
                  </div>
                )}
              </WoodenQuestBoard>
            );
          })}
        </div>
      )}

      {/* Detail / Admin Status Modal */}
      <PixelModal
        open={Boolean(detailQuest)}
        title={detailQuest?.title || 'Detail Quest'}
        onClose={() => setDetailQuest(null)}
      >
        {detailQuest && (
          <div className="space-y-4 text-[16px]">
            <div className="pixel-box-inset p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <QuestCategoryBadge category={detailQuest.category} showDescription />
                {detailQuest.chapter?.trim() && (
                  <span className="px-2 py-0.5 text-[11px] font-bold border border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)]">
                    Bab / Teks: {formatChapterLabel(detailQuest.chapter)}
                  </span>
                )}
                <span className="px-2 py-0.5 text-[11px] font-semibold border border-[var(--border-pixel)]/50 bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                  Kelas: {formatTargetDungeonsSummary(detailQuest.dungeonId, state.dungeons, 'Semua Kelas')}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                <span className="font-semibold text-[var(--accent-warning)]">
                  Tenggat: {formatRetroDate(detailQuest.deadline)} (
                  {getDeadlineUrgency(detailQuest.deadline).label})
                </span>
                <span className="font-bold text-[var(--accent-primary)]">
                  Max +{detailQuest.maxExp} EXP
                </span>
              </div>
              <p className="text-[16px] text-[var(--text-primary)] leading-relaxed whitespace-pre-line break-words">
                {detailDetailText(detailQuest)}
              </p>
              {detailQuest.linkUrl && (
                <div className="pt-2">
                  <PixelLinkButton
                    url={detailQuest.linkUrl}
                    label="Buka Tautan Tugas"
                  />
                </div>
              )}
            </div>

            {isGm && detailRow && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-pixel-ui text-[12px] uppercase text-[var(--text-primary)]">
                    Status Pengumpulan Heroes ({detailRow.targetHeroes.length})
                  </h4>
                  {onNavigateGm && (
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setDetailQuest(null);
                        onNavigateGm('exp_loot');
                      }}
                    >
                      Nilai di EXP &amp; Loot
                    </PixelButton>
                  )}
                </div>

                {detailRow.targetHeroes.length === 0 ? (
                  <p className="text-[15px] text-[var(--text-secondary)]">
                    Tidak ada Hero aktif pada kelas target.
                  </p>
                ) : (
                  <div className="max-h-[42vh] overflow-y-auto pixel-scroll space-y-2 pr-1">
                    {detailRow.targetHeroes.map((h) => {
                      const st = resolveHeroQuestSubmissionStatus(
                        h.id,
                        detailQuest,
                        state.grades
                      );
                      const dng = dungeonMap.get(h.dungeonId);
                      return (
                        <div
                          key={h.id}
                          className="pixel-box-inset p-2.5 flex items-center justify-between gap-2 text-[15px]"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--text-primary)] truncate">
                              {h.name}
                            </p>
                            <p className="text-[13px] text-[var(--text-secondary)] truncate">
                              {dng ? dng.name : 'Tanpa Kelas'}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 border font-pixel-ui text-[10.5px] font-bold shrink-0 ${STATUS_BADGE_MAP[st].className}`}
                          >
                            {STATUS_BADGE_MAP[st].label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </PixelModal>
    </div>
  );
};

function detailDetailText(quest: ActiveQuest): string {
  return quest.instructions?.trim() || 'Tidak ada instruksi tambahan.';
}
