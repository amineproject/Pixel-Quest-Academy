import React, { useEffect, useState } from 'react';
import { CalendarClock, Clock, Layers } from 'lucide-react';
import { Dungeon } from '../types/lms';
import { sortDungeonsAlphabetically } from '../utils/exp';
import { DungeonOptGroupOptions, PixelFieldLabel, PixelSelect } from './PixelUI';

type ScheduleMode = 'now' | 'sync' | 'per_class';

interface ScheduleConfigSectionProps {
  dungeons: Dungeon[];
  targetDungeonId: string;
  onChangeTargetDungeonId: (id: string) => void;
  scheduledAt: string;
  onChangeScheduledAt: (val: string) => void;
  classSchedules: Record<string, string>;
  onChangeClassSchedules: (val: Record<string, string>) => void;
  idPrefix?: string;
  targetLabel?: string;
  hideTargetSelect?: boolean;
  filterRealmId?: string;
  filterRealmName?: string;
}

function getDefaultDateTimeLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function inferMode(
  scheduledAt: string,
  classSchedules: Record<string, string>
): ScheduleMode {
  if (scheduledAt === '__per_class__') return 'per_class';
  const hasPerClass = Object.values(classSchedules || {}).some((v) =>
    Boolean(v && v.trim())
  );
  if (hasPerClass) return 'per_class';
  if (scheduledAt && scheduledAt.trim()) return 'sync';
  return 'now';
}

