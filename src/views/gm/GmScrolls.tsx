import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, AncientTome, Dungeon } from '../../types/lms';
import { BulkDeleteBar } from '../../components/BulkDeleteBar';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
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
  ThemedPanelCard,
  ThemedReadingSurface,
} from '../../components/ThemePrimitives';
import { WoodenQuestBoard } from '../../components/WoodenQuestBoard';
import {
  formatChapterLabel,
  formatRetroDate,
  getScheduleStatusSummary,
} from '../../utils/exp';

function doesTomeApplyToDungeon(tome: AncientTome, dungeon: Dungeon): boolean {
  const target = tome.targetDungeonId || 'all';
  if (target === dungeon.id) return true;
  if (target !== 'all') return false;
  if (tome.scheduledAt === '__per_class__') {
    return Boolean(tome.classSchedules?.[dungeon.id]);
  }
  return (
    !dungeon.realmIds ||
    dungeon.realmIds.length === 0 ||
    dungeon.realmIds.includes(tome.realmId)
  );
}

interface GmScrollsProps {
  state: AcademyState;
  onSaveTome: (tome: AncientTome) => void;
  onDeleteTome: (id: string) => void;
  onDeleteTomesBatch?: (ids: string[]) => void | Promise<void>;
}

export const GmScrolls: React.FC<GmScrollsProps> = ({
  state,
  onSaveTome,
  onDeleteTome,
  onDeleteTomesBatch,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [realmFilter, setRealmFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewTome, setPreviewTome] = useState<AncientTome | null>(null);
  const [editing, setEditing] = useState<AncientTome | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AncientTome | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(state.dungeons, selectedTier, selectedDungeonIds),
    [state.dungeons, selectedTier, selectedDungeonIds]
  );

  useEffect(() => {
    const valid = new Set(state.tomes.map((t) => t.id));
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [state.tomes]);

  const [realmId, setRealmId] = useState(state.realms[0]?.id || '');
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('Bab 1');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetDungeonId, setTargetDungeonId] = useState('all');
  const [scheduledAt, setScheduledAt] = useState('');
  const [classSchedules, setClassSchedules] = useState<Record<string, string>>({});

  const filtered = state.tomes
    .filter((t) => {
      if (realmFilter !== 'all' && t.realmId !== realmFilter) return false;
      if (
        scope.isFiltered &&
        !scope.activeDungeons.some((d) => doesTomeApplyToDungeon(t, d))
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) =>
      String(a.chapter || '').localeCompare(String(b.chapter || ''), 'id', {
        numeric: true,
        sensitivity: 'base',
      })
    );
  const visibleIds = filtered.map((t) => t.id);

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

  const openCreate = () => {
    const defaultDungeon =
      scope.isFiltered && scope.activeDungeons.length === 1
        ? scope.activeDungeons[0].id
        : 'all';
    setEditing(null);
    setRealmId(
      realmFilter !== 'all' ? realmFilter : state.realms[0]?.id || ''
    );
    setTitle('');
    setChapter('Bab 1');
    setSummary('');
    setContent('');
    setLinkUrl('');
    setTargetDungeonId(defaultDungeon);
    setScheduledAt('');
    setClassSchedules({});
    setModalOpen(true);
  };

  const openEdit = (t: AncientTome) => {
    setEditing(t);
    setRealmId(t.realmId);
    setTitle(t.title);
    setChapter(String(t.chapter || 'Bab 1'));
    setSummary(t.summary);
    setContent(t.content);
    setLinkUrl(t.linkUrl || '');
    setTargetDungeonId(t.targetDungeonId || 'all');
    setScheduledAt(t.scheduledAt || '');
    setClassSchedules(t.classSchedules || {});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSaveTome({
      id: editing?.id || `tm-${Date.now()}`,
      realmId,
      title: title.trim(),
      chapter: chapter.trim() || 'Bab 1',
      summary: summary.trim() || content.trim().slice(0, 90),
      content: content.trim(),
      linkUrl: linkUrl.trim(),
      targetDungeonId,
      scheduledAt,
      classSchedules,
      publishedDate:
        editing?.publishedDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Ancient Tomes / Modul"
        subtitle="Publikasikan materi bacaan terstruktur & terjadwal per kelas"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            New Tome
          </PixelButton>
        }
      />

      {/* Filter Bar: Tingkat Kelas, Kelas & Mapel */}
      <ThemedPanelCard className="p-3.5">
        <TierDungeonFilter
          idPrefix="scrolls"
          dungeons={state.dungeons}
          selectedTier={selectedTier}
          onChangeTier={setSelectedTier}
          selectedDungeonIds={selectedDungeonIds}
          onChangeDungeonIds={setSelectedDungeonIds}
          highlightedRealmId={realmFilter !== 'all' ? realmFilter : undefined}
          extraRightSlot={
            <div>
              <PixelFieldLabel htmlFor="scrolls-realm-filter">
                Filter Mapel (Realm)
              </PixelFieldLabel>
              <PixelSelect
                id="scrolls-realm-filter"
                value={realmFilter}
                onChange={(e) => setRealmFilter(e.target.value)}
                aria-label="Filter materi per Realm"
              >
                <option value="all">Semua Mapel ({state.tomes.length} Tomes)</option>
                {state.realms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </PixelSelect>
            </div>
          }
        />
      </ThemedPanelCard>

      <BulkDeleteBar
        totalCount={state.tomes.length}
        visibleIds={visibleIds}
        selectedIds={selectedIds}
        itemLabel="materi"
        onToggleSelectAllVisible={toggleSelectAllVisible}
        onClearSelection={() => setSelectedIds([])}
        onRequestDeleteSelected={() => setBulkDeleteMode('selected')}
        onRequestDeleteAll={() => setBulkDeleteMode('all')}
      />

      {filtered.length === 0 ? (
        <PixelEmptyChest
          title="No Scrolls Found in This Chest!"
          description="Belum ada Ancient Tome pada Realm yang dipilih."
          action={
            <PixelButton type="button" variant="success" onClick={openCreate}>
              Publish First Tome
            </PixelButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((tome) => {
            const realm = state.realms.find((r) => r.id === tome.realmId);
            const sched = getScheduleStatusSummary(tome, state.dungeons);
            const isSelected = selectedIds.includes(tome.id);
            return (
              <WoodenQuestBoard
                key={tome.id}
                selected={isSelected}
                bannerTitle={`${formatChapterLabel(tome.chapter)} · ${realm?.code || 'MODUL'}`}
                bannerLeft={
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(tome.id)}
                    aria-label={`Pilih materi ${tome.title}`}
                    className="w-4 h-4 accent-[#f6c445] shrink-0 cursor-pointer"
                  />
                }
                stats={[
                  { label: 'MAPEL', value: realm?.name || 'General' },
                  { label: 'RILIS', value: formatRetroDate(tome.publishedDate) },
                  {
                    label: 'STATUS',
                    value: sched.isScheduledFuture ? 'Terjadwal' : 'Tayang',
                    tone: sched.isScheduledFuture ? 'warning' : 'success',
                  },
                ]}
              >
                <button
                  type="button"
                  onClick={() => setPreviewTome(tome)}
                  className="text-left text-[16px] sm:text-[17px] font-bold text-[#261006] hover:text-[#7c2d12] leading-snug break-words [overflow-wrap:anywhere] cursor-pointer block w-full"
                >
                  {tome.title}
                </button>

                {tome.summary && (
                  <p className="text-[14.5px] sm:text-[15px] text-[#45230e] leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
                    {tome.summary}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#563018]">
                  <CalendarClock size={14} className="shrink-0" />
                  <span className="truncate">{sched.label}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3d1b0c]/20">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(tome)}
                      aria-label={`Edit ${tome.title}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] px-2.5 flex items-center justify-center gap-1 bg-[#fff7eb] text-[#261006] text-[12.5px] font-bold cursor-pointer"
                    >
                      <Pencil size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(tome)}
                      aria-label={`Delete ${tome.title}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <PixelButton
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setPreviewTome(tome)}
                  >
                    <BookOpen size={15} />
                    Baca Materi
                  </PixelButton>
                </div>
              </WoodenQuestBoard>
            );
          })}
        </div>
      )}

      {/* Reader Preview Modal */}
      <PixelModal
        open={Boolean(previewTome)}
        title={
          previewTome
            ? `${formatChapterLabel(previewTome.chapter)}: ${previewTome.title}`
            : ''
        }
        onClose={() => setPreviewTome(null)}
      >
        {previewTome && (
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold text-[var(--accent-warning)] break-words">
                {state.realms.find((r) => r.id === previewTome.realmId)?.code} —{' '}
                {state.realms.find((r) => r.id === previewTome.realmId)?.name}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {getScheduleStatusSummary(previewTome, state.dungeons).label}
              </span>
            </div>
            {previewTome.summary && (
              <p className="pixel-box-inset p-2.5 text-[12.5px] text-[var(--text-secondary)] italic leading-relaxed break-words [overflow-wrap:anywhere]">
                {previewTome.summary}
              </p>
            )}
            <ThemedReadingSurface>
              {previewTome.content}
            </ThemedReadingSurface>
            {previewTome.linkUrl && (
              <div>
                <PixelLinkButton
                  url={previewTome.linkUrl}
                  label="Buka Tautan Materi"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <PixelButton
                type="button"
                variant="warning"
                onClick={() => {
                  const t = previewTome;
                  setPreviewTome(null);
                  openEdit(t);
                }}
              >
                <Pencil size={14} />
                Edit Materi
              </PixelButton>
              <PixelButton
                type="button"
                variant="neutral"
                onClick={() => setPreviewTome(null)}
              >
                Tutup
              </PixelButton>
            </div>
          </div>
        )}
      </PixelModal>

      {/* Create / Edit Tome Modal */}
      <PixelModal
        open={modalOpen}
        title={editing ? 'Edit Ancient Tome' : 'Publish Ancient Tome'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <PixelFieldLabel htmlFor="tm-realm">Realm / Mapel</PixelFieldLabel>
            <PixelSelect
              id="tm-realm"
              value={realmId}
              onChange={(e) => setRealmId(e.target.value)}
            >
              {state.realms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>
              ))}
            </PixelSelect>
          </div>
          <div>
            <PixelFieldLabel htmlFor="tm-title">Judul Modul</PixelFieldLabel>
            <PixelInput
              id="tm-title"
              required
              placeholder="Contoh: Ikatan Kovalen & Ionik"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="tm-chap">Bab / Chapter / Teks</PixelFieldLabel>
            <PixelInput
              id="tm-chap"
              type="text"
              required
              placeholder="Contoh: Bab 1, Pertemuan 2, atau Teks Prosedur"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="tm-sum">Ringkasan Singkat</PixelFieldLabel>
            <PixelInput
              id="tm-sum"
              placeholder="Inti bahasan modul..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="tm-content">Isi Materi Lengkap</PixelFieldLabel>
            <PixelTextarea
              id="tm-content"
              rows={6}
              required
              placeholder="Tulis materi pembelajaran terstruktur untuk Hero..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="tm-link">Tautan Materi / PDF / Video (Opsional)</PixelFieldLabel>
            <PixelInput
              id="tm-link"
              inputMode="url"
              placeholder="https://drive.google.com/... atau link YouTube/modul"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <ScheduleConfigSection
            idPrefix="tm-sched"
            targetLabel="Target Kelas Penerima Materi"
            dungeons={state.dungeons}
            targetDungeonId={targetDungeonId}
            onChangeTargetDungeonId={setTargetDungeonId}
            scheduledAt={scheduledAt}
            onChangeScheduledAt={setScheduledAt}
            classSchedules={classSchedules}
            onChangeClassSchedules={setClassSchedules}
          />

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
        title="Delete Tome"
        message={`Hapus Ancient Tome "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteTome(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      <PixelConfirmDialog
        open={Boolean(bulkDeleteMode)}
        title={
          bulkDeleteMode === 'all'
            ? 'Hapus Semua Data Materi'
            : 'Hapus Materi Terpilih'
        }
        message={
          bulkDeleteMode === 'all'
            ? `Yakin ingin menghapus SEMUA ${state.tomes.length} materi yang telah dientrykan? Tindakan ini tidak dapat dibatalkan.`
            : `Yakin ingin menghapus ${selectedIds.length} materi yang dipilih?`
        }
        confirmLabel={bulkDeleteMode === 'all' ? 'Hapus Semua' : 'Hapus Terpilih'}
        onCancel={() => setBulkDeleteMode(null)}
        onConfirm={() => {
          const idsToDelete =
            bulkDeleteMode === 'all'
              ? state.tomes.map((t) => t.id)
              : [...selectedIds];
          if (idsToDelete.length > 0) {
            if (onDeleteTomesBatch) {
              onDeleteTomesBatch(idsToDelete);
            } else {
              idsToDelete.forEach((id) => onDeleteTome(id));
            }
          }
          setSelectedIds([]);
          setBulkDeleteMode(null);
        }}
      />
    </div>
  );
};
