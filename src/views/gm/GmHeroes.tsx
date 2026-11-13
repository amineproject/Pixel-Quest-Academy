import React, { useState } from 'react';
import { Dices, KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, AvatarClass, HeroStudent } from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  DungeonOptGroupOptions,
  PixelButton,
  PixelConfirmDialog,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import {
  getHeroEffectiveRealmIds,
  getHeroLevelProgress,
  getHeroTotalExp,
  sortDungeonsAlphabetically,
} from '../../utils/exp';

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
  const [realmFilter, setRealmFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroStudent | null>(null);

  const sortedDungeons = sortDungeonsAlphabetically(state.dungeons);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [dungeonId, setDungeonId] = useState(sortedDungeons[0]?.id || '');
  const [enrolledRealmIds, setEnrolledRealmIds] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<AvatarClass>('knight');
  const [heroClass, setHeroClass] = useState('Arcane Knight');
  const [active, setActive] = useState(true);
  const [pin, setPin] = useState('');
  const [clearPin, setClearPin] = useState(false);

  const getEffectiveRealmsForHero = (hero: HeroStudent): string[] => {
    return getHeroEffectiveRealmIds(hero, state.dungeons) || [];
  };

  const dungeonOrder = new Map(sortedDungeons.map((d, idx) => [d.id, idx]));

  const filtered = state.heroes
    .filter((h) => {
      const matchDungeon =
        dungeonFilter === 'all' || h.dungeonId === dungeonFilter;
      const heroRealms = getEffectiveRealmsForHero(h);
      const matchRealm =
        realmFilter === 'all'
          ? true
          : realmFilter === 'unassigned'
            ? heroRealms.length === 0
            : heroRealms.includes(realmFilter);
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.username.toLowerCase().includes(q) ||
        h.studentCode.toLowerCase().includes(q);
      return matchDungeon && matchRealm && matchQuery;
    })
    .sort((a, b) => {
      const idxA = dungeonOrder.get(a.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      const idxB = dungeonOrder.get(b.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
    });

  const getDungeonDefaultRealms = (dId: string): string[] => {
    const dng = state.dungeons.find((d) => d.id === dId);
    if (dng?.realmIds && dng.realmIds.length > 0) {
      return dng.realmIds;
    }
    return state.realms.map((r) => r.id);
  };

  const openCreate = () => {
    const defaultDungeonId = sortedDungeons[0]?.id || '';
    setEditingHero(null);
    setName('');
    setUsername('');
    setStudentCode('');
    setDungeonId(defaultDungeonId);
    setEnrolledRealmIds(getDungeonDefaultRealms(defaultDungeonId));
    setAvatar('knight');
    setHeroClass('Arcane Knight');
    setActive(true);
    setPin('');
    setClearPin(false);
    setModalOpen(true);
  };

  const openEdit = (h: HeroStudent) => {
    setEditingHero(h);
    setName(h.name);
    setUsername(h.username);
    setStudentCode(h.studentCode);
    setDungeonId(h.dungeonId);
    const existingRealms =
      h.enrolledRealmIds && h.enrolledRealmIds.length > 0
        ? h.enrolledRealmIds
        : getDungeonDefaultRealms(h.dungeonId);
    setEnrolledRealmIds(existingRealms);
    setAvatar(h.avatar);
    setHeroClass(h.heroClass);
    setActive(h.active);
    setPin('');
    setClearPin(false);
    setModalOpen(true);
  };

  const handleDungeonSelectionChange = (nextDungeonId: string) => {
    setDungeonId(nextDungeonId);
    const dng = state.dungeons.find((d) => d.id === nextDungeonId);
    if (dng?.realmIds && dng.realmIds.length > 0) {
      setEnrolledRealmIds(dng.realmIds);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    const resolvedDungeonId = dungeonId || sortedDungeons[0]?.id || '';
    const trimmedPin = pin.trim();
    onSaveHero({
      id: editingHero?.id || `hr-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      studentCode: studentCode.trim() || String(Math.floor(261000 + Math.random() * 900)),
      dungeonId: resolvedDungeonId,
      avatar,
      heroClass: heroClass.trim() || 'Adventurer',
      active,
      joinedDate:
        editingHero?.joinedDate || new Date().toISOString().slice(0, 10),
      enrolledRealmIds,
      ...(trimmedPin
        ? { pin: trimmedPin, hasPin: true }
        : clearPin
          ? { pin: '', hasPin: false }
          : { hasPin: Boolean(editingHero?.hasPin) }),
    });
    setModalOpen(false);
  };

  const selectedDungeon = state.dungeons.find((d) => d.id === dungeonId);

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Adventurers / Heroes"
        subtitle="Manajemen siswa, kelas, dan pengelompokan mapel"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PixelSelect
            value={dungeonFilter}
            onChange={(e) => setDungeonFilter(e.target.value)}
            aria-label="Filter berdasarkan Kelas"
          >
            <option value="all">Semua Kelas ({state.heroes.length} Heroes)</option>
            <DungeonOptGroupOptions dungeons={sortedDungeons} />
          </PixelSelect>

          <PixelSelect
            value={realmFilter}
            onChange={(e) => setRealmFilter(e.target.value)}
            aria-label="Filter berdasarkan Mapel"
          >
            <option value="all">Semua Mapel / Realms</option>
            {state.realms.map((r) => {
              const count = state.heroes.filter((h) =>
                getEffectiveRealmsForHero(h).includes(r.id)
              ).length;
              return (
                <option key={r.id} value={r.id}>
                  {r.name} ({count} siswa)
                </option>
              );
            })}
            <option value="unassigned">Belum Pilih Mapel</option>
          </PixelSelect>
        </div>

        {/* Quick Mapel Filter Chips */}
        {state.realms.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pixel-scroll">
            <button
              type="button"
              onClick={() => setRealmFilter('all')}
              className={`pixel-btn min-h-[34px] px-2.5 font-pixel-ui text-[9.5px] whitespace-nowrap shrink-0 cursor-pointer ${
                realmFilter === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Semua Mapel
            </button>
            {state.realms.map((realm) => {
              const activeChip = realmFilter === realm.id;
              return (
                <button
                  key={realm.id}
                  type="button"
                  onClick={() => setRealmFilter(realm.id)}
                  className={`pixel-btn min-h-[34px] px-2.5 text-[11.5px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeChip
                      ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 inline-block shrink-0"
                    style={{
                      backgroundColor: activeChip ? '#11131E' : realm.accentColor,
                    }}
                  />
                  <span>{realm.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <PixelEmptyChest
          title="No Heroes Found!"
          description="Tidak ada Hero yang cocok dengan pencarian, kelas, atau mapel ini."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((hero) => {
            const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);
            const exp = getHeroTotalExp(hero.id, state.grades);
            const lvl = getHeroLevelProgress(exp);
            const heroRealmIds = getEffectiveRealmsForHero(hero);

            return (
              <article key={hero.id} className="pixel-box p-3.5 space-y-2.5 overflow-hidden">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <PixelAvatar avatar={hero.avatar} size={44} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-[14px] font-bold text-[var(--text-primary)] break-words [overflow-wrap:anywhere]">
                          {hero.name}
                        </h3>
                        {hero.hasPin && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-400/70 bg-emerald-950/40 text-emerald-300 shrink-0"
                            title="Akun siswa dilindungi PIN Rahasia"
                          >
                            <Lock size={10} />
                            PIN
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] truncate">
                        @{hero.username} · NIS {hero.studentCode}
                      </p>
                      <p className="text-[12px] font-semibold text-[var(--accent-warning)] tabular-nums truncate">
                        LV.{lvl.level} ({exp} EXP) · {dungeon ? `${dungeon.name} (${dungeon.guildCode})` : 'Belum ada kelas'}
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

                {/* Enrolled Subjects Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border-pixel)]/30">
                  <span className="font-pixel-ui text-[9px] text-[var(--accent-warning)] uppercase shrink-0">
                    Mapel ({heroRealmIds.length}):
                  </span>
                  {heroRealmIds.length > 0 ? (
                    heroRealmIds.map((rid) => {
                      const realm = state.realms.find((r) => r.id === rid);
                      if (!realm) return null;
                      return (
                        <span
                          key={rid}
                          className="text-[11px] font-medium px-2 py-0.5 border border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] flex items-center gap-1 max-w-full"
                        >
                          <span
                            className="w-2 h-2 inline-block shrink-0"
                            style={{ backgroundColor: realm.accentColor }}
                          />
                          <span className="truncate max-w-[140px]">{realm.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] italic">
                      Belum ada mapel diikuti
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-pixel)]/40">
                  <span className="text-[12px] text-[var(--text-secondary)] min-w-0 break-words">
                    Karakter: <span className="font-medium text-[var(--text-primary)]">{hero.heroClass}</span> · Status:{' '}
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
                    className="pixel-btn min-h-[36px] px-2.5 font-pixel-ui text-[10px] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] shrink-0 cursor-pointer"
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
            <PixelFieldLabel htmlFor="hr-dng">Kelas (Pilih dari Daftar Kelas Guru)</PixelFieldLabel>
            <PixelSelect
              id="hr-dng"
              required={sortedDungeons.length > 0}
              value={dungeonId}
              onChange={(e) => handleDungeonSelectionChange(e.target.value)}
            >
              {sortedDungeons.length === 0 ? (
                <option value="">-- Belum ada kelas. Buat dulu di menu Dungeons/Kelas --</option>
              ) : (
                <>
                  {!sortedDungeons.some((d) => d.id === dungeonId) && (
                    <option value="">-- Pilih Kelas --</option>
                  )}
                  <DungeonOptGroupOptions dungeons={sortedDungeons} />
                </>
              )}
            </PixelSelect>
          </div>

          {/* Mata Pelajaran yang Diikuti (Realms) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <PixelFieldLabel>Mata Pelajaran yang Diikuti (Realms)</PixelFieldLabel>
              <div className="flex items-center gap-2">
                {selectedDungeon && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setEnrolledRealmIds(getDungeonDefaultRealms(selectedDungeon.id))
                      }
                      className="text-[10px] text-[var(--accent-success)] hover:underline font-pixel-ui cursor-pointer"
                    >
                      Ikuti Kelas
                    </button>
                    <span className="text-[var(--text-muted)] text-[10px]">·</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setEnrolledRealmIds(state.realms.map((r) => r.id))}
                  className="text-[10px] text-[var(--accent-warning)] hover:underline font-pixel-ui cursor-pointer"
                >
                  Semua
                </button>
                <span className="text-[var(--text-muted)] text-[10px]">·</span>
                <button
                  type="button"
                  onClick={() => setEnrolledRealmIds([])}
                  className="text-[10px] text-[var(--text-muted)] hover:underline font-pixel-ui cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-tight">
              Saat memilih kelas, mapel kelas otomatis tercentang. Anda tetap dapat menambah/mengurangi mapel siswa ini secara manual:
            </p>
            {state.realms.length === 0 ? (
              <p className="text-[12px] text-[var(--accent-warning)] p-2 pixel-box-inset">
                Belum ada mapel di menu Realms.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 pixel-box-inset bg-[var(--bg-inset)] max-h-36 overflow-y-auto pixel-scroll">
                {state.realms.map((realm) => {
                  const isChecked = enrolledRealmIds.includes(realm.id);
                  const isClassRealm = selectedDungeon?.realmIds?.includes(realm.id);
                  return (
                    <button
                      key={realm.id}
                      type="button"
                      onClick={() => {
                        setEnrolledRealmIds((prev) =>
                          prev.includes(realm.id)
                            ? prev.filter((id) => id !== realm.id)
                            : [...prev, realm.id]
                        );
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
                      <span className="text-[13px] truncate flex-1">
                        {realm.name}
                        {isClassRealm && (
                          <span className="ml-1 text-[10px] text-[var(--accent-success)] font-normal">
                            [Kelas]
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-pixel-ui text-[var(--accent-warning)]">
                        {isChecked ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
            <PixelFieldLabel htmlFor="hr-class">Julukan Karakter (Opsional)</PixelFieldLabel>
            <PixelInput
              id="hr-class"
              value={heroClass}
              onChange={(e) => setHeroClass(e.target.value)}
            />
          </div>

          {/* PIN Rahasia Siswa */}
          <div className="pixel-box-inset p-3 space-y-2 border border-[var(--border-pixel)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PixelFieldLabel htmlFor="hr-pin">
                <span className="inline-flex items-center gap-1">
                  <KeyRound size={11} className="text-[var(--accent-warning)]" />
                  PIN Rahasia Siswa (Keamanan Login)
                </span>
              </PixelFieldLabel>
              {editingHero?.hasPin && !clearPin && (
                <span className="text-[10.5px] font-semibold text-emerald-400">
                  ✓ PIN Aktif
                </span>
              )}
              {clearPin && (
                <span className="text-[10.5px] font-semibold text-rose-400">
                  PIN akan dihapus saat disimpan
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PixelInput
                id="hr-pin"
                maxLength={12}
                placeholder={
                  editingHero?.hasPin && !clearPin
                    ? 'Isi PIN baru jika ingin reset PIN...'
                    : 'Contoh: 482910 (kosongkan jika tanpa PIN)'
                }
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (clearPin) setClearPin(false);
                }}
                className="flex-1"
              />
              <PixelButton
                type="button"
                size="sm"
                variant="warning"
                onClick={() => {
                  setPin(String(Math.floor(100000 + Math.random() * 900000)));
                  setClearPin(false);
                }}
              >
                <Dices size={13} />
                Acak
              </PixelButton>
              {editingHero?.hasPin && (
                <PixelButton
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setPin('');
                    setClearPin((prev) => !prev);
                  }}
                >
                  {clearPin ? 'Batal Hapus' : 'Hapus PIN'}
                </PixelButton>
              )}
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
              Melindungi akun siswa agar teman sekelas yang tahu NIS-nya tidak bisa login tanpa PIN. Siswa juga bisa mengubah PIN sendiri setelah login.
            </p>
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
