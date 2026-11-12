import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, AvatarClass, HeroStudent } from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelConfirmDialog,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { getHeroLevelProgress, getHeroTotalExp } from '../../utils/exp';

interface GmHeroesProps {
  state: AcademyState;
  onSaveHero: (hero: HeroStudent) => void;
  onDeleteHero: (id: string) => void;
}

const AVATARS: { value: AvatarClass; label: string }[] = [
  { value: 'knight', label: 'Arcane Knight' },
  { value: 'alchemist', label: 'Potion Alchemist' },
  { value: 'mage', label: 'Rune Mage' },
  { value: 'ranger', label: 'Forest Ranger' },
  { value: 'scholar', label: 'Scroll Scholar' },
];

export const GmHeroes: React.FC<GmHeroesProps> = ({
  state,
  onSaveHero,
  onDeleteHero,
}) => {
  const [search, setSearch] = useState('');
  const [dungeonFilter, setDungeonFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroStudent | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [dungeonId, setDungeonId] = useState(state.dungeons[0]?.id || '');
  const [avatar, setAvatar] = useState<AvatarClass>('knight');
  const [heroClass, setHeroClass] = useState('Arcane Knight');
  const [active, setActive] = useState(true);

  const filtered = state.heroes.filter((h) => {
    const matchDungeon =
      dungeonFilter === 'all' || h.dungeonId === dungeonFilter;
    const q = search.trim().toLowerCase();
    const matchQuery =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.username.toLowerCase().includes(q) ||
      h.studentCode.toLowerCase().includes(q);
    return matchDungeon && matchQuery;
  });

  const openCreate = () => {
    setEditingHero(null);
    setName('');
    setUsername('');
    setStudentCode('');
    setDungeonId(state.dungeons[0]?.id || '');
    setAvatar('knight');
    setHeroClass('Arcane Knight');
    setActive(true);
    setModalOpen(true);
  };

  const openEdit = (h: HeroStudent) => {
    setEditingHero(h);
    setName(h.name);
    setUsername(h.username);
    setStudentCode(h.studentCode);
    setDungeonId(h.dungeonId);
    setAvatar(h.avatar);
    setHeroClass(h.heroClass);
    setActive(h.active);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    onSaveHero({
      id: editingHero?.id || `hr-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      studentCode: studentCode.trim() || String(Math.floor(261000 + Math.random() * 900)),
      dungeonId,
      avatar,
      heroClass: heroClass.trim() || 'Adventurer',
      active,
      joinedDate:
        editingHero?.joinedDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Adventurers / Heroes"
        subtitle="Manajemen akun siswa & status keaktifan"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            Add Hero
          </PixelButton>
        }
      />

      <div className="space-y-2.5">
        <PixelInput
          placeholder="Cari nama, username, atau NIS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari siswa"
        />
        <PixelSelect
          value={dungeonFilter}
          onChange={(e) => setDungeonFilter(e.target.value)}
          aria-label="Filter berdasarkan Dungeon"
        >
          <option value="all">All Dungeons ({state.heroes.length} Heroes)</option>
          {state.dungeons.map((d) => (
            <option key={d.id} value={d.id}>
              {d.guildCode} — {d.name}
            </option>
          ))}
        </PixelSelect>
      </div>

      {filtered.length === 0 ? (
        <PixelEmptyChest
          title="No Heroes Found!"
          description="Tidak ada Hero yang cocok dengan pencarian atau Dungeon ini."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((hero) => {
            const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);
            const exp = getHeroTotalExp(hero.id, state.grades);
            const lvl = getHeroLevelProgress(exp);

            return (
              <article key={hero.id} className="pixel-box p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <PixelAvatar avatar={hero.avatar} size={44} />
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
                        {hero.name}
                      </h3>
                      <p className="text-[12.5px] text-[var(--text-secondary)] truncate">
                        @{hero.username} · NIS {hero.studentCode}
                      </p>
                      <p className="text-[12px] font-semibold text-[var(--accent-warning)] tabular-nums">
                        LV.{lvl.level} ({exp} EXP) · {dungeon?.guildCode || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(hero)}
                      aria-label={`Edit ${hero.name}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(hero)}
                      aria-label={`Delete ${hero.name}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[#11131E] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-pixel)]/40">
                  <span className="text-[12.5px] text-[var(--text-secondary)]">
                    Class: <span className="font-medium text-[var(--text-primary)]">{hero.heroClass}</span> · Status:{' '}
                    <strong
                      className={
                        hero.active
                          ? 'text-[var(--accent-success)]'
                          : 'text-[var(--accent-danger)]'
                      }
                    >
                      {hero.active ? 'ACTIVE' : 'INACTIVE'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSaveHero({ ...hero, active: !hero.active })
                    }
                    className="pixel-btn min-h-[36px] px-2.5 font-pixel-ui text-[10px] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                  >
                    {hero.active ? 'Set Inactive' : 'Activate'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PixelModal
        open={modalOpen}
        title={editingHero ? 'Edit Hero Account' : 'Recruit New Hero'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <PixelFieldLabel htmlFor="hr-name">Nama Lengkap Siswa</PixelFieldLabel>
            <PixelInput
              id="hr-name"
              required
              placeholder="Contoh: Rian Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="hr-user">Username</PixelFieldLabel>
              <PixelInput
                id="hr-user"
                required
                placeholder="rian_x1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <PixelFieldLabel htmlFor="hr-nis">NIS / Kode</PixelFieldLabel>
              <PixelInput
                id="hr-nis"
                placeholder="261001"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
              />
            </div>
          </div>
          <div>
            <PixelFieldLabel htmlFor="hr-dng">Dungeon / Kelas</PixelFieldLabel>
            <PixelSelect
              id="hr-dng"
              value={dungeonId}
              onChange={(e) => setDungeonId(e.target.value)}
            >
              {state.dungeons.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.guildCode} — {d.name}
                </option>
              ))}
            </PixelSelect>
          </div>
          <div>
            <PixelFieldLabel>Sprite Class</PixelFieldLabel>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setAvatar(item.value);
                    setHeroClass(item.label);
                  }}
                  className={`p-1.5 flex flex-col items-center justify-center gap-1 border-2 cursor-pointer transition-all ${
                    avatar === item.value
                      ? 'border-[var(--accent-warning)] bg-[var(--bg-surface-alt)] shadow-sm'
                      : 'border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <PixelAvatar avatar={item.value} size={32} />
                  <span className="font-pixel-ui text-[8.5px] text-[var(--text-primary)] capitalize">
                    {item.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <PixelFieldLabel htmlFor="hr-class">Hero Title</PixelFieldLabel>
            <PixelInput
              id="hr-class"
              value={heroClass}
              onChange={(e) => setHeroClass(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-5 h-5 accent-[var(--accent-success)]"
            />
            <span className="font-pixel-body text-[18px] text-[var(--text-primary)]">
              Akun Hero Aktif
            </span>
          </label>
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
        title="Remove Hero"
        message={`Hapus akun Hero "${deleteTarget?.name}" dari daftar siswa?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteHero(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
