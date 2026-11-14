import React, { useState } from 'react';
import { BookOpen, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, AncientTome } from '../../types/lms';
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
import {
  formatChapterLabel,
  formatRetroDate,
  getScheduleStatusSummary,
} from '../../utils/exp';

interface GmScrollsProps {
  state: AcademyState;
  onSaveTome: (tome: AncientTome) => void;
  onDeleteTome: (id: string) => void;
}

export const GmScrolls: React.FC<GmScrollsProps> = ({
  state,
  onSaveTome,
  onDeleteTome,
}) => {
  const [realmFilter, setRealmFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewTome, setPreviewTome] = useState<AncientTome | null>(null);
  const [editing, setEditing] = useState<AncientTome | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AncientTome | null>(null);

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
    .filter((t) => realmFilter === 'all' || t.realmId === realmFilter)
    .sort((a, b) =>
      String(a.chapter || '').localeCompare(String(b.chapter || ''), 'id', {
        numeric: true,
        sensitivity: 'base',
      })
    );

  const openCreate = () => {
    setEditing(null);
    setRealmId(
      realmFilter !== 'all' ? realmFilter : state.realms[0]?.id || ''
    );
    setTitle('');
    setChapter('Bab 1');
    setSummary('');
    setContent('');
    setLinkUrl('');
    setTargetDungeonId('all');
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

      <PixelSelect
        value={realmFilter}
        onChange={(e) => setRealmFilter(e.target.value)}
        aria-label="Filter materi per Realm"
      >
        <option value="all">All Realms ({state.tomes.length} Tomes)</option>
        {state.realms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.code} — {r.name}
          </option>
        ))}
      </PixelSelect>

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
            return (
              <ThemedPanelCard key={tome.id} className="space-y-2.5">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-[var(--accent-warning)] break-words">
                      {formatChapterLabel(tome.chapter)} · {realm?.name || 'General'}
                    </p>
                    <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] mt-0.5 leading-snug break-words [overflow-wrap:anywhere]">
                      {tome.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(tome)}
                      aria-label={`Edit ${tome.title}`}
                      className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(tome)}
                      aria-label={`Delete ${tome.title}`}
                      className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed break-words [overflow-wrap:anywhere]">
                  {tome.summary}
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
                </div>

                {tome.linkUrl && (
                  <div>
                    <PixelLinkButton url={tome.linkUrl} label="Buka Tautan Materi" />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-pixel)]/40">
                  <span className="text-[12px] text-[var(--text-muted)] tabular-nums">
                    Published {formatRetroDate(tome.publishedDate)}
                  </span>
                  <PixelButton
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setPreviewTome(tome)}
                  >
                    <BookOpen size={14} />
                    Read Preview
                  </PixelButton>
                </div>
              </ThemedPanelCard>
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
            <p className="text-[12.5px] font-semibold text-[var(--accent-warning)] break-words">
              {state.realms.find((r) => r.id === previewTome.realmId)?.name}
            </p>
            {previewTome.linkUrl && (
              <div>
                <PixelLinkButton
                  url={previewTome.linkUrl}
                  label="Buka Tautan Materi"
                />
              </div>
            )}
            <ThemedReadingSurface>
              {previewTome.content}
            </ThemedReadingSurface>
            <PixelButton
              type="button"
              variant="neutral"
              fullWidth
              onClick={() => setPreviewTome(null)}
            >
              Close Tome
            </PixelButton>
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
    </div>
  );
};
