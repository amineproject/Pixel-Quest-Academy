import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Sparkles,
  Sword,
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
  PixelExpBar,
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
  isQuestAssignedToHero,
  normalizeQuestCategory,
  parseTargetDungeonIds,
} from '../../utils/exp';

export type QuestBoardFilter = 'all' | 'pending' | 'done';
export type StudentCategoryFilter = 'all' | QuestCategory | 'done';
export type SubmissionBadgeStatus =
  | 'belum'
  | 'dikumpulkan'
  | 'remidial'
  | 'terlambat'
  | 'selesai';

interface QuestBoardViewProps {
  state: AcademyState;
  role: UserRole;
  hero?: HeroStudent;
  seenQuestIds?: string[];
  onMarkQuestSeen?: (questId: string) => void;
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
    label: 'Proses Dinilai',
    className: 'bg-sky-100 text-sky-900 border-sky-800',
  },
  remidial: {
    label: 'Remidial',
    className: 'bg-amber-100 text-amber-950 border-amber-800',
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
  if (eff === 'remidial') return 'remidial';
  return urgency.isOverdue ? 'terlambat' : 'belum';
}

/**
 * Lightweight Quest Board list view shared between Game Master (Admin) and Hero (Student).
 * For students, completed quests move exclusively into the "Quest Selesai" category filter.
 */
