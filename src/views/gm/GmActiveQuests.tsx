import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  List,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  AcademyState,
  ActiveQuest,
  Dungeon,
  QuestDifficulty,
  Realm,
} from '../../types/lms';
import { BulkDeleteBar } from '../../components/BulkDeleteBar';
import {
  DungeonOptGroupOptions,
  PixelButton,
  PixelConfirmDialog,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
  PixelTextarea,
} from '../../components/PixelUI';
import { ScheduleConfigSection } from '../../components/ScheduleConfigSection';
import { QuestCard, ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  formatRetroDate,
  getScheduleStatusSummary,
  sortDungeonsAlphabetically,
} from '../../utils/exp';

interface GmActiveQuestsProps {
  state: AcademyState;
  onSaveQuest: (quest: ActiveQuest) => void;
  onDeleteQuest: (id: string) => void;
  onDeleteQuestsBatch?: (ids: string[]) => void | Promise<void>;
}

type QuestGroupMode = 'class_realm' | 'realm_class' | 'flat';

function doesDungeonTeachRealm(dungeon: Dungeon, realmId: string): boolean {
  if (!dungeon.realmIds || dungeon.realmIds.length === 0) return true;
  return dungeon.realmIds.includes(realmId);
}

function getTaughtRealmsForDungeon(dungeon: Dungeon, allRealms: Realm[]): Realm[] {
  if (!dungeon.realmIds || dungeon.realmIds.length === 0) {
    return allRealms;
  }
  const set = new Set(dungeon.realmIds);
  return allRealms.filter((r) => set.has(r.id));
}

function doesQuestApplyToDungeon(quest: ActiveQuest, dungeon: Dungeon): boolean {
  if (quest.dungeonId === dungeon.id) return true;
  if (quest.dungeonId !== 'all') return false;
  if (quest.scheduledAt === '__per_class__') {
    return Boolean(quest.classSchedules && quest.classSchedules[dungeon.id]);
  }
  return doesDungeonTeachRealm(dungeon, quest.realmId);
}

