import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, Realm, RealmIconType } from '../../types/lms';
import { PixelRealmGlyph } from '../../components/PixelArt';
import {
  PixelButton,
  PixelConfirmDialog,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelTextarea,
} from '../../components/PixelUI';

interface GmRealmsProps {
  state: AcademyState;
  onSaveRealm: (realm: Realm) => void;
  onDeleteRealm: (id: string) => void;
}

const ICONS: { value: RealmIconType; label: string }[] = [
  { value: 'flask', label: 'Alchemy' },
  { value: 'compass', label: 'Arcane' },
  { value: 'leaf', label: 'Nature' },
  { value: 'book', label: 'Lore' },
  { value: 'bolt', label: 'Physics' },
];

const COLORS = ['#38B764', '#3B5DC9', '#FEAE34', '#EF7D57', '#73EFF7'];

export const GmRealms: React.FC<GmRealmsProps> = ({
  state,
  onSaveRealm,
  onDeleteRealm,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Realm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Realm | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [icon, setIcon] = useState<RealmIconType>('flask');
  const [accentColor, setAccentColor] = useState('#38B764');
  const [description, setDescription] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCode('');
    setIcon('flask');
    setAccentColor('#38B764');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (r: Realm) => {
    setEditing(r);
    setName(r.name);
    setCode(r.code);
    setIcon(r.icon);
    setAccentColor(r.accentColor);
    setDescription(r.description);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onSaveRealm({
      id: editing?.id || `rlm-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      icon,
      accentColor,
      description: description.trim(),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Realms / Skill Trees"
        subtitle="Cabang mata pelajaran dan fokus keilmuan"
        action={
          <PixelButton type="button" size="sm" variant="success" onClick={openCreate}>
            <Plus size={15} />
            New Realm
          </PixelButton>
        }
      />

      {state.realms.length === 0 ? (
        <PixelEmptyChest
          title="No Realms Configured!"
          description="Tambahkan Realm mata pelajaran pertama Anda."
        />
      ) : (
        <div className="space-y-3">
          {state.realms.map((realm) => {
            const tomeCount = state.tomes.filter(
              (t) => t.realmId === realm.id
            ).length;
            const questCount = state.quests.filter(
              (q) => q.realmId === realm.id
            ).length;

            return (
              <article key={realm.id} className="pixel-box p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 pixel-box-inset flex items-center justify-center">
                      <PixelRealmGlyph
                        icon={realm.icon}
                        color={realm.accentColor}
                        size={28}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-pixel-body text-[15px] text-[var(--text-muted)]">
                        {realm.code} · {tomeCount} Tomes · {questCount} Quests
                      </p>
                      <h3 className="font-pixel-display text-[12px] text-[var(--text-primary)] truncate mt-0.5">
                        {realm.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(realm)}
                      aria-label={`Edit ${realm.name}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(realm)}
                      aria-label={`Delete ${realm.name}`}
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[#11131E] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {realm.description && (
                  <p className="font-pixel-body text-[17px] text-[var(--text-secondary)]">
                    {realm.description}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <PixelModal
        open={modalOpen}
        title={editing ? 'Edit Realm' : 'Create New Realm'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <PixelFieldLabel htmlFor="rlm-name">Nama Realm / Mapel</PixelFieldLabel>
            <PixelInput
              id="rlm-name"
              required
              placeholder="Contoh: Alchemic Chemistry"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="rlm-code">Kode Mapel</PixelFieldLabel>
            <PixelInput
              id="rlm-code"
              required
              placeholder="CHEM-101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel>Realm Emblem</PixelFieldLabel>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setIcon(item.value)}
                  className={`p-2 flex flex-col items-center gap-1 border-2 cursor-pointer ${
                    icon === item.value
                      ? 'border-[var(--accent-warning)] bg-[var(--bg-surface-alt)]'
                      : 'border-[var(--border-pixel)] bg-[var(--bg-inset)]'
                  }`}
                >
                  <PixelRealmGlyph
                    icon={item.value}
                    color={accentColor}
                    size={24}
                  />
                  <span className="font-pixel-ui text-[9px] text-[var(--text-secondary)]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <PixelFieldLabel>Element Color</PixelFieldLabel>
            <div className="flex items-center gap-2.5">
              {COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`Color ${col}`}
                  onClick={() => setAccentColor(col)}
                  className={`w-10 h-10 border-3 cursor-pointer ${
                    accentColor === col
                      ? 'border-white scale-105'
                      : 'border-black/60'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
          <div>
            <PixelFieldLabel htmlFor="rlm-desc">Deskripsi</PixelFieldLabel>
            <PixelTextarea
              id="rlm-desc"
              rows={3}
              placeholder="Ruang lingkup materi mata pelajaran..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
        title="Delete Realm"
        message={`Hapus Realm "${deleteTarget?.name}" (${deleteTarget?.code})?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteRealm(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
