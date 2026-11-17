import React, { useMemo } from 'react';
import { Check, CheckSquare, Users } from 'lucide-react';
import { Dungeon } from '../types/lms';
import { groupDungeonsByTier, sortDungeonsAlphabetically } from '../utils/exp';
import { PixelFieldLabel } from './PixelUI';

interface TargetDungeonsSelectorProps {
  dungeons: Dungeon[];
  mode: 'all' | 'selected';
  onChangeMode: (mode: 'all' | 'selected') => void;
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  errorMessage?: string | null;
  onClearError?: () => void;
  label?: string;
  allLabel?: string;
  selectedLabel?: string;
  allDescription?: string;
  selectedDescription?: string;
  highlightedRealmId?: string;
  highlightedRealmName?: string;
  embedded?: boolean;
}

export const TargetDungeonsSelector: React.FC<TargetDungeonsSelectorProps> = ({
  dungeons,
  mode,
  onChangeMode,
  selectedIds,
  onChangeSelectedIds,
  errorMessage,
  onClearError,
  label = 'Sasaran Kelas Penerima',
  allLabel = 'Semua Kelas',
  selectedLabel = 'Beberapa / Kelas Tertentu',
  allDescription = 'Berlaku untuk seluruh kelas yang relevan.',
  selectedDescription = 'Centang satu atau beberapa kelas tujuan. Kelas lain tidak akan menerima item ini.',
  highlightedRealmId,
  highlightedRealmName,
  embedded = false,
}) => {
  const sortedDungeons = useMemo(
    () => sortDungeonsAlphabetically(dungeons),
    [dungeons]
  );
  const tierGroups = useMemo(
    () => groupDungeonsByTier(sortedDungeons),
    [sortedDungeons]
  );

  const realmTeachingIds = useMemo(() => {
    if (!highlightedRealmId) return [];
    return sortedDungeons
      .filter(
        (d) =>
          !d.realmIds ||
          d.realmIds.length === 0 ||
          d.realmIds.includes(highlightedRealmId)
      )
      .map((d) => d.id);
  }, [sortedDungeons, highlightedRealmId]);

  const toggleDungeon = (dungeonId: string) => {
    onClearError?.();
    onChangeSelectedIds(
      selectedIds.includes(dungeonId)
        ? selectedIds.filter((id) => id !== dungeonId)
        : [...selectedIds, dungeonId]
    );
  };

  const toggleTier = (tierIds: string[]) => {
    onClearError?.();
    const allSelected =
      tierIds.length > 0 && tierIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      const tierSet = new Set(tierIds);
      onChangeSelectedIds(selectedIds.filter((id) => !tierSet.has(id)));
    } else {
      onChangeSelectedIds(Array.from(new Set([...selectedIds, ...tierIds])));
    }
  };

  const wrapperClass = embedded
    ? 'space-y-2.5'
    : 'pixel-box-inset p-3 space-y-2.5 border border-[var(--border-pixel)] bg-[var(--bg-inset)]';

  return (
    <div className={wrapperClass}>
      <PixelFieldLabel>{label}</PixelFieldLabel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onChangeMode('all');
            onClearError?.();
          }}
          className={`pixel-btn min-h-[40px] px-3 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'all'
              ? 'bg-[var(--accent-success)] text-[var(--text-on-success)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <Users size={14} />
          {allLabel} ({sortedDungeons.length})
        </button>
        <button
          type="button"
          onClick={() => {
            onChangeMode('selected');
            onClearError?.();
          }}
          className={`pixel-btn min-h-[40px] px-3 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'selected'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <CheckSquare size={14} />
          {selectedLabel}
          {mode === 'selected' && selectedIds.length > 0
            ? ` (${selectedIds.length})`
            : ''}
        </button>
      </div>

      {mode === 'all' ? (
        <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
          {allDescription}
        </p>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
              {selectedDescription} ({selectedIds.length} dipilih)
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold shrink-0">
              {highlightedRealmId &&
                realmTeachingIds.length > 0 &&
                realmTeachingIds.length < sortedDungeons.length && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onClearError?.();
                        onChangeSelectedIds(realmTeachingIds);
                      }}
                      className="text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      Pilih Kelas Mapel ({realmTeachingIds.length})
                    </button>
                    <span className="text-[var(--text-muted)]">·</span>
                  </>
                )}
              <button
                type="button"
                onClick={() => {
                  onClearError?.();
                  onChangeSelectedIds(sortedDungeons.map((d) => d.id));
                }}
                className="text-[var(--accent-success)] hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-[var(--text-muted)]">·</span>
              <button
                type="button"
                onClick={() => {
                  onClearError?.();
                  onChangeSelectedIds([]);
                }}
                className="text-[var(--text-muted)] hover:underline cursor-pointer"
              >
                Kosongkan
              </button>
            </div>
          </div>

          {tierGroups.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {tierGroups.map((group) => {
                const tierIds = group.items.map((d) => d.id);
                const pickedCount = tierIds.filter((id) =>
                  selectedIds.includes(id)
                ).length;
                const allTierPicked =
                  tierIds.length > 0 && pickedCount === tierIds.length;
                return (
                  <button
                    key={group.tier}
                    type="button"
                    onClick={() => toggleTier(tierIds)}
                    className={`min-h-[32px] px-2.5 py-0.5 border text-[11.5px] font-semibold cursor-pointer ${
                      allTierPicked
                        ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--border-pixel)] font-bold'
                        : pickedCount > 0
                          ? 'bg-[var(--surface-tint)] text-[var(--text-primary)] border-[var(--border-pixel)] font-bold'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-pixel)]/50'
                    }`}
                  >
                    {group.tier} ({pickedCount}/{tierIds.length})
                  </button>
                );
              })}
            </div>
          )}

          {sortedDungeons.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)] italic">
              Belum ada kelas di Era ini. Tambahkan kelas terlebih dahulu di menu Dungeons.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto pixel-scroll space-y-2 pr-1">
              {tierGroups.map((group) => (
                <div key={group.tier} className="space-y-1">
                  {tierGroups.length > 1 && (
                    <p className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                      {group.tier}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.items.map((dng) => {
                      const checked = selectedIds.includes(dng.id);
                      const teachesHighlighted =
                        !highlightedRealmId ||
                        !dng.realmIds ||
                        dng.realmIds.length === 0 ||
                        dng.realmIds.includes(highlightedRealmId);
                      return (
                        <button
                          key={dng.id}
                          type="button"
                          onClick={() => toggleDungeon(dng.id)}
                          title={
                            !teachesHighlighted && highlightedRealmName
                              ? `${dng.guildCode} belum menautkan mapel ${highlightedRealmName}`
                              : undefined
                          }
                          className={`min-h-[38px] px-2.5 py-1 border text-left flex items-center gap-2 text-[12.5px] cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[var(--surface-tint)] border-[var(--border-pixel)] font-bold text-[var(--text-primary)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border-pixel)]/40 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 shrink-0 border flex items-center justify-center ${
                              checked
                                ? 'bg-[var(--accent-primary)] border-[var(--border-pixel)] text-[var(--text-on-accent)]'
                                : 'bg-[var(--bg-inset)] border-[var(--border-pixel)]/70'
                            }`}
                          >
                            {checked && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {dng.guildCode} — {dng.name}
                          </span>
                          {highlightedRealmId && !teachesHighlighted && (
                            <span className="text-[9.5px] px-1 py-0.5 border border-amber-700/60 bg-amber-100 text-amber-900 font-semibold shrink-0">
                              Luar Mapel
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sortedDungeons.length > 0 &&
            selectedIds.length >= sortedDungeons.length && (
              <p className="text-[11px] font-semibold text-emerald-700">
                Semua kelas dipilih — akan diterapkan ke seluruh kelas.
              </p>
            )}

          {errorMessage && (
            <p className="text-[12px] font-bold text-[var(--accent-danger)]">
              [!] {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
