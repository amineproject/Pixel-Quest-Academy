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
  UserRole,
} from '../../types/lms';
import {
  DungeonOptGroupOptions,
  PixelButton,
  PixelEmptyState,
  PixelFieldLabel,
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  formatRetroDate,
  getDeadlineUrgency,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
  isContentVisibleToHero,
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
  const [selectedDungeonId, setSelectedDungeonId] = useState<string>('all');
  const [detailQuest, setDetailQuest] = useState<ActiveQuest | null>(null);

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

  const rows = useMemo(() => {
    const baseQuests = isGm
      ? state.quests.filter(
          (q) =>
            selectedDungeonId === 'all' ||
            q.dungeonId === 'all' ||
            q.dungeonId === selectedDungeonId
        )
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
          (quest.dungeonId === 'all' || h.dungeonId === quest.dungeonId) &&
          (selectedDungeonId === 'all' || h.dungeonId === selectedDungeonId)
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
    selectedDungeonId,
    hero,
    heroRealmIds,
  ]);

  const filteredRows = useMemo(() => {
    if (filter === 'pending') return rows.filter((r) => !r.isDone);
    if (filter === 'done') return rows.filter((r) => r.isDone);
    return rows;
  }, [rows, filter]);

  const filterOptions: { id: QuestBoardFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: rows.length },
    { id: 'pending', label: 'Belum', count: rows.filter((r) => !r.isDone).length },
    { id: 'done', label: 'Selesai', count: rows.filter((r) => r.isDone).length },
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

        {isGm && (
          <div className="max-w-sm">
            <PixelFieldLabel htmlFor="qb-dungeon-filter">
              Filter Kelas (Dungeon)
            </PixelFieldLabel>
            <PixelSelect
              id="qb-dungeon-filter"
              value={selectedDungeonId}
              onChange={(e) => setSelectedDungeonId(e.target.value)}
            >
              <option value="all">Semua Dungeon (Kelas)</option>
              <DungeonOptGroupOptions dungeons={state.dungeons} />
            </PixelSelect>
          </div>
        )}
      </ThemedPanelCard>

      {/* Lightweight Quest List */}
      {filteredRows.length === 0 ? (
        <PixelEmptyState
          title="Belum Ada Quest di Daftar Ini"
          description={
            filter === 'pending'
              ? 'Semua tugas sudah dikumpulkan atau diselesaikan!'
              : filter === 'done'
                ? 'Belum ada tugas yang berstatus selesai.'
                : 'Belum ada Quest yang ditugaskan saat ini.'
          }
          compact
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map(({ quest, urgency, personalStatus, counts }) => {
            const realm = realmMap.get(quest.realmId);
            const dungeon =
              quest.dungeonId === 'all' ? null : dungeonMap.get(quest.dungeonId);

            return (
              <ThemedPanelCard
                key={quest.id}
                className="p-3.5 sm:p-4 space-y-2.5 transition-transform duration-150"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-pixel-ui text-[10.5px] px-2 py-0.5 border border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)] font-bold">
                        {realm ? `${realm.code} · ${realm.name}` : 'Mapel'}
                      </span>
                      <span className="text-[12.5px] font-semibold px-2 py-0.5 border border-[var(--border-pixel)]/40 bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                        {dungeon ? `${dungeon.guildCode} · ${dungeon.name}` : 'Semua Kelas'}
                      </span>
                      <span className="text-[12.5px] font-bold text-[var(--accent-warning)]">
                        +{quest.maxExp} EXP
                      </span>
                    </div>

                    <h3 className="text-[16px] font-bold text-[var(--text-primary)] leading-snug break-words">
                      {quest.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-[14px] text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock
                          size={15}
                          className={
                            urgency.isOverdue
                              ? 'text-[var(--accent-danger)]'
                              : urgency.isUrgent
                                ? 'text-[var(--accent-warning)]'
                                : 'text-[var(--accent-primary)]'
                          }
                        />
                        <span
                          className={
                            urgency.isOverdue
                              ? 'font-bold text-[var(--accent-danger)]'
                              : urgency.isUrgent
                                ? 'font-bold text-[var(--accent-warning)]'
                                : 'font-medium'
                          }
                        >
                          {urgency.label}
                        </span>
                        <span className="text-[13px] text-[var(--text-muted)]">
                          ({formatRetroDate(quest.deadline)})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right Status / Action */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isGm && personalStatus && (
                      <span
                        className={`px-3 py-1.5 border-2 font-pixel-ui text-[11px] font-bold inline-flex items-center gap-1.5 ${STATUS_BADGE_MAP[personalStatus].className}`}
                      >
                        {personalStatus === 'selesai' && <CheckCircle2 size={14} />}
                        {personalStatus === 'dikumpulkan' && <Send size={14} />}
                        {personalStatus === 'terlambat' && <AlertTriangle size={14} />}
                        {personalStatus === 'belum' && <Sword size={14} />}
                        {STATUS_BADGE_MAP[personalStatus].label}
                      </span>
                    )}

                    <PixelButton
                      type="button"
                      size="sm"
                      variant="neutral"
                      onClick={() => setDetailQuest(quest)}
                    >
                      <Eye size={15} />
                      <span>{isGm ? 'Cek Status' : 'Detail'}</span>
                    </PixelButton>
                  </div>
                </div>

                {/* Admin submission breakdown strip */}
                {isGm && counts && (
                  <div className="pt-2.5 border-t border-[var(--border-pixel)]/30 flex flex-wrap items-center gap-2 text-[13.5px]">
                    <span className="px-2.5 py-1 border border-amber-700 bg-amber-50 text-amber-950 font-semibold tabular-nums">
                      Belum: {counts.belum}
                    </span>
                    <span className="px-2.5 py-1 border border-sky-700 bg-sky-50 text-sky-900 font-semibold tabular-nums">
                      Dikumpulkan: {counts.dikumpulkan + counts.selesai}
                    </span>
                    <span className="px-2.5 py-1 border border-rose-700 bg-rose-50 text-rose-900 font-semibold tabular-nums">
                      Terlambat: {counts.terlambat}
                    </span>
                    <span className="text-[13px] text-[var(--text-muted)] ml-auto tabular-nums">
                      Total Hero Target: {counts.total}
                    </span>
                  </div>
                )}
              </ThemedPanelCard>
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