export const QuestBoardView: React.FC<QuestBoardViewProps> = ({
  state,
  role,
  hero,
  seenQuestIds = [],
  onMarkQuestSeen,
  onNavigateGm,
}) => {
  const isGm = role === UserRole.GAME_MASTER;
  const [filter, setFilter] = useState<QuestBoardFilter>('all');
  const [selectedRealmId, setSelectedRealmId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<StudentCategoryFilter>('all');
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

  const seenQuestSet = useMemo(() => new Set(seenQuestIds), [seenQuestIds]);

  const rows = useMemo(() => {
    const heroGradeQuestIds =
      !isGm && hero
        ? new Set(state.grades.filter((g) => g.heroId === hero.id).map((g) => g.questId))
        : null;

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
        ? state.quests.filter((q) =>
            isQuestAssignedToHero(q, hero, state.dungeons, {
              hasGrade: heroGradeQuestIds?.has(q.id),
            })
          )
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
        const isCompleted = personalStatus === 'selesai';
        const isUnreadNew = !seenQuestSet.has(quest.id) && !isCompleted;
        return {
          quest,
          urgency,
          personalStatus,
          isDone: isCompleted,
          isUnreadNew,
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
        else if (st === 'dikumpulkan' || st === 'remidial') dikumpulkan++;
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
        isUnreadNew: false,
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
    state.dungeons,
    gmScope,
    hero,
    seenQuestSet,
  ]);

  const studentTotalDone = useMemo(
    () => rows.filter((r) => r.isDone).length,
    [rows]
  );

  const studentCompletionPercent = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round((studentTotalDone / rows.length) * 100);
  }, [rows.length, studentTotalDone]);

  const questCountByRealm = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      if (!isGm) {
        const matchesMode = selectedCategory === 'done' ? r.isDone : !r.isDone;
        if (!matchesMode) return;
      }
      map.set(r.quest.realmId, (map.get(r.quest.realmId) || 0) + 1);
    });
    return map;
  }, [rows, isGm, selectedCategory]);

  const studentRealmModeTotal = useMemo(() => {
    if (isGm) return rows.length;
    return rows.filter((r) => (selectedCategory === 'done' ? r.isDone : !r.isDone))
      .length;
  }, [rows, isGm, selectedCategory]);

  const realmOnlyRows = useMemo(() => {
    return rows.filter((r) => {
      if (!isGm && activeRealmFilter !== 'all' && r.quest.realmId !== activeRealmFilter) {
        return false;
      }
      return true;
    });
  }, [rows, isGm, activeRealmFilter]);

  const studentActiveCount = useMemo(
    () => realmOnlyRows.filter((r) => !r.isDone).length,
    [realmOnlyRows]
  );

  const studentDoneCount = useMemo(
    () => realmOnlyRows.filter((r) => r.isDone).length,
    [realmOnlyRows]
  );

  const realmScopedRows = useMemo(() => {
    return realmOnlyRows.filter((r) => {
      if (!isGm) {
        // Completed quests move exclusively to 'done' (Quest Selesai) and do not appear elsewhere
        if (selectedCategory === 'done') {
          return r.isDone;
        }
        if (r.isDone) return false;
      }
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'done' &&
        normalizeQuestCategory(r.quest.category) !== selectedCategory
      ) {
        return false;
      }
      return true;
    });
  }, [realmOnlyRows, isGm, selectedCategory]);

  const categoryCountMap = useMemo(() => {
    const map = new Map<QuestCategory, number>();
    realmOnlyRows.forEach((r) => {
      // For students, exclude finished quests from active quest categories
      if (!isGm && r.isDone) return;
      const cat = normalizeQuestCategory(r.quest.category);
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return map;
  }, [realmOnlyRows, isGm]);

  const filteredRows = useMemo(() => {
    if (!isGm) {
      return realmScopedRows;
    }
    if (filter === 'pending') return realmScopedRows.filter((r) => !r.isDone);
    if (filter === 'done') return realmScopedRows.filter((r) => r.isDone);
    return realmScopedRows;
  }, [realmScopedRows, filter, isGm]);

  const gmFilterOptions: { id: QuestBoardFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: realmScopedRows.length },
    { id: 'pending', label: 'Belum', count: realmScopedRows.filter((r) => !r.isDone).length },
    { id: 'done', label: 'Selesai', count: realmScopedRows.filter((r) => r.isDone).length },
  ];

  const handleOpenQuestDetail = (quest: ActiveQuest) => {
    setDetailQuest(quest);
    if (!isGm && onMarkQuestSeen) {
      onMarkQuestSeen(quest.id);
    }
  };

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
            : 'Daftar tugas aktif berdasarkan kategori dan tugas tuntas di Quest Selesai'
        }
      />

      {/* Filter Bar */}
      <ThemedPanelCard className="p-3.5 space-y-3">
        {isGm ? (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status quest">
            {gmFilterOptions.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(opt.id)}
                  className={`pixel-btn font-pixel-ui min-h-[38px] px-3 py-1.5 text-[11px] sm:text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10.5px] tabular-nums">
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <PixelExpBar
            percent={studentCompletionPercent}
            labelLeft={`Progres Tugas: ${studentTotalDone} dari ${rows.length} Quest Selesai`}
            labelRight={
              rows.length > 0 && rows.length - studentTotalDone === 0
                ? 'Semua Tuntas!'
                : `Tersisa ${rows.length - studentTotalDone} Quest Aktif`
            }
            color={
              rows.length > 0 && rows.length - studentTotalDone === 0
                ? 'var(--accent-success)'
                : 'var(--accent-warning)'
            }
          />
        )}

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
                className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRealmFilter === 'all'
                    ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <span>Semua Mapel</span>
                <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10.5px] tabular-nums">
                  {studentRealmModeTotal}
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
                    className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <PixelRealmGlyph
                      icon={realm.icon}
                      color={selected ? 'currentColor' : realm.accentColor}
                      size={15}
                    />
                    <span>{realm.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10.5px] tabular-nums">
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

        {/* RPG Quest Category Filter (+ Quest Selesai for Student) */}
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
              className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
              }`}
            >
              <span>Semua Kategori</span>
              {!isGm && (
                <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10.5px] tabular-nums">
                  {studentActiveCount}
                </span>
              )}
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
                  className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  {getQuestCategoryIcon(cat.id, 13)}
                  <span>{cat.label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10.5px] tabular-nums">
                    {cnt}
                  </span>
                </button>
              );
            })}
            {!isGm && (
              <button
                type="button"
                role="tab"
                aria-selected={selectedCategory === 'done'}
                title="Tugas yang sudah selesai / tuntas dinilai"
                onClick={() => setSelectedCategory('done')}
                className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === 'done'
                    ? 'bg-[var(--accent-success)] text-[var(--text-on-success)] font-bold'
                    : 'bg-[var(--bg-surface)] text-emerald-800 hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Quest Selesai</span>
                <span className="px-1.5 py-0.5 rounded bg-black/15 text-[10.5px] tabular-nums">
                  {studentDoneCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </ThemedPanelCard>

      {/* Quest Board Card List */}
      {filteredRows.length === 0 ? (
        <PixelEmptyState
          title={
            !isGm && selectedCategory === 'done'
              ? 'Belum Ada Quest Selesai'
              : !isGm && studentActiveCount === 0 && studentDoneCount > 0
                ? 'Semua Quest Sudah Selesai!'
                : 'Belum Ada Quest di Daftar Ini'
          }
          description={
            !isGm
              ? selectedCategory === 'done'
                ? activeRealmFilter !== 'all'
                  ? 'Belum ada tugas yang berstatus selesai di mata pelajaran ini.'
                  : 'Belum ada tugas yang berstatus selesai.'
                : studentActiveCount === 0 && studentDoneCount > 0
                  ? 'Semua tugasmu sudah tuntas dan dipindahkan ke kategori Quest Selesai.'
                  : 'Belum ada tugas aktif pada mata pelajaran atau kategori yang dipilih.'
              : activeRealmFilter !== 'all'
                ? 'Belum ada tugas untuk mata pelajaran dan status yang dipilih.'
                : filter === 'pending'
                  ? 'Semua tugas sudah dikumpulkan atau diselesaikan!'
                  : filter === 'done'
                    ? 'Belum ada tugas yang berstatus selesai.'
                    : 'Belum ada Quest yang ditugaskan saat ini.'
          }
          action={
            !isGm && selectedCategory !== 'done' && studentActiveCount === 0 && studentDoneCount > 0 ? (
              <PixelButton
                type="button"
                size="sm"
                variant="primary"
                onClick={() => setSelectedCategory('done')}
              >
                Lihat Quest Selesai ({studentDoneCount})
              </PixelButton>
            ) : activeRealmFilter !== 'all' ? (
              <PixelButton
                type="button"
                size="sm"
                variant="neutral"
                onClick={() => setSelectedRealmId('all')}
              >
                Tampilkan Semua Mapel
              </PixelButton>
            ) : !isGm && selectedCategory !== 'all' ? (
              <PixelButton
                type="button"
                size="sm"
                variant="neutral"
                onClick={() => setSelectedCategory('all')}
              >
                Lihat Semua Kategori Aktif
              </PixelButton>
            ) : undefined
          }
          compact
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map(({ quest, urgency, personalStatus, isUnreadNew, counts }) => {
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
                    ? `${chapterText ? `${chapterText} · ` : ''}${getQuestCategoryMeta(quest.category).shortLabel} · ${realm.code} · ${realm.name}`
                    : `${chapterText ? `${chapterText} · ` : ''}${getQuestCategoryMeta(quest.category).shortLabel} · QUEST BOARD`
                }
                bannerRight={
                  !isGm && personalStatus ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isUnreadNew && (
                        <span className="px-2 py-0.5 rounded border border-[#09090f] bg-[var(--comic-gold)] text-[#09090f] font-pixel-ui text-[10.5px] font-bold inline-flex items-center gap-1">
                          <Sparkles size={11} />
                          BARU
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded border font-pixel-ui text-[11px] font-bold inline-flex items-center gap-1 ${STATUS_BADGE_MAP[personalStatus].className}`}
                      >
                        {personalStatus === 'selesai' && <CheckCircle2 size={13} />}
                        {personalStatus === 'dikumpulkan' && <Send size={13} />}
                        {(personalStatus === 'terlambat' || personalStatus === 'remidial') && (
                          <AlertTriangle size={13} />
                        )}
                        {personalStatus === 'belum' && <Sword size={13} />}
                        {STATUS_BADGE_MAP[personalStatus].label}
                      </span>
                    </div>
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
                        <span className="px-2 py-0.5 text-[10.5px] font-bold border border-[var(--board-chip-border)] bg-[var(--board-chip-bg)] text-[var(--board-ink)]">
                          {chapterText}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-[var(--board-muted)]">
                        {getQuestCategoryMeta(quest.category).description}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenQuestDetail(quest)}
                      className="text-left text-[15px] sm:text-[16px] font-bold text-[var(--board-ink)] hover:text-[var(--board-accent)] leading-snug break-words cursor-pointer block w-full"
                    >
                      {quest.title}
                    </button>

                    {quest.description?.trim() && (
                      <p className="text-[13px] sm:text-[13.5px] text-[var(--board-muted)] leading-snug line-clamp-2 break-words">
                        {quest.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--board-ink)]">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="shrink-0 text-[var(--board-accent)]" />
                        <span>Batas: {formatRetroDate(quest.deadline)}</span>
                      </span>
                      {targetIds.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[13px] font-semibold">
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
                      onClick={() => handleOpenQuestDetail(quest)}
                    >
                      <Eye size={15} />
                      <span>{isGm ? 'Cek Status' : 'Detail'}</span>
                    </PixelButton>
                  </div>
                </div>

                {/* Admin submission breakdown strip */}
                {isGm && counts && (
                  <div className="pt-2.5 border-t border-[var(--board-divider)] flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="px-2.5 py-1 rounded border border-[#78350f] bg-[#fef3c7] text-[#451a03] font-bold tabular-nums">
                      Belum: {counts.belum}
                    </span>
                    <span className="px-2.5 py-1 rounded border border-[#075985] bg-[#e0f2fe] text-[#0c4a6e] font-bold tabular-nums">
                      Dikumpulkan: {counts.dikumpulkan + counts.selesai}
                    </span>
                    <span className="px-2.5 py-1 rounded border border-[#9f1239] bg-[#ffe4e6] text-[#881337] font-bold tabular-nums">
                      Terlambat: {counts.terlambat}
                    </span>
                    <span className="text-[12px] font-semibold text-[var(--board-muted)] ml-auto tabular-nums">
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
          <div className="space-y-4 text-[13.5px] sm:text-[14px]">
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span className="font-semibold text-[var(--accent-warning)]">
                  Tenggat: {formatRetroDate(detailQuest.deadline)} (
                  {getDeadlineUrgency(detailQuest.deadline).label})
                </span>
                <span className="font-bold text-[var(--accent-primary)]">
                  Max +{detailQuest.maxExp} EXP
                </span>
              </div>
              {detailQuest.description?.trim() && (
                <div className="pt-1 border-t border-[var(--border-pixel)]/30 space-y-0.5">
                  <p className="font-pixel-ui text-[11px] uppercase text-[var(--accent-primary)]">
                    Deskripsi Misi
                  </p>
                  <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words">
                    {detailQuest.description}
                  </p>
                </div>
              )}
              <div className="pt-1 border-t border-[var(--border-pixel)]/30 space-y-1">
                <p className="font-pixel-ui text-[11px] uppercase text-[var(--accent-warning)]">
                  Objek Misi / Instruksi Tugas
                </p>
                <p className="text-[13.5px] sm:text-[14px] text-[var(--text-primary)] leading-relaxed whitespace-pre-line break-words">
                  {detailDetailText(detailQuest)}
                </p>
              </div>
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
                  <p className="text-[13px] text-[var(--text-secondary)]">
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
                          className="pixel-box-inset p-2.5 flex items-center justify-between gap-2 text-[13.5px]"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--text-primary)] truncate">
                              {h.name}
                            </p>
                            <p className="text-[12px] text-[var(--text-secondary)] truncate">
                              {dng ? dng.name : 'Tanpa Kelas'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 border font-pixel-ui text-[10.5px] font-bold shrink-0 ${STATUS_BADGE_MAP[st].className}`}
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
