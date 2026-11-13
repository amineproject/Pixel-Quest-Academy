import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AcademyState,
  NoticePriority,
  QuestNotice,
} from '../../types/lms';
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
import { formatRetroDate } from '../../utils/exp';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestNotice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestNotice | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('Medium');
  const [targetDungeonId, setTargetDungeonId] = useState('all');
  const [releaseDate, setReleaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const sorted = [...state.notices]
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .filter((n) => priorityFilter === 'all' || n.priority === priorityFilter);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setPriority('Medium');
    setTargetDungeonId('all');
    setReleaseDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const openEdit = (n: QuestNotice) => {
    setEditing(n);
    setTitle(n.title);
    setDescription(n.description);
    setLinkUrl(n.linkUrl || '');
    setPriority(n.priority);
    setTargetDungeonId(n.targetDungeonId);
    setReleaseDate(n.releaseDate);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSaveNotice({
      id: editing?.id || `ntc-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      linkUrl: linkUrl.trim(),
      priority,
      targetDungeonId,
      releaseDate,
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
        subtitle="Siarkan pengumuman ke seluruh Guild atau kelas"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            Broadcast
          </PixelButton>
        }
      />

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'Critical', 'Medium', 'Low'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriorityFilter(p)}
            className={`pixel-btn min-h-[40px] px-3 font-pixel-ui text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
              priorityFilter === p
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            {p === 'all' ? 'All Notices' : p}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <PixelEmptyChest
          title="No Notices Posted!"
          description="Belum ada pengumuman di Quest Board untuk prioritas ini."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => {
            const targetDungeon = state.dungeons.find(
              (d) => d.id === notice.targetDungeonId
            );
            return (
              <article key={notice.id} className="pixel-box p-4 space-y-2.5 overflow-hidden">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      <span className={priorityTextColor(notice.priority)}>
                        {priorityPrefix(notice.priority)}
                      </span>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-[var(--text-secondary)]">
                        {targetDungeon ? targetDungeon.guildCode : 'All Guilds'}
                      </span>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-[var(--text-muted)] tabular-nums">
                        {formatRetroDate(notice.releaseDate)}
                      </span>
                    </div>
                    <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
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
                      className="pixel-btn min-w-[38px] min-h-[38px] flex items-center justify-center bg-[var(--accent-danger)] text-[#11131E] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {notice.description}
                </p>
                {notice.linkUrl && (
                  <div className="pt-1">
                    <PixelLinkButton
                      url={notice.linkUrl}
                      label="Buka Tautan Pengumuman"
                    />
                  </div>
                )}
              </article>
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
          <div className="grid grid-cols-2 gap-3">
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
              <PixelFieldLabel htmlFor="ntc-date">Tanggal Rilis</PixelFieldLabel>
              <PixelInput
                id="ntc-date"
                type="date"
                required
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <PixelFieldLabel htmlFor="ntc-target">Target Dungeon</PixelFieldLabel>
            <PixelSelect
              id="ntc-target"
              value={targetDungeonId}
              onChange={(e) => setTargetDungeonId(e.target.value)}
            >
              <option value="all">All Guilds (Semua Kelas)</option>
              <DungeonOptGroupOptions dungeons={state.dungeons} />
            </PixelSelect>
          </div>
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
