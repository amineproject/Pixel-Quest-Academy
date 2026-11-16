import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Eye,
  Layers,
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
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
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
import {
  ThemedPanelCard,
  ThemedReadingSurface,
} from '../../components/ThemePrimitives';
import { WoodenQuestBoard } from '../../components/WoodenQuestBoard';
import {
  formatRetroDate,
  getScheduleStatusSummary,
} from '../../utils/exp';

interface GmActiveQuestsProps {
  state: AcademyState;
  onSaveQuest: (quest: ActiveQuest) => void;
  onDeleteQuest: (id: string) => void;
  onDeleteQuestsBatch?: (ids: string[]) => void | Promise<void>;
}

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
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [realmFilter, setRealmFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [previewQuest, setPreviewQuest] = useState<ActiveQuest | null>(null);
  const [editing, setEditing] = useState<ActiveQuest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActiveQuest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(state.dungeons, selectedTier, selectedDungeonIds),
    [state.dungeons, selectedTier, selectedDungeonIds]
  );
  const sortedDungeons = scope.sortedDungeons;
  const selectedDungeons = scope.activeDungeons;

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

  // Filtered quests matching active Tingkat, Kelas & Mapel filters
  const filteredQuests = useMemo(() => {
    return state.quests.filter((q) => {
      if (realmFilter !== 'all' && q.realmId !== realmFilter) return false;
      if (
        scope.isFiltered &&
        !scope.activeDungeons.some((d) => doesQuestApplyToDungeon(q, d))
      ) {
        return false;
      }
      return true;
    });
  }, [state.quests, scope, realmFilter]);

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
      preselectedDungeonId ??
      (selectedDungeons.length === 1 ? selectedDungeons[0].id : 'all');

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
    scope.isFiltered && selectedDungeons.length === 1
      ? selectedDungeons[0]
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
      <WoodenQuestBoard
        key={`${keyPrefix}::${quest.id}`}
        selected={isSelected}
        bannerTitle={`${quest.difficulty.toUpperCase()} QUEST · ${realm?.code || 'MAPEL'}`}
        bannerLeft={
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(quest.id)}
            aria-label={`Pilih tugas ${quest.title}`}
            className="w-4 h-4 accent-[#f6c445] shrink-0 cursor-pointer"
          />
        }
        stats={[
          { label: 'EXP', value: `+${quest.maxExp}`, tone: 'warning' },
          { label: 'TENGGAT', value: formatRetroDate(quest.deadline) },
          {
            label: 'KELAS',
            value: dungeon ? dungeon.guildCode : 'Semua Kelas',
          },
        ]}
      >
        <button
          type="button"
          onClick={() => setPreviewQuest(quest)}
          className="text-left text-[16px] sm:text-[17px] font-bold text-[#261006] hover:text-[#7c2d12] leading-snug break-words [overflow-wrap:anywhere] cursor-pointer block w-full"
        >
          {quest.title}
        </button>

        <p className="text-[14.5px] sm:text-[15px] text-[#45230e] leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
          {quest.instructions}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-[#563018]">
          <span className="inline-flex items-center gap-1">
            <CalendarClock size={14} className="shrink-0" />
            <span>{sched.label}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{scopeLabel}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3d1b0c]/20">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(quest)}
              aria-label={`Edit ${quest.title}`}
              className="pixel-btn min-w-[40px] min-h-[40px] px-2.5 flex items-center justify-center gap-1 bg-[#fff7eb] text-[#261006] text-[12.5px] font-bold cursor-pointer"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(quest)}
              aria-label={`Delete ${quest.title}`}
              className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <PixelButton
            type="button"
            size="sm"
            variant="primary"
            onClick={() => setPreviewQuest(quest)}
          >
            <Eye size={15} />
            Lihat Instruksi
          </PixelButton>
        </div>
      </WoodenQuestBoard>
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

      {/* Filter Bar: Tingkat Kelas, Kelas & Mapel */}
      <ThemedPanelCard className="p-3.5">
        <TierDungeonFilter
          idPrefix="filter-qst"
          dungeons={state.dungeons}
          selectedTier={selectedTier}
          onChangeTier={(nextTier) => {
            setSelectedTier(nextTier);
            setSelectedDungeonIds([]);
          }}
          selectedDungeonIds={selectedDungeonIds}
          onChangeDungeonIds={(nextIds) => {
            setSelectedDungeonIds(nextIds);
            if (nextIds.length > 0 && realmFilter !== 'all') {
              const nextSet = new Set(nextIds);
              const nextDngs = sortedDungeons.filter((d) => nextSet.has(d.id));
              const anyMatchesRealm = nextDngs.some(
                (dng) =>
                  doesDungeonTeachRealm(dng, realmFilter) ||
                  state.quests.some(
                    (q) =>
                      q.realmId === realmFilter &&
                      doesQuestApplyToDungeon(q, dng)
                  )
              );
              if (!anyMatchesRealm) {
                setRealmFilter('all');
              }
            }
          }}
          highlightedRealmId={realmFilter !== 'all' ? realmFilter : undefined}
          extraRightSlot={
            <div>
              <PixelFieldLabel htmlFor="filter-qst-realm">
                Filter Mapel{' '}
                {activeFilterDungeon
                  ? `(${activeFilterDungeon.guildCode})`
                  : scope.isFiltered && selectedDungeons.length > 1
                    ? `(${selectedDungeons.length} Kelas)`
                    : ''}
              </PixelFieldLabel>
              <PixelSelect
                id="filter-qst-realm"
                value={realmFilter}
                onChange={(e) => setRealmFilter(e.target.value)}
                aria-label="Filter tugas berdasarkan Mapel"
              >
                <option value="all">Semua Mapel ({filteredQuests.length} Tugas)</option>
                {activeFilterDungeon &&
                activeFilterDungeon.realmIds &&
                activeFilterDungeon.realmIds.length > 0 ? (
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
                    const classCount = scope.dungeonsInSelectedTier.filter((d) =>
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
          }
        />
      </ThemedPanelCard>

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

      {/* QUEST LIST */}
      {filteredQuests.length === 0 ? (
        <PixelEmptyChest
          title="No Active Quests Found!"
          description="Belum ada misi tugas untuk filter kelas & mapel ini."
        />
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest) => renderQuestCardItem(quest, 'list'))}
        </div>
      )}

      {/* QUEST DETAIL POP-UP MODAL */}
      <PixelModal
        open={Boolean(previewQuest)}
        title={previewQuest ? previewQuest.title : ''}
        onClose={() => setPreviewQuest(null)}
      >
        {previewQuest && (() => {
          const realm = state.realms.find((r) => r.id === previewQuest.realmId);
          const dungeon = state.dungeons.find(
            (d) => d.id === previewQuest.dungeonId
          );
          const sched = getScheduleStatusSummary(previewQuest, state.dungeons);
          return (
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-[var(--accent-warning)] break-words">
                  {realm ? `${realm.code} — ${realm.name}` : 'Mapel'} · [
                  {previewQuest.difficulty.toUpperCase()}] · +{previewQuest.maxExp} EXP
                </p>
                <span className="text-[11.5px] font-semibold text-[var(--text-muted)] tabular-nums">
                  Due: {formatRetroDate(previewQuest.deadline)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border font-semibold bg-[var(--bg-inset)] text-[var(--text-primary)] border-[var(--border-pixel)]/50">
                  Target:{' '}
                  {dungeon
                    ? `${dungeon.guildCode} — ${dungeon.name}`
                    : 'Semua Kelas (Mapel Terkait)'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border font-semibold bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-pixel)]/50">
                  <CalendarClock size={11} />
                  {sched.label}
                </span>
              </div>

              <ThemedReadingSurface>
                {previewQuest.instructions}
              </ThemedReadingSurface>

              {previewQuest.linkUrl && (
                <div>
                  <PixelLinkButton
                    url={previewQuest.linkUrl}
                    label="Buka Tautan Tugas"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <PixelButton
                  type="button"
                  variant="warning"
                  onClick={() => {
                    const q = previewQuest;
                    setPreviewQuest(null);
                    openEdit(q);
                  }}
                >
                  <Pencil size={14} />
                  Edit Tugas
                </PixelButton>
                <PixelButton
                  type="button"
                  variant="neutral"
                  onClick={() => setPreviewQuest(null)}
                >
                  Tutup
                </PixelButton>
              </div>
            </div>
          );
        })()}
      </PixelModal>

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
