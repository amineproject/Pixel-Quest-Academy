import React, { useEffect, useRef, useState } from 'react';
import { CalendarRange, Check, ChevronDown, Plus } from 'lucide-react';
import { AcademicYear } from '../types/lms';

export interface EraSelectorProps {
  academicYears: AcademicYear[];
  activeEraId: string;
  canManage: boolean;
  onSwitchEra?: (eraId: string) => void;
  onCreateEra?: (era: AcademicYear) => void;
}

/**
 * Lightweight dropdown in the header right beside the Game Master name
 * for switching or creating an Era (academic year archive filter).
 * Guardrail: only Admin / Game Master can switch or create Eras.
 */
export const EraSelector: React.FC<EraSelectorProps> = ({
  academicYears,
  activeEraId,
  canManage,
  onSwitchEra,
  onCreateEra,
}) => {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eraName, setEraName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const activeEra =
    academicYears.find((y) => y.id === activeEraId) ||
    academicYears.find((y) => y.isActive) ||
    academicYears[0];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreateForm(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowCreateForm(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!activeEra) return null;

  // Guardrail: Hero (student) gets read-only active Era indicator only
  if (!canManage) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-[var(--border-pixel)]/40 bg-[var(--bg-surface)] text-[11px] font-bold text-[var(--text-secondary)] rounded-[var(--btn-radius)] shrink-0"
        title={`Era Aktif: ${activeEra.name}`}
      >
        <CalendarRange size={11} className="text-[var(--accent-warning)] shrink-0" />
        <span className="truncate max-w-[110px]">Era {activeEra.name}</span>
      </span>
    );
  }

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !onCreateEra) return;
    const cleanName = eraName.trim();
    if (!cleanName) return;
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newEra: AcademicYear = {
      id: `era-${slug || Date.now()}`,
      name: cleanName,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || '',
      isActive: true,
    };
    onCreateEra(newEra);
    setEraName('');
    setStartDate('');
    setEndDate('');
    setShowCreateForm(false);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Pilih atau Tambah Era (Tahun Pelajaran)"
        className="inline-flex items-center gap-1 px-2 py-0.5 min-h-[26px] rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--comic-gold)] text-[#18181b] font-pixel-ui text-[10px] tracking-normal font-bold shadow-[2px_2px_0_var(--shadow-ink)] hover:brightness-105 active:translate-y-[1px] cursor-pointer transition-all"
      >
        <CalendarRange size={11} className="shrink-0" />
        <span className="truncate max-w-[92px] sm:max-w-[130px]">
          Era {activeEra.name}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Daftar Era"
          className="absolute left-0 mt-1.5 z-50 w-[250px] sm:w-[272px] rounded-[var(--card-radius)] border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[4px_4px_0_var(--shadow-ink)] p-2 space-y-1.5"
        >
          <div className="px-1.5 py-0.5 flex items-center justify-between border-b border-[var(--border-pixel)]/20">
            <span className="font-pixel-ui text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">
              Arsip Era Aktif
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {academicYears.length} Era
            </span>
          </div>

          <div className="max-h-[180px] overflow-y-auto pixel-scroll space-y-1">
            {academicYears.map((era) => {
              const selected = era.id === activeEra.id;
              return (
                <button
                  key={era.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    if (onSwitchEra && !selected) {
                      onSwitchEra(era.id);
                    }
                    setOpen(false);
                    setShowCreateForm(false);
                  }}
                  className={`w-full px-2 py-1.5 rounded-[var(--btn-radius)] border text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--border-pixel)] font-bold'
                      : 'bg-[var(--bg-surface-alt)]/50 text-[var(--text-primary)] border-transparent hover:border-[var(--border-pixel)]/40 hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-tight truncate">
                      Era {era.name}
                    </p>
                    {(era.startDate || era.endDate) && (
                      <p
                        className={`text-[10.5px] leading-tight mt-0.5 truncate ${
                          selected ? 'opacity-85' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {era.startDate || '—'} s/d {era.endDate || '—'}
                      </p>
                    )}
                  </div>
                  {selected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full min-h-[34px] px-2.5 py-1 rounded-[var(--btn-radius)] border-2 border-dashed border-[var(--border-pixel)]/50 text-[12px] font-bold text-[var(--accent-primary)] hover:bg-[var(--bg-surface-alt)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Era Baru</span>
            </button>
          ) : (
            <form
              onSubmit={handleSubmitCreate}
              className="pt-1.5 border-t border-[var(--border-pixel)]/20 space-y-2"
            >
              <p className="font-pixel-ui text-[9.5px] uppercase tracking-wide text-[var(--accent-warning)]">
                Buat Era Baru
              </p>
              <input
                type="text"
                required
                placeholder="Misal: 2027/2028"
                value={eraName}
                onChange={(e) => setEraName(e.target.value)}
                className="w-full px-2 py-1.5 text-[12.5px] rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--bg-canvas)] text-[var(--text-primary)]"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  title="Tanggal Mulai"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-1.5 py-1 text-[11px] rounded-[var(--btn-radius)] border border-[var(--border-pixel)]/60 bg-[var(--bg-canvas)] text-[var(--text-primary)]"
                />
                <input
                  type="date"
                  title="Tanggal Selesai"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-1.5 py-1 text-[11px] rounded-[var(--btn-radius)] border border-[var(--border-pixel)]/60 bg-[var(--bg-canvas)] text-[var(--text-primary)]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 min-h-[32px] px-2 py-1 rounded-[var(--btn-radius)] border border-[var(--border-pixel)]/40 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[32px] px-2 py-1 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-[12px] font-bold cursor-pointer"
                >
                  Aktifkan
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
