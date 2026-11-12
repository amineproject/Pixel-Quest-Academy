import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AcademyState,
  ActiveQuest,
  QuestDifficulty,
} from '../../types/lms';
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
import { formatRetroDate, sortDungeonsAlphabetically } from '../../utils/exp';

interface GmActiveQuestsProps {
  state: AcademyState;
  onSaveQuest: (quest: ActiveQuest) => void;
  onDeleteQuest: (id: string) => void;
}

export const GmActiveQuests: React.FC<GmActiveQuestsProps> = ({
  state,
  onSaveQuest,
  onDeleteQuest,
}) => {
  const [realmFilter, setRealmFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActiveQuest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActiveQuest | null>(null);

  const [title, setTitle] = useState('');
  const [realmId, setRealmId] = useState(state.realms[0]?.id || '');
  const [dungeonId, setDungeonId] = useState('all');
  const [deadline, setDeadline] = useState('2026-11-28');
  const [maxExp, setMaxExp] = useState(200);
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Normal');
  const [instructions, setInstructions] = useState('');

  const filtered = state.quests.filter(
    (q) => realmFilter === 'all' || q.realmId === realmFilter
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setRealmId(state.realms[0]?.id || '');
    setDungeonId('all');
    setDeadline('2026-11-28');
    setMaxExp(200);
    setDifficulty('Normal');
    setInstructions('');
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
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) return;
    onSaveQuest({
      id: editing?.id || `qst-${Date.now()}`,
      title: title.trim(),
      realmId,
      dungeonId,
      deadline,
      maxExp: Math.max(50, Number(maxExp) || 200),
      difficulty,
      instructions: instructions.trim(),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Active Quests / Tugas"
        subtitle="Publikasikan instruksi misi, tenggat, dan bobot EXP"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            New Quest
          </PixelButton>
        }
      />

      <PixelSelect
        value={realmFilter}
        onChange={(e) => setRealmFilter(e.target.value)}
        aria-label="Filter tugas berdasarkan Realm"
      >
        <option value="all">All Realms ({state.quests.length} Quests)</option>
        {state.realms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.code} — {r.name}
          </option>
        ))}
      </PixelSelect>

      {filtered.length === 0 ? (
        <PixelEmptyChest
          title="No Active Quests Found!"
          description="Belum ada misi tugas untuk Realm ini."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((quest) => {
            const realm = state.realms.find((r) => r.id === quest.realmId);
            const dungeon = state.dungeons.find(
              (d) => d.id === quest.dungeonId
            );
            return (
              <article key={quest.id} className="pixel-box p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-pixel-body text-[15px] text-[var(--accent-warning)] tabular-nums">
                      [{quest.difficulty.toUpperCase()}] · +{quest.maxExp} EXP ·{' '}
                      {realm?.code || 'REALM'}
                    </p>
                    <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)]">
                      {quest.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(quest)}
                      aria-label={`Edit ${quest.title}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(quest)}
                      aria-label={`Delete ${quest.title}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[#11131E] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="font-pixel-body text-[17px] text-[var(--text-secondary)]">
                  {quest.instructions}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-pixel)]/40 font-pixel-body text-[15px] text-[var(--text-muted)] tabular-nums">
                  <span>
                    Target: {dungeon ? dungeon.guildCode : 'All Guilds'}
                  </span>
                  <span>Due: {formatRetroDate(quest.deadline)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PixelModal
        open={modalOpen}
        title={editing ? 'Edit Active Quest' : 'Create Active Quest'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <PixelFieldLabel htmlFor="qst-title">Judul Quest</PixelFieldLabel>
            <PixelInput
              id="qst-title"
              required
              placeholder="Contoh: Boss Quest Stoikiometri"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="qst-realm">Realm / Mapel</PixelFieldLabel>
              <PixelSelect
                id="qst-realm"
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
              <PixelFieldLabel htmlFor="qst-dng">Target Guild</PixelFieldLabel>
              <PixelSelect
                id="qst-dng"
                value={dungeonId}
                onChange={(e) => setDungeonId(e.target.value)}
              >
                <option value="all">All Guilds</option>
                {sortDungeonsAlphabetically(state.dungeons).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.guildCode})
                  </option>
                ))}
              </PixelSelect>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
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
            <div>
              <PixelFieldLabel htmlFor="qst-due">Deadline</PixelFieldLabel>
              <PixelInput
                id="qst-due"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
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
    </div>
  );
};
