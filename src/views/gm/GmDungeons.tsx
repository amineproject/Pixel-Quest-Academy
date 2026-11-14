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
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import { compareClassText, sortDungeonsAlphabetically } from '../../utils/exp';

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
  realmIds: [],
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
  ).sort(compareClassText);
  const tierFilterOptions = ['all', ...uniqueTiers];

  const sortedDungeons = sortDungeonsAlphabetically(state.dungeons);
  const filtered = sortedDungeons.filter(
    (d) => tierFilter === 'all' || d.tier === tierFilter
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      realmIds: state.realms.map((r) => r.id),
    });
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
      realmIds: d.realmIds || [],
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
      realmIds: form.realmIds || [],
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
              <ThemedPanelCard key={dungeon.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-[var(--accent-warning)] break-words [overflow-wrap:anywhere]">
                      {dungeon.guildCode} · {dungeon.tier}
                    </p>
                    <h3 className="text-[14.5px] font-bold text-[var(--text-primary)] mt-0.5 leading-snug break-words [overflow-wrap:anywhere]">
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
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {dungeon.description && (
                  <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {dungeon.description}
                  </p>
                )}

                <PixelExpBar
                  percent={ratio}
                  labelLeft="Guild Occupancy"
                  labelRight={`${memberCount}/${dungeon.capacity} Heroes`}
                  color="var(--accent-success)"
                />

                {/* Linked Realms / Subjects */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border-pixel)]/30">
                  <span className="font-pixel-ui text-[9px] text-[var(--accent-warning)] uppercase shrink-0">
                    Mapel ({dungeon.realmIds?.length || 0}):
                  </span>
                  {dungeon.realmIds && dungeon.realmIds.length > 0 ? (
                    dungeon.realmIds.map((rid) => {
                      const realm = state.realms.find((r) => r.id === rid);
                      if (!realm) return null;
                      return (
                        <span
                          key={rid}
                          className="text-[11px] font-medium px-2 py-0.5 border border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] flex items-center gap-1"
                        >
                          <span
                            className="w-2 h-2 inline-block shrink-0"
                            style={{ backgroundColor: realm.accentColor }}
                          />
                          <span className="truncate max-w-[120px]">{realm.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] italic">
                      Belum ada mapel terhubung
                    </span>
                  )}
                </div>
              </ThemedPanelCard>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex flex-wrap gap-1.5 mt-2">
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
                    className="text-[10.5px] font-medium px-2 py-1 border border-[var(--border-pixel)]/50 bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-warning)] cursor-pointer"
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
              rows={2}
              placeholder="Fokus pembelajaran rombel..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Hubungkan dengan Mata Pelajaran (Realms) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PixelFieldLabel>Mata Pelajaran di Kelas Ini (Realms)</PixelFieldLabel>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, realmIds: state.realms.map((r) => r.id) })}
                  className="text-[10px] text-[var(--accent-warning)] hover:underline font-pixel-ui cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-[var(--text-muted)] text-[10px]">·</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, realmIds: [] })}
                  className="text-[10px] text-[var(--text-muted)] hover:underline font-pixel-ui cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-tight">
              Pilih mapel yang dibuka di kelas ini. Siswa yang dimasukkan ke kelas ini akan otomatis terdaftar ke mapel-mapel ini:
            </p>
            {state.realms.length === 0 ? (
              <p className="text-[12px] text-[var(--accent-warning)] p-2 pixel-box-inset">
                Belum ada mapel di menu Realms. Buat mapel terlebih dahulu agar bisa dihubungkan ke kelas.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 pixel-box-inset bg-[var(--bg-inset)] max-h-36 overflow-y-auto pixel-scroll">
                {state.realms.map((realm) => {
                  const isChecked = form.realmIds?.includes(realm.id);
                  return (
                    <button
                      key={realm.id}
                      type="button"
                      onClick={() => {
                        const current = form.realmIds || [];
                        const next = current.includes(realm.id)
                          ? current.filter((id) => id !== realm.id)
                          : [...current, realm.id];
                        setForm({ ...form, realmIds: next });
                      }}
                      className={`flex items-center gap-2 p-1.5 border text-left cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[var(--accent-warning)] bg-[var(--accent-warning)]/15 text-[var(--text-primary)] font-semibold'
                          : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 shrink-0 inline-block"
                        style={{ backgroundColor: realm.accentColor }}
                      />
                      <span className="text-[13px] truncate flex-1">{realm.name}</span>
                      <span className="text-[10px] font-pixel-ui text-[var(--accent-warning)]">
                        {isChecked ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
