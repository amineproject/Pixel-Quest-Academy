import React, { useState } from 'react';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
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
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
  PixelTextarea,
} from '../../components/PixelUI';
import { ScheduleConfigSection } from '../../components/ScheduleConfigSection';
import { QuestCard } from '../../components/ThemePrimitives';
import { formatRetroDate, getScheduleStatusSummary } from '../../utils/exp';

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
  const [linkUrl, setLinkUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [classSchedules, setClassSchedules] = useState<Record<string, string>>({});

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
      linkUrl: linkUrl.trim(),
      scheduledAt,
      classSchedules,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Active Quests / Tugas"
        subtitle="Publikasikan instruksi misi, tenggat, & jadwal tayang per kelas"
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
            const sched = getScheduleStatusSummary(quest, state.dungeons);
            return (
              <QuestCard key={quest.id} className="space-y-2.5">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[11.5px] font-semibold text-[var(--accent-warning)] tabular-nums break-words">
                      [{quest.difficulty.toUpperCase()}] · +{quest.maxExp} EXP ·{' '}
                      {realm?.code || 'REALM'}
                    </p>
                    <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
                      {quest.title}
                    </h3>
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
                </div>

                {quest.linkUrl && (
                  <div>
                    <PixelLinkButton url={quest.linkUrl} label="Buka Tautan Tugas" />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-pixel)]/40 text-[12px] text-[var(--text-muted)] tabular-nums">
                  <span>
                    Target: {dungeon ? dungeon.guildCode : 'All Guilds'}
                  </span>
                  <span>Due: {formatRetroDate(quest.deadline)}</span>
                </div>
              </QuestCard>
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
            dungeons={state.dungeons}
            targetDungeonId={dungeonId}
            onChangeTargetDungeonId={setDungeonId}
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
            <PixelFieldLabel htmlFor="qst-link">Tautan Tugas / Form / Pengumpulan (Opsional)</PixelFieldLabel>
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
    </div>
  );
};
