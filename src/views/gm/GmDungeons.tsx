import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, Dungeon } from '../../types/lms';
import {
  PixelButton,
  PixelConfirmDialog,
  PixelEmptyChest,
  PixelExpBar,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
  PixelTextarea,
} from '../../components/PixelUI';

interface GmDungeonsProps {
  state: AcademyState;
  onSaveDungeon: (dungeon: Dungeon) => void;
  onDeleteDungeon: (id: string) => void;
}

const EMPTY_FORM: Omit<Dungeon, 'id'> = {
  name: '',
  tier: 'Kelas X SMA',
  guildCode: '',
  capacity: 30,
  description: '',
};

export const GmDungeons: React.FC<GmDungeonsProps> = ({
  state,
  onSaveDungeon,
  onDeleteDungeon,
}) => {
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Dungeon, 'id'>>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Dungeon | null>(null);

  const uniqueTiers = Array.from(
    new Set(state.dungeons.map((d) => d.tier).filter(Boolean))
  );
  const tierFilterOptions = ['all', ...uniqueTiers];

  const filtered = state.dungeons.filter(
    (d) => tierFilter === 'all' || d.tier === tierFilter
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (d: Dungeon) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      tier: d.tier,
      guildCode: d.guildCode,
      capacity: d.capacity,
      description: d.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.guildCode.trim() || !form.tier.trim()) return;
    onSaveDungeon({
      id: editingId || `dng-${Date.now()}`,
      name: form.name.trim(),
      tier: form.tier.trim(),
      guildCode: form.guildCode.trim().toUpperCase(),
      capacity: Math.max(1, Number(form.capacity) || 30),
      description: form.description.trim(),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Dungeons / Guilds"
        subtitle="Kelola rombel kelas (SD, SMP, SMA, SMK, dll.) dan kuota siswa"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            New Dungeon
          </PixelButton>
        }
      />

      {/* Dynamic Tier Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pixel-scroll">
        {tierFilterOptions.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setTierFilter(tier)}
            className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
              tierFilter === tier
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tier === 'all' ? 'All Tiers' : tier}
          </button>
        ))}
      </div>

      {/* Dungeon List */}
      {filtered.length === 0 ? (
        <PixelEmptyChest
          title="No Dungeons Found!"
          description="Belum ada Dungeon untuk tingkatan kelas ini."
          action={
            <PixelButton type="button" variant="success" onClick={openCreate}>
              Create First Dungeon
            </PixelButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((dungeon) => {
            const memberCount = state.heroes.filter(
              (h) => h.dungeonId === dungeon.id
            ).length;
            const ratio = Math.round((memberCount / dungeon.capacity) * 100);
            return (
              <article key={dungeon.id} className="pixel-box p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-pixel-body text-[16px] text-[var(--accent-warning)]">
                      {dungeon.guildCode} · {dungeon.tier}
                    </p>
                    <h3 className="font-pixel-display text-[12px] text-[var(--text-primary)] mt-0.5">
                      {dungeon.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(dungeon)}
                      aria-label={`Edit ${dungeon.name}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(dungeon)}
                      aria-label={`Delete ${dungeon.name}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[#11131E] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {dungeon.description && (
                  <p className="font-pixel-body text-[17px] text-[var(--text-secondary)]">
                    {dungeon.description}
                  </p>
                )}

                <PixelExpBar
                  percent={ratio}
                  labelLeft="Guild Occupancy"
                  labelRight={`${memberCount}/${dungeon.capacity} Heroes`}
                  color="var(--accent-success)"
                />
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <PixelModal
        open={modalOpen}
        title={editingId ? 'Edit Dungeon' : 'Create Dungeon'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <PixelFieldLabel htmlFor="dng-name">Nama Dungeon</PixelFieldLabel>
            <PixelInput
              id="dng-name"
              required
              placeholder="Contoh: Crimson Citadel"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="dng-code">Kode Guild</PixelFieldLabel>
              <PixelInput
                id="dng-code"
                required
                placeholder="X-IPA-1"
                value={form.guildCode}
                onChange={(e) => setForm({ ...form, guildCode: e.target.value })}
              />
            </div>
            <div>
              <PixelFieldLabel htmlFor="dng-tier">
                Tingkat Kelas (Manual: SD, SMP, SMA, dll.)
              </PixelFieldLabel>
              <input
                id="dng-tier"
                list="tier-preset-options"
                required
                placeholder="Ketik manual misal: Kelas 5 SD, Kelas VIII SMP..."
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="pixel-box-inset pixel-focus w-full min-h-[40px] px-3 py-1.5 text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-inset)] outline-none"
              />
              <datalist id="tier-preset-options">
                {/* SD / MI */}
                <option value="Kelas 1 SD" />
                <option value="Kelas 2 SD" />
                <option value="Kelas 3 SD" />
                <option value="Kelas 4 SD" />
                <option value="Kelas 5 SD" />
                <option value="Kelas 6 SD" />
                <option value="Madrasah Ibtidaiyah (MI)" />
                {/* SMP / MTs */}
                <option value="Kelas VII SMP" />
                <option value="Kelas VIII SMP" />
                <option value="Kelas IX SMP" />
                <option value="Madrasah Tsanawiyah (MTs)" />
                {/* SMA / SMK / MA */}
                <option value="Kelas X SMA" />
                <option value="Kelas XI SMA" />
                <option value="Kelas XII SMA" />
                <option value="Kelas X SMK" />
                <option value="Kelas XI SMK" />
                <option value="Kelas XII SMK" />
                <option value="Madrasah Aliyah (MA)" />
                <option value="Pendidikan Kesetaraan (Paket A/B/C)" />
              </datalist>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  'Kelas 1-6 SD',
                  'Kelas VII SMP',
                  'Kelas VIII SMP',
                  'Kelas IX SMP',
                  'Kelas X SMA',
                  'Kelas XI SMA',
                  'Kelas XII SMA',
                  'SMK',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const actual = preset === 'Kelas 1-6 SD' ? 'Kelas 5 SD' : preset;
                      setForm({ ...form, tier: actual });
                    }}
                    className="text-[9.5px] px-1.5 py-0.5 border border-[var(--border-pixel)]/50 bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-warning)] cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <PixelFieldLabel htmlFor="dng-cap">Kapasitas Hero</PixelFieldLabel>
            <PixelInput
              id="dng-cap"
              type="number"
              min={1}
              max={60}
              required
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="dng-desc">Deskripsi Guild</PixelFieldLabel>
            <PixelTextarea
              id="dng-desc"
              rows={3}
              placeholder="Fokus pembelajaran rombel..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
        title="Delete Dungeon"
        message={`Hapus Dungeon "${deleteTarget?.name}" (${deleteTarget?.guildCode})?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteDungeon(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