export const ScheduleConfigSection: React.FC<ScheduleConfigSectionProps> = ({
  dungeons,
  targetDungeonId,
  onChangeTargetDungeonId,
  scheduledAt,
  onChangeScheduledAt,
  classSchedules,
  onChangeClassSchedules,
  idPrefix = 'sched',
  targetLabel = 'Target Kelas / Guild',
  hideTargetSelect = false,
  filterRealmId,
  filterRealmName,
}) => {
  const sortedDungeons = sortDungeonsAlphabetically(dungeons);
  const [mode, setMode] = useState<ScheduleMode>(() =>
    inferMode(scheduledAt, classSchedules)
  );
  const [showAllClasses, setShowAllClasses] = useState(false);

  useEffect(() => {
    setMode(inferMode(scheduledAt, classSchedules));
  }, [scheduledAt, classSchedules]);

  const handleSelectMode = (nextMode: ScheduleMode) => {
    setMode(nextMode);
    if (nextMode === 'now') {
      onChangeScheduledAt('');
      onChangeClassSchedules({});
    } else if (nextMode === 'sync') {
      onChangeClassSchedules({});
      if (!scheduledAt || scheduledAt === '__per_class__') {
        onChangeScheduledAt(getDefaultDateTimeLocal());
      }
    } else {
      onChangeScheduledAt('__per_class__');
    }
  };

  const baseDungeons =
    targetDungeonId === 'all'
      ? sortedDungeons
      : sortedDungeons.filter((d) => d.id === targetDungeonId);

  const teachesFilterRealm = (d: Dungeon) => {
    if (!filterRealmId) return true;
    if (!d.realmIds || d.realmIds.length === 0) return true;
    return d.realmIds.includes(filterRealmId);
  };

  const matchingDungeons =
    targetDungeonId === 'all' && filterRealmId
      ? baseDungeons.filter(teachesFilterRealm)
      : baseDungeons;
  const nonMatchingCount = baseDungeons.length - matchingDungeons.length;
  const visibleDungeons =
    targetDungeonId === 'all' && filterRealmId && !showAllClasses && matchingDungeons.length > 0
      ? matchingDungeons
      : baseDungeons;

  const handleFillAllPerClass = () => {
    const baseTime =
      Object.values(classSchedules).find((v) => Boolean(v)) ||
      getDefaultDateTimeLocal();
    const next: Record<string, string> = { ...classSchedules };
    visibleDungeons.forEach((d) => {
      if (!next[d.id]) next[d.id] = baseTime;
    });
    onChangeScheduledAt('__per_class__');
    onChangeClassSchedules(next);
  };

  const handleClearPerClass = () => {
    onChangeScheduledAt('__per_class__');
    onChangeClassSchedules({});
  };

  return (
    <div className="pixel-box-inset p-3 space-y-3 border border-[var(--border-pixel)] bg-[var(--bg-inset)]">
      {!hideTargetSelect && (
        <div>
          <PixelFieldLabel htmlFor={`${idPrefix}-target`}>{targetLabel}</PixelFieldLabel>
          <PixelSelect
            id={`${idPrefix}-target`}
            value={targetDungeonId}
            onChange={(e) => onChangeTargetDungeonId(e.target.value)}
          >
            <option value="all">All Guilds (Semua Kelas)</option>
            <DungeonOptGroupOptions dungeons={sortedDungeons} />
          </PixelSelect>
        </div>
      )}

      <div className="space-y-1.5">
        <PixelFieldLabel>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock size={12} className="text-[var(--accent-warning)]" />
            Jadwal Tayang &amp; Notifikasi Siswa
          </span>
        </PixelFieldLabel>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectMode('now')}
            className={`pixel-btn min-h-[38px] px-2.5 text-[11.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'now'
                ? 'bg-[var(--accent-success)] text-[var(--text-on-success)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            <Clock size={13} />
            Langsung Tayang
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('sync')}
            className={`pixel-btn min-h-[38px] px-2.5 text-[11.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'sync'
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            <CalendarClock size={13} />
            Jadwal Serentak
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('per_class')}
            className={`pixel-btn min-h-[38px] px-2.5 text-[11.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'per_class'
                ? 'bg-[var(--comic-gold)] text-[#09090f] font-bold'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            <Layers size={13} />
            Per-Kelas (Jam Mapel)
          </button>
        </div>
      </div>

      {mode === 'now' && (
        <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
          Langsung tampil di akun siswa sesuai target kelas segera setelah disimpan.
        </p>
      )}

      {mode === 'sync' && (
        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-sync-dt`}
            className="block text-[12px] font-semibold text-[var(--text-primary)]"
          >
            Tanggal &amp; Jam Tayang Serentak:
          </label>
          <input
            id={`${idPrefix}-sync-dt`}
            type="datetime-local"
            value={scheduledAt === '__per_class__' ? '' : scheduledAt}
            onChange={(e) => onChangeScheduledAt(e.target.value)}
            className="pixel-box-inset pixel-focus w-full min-h-[42px] px-3 py-1.5 text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none"
          />
          <p className="text-[11px] text-[var(--text-muted)] leading-snug">
            Siswa baru akan melihat dan menerima notifikasi saat waktu di atas telah tiba.
          </p>
        </div>
      )}

      {mode === 'per_class' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug flex-1">
              Atur tanggal &amp; jam masuk berbeda untuk setiap kelas. Kelas yang dikosongkan tidak akan menampilkan item ini.
            </p>
            {visibleDungeons.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 text-[10.5px] font-pixel-ui">
                <button
                  type="button"
                  onClick={handleFillAllPerClass}
                  className="text-[var(--accent-success)] hover:underline cursor-pointer"
                >
                  Isi Kosong
                </button>
                <span className="text-[var(--text-muted)]">·</span>
                <button
                  type="button"
                  onClick={handleClearPerClass}
                  className="text-[var(--text-muted)] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {filterRealmId && targetDungeonId === 'all' && nonMatchingCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/50 text-[11px]">
              <span className="text-[var(--text-secondary)]">
                Menampilkan kelas yang mengajarkan{' '}
                <strong className="text-[var(--text-primary)]">
                  {filterRealmName || 'mapel ini'}
                </strong>{' '}
                ({matchingDungeons.length} kelas).
              </span>
              <button
                type="button"
                onClick={() => setShowAllClasses((prev) => !prev)}
                className="font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer shrink-0"
              >
                {showAllClasses
                  ? 'Sembunyikan kelas lain'
                  : `Lihat ${nonMatchingCount} kelas lain`}
              </button>
            </div>
          )}

          {visibleDungeons.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)] italic">
              Belum ada kelas tersedia. Tambahkan kelas terlebih dahulu di menu Dungeons.
            </p>
          ) : (
            <div className="max-h-52 overflow-y-auto pixel-scroll space-y-2 pr-1">
              {visibleDungeons.map((dng) => {
                const val = classSchedules[dng.id] || '';
                const teachesRealm = teachesFilterRealm(dng);
                return (
                  <div
                    key={dng.id}
                    className="p-2 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[var(--text-primary)] truncate">
                        {dng.guildCode} — {dng.name}
                      </p>
                      <p className="text-[10.5px] text-[var(--text-muted)]">
                        {val ? 'Terjadwal sesuai jam kelas' : 'Belum dijadwalkan (tidak tayang)'}
                        {filterRealmId && !teachesRealm ? ' · Mapel tidak terdaftar di kelas ini' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="datetime-local"
                        aria-label={`Jadwal ${dng.guildCode}`}
                        value={val}
                        onChange={(e) => {
                          const next = { ...classSchedules };
                          if (e.target.value) {
                            next[dng.id] = e.target.value;
                          } else {
                            delete next[dng.id];
                          }
                          onChangeScheduledAt('__per_class__');
                          onChangeClassSchedules(next);
                        }}
                        className="pixel-box-inset pixel-focus min-h-[38px] px-2 py-1 text-[12.5px] font-medium text-[var(--text-primary)] bg-[var(--bg-inset)] outline-none"
                      />
                      {val && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...classSchedules };
                            delete next[dng.id];
                            onChangeScheduledAt('__per_class__');
                            onChangeClassSchedules(next);
                          }}
                          className="pixel-btn px-2 min-h-[38px] text-[11px] bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] cursor-pointer"
                          title="Hapus jadwal kelas ini"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