export const GmActiveQuests: React.FC<GmActiveQuestsProps> = ({
  state,
  onSaveQuest,
  onDeleteQuest,
  onDeleteQuestsBatch,
}) => {
  const [dungeonFilter, setDungeonFilter] = useState('all');
  const [realmFilter, setRealmFilter] = useState('all');
  const [groupMode, setGroupMode] = useState<QuestGroupMode>('class_realm');
  const [collapsedClasses, setCollapsedClasses] = useState<Record<string, boolean>>({});
  const [collapsedRealms, setCollapsedRealms] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActiveQuest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActiveQuest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);

  const sortedDungeons = useMemo(
    () => sortDungeonsAlphabetically(state.dungeons),
    [state.dungeons]
  );

  useEffect(() => {
    const valid = new Set(state.quests.map((q) => q.id));
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [state.quests]);

  const [title, setTitle] = useState('');
  const [realmId, setRealmId] = useState(state.realms[0]?.id || '');
  const [dungeonId, setDungeonId] = useState('all');
  const [deadline, setDeadline] = useState('2026-11-28');
  const [maxExp, setMaxExp] = useState(200);
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Normal');
  const [instructions, setInstructions] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [classSchedules, setClassSchedules] = useState<Record<string, string>>({});

  // Filtered quests matching active Class & Subject filters
  const filteredQuests = useMemo(() => {
    const selectedDungeon =
      dungeonFilter !== 'all'
        ? sortedDungeons.find((d) => d.id === dungeonFilter)
        : undefined;

    return state.quests.filter((q) => {
      if (realmFilter !== 'all' && q.realmId !== realmFilter) return false;
      if (selectedDungeon && !doesQuestApplyToDungeon(q, selectedDungeon)) {
        return false;
      }
      return true;
    });
  }, [state.quests, sortedDungeons, dungeonFilter, realmFilter]);

  const visibleIds = useMemo(
    () => filteredQuests.map((q) => q.id),
    [filteredQuests]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const selectedSet = new Set(selectedIds);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
    if (allVisibleSelected) {
      const visibleSet = new Set(visibleIds);
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleModalDungeonChange = (nextDungeonId: string) => {
    setDungeonId(nextDungeonId);
    if (nextDungeonId !== 'all') {
      const targetDng = sortedDungeons.find((d) => d.id === nextDungeonId);
      if (targetDng && targetDng.realmIds && targetDng.realmIds.length > 0) {
        if (!targetDng.realmIds.includes(realmId)) {
          const firstValid = state.realms.find((r) =>
            targetDng.realmIds?.includes(r.id)
          );
          if (firstValid) setRealmId(firstValid.id);
        }
      }
    }
  };

  const openCreate = (preselectedDungeonId?: string, preselectedRealmId?: string) => {
    const nextDungeonId =
      preselectedDungeonId ?? (dungeonFilter !== 'all' ? dungeonFilter : 'all');

    let nextRealmId =
      preselectedRealmId ??
      (realmFilter !== 'all' ? realmFilter : state.realms[0]?.id || '');

    if (nextDungeonId !== 'all') {
      const targetDng = sortedDungeons.find((d) => d.id === nextDungeonId);
      if (targetDng?.realmIds && targetDng.realmIds.length > 0) {
        if (!preselectedRealmId && !targetDng.realmIds.includes(nextRealmId)) {
          nextRealmId =
            state.realms.find((r) => targetDng.realmIds?.includes(r.id))?.id ||
            nextRealmId;
        }
      }
    }

    setEditing(null);
    setTitle('');
    setDungeonId(nextDungeonId);
    setRealmId(nextRealmId);
    setDeadline('2026-11-28');
    setMaxExp(200);
    setDifficulty('Normal');
    setInstructions('');
    setLinkUrl('');
    setScheduledAt('');
    setClassSchedules({});
    setModalOpen(true);
  };

  const openEdit = (q: ActiveQuest) => {
    setEditing(q);
    setTitle(q.title);
    setRealmId(q.realmId);
    setDungeonId(q.dungeonId);
    setDeadline(q.deadline);
    setMaxExp(q.maxExp);
    setDifficulty(q.difficulty);
    setInstructions(q.instructions);
    setLinkUrl(q.linkUrl || '');
    setScheduledAt(q.scheduledAt || '');
    setClassSchedules(q.classSchedules || {});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim() || !realmId) return;
    onSaveQuest({
      id: editing?.id || `qst-${Date.now()}`,
      title: title.trim(),
      realmId,
      dungeonId,
      deadline,
      maxExp: Math.max(50, Number(maxExp) || 200),
      difficulty,
      instructions: instructions.trim(),
      linkUrl: linkUrl.trim(),
      scheduledAt,
      classSchedules,
    });
    setModalOpen(false);
  };

  const activeFilterDungeon =
    dungeonFilter !== 'all'
      ? sortedDungeons.find((d) => d.id === dungeonFilter)
      : undefined;

  const modalSelectedDungeon =
    dungeonId !== 'all'
      ? sortedDungeons.find((d) => d.id === dungeonId)
      : undefined;

  const modalTaughtRealms = modalSelectedDungeon
    ? getTaughtRealmsForDungeon(modalSelectedDungeon, state.realms)
    : state.realms;

  const modalOtherRealms =
    modalSelectedDungeon &&
    modalSelectedDungeon.realmIds &&
    modalSelectedDungeon.realmIds.length > 0
      ? state.realms.filter(
          (r) => !modalSelectedDungeon.realmIds?.includes(r.id)
        )
      : [];

  const modalSelectedRealm = state.realms.find((r) => r.id === realmId);
  const modalClassesTeachingRealm = sortedDungeons.filter((d) =>
    doesDungeonTeachRealm(d, realmId)
  );
  const modalIsRealmOutsideClass =
    Boolean(modalSelectedDungeon) &&
    Boolean(modalSelectedDungeon?.realmIds?.length) &&
    !modalSelectedDungeon?.realmIds?.includes(realmId);

  // Build grouped data for Class -> Taught Subjects -> Quests
  const visibleDungeonsForGroup = useMemo(() => {
    let list =
      dungeonFilter === 'all'
        ? sortedDungeons
        : sortedDungeons.filter((d) => d.id === dungeonFilter);
    if (realmFilter !== 'all') {
      list = list.filter(
        (d) =>
          doesDungeonTeachRealm(d, realmFilter) ||
          state.quests.some(
            (q) => q.realmId === realmFilter && doesQuestApplyToDungeon(q, d)
          )
      );
    }
    return list;
  }, [sortedDungeons, dungeonFilter, realmFilter, state.quests]);

  // Any quests whose dungeonId does not match any existing dungeon (except 'all')
  const orphanQuests = useMemo(() => {
    const dungeonIds = new Set(sortedDungeons.map((d) => d.id));
    return filteredQuests.filter(
      (q) => q.dungeonId !== 'all' && !dungeonIds.has(q.dungeonId)
    );
  }, [filteredQuests, sortedDungeons]);

  const renderQuestCardItem = (
    quest: ActiveQuest,
    keyPrefix: string,
    contextDungeon?: Dungeon
  ) => {
    const realm = state.realms.find((r) => r.id === quest.realmId);
    const dungeon = state.dungeons.find((d) => d.id === quest.dungeonId);
    const sched = getScheduleStatusSummary(quest, state.dungeons);
    const isSelected = selectedIds.includes(quest.id);

    const scopeLabel =
      quest.dungeonId === 'all'
        ? quest.scheduledAt === '__per_class__'
          ? contextDungeon
            ? `Terjadwal di ${contextDungeon.guildCode}`
            : 'Per-Kelas Terjadwal'
          : 'Lintas Kelas (Sesuai Mapel)'
        : `Khusus ${dungeon?.guildCode || quest.dungeonId}`;

    return (
      <QuestCard
        key={`${keyPrefix}::${quest.id}`}
        className={`space-y-2.5 ${isSelected ? 'ring-2 ring-[var(--accent-danger)]' : ''}`}
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(quest.id)}
              aria-label={`Pilih tugas ${quest.title}`}
              className="w-4 h-4 mt-1 accent-[var(--accent-danger)] shrink-0 cursor-pointer"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[11.5px] font-semibold text-[var(--accent-warning)] tabular-nums break-words">
                [{quest.difficulty.toUpperCase()}] · +{quest.maxExp} EXP ·{' '}
                {realm?.code || 'REALM'}
              </p>
              <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
                {quest.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openEdit(quest)}
              aria-label={`Edit ${quest.title}`}
              className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(quest)}
              aria-label={`Delete ${quest.title}`}
              className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
          {quest.instructions}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 border font-semibold ${
              sched.isScheduledFuture
                ? 'bg-amber-100 text-amber-900 border-amber-700'
                : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-pixel)]/50'
            }`}
          >
            <CalendarClock size={11} />
            {sched.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 border font-semibold bg-[var(--bg-surface-alt)] text-[var(--text-primary)] border-[var(--border-pixel)]/50">
            {scopeLabel}
          </span>
        </div>

        {quest.linkUrl && (
          <div>
            <PixelLinkButton url={quest.linkUrl} label="Buka Tautan Tugas" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-pixel)]/40 text-[12px] text-[var(--text-muted)] tabular-nums">
          <span>
            Target: {dungeon ? `${dungeon.guildCode} — ${dungeon.name}` : 'Semua Kelas (Mapel Terkait)'}
          </span>
          <span>Due: {formatRetroDate(quest.deadline)}</span>
        </div>
      </QuestCard>
    );
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Active Quests / Tugas"
        subtitle="Kelompokkan & berikan tugas berdasarkan kelas serta mapel yang diajarkan"
        action={
          <PixelButton
            type="button"
            size="sm"
            variant="success"
            onClick={() => openCreate()}
          >
            <Plus size={15} />
            Beri Tugas
          </PixelButton>
        }
      />

      {/* Filter Bar: Kelas & Mapel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <PixelFieldLabel htmlFor="filter-qst-dungeon">Filter Kelas</PixelFieldLabel>
          <PixelSelect
            id="filter-qst-dungeon"
            value={dungeonFilter}
            onChange={(e) => {
              const nextDngId = e.target.value;
              setDungeonFilter(nextDngId);
              if (nextDngId !== 'all' && realmFilter !== 'all') {
                const dng = sortedDungeons.find((d) => d.id === nextDngId);
                if (
                  dng &&
                  !doesDungeonTeachRealm(dng, realmFilter) &&
                  !state.quests.some(
                    (q) => q.realmId === realmFilter && doesQuestApplyToDungeon(q, dng)
                  )
                ) {
                  setRealmFilter('all');
                }
              }
            }}
            aria-label="Filter tugas berdasarkan Kelas"
          >
            <option value="all">Semua Kelas ({sortedDungeons.length} Kelas)</option>
            <DungeonOptGroupOptions dungeons={sortedDungeons} />
          </PixelSelect>
        </div>

        <div>
          <PixelFieldLabel htmlFor="filter-qst-realm">
            Filter Mapel {activeFilterDungeon ? `(${activeFilterDungeon.guildCode})` : ''}
          </PixelFieldLabel>
          <PixelSelect
            id="filter-qst-realm"
            value={realmFilter}
            onChange={(e) => setRealmFilter(e.target.value)}
            aria-label="Filter tugas berdasarkan Mapel"
          >
            <option value="all">Semua Mapel ({filteredQuests.length} Tugas)</option>
            {activeFilterDungeon && activeFilterDungeon.realmIds && activeFilterDungeon.realmIds.length > 0 ? (
              <>
                <optgroup label={`Mapel Diajarkan di ${activeFilterDungeon.guildCode}`}>
                  {getTaughtRealmsForDungeon(activeFilterDungeon, state.realms).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </option>
                  ))}
                </optgroup>
                {state.realms.some(
                  (r) => !activeFilterDungeon.realmIds?.includes(r.id)
                ) && (
                  <optgroup label="Mapel Lainnya">
                    {state.realms
                      .filter((r) => !activeFilterDungeon.realmIds?.includes(r.id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} — {r.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </>
            ) : (
              state.realms.map((r) => {
                const classCount = sortedDungeons.filter((d) =>
                  doesDungeonTeachRealm(d, r.id)
                ).length;
                return (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name} ({classCount} Kelas)
                  </option>
                );
              })
            )}
          </PixelSelect>
        </div>
      </div>

      {/* Group Mode Switcher */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setGroupMode('class_realm')}
          className={`pixel-btn min-h-[38px] px-2 text-[11px] sm:text-[11.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            groupMode === 'class_realm'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <GraduationCap size={14} className="shrink-0" />
          <span className="truncate">Per Kelas &amp; Mapel</span>
        </button>
        <button
          type="button"
          onClick={() => setGroupMode('realm_class')}
          className={`pixel-btn min-h-[38px] px-2 text-[11px] sm:text-[11.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            groupMode === 'realm_class'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <BookOpen size={14} className="shrink-0" />
          <span className="truncate">Per Mapel &amp; Kelas</span>
        </button>
        <button
          type="button"
          onClick={() => setGroupMode('flat')}
          className={`pixel-btn min-h-[38px] px-2 text-[11px] sm:text-[11.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            groupMode === 'flat'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <List size={14} className="shrink-0" />
          <span className="truncate">Semua Daftar</span>
        </button>
      </div>

      <BulkDeleteBar
        totalCount={state.quests.length}
        visibleIds={visibleIds}
        selectedIds={selectedIds}
        itemLabel="tugas"
        onToggleSelectAllVisible={toggleSelectAllVisible}
        onClearSelection={() => setSelectedIds([])}
        onRequestDeleteSelected={() => setBulkDeleteMode('selected')}
        onRequestDeleteAll={() => setBulkDeleteMode('all')}
      />

      {/* VIEW MODE 1: GROUPED BY CLASS -> TAUGHT SUBJECTS */}
      {groupMode === 'class_realm' && (
        <>
          {sortedDungeons.length === 0 ? (
            <PixelEmptyChest
              title="Belum Ada Data Kelas!"
              description="Tambahkan kelas di menu Dungeons terlebih dahulu agar tugas dapat dikelompokkan per kelas dan mapel."
            />
          ) : visibleDungeonsForGroup.length === 0 ? (
            <PixelEmptyChest
              title="Tidak Ada Kelas yang Cocok"
              description="Tidak ditemukan kelas yang mengajarkan mapel yang dipilih."
            />
          ) : (
            <div className="space-y-4">
              {visibleDungeonsForGroup.map((dng) => {
                const taughtRealms = getTaughtRealmsForDungeon(dng, state.realms);
                const extraQuestRealmIds = Array.from(
                  new Set(
                    state.quests
                      .filter(
                        (q) =>
                          doesQuestApplyToDungeon(q, dng) &&
                          !taughtRealms.some((r) => r.id === q.realmId)
                      )
                      .map((q) => q.realmId)
                  )
                );
                const extraRealms = state.realms.filter((r) =>
                  extraQuestRealmIds.includes(r.id)
                );

                const allClassRealms = [...taughtRealms, ...extraRealms].filter(
                  (r) => realmFilter === 'all' || r.id === realmFilter
                );

                const questsInClass = filteredQuests.filter((q) =>
                  doesQuestApplyToDungeon(q, dng)
                );
                const isCollapsed = Boolean(collapsedClasses[dng.id]);
                const defaultRealmForClass =
                  realmFilter !== 'all'
                    ? realmFilter
                    : taughtRealms[0]?.id || state.realms[0]?.id || '';

                return (
                  <ThemedPanelCard key={dng.id} className="p-3 sm:p-4 space-y-3">
                    {/* Class Group Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-pixel)]/40">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedClasses((prev) => ({
                            ...prev,
                            [dng.id]: !prev[dng.id],
                          }))
                        }
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span className="w-7 h-7 flex items-center justify-center bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 text-[var(--text-primary)] shrink-0">
                          {isCollapsed ? (
                            <ChevronRight size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-pixel-ui text-[10px] px-1.5 py-0.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)]">
                              {dng.guildCode}
                            </span>
                            <h3 className="text-[14px] sm:text-[15px] font-bold text-[var(--text-primary)] truncate">
                              {dng.name}
                            </h3>
                            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                              ({dng.tier})
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
                            {taughtRealms.length} mapel diajarkan ·{' '}
                            <strong className="text-[var(--text-primary)]">
                              {questsInClass.length} tugas aktif
                            </strong>
                          </p>
                        </div>
                      </button>

                      <PixelButton
                        type="button"
                        size="sm"
                        variant="success"
                        onClick={() => openCreate(dng.id, defaultRealmForClass)}
                      >
                        <Plus size={14} />
                        Beri Tugas
                      </PixelButton>
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-3">
                        {allClassRealms.length === 0 ? (
                          <div className="pixel-box-inset p-3 text-[12px] text-[var(--text-muted)]">
                            Belum ada mapel yang ditautkan ke kelas ini. Atur mapel kelas di menu Dungeons.
                          </div>
                        ) : (
                          allClassRealms.map((realm) => {
                            const questsForClassAndRealm = questsInClass.filter(
                              (q) => q.realmId === realm.id
                            );
                            const isExtra = !taughtRealms.some(
                              (tr) => tr.id === realm.id
                            );

                            return (
                              <div
                                key={`${dng.id}-${realm.id}`}
                                className="pixel-box-inset p-2.5 sm:p-3 space-y-2.5 border border-[var(--border-pixel)]/50 bg-[var(--bg-inset)]"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    <BookOpen
                                      size={14}
                                      className="text-[var(--accent-warning)] shrink-0"
                                    />
                                    <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
                                      {realm.code}
                                    </span>
                                    <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">
                                      {realm.name}
                                    </span>
                                    <span className="text-[11px] px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/40 text-[var(--text-secondary)] font-semibold tabular-nums">
                                      {questsForClassAndRealm.length} tugas
                                    </span>
                                    {isExtra && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-700 font-semibold">
                                        Di luar mapel kelas
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => openCreate(dng.id, realm.id)}
                                    className="pixel-btn min-h-[32px] px-2.5 text-[11px] font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <Plus size={12} />
                                    Tugas {realm.code}
                                  </button>
                                </div>

                                {questsForClassAndRealm.length === 0 ? (
                                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 bg-[var(--bg-surface)]/70 border border-dashed border-[var(--border-pixel)]/40 text-[11.5px] text-[var(--text-muted)]">
                                    <span>
                                      Belum ada tugas untuk {realm.name} di kelas {dng.guildCode}.
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openCreate(dng.id, realm.id)}
                                      className="font-bold text-[var(--accent-success)] hover:underline cursor-pointer"
                                    >
                                      + Buat Tugas Sekarang
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    {questsForClassAndRealm.map((quest) =>
                                      renderQuestCardItem(
                                        quest,
                                        `${dng.id}-${realm.id}`,
                                        dng
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </ThemedPanelCard>
                );
              })}

              {orphanQuests.length > 0 && (
                <ThemedPanelCard className="p-3 sm:p-4 space-y-2.5">
                  <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
                    Tugas Kelas Lain / Kelas Tidak Ditemukan ({orphanQuests.length})
                  </h3>
                  <div className="space-y-2.5">
                    {orphanQuests.map((quest) =>
                      renderQuestCardItem(quest, 'orphan')
                    )}
                  </div>
                </ThemedPanelCard>
              )}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: GROUPED BY SUBJECT -> CLASSES TEACHING IT */}
      {groupMode === 'realm_class' && (
        <>
          {state.realms.length === 0 ? (
            <PixelEmptyChest
              title="Belum Ada Mata Pelajaran!"
              description="Tambahkan mata pelajaran di menu Realms terlebih dahulu."
            />
          ) : (
            <div className="space-y-4">
              {state.realms
                .filter((r) => realmFilter === 'all' || r.id === realmFilter)
                .map((realm) => {
                  const teachingClasses = visibleDungeonsForGroup.filter(
                    (d) =>
                      doesDungeonTeachRealm(d, realm.id) ||
                      filteredQuests.some(
                        (q) => q.realmId === realm.id && doesQuestApplyToDungeon(q, d)
                      )
                  );
                  const realmQuests = filteredQuests.filter(
                    (q) => q.realmId === realm.id
                  );
                  const isCollapsed = Boolean(collapsedRealms[realm.id]);

                  if (dungeonFilter !== 'all' && teachingClasses.length === 0) {
                    return null;
                  }

                  return (
                    <ThemedPanelCard key={realm.id} className="p-3 sm:p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-pixel)]/40">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedRealms((prev) => ({
                              ...prev,
                              [realm.id]: !prev[realm.id],
                            }))
                          }
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <span className="w-7 h-7 flex items-center justify-center bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 text-[var(--text-primary)] shrink-0">
                            {isCollapsed ? (
                              <ChevronRight size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-pixel-ui text-[10px] px-1.5 py-0.5 bg-[var(--accent-warning)] text-[var(--text-on-warning)]">
                                {realm.code}
                              </span>
                              <h3 className="text-[14px] sm:text-[15px] font-bold text-[var(--text-primary)] truncate">
                                {realm.name}
                              </h3>
                            </div>
                            <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
                              Diajarkan di {teachingClasses.length} kelas ·{' '}
                              <strong className="text-[var(--text-primary)]">
                                {realmQuests.length} tugas
                              </strong>
                            </p>
                          </div>
                        </button>

                        <PixelButton
                          type="button"
                          size="sm"
                          variant="success"
                          onClick={() =>
                            openCreate(
                              dungeonFilter !== 'all' ? dungeonFilter : 'all',
                              realm.id
                            )
                          }
                        >
                          <Plus size={14} />
                          Beri Tugas
                        </PixelButton>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-3">
                          {teachingClasses.length === 0 ? (
                            <p className="text-[12px] text-[var(--text-muted)] italic">
                              Belum ada kelas yang mengajarkan mapel ini.
                            </p>
                          ) : (
                            teachingClasses.map((dng) => {
                              const classRealmQuests = realmQuests.filter((q) =>
                                doesQuestApplyToDungeon(q, dng)
                              );
                              return (
                                <div
                                  key={`${realm.id}-${dng.id}`}
                                  className="pixel-box-inset p-2.5 sm:p-3 space-y-2 border border-[var(--border-pixel)]/50 bg-[var(--bg-inset)]"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                      <GraduationCap
                                        size={14}
                                        className="text-[var(--accent-primary)] shrink-0"
                                      />
                                      <span className="text-[13px] font-bold text-[var(--text-primary)]">
                                        {dng.guildCode} — {dng.name}
                                      </span>
                                      <span className="text-[11px] text-[var(--text-muted)]">
                                        ({dng.tier})
                                      </span>
                                      <span className="text-[11px] px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/40 text-[var(--text-secondary)] font-semibold">
                                        {classRealmQuests.length} tugas
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openCreate(dng.id, realm.id)}
                                      className="pixel-btn min-h-[32px] px-2.5 text-[11px] font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center gap-1 cursor-pointer shrink-0"
                                    >
                                      <Plus size={12} />
                                      Tugas {dng.guildCode}
                                    </button>
                                  </div>

                                  {classRealmQuests.length === 0 ? (
                                    <p className="text-[11.5px] text-[var(--text-muted)] italic">
                                      Belum ada tugas untuk kelas {dng.guildCode}.
                                    </p>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {classRealmQuests.map((quest) =>
                                        renderQuestCardItem(
                                          quest,
                                          `${realm.id}-${dng.id}`,
                                          dng
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </ThemedPanelCard>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 3: FLAT LIST */}
      {groupMode === 'flat' && (
        <>
          {filteredQuests.length === 0 ? (
            <PixelEmptyChest
              title="No Active Quests Found!"
              description="Belum ada misi tugas untuk filter kelas & mapel ini."
            />
          ) : (
            <div className="space-y-3">
              {filteredQuests.map((quest) => renderQuestCardItem(quest, 'flat'))}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT QUEST MODAL */}
      <PixelModal
        open={modalOpen}
        title={editing ? 'Edit Active Quest' : 'Beri Tugas Baru'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Grouped Class & Taught Subject Selection */}
          <div className="pixel-box-inset p-3 space-y-3 border border-[var(--border-pixel)] bg-[var(--bg-inset)]">
            <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-primary)]">
              <Layers size={13} />
              <span>KELOMPOK KELAS &amp; MAPEL YANG DIAJARKAN</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <PixelFieldLabel htmlFor="qst-dungeon">
                  1. Target Kelas / Guild
                </PixelFieldLabel>
                <PixelSelect
                  id="qst-dungeon"
                  value={dungeonId}
                  onChange={(e) => handleModalDungeonChange(e.target.value)}
                >
                  <option value="all">Semua Kelas (Sesuai Mapel)</option>
                  <DungeonOptGroupOptions dungeons={sortedDungeons} />
                </PixelSelect>
              </div>

              <div>
                <PixelFieldLabel htmlFor="qst-realm">
                  2. Mapel yang Diajarkan
                </PixelFieldLabel>
                <PixelSelect
                  id="qst-realm"
                  value={realmId}
                  onChange={(e) => setRealmId(e.target.value)}
                >
                  {modalSelectedDungeon &&
                  modalSelectedDungeon.realmIds &&
                  modalSelectedDungeon.realmIds.length > 0 ? (
                    <>
                      <optgroup
                        label={`Mapel Diajarkan di ${modalSelectedDungeon.guildCode}`}
                      >
                        {modalTaughtRealms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.code} — {r.name}
                          </option>
                        ))}
                      </optgroup>
                      {modalOtherRealms.length > 0 && (
                        <optgroup label="Mapel Lainnya (Di Luar Mapel Kelas)">
                          {modalOtherRealms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.code} — {r.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    state.realms.map((r) => {
                      const classCount = sortedDungeons.filter((d) =>
                        doesDungeonTeachRealm(d, r.id)
                      ).length;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.code} — {r.name} ({classCount} Kelas)
                        </option>
                      );
                    })
                  )}
                </PixelSelect>
              </div>
            </div>

            {modalSelectedDungeon ? (
              <div className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
                {modalIsRealmOutsideClass ? (
                  <p className="text-amber-800 bg-amber-50 border border-amber-700 px-2.5 py-1.5 font-semibold">
                    Catatan: Mapel {modalSelectedRealm?.code} belum terdaftar di daftar mapel kelas {modalSelectedDungeon.guildCode}. Siswa yang tidak terdaftar di mapel ini tidak akan melihat tugas kecuali mapel ditambahkan ke kelas/siswa.
                  </p>
                ) : (
                  <p>
                    Tugas ditujukan ke kelas{' '}
                    <strong className="text-[var(--text-primary)]">
                      {modalSelectedDungeon.guildCode} — {modalSelectedDungeon.name}
                    </strong>{' '}
                    pada mapel{' '}
                    <strong className="text-[var(--text-primary)]">
                      {modalSelectedRealm?.code} — {modalSelectedRealm?.name}
                    </strong>
                    .
                  </p>
                )}
              </div>
            ) : (
              <div className="text-[11.5px] text-[var(--text-secondary)] space-y-1">
                <p>
                  Kelas yang mengajarkan{' '}
                  <strong className="text-[var(--text-primary)]">
                    {modalSelectedRealm?.name || 'mapel ini'}
                  </strong>{' '}
                  ({modalClassesTeachingRealm.length} kelas):
                </p>
                {modalClassesTeachingRealm.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {modalClassesTeachingRealm.map((d) => (
                      <span
                        key={d.id}
                        className="text-[10.5px] px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/50 font-semibold text-[var(--text-primary)]"
                      >
                        {d.guildCode}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-800 font-semibold">
                    Belum ada kelas yang menautkan mapel ini di menu Dungeons.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <PixelFieldLabel htmlFor="qst-title">Judul Quest / Tugas</PixelFieldLabel>
            <PixelInput
              id="qst-title"
              required
              placeholder="Contoh: Boss Quest Stoikiometri"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <PixelFieldLabel htmlFor="qst-exp">Max EXP</PixelFieldLabel>
              <PixelInput
                id="qst-exp"
                type="number"
                min={50}
                max={1000}
                step={25}
                value={maxExp}
                onChange={(e) => setMaxExp(Number(e.target.value))}
              />
            </div>
            <div>
              <PixelFieldLabel htmlFor="qst-diff">Tier</PixelFieldLabel>
              <PixelSelect
                id="qst-diff"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as QuestDifficulty)
                }
              >
                <option value="Normal">Normal</option>
                <option value="Elite">Elite</option>
                <option value="Boss">Boss</option>
              </PixelSelect>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <PixelFieldLabel htmlFor="qst-due">Deadline</PixelFieldLabel>
              <PixelInput
                id="qst-due"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <ScheduleConfigSection
            idPrefix="qst-sched"
            targetLabel="Target Guild / Kelas"
            hideTargetSelect
            filterRealmId={realmId}
            filterRealmName={
              modalSelectedRealm
                ? `${modalSelectedRealm.code} — ${modalSelectedRealm.name}`
                : undefined
            }
            dungeons={state.dungeons}
            targetDungeonId={dungeonId}
            onChangeTargetDungeonId={handleModalDungeonChange}
            scheduledAt={scheduledAt}
            onChangeScheduledAt={setScheduledAt}
            classSchedules={classSchedules}
            onChangeClassSchedules={setClassSchedules}
          />

          <div>
            <PixelFieldLabel htmlFor="qst-inst">Instruksi Tugas</PixelFieldLabel>
            <PixelTextarea
              id="qst-inst"
              rows={4}
              required
              placeholder="Tuliskan rincian langkah pengerjaan untuk siswa..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="qst-link">
              Tautan Tugas / Form / Pengumpulan (Opsional)
            </PixelFieldLabel>
            <PixelInput
              id="qst-link"
              inputMode="url"
              placeholder="https://forms.gle/... atau link soal/kumpul tugas"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <PixelButton
              type="button"
              variant="neutral"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </PixelButton>
            <PixelButton type="submit" variant="success">
              Save
            </PixelButton>
          </div>
        </form>
      </PixelModal>

      <PixelConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Quest"
        message={`Hapus Active Quest "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteQuest(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      <PixelConfirmDialog
        open={Boolean(bulkDeleteMode)}
        title={
          bulkDeleteMode === 'all'
            ? 'Hapus Semua Data Tugas'
            : 'Hapus Tugas Terpilih'
        }
        message={
          bulkDeleteMode === 'all'
            ? `Yakin ingin menghapus SEMUA ${state.quests.length} data tugas beserta catatan nilai tugas tersebut? Tindakan ini tidak dapat dibatalkan.`
            : `Yakin ingin menghapus ${selectedIds.length} tugas yang dipilih beserta nilai terkait?`
        }
        confirmLabel={bulkDeleteMode === 'all' ? 'Hapus Semua' : 'Hapus Terpilih'}
        onCancel={() => setBulkDeleteMode(null)}
        onConfirm={() => {
          const idsToDelete =
            bulkDeleteMode === 'all'
              ? state.quests.map((q) => q.id)
              : [...selectedIds];
          if (idsToDelete.length > 0) {
            if (onDeleteQuestsBatch) {
              onDeleteQuestsBatch(idsToDelete);
            } else {
              idsToDelete.forEach((id) => onDeleteQuest(id));
            }
          }
          setSelectedIds([]);
          setBulkDeleteMode(null);
        }}
      />
    </div>
  );
};
