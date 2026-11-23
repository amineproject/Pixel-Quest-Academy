import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  CheckSquare,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import {
  AcademyState,
  NoticePriority,
  QuestNotice,
} from '../../types/lms';
import {
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
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import { ThemedNoticeCard, ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  doesTargetMatchDungeon,
  formatRetroDate,
  formatTargetDungeonsSummary,
  getScheduleStatusSummary,
  groupDungeonsByTier,
  parseTargetDungeonIds,
  serializeTargetDungeonIds,
  sortDungeonsAlphabetically,
} from '../../utils/exp';

interface GmQuestBoardProps {
  state: AcademyState;
  onSaveNotice: (notice: QuestNotice) => void;
  onDeleteNotice: (id: string) => void;
}

export const GmQuestBoard: React.FC<GmQuestBoardProps> = ({
  state,
  onSaveNotice,
  onDeleteNotice,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'all' | NoticePriority>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedFilterDungeonIds, setSelectedFilterDungeonIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestNotice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestNotice | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('Medium');
  const [targetScopeMode, setTargetScopeMode] = useState<'all' | 'selected'>('all');
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduledAt, setScheduledAt] = useState('');
  const [classSchedules, setClassSchedules] = useState<Record<string, string>>({});

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(
        state.dungeons,
        selectedTier,
        selectedFilterDungeonIds
      ),
    [state.dungeons, selectedTier, selectedFilterDungeonIds]
  );

  const sortedDungeons = useMemo(
    () => sortDungeonsAlphabetically(state.dungeons),
    [state.dungeons]
  );
  const tierGroups = useMemo(
    () => groupDungeonsByTier(sortedDungeons),
    [sortedDungeons]
  );
  const validDungeonIdSet = useMemo(
    () => new Set(sortedDungeons.map((d) => d.id)),
    [sortedDungeons]
  );

  const sorted = useMemo(
    () =>
      [...state.notices]
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
        .filter((n) => priorityFilter === 'all' || n.priority === priorityFilter)
        .filter(
          (n) =>
            !scope.isFiltered ||
            scope.activeDungeons.some((d) =>
              doesTargetMatchDungeon(n.targetDungeonId, d.id)
            )
        ),
    [state.notices, priorityFilter, scope]
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setPriority('Medium');
    if (scope.isFiltered && scope.activeDungeons.length > 0 && scope.activeDungeons.length < sortedDungeons.length) {
      setTargetScopeMode('selected');
      setSelectedTargetIds(scope.activeDungeons.map((d) => d.id));
    } else {
      setTargetScopeMode('all');
      setSelectedTargetIds([]);
    }
    setTargetError(null);
    setReleaseDate(new Date().toISOString().slice(0, 10));
    setScheduledAt('');
    setClassSchedules({});
    setModalOpen(true);
  };

  const openEdit = (n: QuestNotice) => {
    const parsedIds = parseTargetDungeonIds(n.targetDungeonId).filter((id) =>
      validDungeonIdSet.has(id)
    );
    setEditing(n);
    setTitle(n.title);
    setDescription(n.description);
    setLinkUrl(n.linkUrl || '');
    setPriority(n.priority);
    if (parsedIds.length > 0) {
      setTargetScopeMode('selected');
      setSelectedTargetIds(parsedIds);
    } else {
      setTargetScopeMode('all');
      setSelectedTargetIds([]);
    }
    setTargetError(null);
    setReleaseDate(n.releaseDate);
    setScheduledAt(n.scheduledAt || '');
    setClassSchedules(n.classSchedules || {});
    setModalOpen(true);
  };

  const toggleTargetDungeon = (dungeonId: string) => {
    setTargetError(null);
    setSelectedTargetIds((prev) =>
      prev.includes(dungeonId)
        ? prev.filter((id) => id !== dungeonId)
        : [...prev, dungeonId]
    );
  };

  const toggleTargetTier = (tierIds: string[]) => {
    setTargetError(null);
    const allSelected =
      tierIds.length > 0 && tierIds.every((id) => selectedTargetIds.includes(id));
    if (allSelected) {
      const tierSet = new Set(tierIds);
      setSelectedTargetIds((prev) => prev.filter((id) => !tierSet.has(id)));
    } else {
      setSelectedTargetIds((prev) => Array.from(new Set([...prev, ...tierIds])));
    }
  };

  const effectiveTargetDungeonId = useMemo(() => {
    if (targetScopeMode === 'all') return 'all';
    const validSelected = selectedTargetIds.filter((id) =>
      validDungeonIdSet.has(id)
    );
    if (validSelected.length === 0) return '';
    return serializeTargetDungeonIds(validSelected, sortedDungeons.length);
  }, [
    targetScopeMode,
    selectedTargetIds,
    validDungeonIdSet,
    sortedDungeons.length,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const validSelected = selectedTargetIds.filter((id) =>
      validDungeonIdSet.has(id)
    );
    if (targetScopeMode === 'selected' && validSelected.length === 0) {
      setTargetError(
        'Pilih minimal 1 kelas tujuan, atau ubah mode ke "Semua Kelas".'
      );
      return;
    }

    const finalTargetDungeonId =
      targetScopeMode === 'all'
        ? 'all'
        : serializeTargetDungeonIds(validSelected, sortedDungeons.length);

    const finalTargetIds = parseTargetDungeonIds(finalTargetDungeonId);
    const cleanedClassSchedules =
      finalTargetIds.length === 0
        ? classSchedules
        : Object.fromEntries(
            Object.entries(classSchedules || {}).filter(([dId]) =>
              finalTargetIds.includes(dId)
            )
          );

    onSaveNotice({
      id: editing?.id || `ntc-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      linkUrl: linkUrl.trim(),
      priority,
      targetDungeonId: finalTargetDungeonId,
      releaseDate,
      scheduledAt,
      classSchedules: cleanedClassSchedules,
      author: state.gmProfile.name,
    });
    setModalOpen(false);
  };

  const priorityTextColor = (p: NoticePriority) => {
    if (p === 'Critical') return 'text-[var(--accent-danger)]';
    if (p === 'Medium') return 'text-[var(--accent-warning)]';
    return 'text-[var(--accent-success)]';
  };

  const priorityPrefix = (p: NoticePriority) => {
    if (p === 'Critical') return '[!] CRITICAL';
    if (p === 'Medium') return '[•] MEDIUM';
    return '[-] LOW';
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Quest Board"
        subtitle="Siarkan pengumuman ke semua kelas atau hanya kelas tertentu"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            Broadcast
          </PixelButton>
        }
      />

      <ThemedPanelCard className="p-3 sm:p-4 space-y-3">
        <TierDungeonFilter
          idPrefix="gm-notice-filter"
          dungeons={state.dungeons}
          selectedTier={selectedTier}
          onChangeTier={setSelectedTier}
          selectedDungeonIds={selectedFilterDungeonIds}
          onChangeDungeonIds={setSelectedFilterDungeonIds}
          tierLabel="Filter Tingkat Kelas"
          dungeonLabel="Filter Kelas Penerima"
          allClassesLabel="Semua Kelas"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[var(--border-pixel)]/30">
          {(['all', 'Critical', 'Medium', 'Low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`pixel-btn min-h-[36px] px-3 font-pixel-ui text-[9.5px] sm:text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
                priorityFilter === p
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
              }`}
            >
              {p === 'all' ? 'All Notices' : p}
            </button>
          ))}
        </div>
      </ThemedPanelCard>

      {sorted.length === 0 ? (
        <PixelEmptyChest
          title="No Notices Posted!"
          description="Belum ada pengumuman di Quest Board untuk filter kelas atau prioritas ini."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => {
            const targetIds = parseTargetDungeonIds(notice.targetDungeonId);
            const targetSummary = formatTargetDungeonsSummary(
              notice.targetDungeonId,
              state.dungeons,
              'Semua Kelas'
            );
            const targetedDungeons = state.dungeons.filter((d) =>
              targetIds.includes(d.id)
            );
            const sched = getScheduleStatusSummary(notice, state.dungeons);
            return (
              <ThemedNoticeCard
                key={notice.id}
                speaker={`${priorityPrefix(notice.priority)} · ${targetSummary}`}
                metaRight={formatRetroDate(notice.releaseDate)}
                footer={
                  <div className="pt-1 border-t border-[var(--border-pixel)]/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] border font-semibold ${
                          sched.isScheduledFuture
                            ? 'bg-amber-100 text-amber-900 border-amber-700'
                            : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-pixel)]/50'
                        }`}
                      >
                        <CalendarClock size={11} />
                        {sched.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] border font-semibold ${
                          targetIds.length === 0
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                            : 'bg-[var(--surface-tint)] text-[var(--text-primary)] border-[var(--border-pixel)]/60'
                        }`}
                      >
                        {targetIds.length === 0 ? (
                          <>
                            <Users size={11} />
                            Semua Kelas
                          </>
                        ) : (
                          <>
                            <CheckSquare size={11} />
                            Khusus {targetedDungeons.length || targetIds.length} Kelas
                          </>
                        )}
                      </span>
                    </div>
                    {notice.linkUrl && (
                      <PixelLinkButton
                        url={notice.linkUrl}
                        label="Buka Tautan Pengumuman"
                        compact
                      />
                    )}
                  </div>
                }
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className={`text-[10.5px] font-bold ${priorityTextColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                    <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words">
                      {notice.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(notice)}
                      aria-label={`Edit ${notice.title}`}
                      className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(notice)}
                      aria-label={`Delete ${notice.title}`}
                      className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words">
                  {notice.description}
                </p>
                {targetedDungeons.length > 1 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {targetedDungeons.map((d) => (
                      <span
                        key={d.id}
                        className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-[var(--bg-inset)] border border-[var(--border-pixel)]/40 text-[var(--text-secondary)]"
                      >
                        {d.guildCode} ({d.name})
                      </span>
                    ))}
                  </div>
                )}
              </ThemedNoticeCard>
            );
          })}
        </div>
      )}

      <PixelModal
        open={modalOpen}
        title={editing ? 'Edit Broadcast' : 'New Guild Broadcast'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <PixelFieldLabel htmlFor="ntc-title">Judul Pengumuman</PixelFieldLabel>
            <PixelInput
              id="ntc-title"
              required
              placeholder="Contoh: Jadwal Boss Battle Praktikum"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="ntc-prio">Prioritas</PixelFieldLabel>
              <PixelSelect
                id="ntc-prio"
                value={priority}
                onChange={(e) => setPriority(e.target.value as NoticePriority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="Critical">Critical</option>
              </PixelSelect>
            </div>
            <div>
              <PixelFieldLabel htmlFor="ntc-date">Tanggal Label</PixelFieldLabel>
              <PixelInput
                id="ntc-date"
                type="date"
                required
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Target Kelas Penerima Pengumuman */}
          <div className="pixel-box-inset p-3 space-y-2.5 border border-[var(--border-pixel)] bg-[var(--bg-inset)]">
            <PixelFieldLabel>Sasaran Kelas Penerima</PixelFieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetScopeMode('all');
                  setTargetError(null);
                }}
                className={`pixel-btn min-h-[40px] px-3 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  targetScopeMode === 'all'
                    ? 'bg-[var(--accent-success)] text-[var(--text-on-success)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                }`}
              >
                <Users size={14} />
                Semua Kelas ({sortedDungeons.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetScopeMode('selected');
                  setTargetError(null);
                }}
                className={`pixel-btn min-h-[40px] px-3 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  targetScopeMode === 'selected'
                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                }`}
              >
                <CheckSquare size={14} />
                Beberapa / Kelas Tertentu
              </button>
            </div>

            {targetScopeMode === 'all' ? (
              <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
                Pengumuman ini akan tampil di seluruh kelas pada Era &amp; Season aktif.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
                    Centang kelas penerima ({selectedTargetIds.length} dipilih). Kelas lain tidak akan melihat pengumuman ini.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetError(null);
                        setSelectedTargetIds(sortedDungeons.map((d) => d.id));
                      }}
                      className="text-[var(--accent-success)] hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-[var(--text-muted)]">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetError(null);
                        setSelectedTargetIds([]);
                      }}
                      className="text-[var(--text-muted)] hover:underline cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                {tierGroups.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tierGroups.map((group) => {
                      const tierIds = group.items.map((d) => d.id);
                      const pickedCount = tierIds.filter((id) =>
                        selectedTargetIds.includes(id)
                      ).length;
                      const allTierPicked =
                        tierIds.length > 0 && pickedCount === tierIds.length;
                      return (
                        <button
                          key={group.tier}
                          type="button"
                          onClick={() => toggleTargetTier(tierIds)}
                          className={`min-h-[32px] px-2.5 py-0.5 border text-[11.5px] font-semibold cursor-pointer ${
                            allTierPicked
                              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--border-pixel)] font-bold'
                              : pickedCount > 0
                                ? 'bg-[var(--surface-tint)] text-[var(--text-primary)] border-[var(--border-pixel)] font-bold'
                                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-pixel)]/50'
                          }`}
                        >
                          {group.tier} ({pickedCount}/{tierIds.length})
                        </button>
                      );
                    })}
                  </div>
                )}

                {sortedDungeons.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)] italic">
                    Belum ada kelas di Era ini. Tambahkan kelas terlebih dahulu di menu Dungeons.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto pixel-scroll space-y-2 pr-1">
                    {tierGroups.map((group) => (
                      <div key={group.tier} className="space-y-1">
                        {tierGroups.length > 1 && (
                          <p className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            {group.tier}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.items.map((dng) => {
                            const checked = selectedTargetIds.includes(dng.id);
                            return (
                              <button
                                key={dng.id}
                                type="button"
                                onClick={() => toggleTargetDungeon(dng.id)}
                                className={`min-h-[38px] px-2.5 py-1 border text-left flex items-center gap-2 text-[12.5px] cursor-pointer transition-colors ${
                                  checked
                                    ? 'bg-[var(--surface-tint)] border-[var(--border-pixel)] font-bold text-[var(--text-primary)]'
                                    : 'bg-[var(--bg-surface)] border-[var(--border-pixel)]/40 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 shrink-0 border flex items-center justify-center ${
                                    checked
                                      ? 'bg-[var(--accent-primary)] border-[var(--border-pixel)] text-[var(--text-on-accent)]'
                                      : 'bg-[var(--bg-inset)] border-[var(--border-pixel)]/70'
                                  }`}
                                >
                                  {checked && <Check size={12} strokeWidth={3} />}
                                </span>
                                <span className="min-w-0 flex-1 truncate">
                                  {dng.guildCode} — {dng.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {sortedDungeons.length > 0 &&
                  selectedTargetIds.length >= sortedDungeons.length && (
                    <p className="text-[11px] font-semibold text-emerald-700">
                      Semua kelas dipilih — pengumuman akan dibagikan ke seluruh kelas.
                    </p>
                  )}

                {targetError && (
                  <p className="text-[12px] font-bold text-[var(--accent-danger)]">
                    [!] {targetError}
                  </p>
                )}
              </div>
            )}
          </div>

          <ScheduleConfigSection
            idPrefix="ntc-sched"
            targetLabel="Target Dungeon"
            hideTargetSelect
            dungeons={state.dungeons}
            targetDungeonId={effectiveTargetDungeonId || 'all'}
            onChangeTargetDungeonId={() => {}}
            scheduledAt={scheduledAt}
            onChangeScheduledAt={setScheduledAt}
            classSchedules={classSchedules}
            onChangeClassSchedules={setClassSchedules}
          />

          <div>
            <PixelFieldLabel htmlFor="ntc-body">Isi Pengumuman</PixelFieldLabel>
            <PixelTextarea
              id="ntc-body"
              rows={4}
              required
              placeholder="Tulis instruksi atau kabar terbaru untuk siswa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="ntc-link">Tautan Lampiran / Info (Opsional)</PixelFieldLabel>
            <PixelInput
              id="ntc-link"
              inputMode="url"
              placeholder="https://drive.google.com/... atau link info lainnya"
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
              Publish
            </PixelButton>
          </div>
        </form>
      </PixelModal>

      <PixelConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Notice"
        message={`Hapus pengumuman "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteNotice(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
