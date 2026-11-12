import React, { useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, AncientTome } from '../../types/lms';
import {
  PixelButton,
  PixelConfirmDialog,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
  PixelTextarea,
} from '../../components/PixelUI';
import { formatRetroDate } from '../../utils/exp';

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
  const [chapter, setChapter] = useState(1);
  const [readMinutes, setReadMinutes] = useState(8);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  const filtered = state.tomes
    .filter((t) => realmFilter === 'all' || t.realmId === realmFilter)
    .sort((a, b) => a.chapter - b.chapter);

  const openCreate = () => {
    setEditing(null);
    setRealmId(
      realmFilter !== 'all' ? realmFilter : state.realms[0]?.id || ''
    );
    setTitle('');
    setChapter(1);
    setReadMinutes(8);
    setSummary('');
    setContent('');
    setModalOpen(true);
  };

  const openEdit = (t: AncientTome) => {
    setEditing(t);
    setRealmId(t.realmId);
    setTitle(t.title);
    setChapter(t.chapter);
    setReadMinutes(t.readMinutes);
    setSummary(t.summary);
    setContent(t.content);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSaveTome({
      id: editing?.id || `tm-${Date.now()}`,
      realmId,
      title: title.trim(),
      chapter: Math.max(1, Number(chapter) || 1),
      readMinutes: Math.max(1, Number(readMinutes) || 5),
      summary: summary.trim() || content.trim().slice(0, 90),
      content: content.trim(),
      publishedDate:
        editing?.publishedDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Ancient Tomes / Modul"
        subtitle="Publikasikan materi bacaan terstruktur per Realm"
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
            return (
              <article key={tome.id} className="pixel-box p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-pixel-body text-[15px] text-[var(--accent-warning)]">
                      Bab {tome.chapter} · {realm?.name || 'General'} ·{' '}
                      {tome.readMinutes} min read
                    </p>
                    <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] mt-0.5">
                      {tome.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(tome)}
                      aria-label={`Edit ${tome.title}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(tome)}
                      aria-label={`Delete ${tome.title}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[#11131E] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="font-pixel-body text-[17px] text-[var(--text-secondary)]">
                  {tome.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-pixel)]/40">
                  <span className="font-pixel-body text-[15px] text-[var(--text-muted)] tabular-nums">
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
              </article>
            );
          })}
        </div>
      )}

      {/* Reader Preview Modal */}
      <PixelModal
        open={Boolean(previewTome)}
        title={previewTome ? `Bab ${previewTome.chapter}: ${previewTome.title}` : ''}
        onClose={() => setPreviewTome(null)}
      >
        {previewTome && (
          <div className="space-y-3">
            <p className="font-pixel-body text-[16px] text-[var(--accent-warning)]">
              {state.realms.find((r) => r.id === previewTome.realmId)?.name} ·{' '}
              {previewTome.readMinutes} min read
            </p>
            <div className="pixel-box-inset p-4 font-pixel-body text-[19px] text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
              {previewTome.content}
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="tm-chap">Bab / Chapter</PixelFieldLabel>
              <PixelInput
                id="tm-chap"
                type="number"
                min={1}
                value={chapter}
                onChange={(e) => setChapter(Number(e.target.value))}
              />
            </div>
            <div>
              <PixelFieldLabel htmlFor="tm-min">Estimasi Baca (Menit)</PixelFieldLabel>
              <PixelInput
                id="tm-min"
                type="number"
                min={1}
                value={readMinutes}
                onChange={(e) => setReadMinutes(Number(e.target.value))}
              />
            </div>
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
