import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { SeasonId } from '../types/lms';
import { getSeasonLabel, getShortSeasonLabel } from '../utils/exp';

export interface SeasonSelectorProps {
  activeSeason: SeasonId;
  canManage: boolean;
  onSwitchSeason?: (season: SeasonId) => void;
}

const SEASON_OPTIONS: {
  id: SeasonId;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'ganjil',
    title: 'Season 1 (Ganjil)',
    subtitle: 'Periode paruh pertama tahun ajaran',
  },
  {
    id: 'genap',
    title: 'Season 2 (Genap)',
    subtitle: 'Periode paruh kedua tahun ajaran',
  },
];

/**
 * Lightweight Season dropdown right beside EraSelector in the header.
 * Guardrail: only Admin / Game Master can switch Season; Students see a read-only badge.
 */
export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  activeSeason,
  canManage,
  onSwitchSeason,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!canManage) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-[var(--border-pixel)]/40 bg-[var(--bg-surface)] text-[11px] font-bold text-[var(--text-secondary)] rounded-[var(--btn-radius)] shrink-0"
        title={`Season Aktif: ${getSeasonLabel(activeSeason)}`}
      >
        <Sparkles size={11} className="text-[var(--accent-primary)] shrink-0" />
        <span className="truncate max-w-[125px]">
          {getShortSeasonLabel(activeSeason)}
        </span>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Pilih Season Aktif (Ganjil / Genap)"
        className="inline-flex items-center gap-1 px-2 py-0.5 min-h-[28px] rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-pixel-ui text-[11px] tracking-normal font-bold shadow-[2px_2px_0_var(--shadow-ink)] hover:brightness-95 active:translate-y-[1px] cursor-pointer transition-all"
      >
        <Sparkles size={11} className="text-[var(--accent-primary)] shrink-0" />
        <span className="truncate max-w-[115px] sm:max-w-[140px]">
          {getShortSeasonLabel(activeSeason)}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Daftar Season"
          className="absolute left-0 mt-1.5 z-50 w-[236px] sm:w-[258px] rounded-[var(--card-radius)] border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[4px_4px_0_var(--shadow-ink)] p-2 space-y-1.5"
        >
          <div className="px-1.5 py-0.5 flex items-center justify-between border-b border-[var(--border-pixel)]/20">
            <span className="font-pixel-ui text-[10.5px] uppercase tracking-wide text-[var(--text-muted)]">
              Season Aktif
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              2 Season
            </span>
          </div>

          <div className="space-y-1">
            {SEASON_OPTIONS.map((opt) => {
              const selected = opt.id === activeSeason;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    if (onSwitchSeason && !selected) {
                      onSwitchSeason(opt.id);
                    }
                    setOpen(false);
                  }}
                  className={`w-full px-2 py-1.5 rounded-[var(--btn-radius)] border text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--border-pixel)] font-bold'
                      : 'bg-[var(--bg-surface-alt)]/50 text-[var(--text-primary)] border-transparent hover:border-[var(--border-pixel)]/40 hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-tight truncate">
                      {opt.title}
                    </p>
                    <p
                      className={`text-[10.5px] leading-tight mt-0.5 truncate ${
                        selected ? 'opacity-85' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {opt.subtitle}
                    </p>
                  </div>
                  {selected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          <p className="px-1.5 pt-1 border-t border-[var(--border-pixel)]/20 text-[11px] text-[var(--text-muted)] leading-snug">
            Tugas, pengumuman &amp; nilai Season lain tetap tersimpan sebagai arsip.
          </p>
        </div>
      )}
    </div>
  );
};
