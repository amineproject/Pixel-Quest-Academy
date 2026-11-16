import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Dungeon } from '../types/lms';
import { groupDungeonsByTier, sortDungeonsAlphabetically } from '../utils/exp';

interface MultiDungeonFilterProps {
  id?: string;
  dungeons: Dungeon[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  allLabel?: string;
  highlightedRealmId?: string;
  ariaLabel?: string;
}

interface PopoverCoords {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

export const MultiDungeonFilter: React.FC<MultiDungeonFilterProps> = ({
  id,
  dungeons,
  selectedIds,
  onChange,
  allLabel = 'Semua Kelas',
  highlightedRealmId,
  ariaLabel = 'Filter multi kelas',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const sortedDungeons = useMemo(
    () => sortDungeonsAlphabetically(dungeons),
    [dungeons]
  );
  const groups = useMemo(
    () => groupDungeonsByTier(sortedDungeons),
    [sortedDungeons]
  );

  const validSelectedIds = useMemo(() => {
    const validSet = new Set(sortedDungeons.map((d) => d.id));
    return selectedIds.filter((dId) => validSet.has(dId));
  }, [sortedDungeons, selectedIds]);

  const selectedSet = useMemo(
    () => new Set(validSelectedIds),
    [validSelectedIds]
  );

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(rect.width, 280), vw - 24);
    const left = Math.max(12, Math.min(rect.left, vw - width - 12));
    const spaceBelow = vh - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    if (spaceBelow >= 230 || spaceBelow >= spaceAbove) {
      setCoords({
        left,
        width,
        top: rect.bottom + 6,
        maxHeight: Math.max(180, Math.min(360, spaceBelow)),
      });
    } else {
      setCoords({
        left,
        width,
        bottom: vh - rect.top + 6,
        maxHeight: Math.max(180, Math.min(360, spaceAbove)),
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, updatePosition]);

  const normalizeSelection = (candidateIds: string[]): string[] => {
    const unique = Array.from(new Set(candidateIds));
    if (unique.length === 0 || unique.length >= sortedDungeons.length) {
      return [];
    }
    return unique;
  };

  const toggleDungeon = (dungeonId: string) => {
    if (selectedSet.has(dungeonId)) {
      onChange(normalizeSelection(validSelectedIds.filter((x) => x !== dungeonId)));
    } else {
      onChange(normalizeSelection([...validSelectedIds, dungeonId]));
    }
  };

  const toggleTier = (tierIds: string[]) => {
    const allInTierSelected =
      tierIds.length > 0 && tierIds.every((tId) => selectedSet.has(tId));
    if (allInTierSelected) {
      const tierSet = new Set(tierIds);
      onChange(normalizeSelection(validSelectedIds.filter((x) => !tierSet.has(x))));
    } else {
      onChange(normalizeSelection([...validSelectedIds, ...tierIds]));
    }
  };

  const triggerText = useMemo(() => {
    if (validSelectedIds.length === 0) {
      return `${allLabel} (${sortedDungeons.length} Kelas)`;
    }
    if (validSelectedIds.length === 1) {
      const single = sortedDungeons.find((d) => d.id === validSelectedIds[0]);
      return single ? `${single.guildCode} — ${single.name}` : '1 Kelas Dipilih';
    }
    const matchedFullTiers = groups.filter(
      (g) =>
        g.items.length > 0 &&
        g.items.every((item) => selectedSet.has(item.id)) &&
        validSelectedIds.every((sId) => g.items.some((item) => item.id === sId))
    );
    if (matchedFullTiers.length === 1) {
      return `${matchedFullTiers[0].tier} (${matchedFullTiers[0].items.length} Kelas)`;
    }
    const codes = sortedDungeons
      .filter((d) => selectedSet.has(d.id))
      .map((d) => d.guildCode);
    const preview =
      codes.length <= 3
        ? codes.join(', ')
        : `${codes.slice(0, 3).join(', ')} +${codes.length - 3}`;
    return `${validSelectedIds.length} Kelas: ${preview}`;
  }, [validSelectedIds, sortedDungeons, groups, selectedSet, allLabel]);

  const popoverMenu =
    open && coords && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            aria-multiselectable="true"
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className="pixel-box z-[60] p-2.5 bg-[var(--bg-surface)] flex flex-col gap-2 shadow-xl"
          >
            {/* Quick Select Bar: Semua Kelas + Tingkat Kelas (Tier) */}
            <div className="space-y-1.5 pb-2 border-b border-[var(--border-pixel)]/30 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="font-pixel-ui text-[10px] uppercase text-[var(--text-muted)]">
                  {groups.length > 1
                    ? 'Pilih Cepat (Tingkat Kelas)'
                    : 'Pilih Kelas'}
                </span>
                {validSelectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-[11.5px] font-bold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Reset Semua
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className={`min-h-[34px] px-2.5 py-1 border text-[12px] font-semibold cursor-pointer ${
                    validSelectedIds.length === 0
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--border-pixel)] font-bold'
                      : 'bg-[var(--bg-inset)] text-[var(--text-primary)] border-[var(--border-pixel)]/50'
                  }`}
                >
                  {allLabel}
                </button>

                {groups.length > 1 &&
                  groups.map((group) => {
                    const tierIds = group.items.map((d) => d.id);
                    const selectedInTier = tierIds.filter((tId) =>
                      selectedSet.has(tId)
                    ).length;
                    const isAllTier =
                      selectedInTier === tierIds.length && tierIds.length > 0;
                    const isPartialTier = selectedInTier > 0 && !isAllTier;

                    return (
                      <button
                        key={group.tier}
                        type="button"
                        onClick={() => toggleTier(tierIds)}
                        className={`min-h-[34px] px-2.5 py-1 border text-[12px] font-semibold cursor-pointer ${
                          isAllTier
                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--border-pixel)] font-bold'
                            : isPartialTier
                              ? 'bg-[var(--surface-tint)] text-[var(--text-primary)] border-[var(--border-pixel)] font-bold'
                              : 'bg-[var(--bg-inset)] text-[var(--text-primary)] border-[var(--border-pixel)]/50'
                        }`}
                      >
                        {group.tier} ({selectedInTier}/{tierIds.length})
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Individual Class Checkboxes Grouped by Tier */}
            <div className="min-h-0 flex-1 overflow-y-auto pixel-scroll space-y-2.5 pr-1">
              {sortedDungeons.length === 0 ? (
                <p className="text-[12.5px] text-[var(--text-muted)] py-2 text-center">
                  Belum ada kelas terdaftar.
                </p>
              ) : (
                groups.map((group) => {
                  const tierIds = group.items.map((d) => d.id);
                  const isAllTier =
                    tierIds.length > 0 &&
                    tierIds.every((tId) => selectedSet.has(tId));

                  return (
                    <div key={group.tier} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleTier(tierIds)}
                        className="w-full flex items-center justify-between text-left px-1.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <span>{group.tier}</span>
                        <span className="text-[10.5px] text-[var(--accent-primary)]">
                          {isAllTier ? 'Hapus Tingkat' : 'Pilih Semua'}
                        </span>
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {group.items.map((d) => {
                          const checked = selectedSet.has(d.id);
                          const teachesRealm = highlightedRealmId
                            ? !d.realmIds ||
                              d.realmIds.length === 0 ||
                              d.realmIds.includes(highlightedRealmId)
                            : false;

                          return (
                            <button
                              key={d.id}
                              type="button"
                              role="option"
                              aria-selected={checked}
                              onClick={() => toggleDungeon(d.id)}
                              className={`min-h-[40px] px-2.5 py-1.5 border text-left flex items-center gap-2 text-[13px] cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[var(--surface-tint)] border-[var(--border-pixel)] font-bold text-[var(--text-primary)]'
                                  : 'bg-[var(--bg-inset)] border-[var(--border-pixel)]/40 text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 shrink-0 border flex items-center justify-center ${
                                  checked
                                    ? 'bg-[var(--accent-primary)] border-[var(--border-pixel)] text-[var(--text-on-accent)]'
                                    : 'bg-[var(--bg-surface)] border-[var(--border-pixel)]/70'
                                }`}
                              >
                                {checked && <Check size={12} strokeWidth={3} />}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {d.guildCode} — {d.name}
                              </span>
                              {teachesRealm && (
                                <span className="text-[10px] px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/40 text-[var(--accent-success)] font-bold shrink-0">
                                  Mapel
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-1.5 border-t border-[var(--border-pixel)]/30 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[12px] text-[var(--text-secondary)]">
                {validSelectedIds.length === 0
                  ? 'Menampilkan semua kelas'
                  : `${validSelectedIds.length} kelas dipilih`}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="pixel-btn min-h-[36px] px-3 text-[12px] font-bold bg-[var(--accent-primary)] text-[var(--text-on-accent)] cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="pixel-box-inset pixel-focus w-full min-w-0 min-h-[44px] px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-inset)] flex items-center justify-between gap-2 cursor-pointer text-left"
      >
        <span className="truncate min-w-0">{triggerText}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {popoverMenu}
    </div>
  );
};

