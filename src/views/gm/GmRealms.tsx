import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademyState, Realm, RealmIconType } from '../../types/lms';
import { PixelRealmGlyph } from '../../components/PixelArt';
import { BulkDeleteBar } from '../../components/BulkDeleteBar';
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
import { ThemedPanelCard } from '../../components/ThemePrimitives';

interface GmRealmsProps {
  state: AcademyState;
  onSaveRealm: (realm: Realm) => void;
  onDeleteRealm: (id: string) => void;
  onDeleteRealmsBatch?: (ids: string[]) => void | Promise<void>;
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
  onDeleteRealmsBatch,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Realm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Realm | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);

  useEffect(() => {
    const valid = new Set(state.realms.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [state.realms]);

  const visibleIds = state.realms.map((r) => r.id);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const selectedSet = new Set(selectedIds);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

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

      <BulkDeleteBar
        totalCount={state.realms.length}
        visibleIds={visibleIds}
        selectedIds={selectedIds}
        itemLabel="mapel"
        onToggleSelectAllVisible={toggleSelectAllVisible}
        onClearSelection={() => setSelectedIds([])}
        onRequestDeleteSelected={() => setBulkDeleteMode('selected')}
        onRequestDeleteAll={() => setBulkDeleteMode('all')}
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
            const isSelected = selectedIds.includes(realm.id);

            return (
              <ThemedPanelCard
                key={realm.id}
                className={`space-y-2.5 ${isSelected ? 'ring-2 ring-[var(--accent-danger)]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(realm.id)}
                      aria-label={`Pilih mapel ${realm.name}`}
                      className="w-4 h-4 accent-[var(--accent-danger)] shrink-0 cursor-pointer"
                    />
                    <div className="w-11 h-11 shrink-0 pixel-box-inset flex items-center justify-center">
                      <PixelRealmGlyph
                        icon={realm.icon}
                        color={realm.accentColor}
                        size={28}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold text-[var(--text-muted)] break-words [overflow-wrap:anywhere]">
                        {realm.code} · {tomeCount} Tomes · {questCount} Quests
                      </p>
                      <h3 className="text-[14.5px] font-bold text-[var(--text-primary)] mt-0.5 leading-snug break-words [overflow-wrap:anywhere]">
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
                      className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--accent-danger)] text-[var(--text-on-danger)] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {realm.description && (
                  <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {realm.description}
                  </p>
                )}
              </ThemedPanelCard>
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ICONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setIcon(item.value)}
                  className={`p-2 flex flex-col items-center gap-1 border-2 cursor-pointer min-w-0 ${
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
                  <span className="font-pixel-ui text-[9px] text-[var(--text-secondary)] truncate max-w-full">
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
                  className={`w-10 h-10 rounded-md border-2 cursor-pointer transition-transform ${
                    accentColor === col
                      ? 'border-[var(--border-pixel)] ring-2 ring-[var(--accent-primary)] scale-105 shadow-[2px_2px_0_var(--shadow-ink)]'
                      : 'border-[var(--border-pixel)]/50'
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

      <PixelConfirmDialog
        open={Boolean(bulkDeleteMode)}
        title={
          bulkDeleteMode === 'all'
            ? 'Hapus Semua Data Mapel'
            : 'Hapus Mapel Terpilih'
        }
        message={
          bulkDeleteMode === 'all'
            ? `Yakin ingin menghapus SEMUA ${state.realms.length} mata pelajaran yang telah dientrykan? Materi, tugas, dan nilai yang terkait mapel tersebut juga akan ikut terhapus.`
            : `Yakin ingin menghapus ${selectedIds.length} mata pelajaran yang dipilih beserta materi/tugas/nilai terkait?`
        }
        confirmLabel={bulkDeleteMode === 'all' ? 'Hapus Semua' : 'Hapus Terpilih'}
        onCancel={() => setBulkDeleteMode(null)}
        onConfirm={() => {
          const idsToDelete =
            bulkDeleteMode === 'all'
              ? state.realms.map((r) => r.id)
              : [...selectedIds];
          if (idsToDelete.length > 0) {
            if (onDeleteRealmsBatch) {
              onDeleteRealmsBatch(idsToDelete);
            } else {
              idsToDelete.forEach((id) => onDeleteRealm(id));
            }
          }
          setSelectedIds([]);
          setBulkDeleteMode(null);
        }}
      />
    </div>
  );
};
