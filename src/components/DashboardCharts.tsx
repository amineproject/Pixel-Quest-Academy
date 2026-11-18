import React, { useMemo, useState } from 'react';
import {
  DashboardAnalytics,
  DashboardComparisonRow,
  DashboardRankBucket,
  DashboardStatusBreakdown,
} from '../utils/exp';
import { ThemedPanelCard } from './ThemePrimitives';

interface StatusSegment {
  key: 'tuntas' | 'proses' | 'remidial' | 'belum';
  label: string;
  count: number;
  percent: number;
  color: string;
  shortDesc: string;
}

export const StatusDonutChart: React.FC<{
  status: DashboardStatusBreakdown;
}> = ({ status }) => {
  const [hoveredKey, setHoveredKey] = useState<StatusSegment['key'] | null>(
    null
  );

  const segments: StatusSegment[] = useMemo(() => {
    const total = Math.max(0, status.totalSlots);
    const pct = (val: number) =>
      total > 0 ? Math.round((val / total) * 100) : 0;

    return [
      {
        key: 'tuntas',
        label: 'Tuntas',
        count: status.tuntas,
        percent: pct(status.tuntas),
        color: '#15803d',
        shortDesc: 'Memenuhi KKM',
      },
      {
        key: 'proses',
        label: 'Proses',
        count: status.proses,
        percent: pct(status.proses),
        color: '#0284c7',
        shortDesc: 'Menunggu finalisasi',
      },
      {
        key: 'remidial',
        label: 'Remidial',
        count: status.remidial,
        percent: pct(status.remidial),
        color: '#dc2626',
        shortDesc: 'Perlu perbaikan nilai',
      },
      {
        key: 'belum',
        label: 'Belum',
        count: status.belum,
        percent: pct(status.belum),
        color: '#d97706',
        shortDesc: 'Belum dinilai / kumpul',
      },
    ];
  }, [status]);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const arcSlices = useMemo(() => {
    if (status.totalSlots <= 0) return [];
    let accumulatedRatio = 0;
    return segments
      .filter((seg) => seg.count > 0)
      .map((seg) => {
        const ratio = seg.count / status.totalSlots;
        const dashLength = ratio * circumference;
        const dashOffset = -accumulatedRatio * circumference;
        accumulatedRatio += ratio;
        return {
          ...seg,
          dashArray: `${dashLength} ${circumference}`,
          dashOffset,
        };
      });
  }, [segments, status.totalSlots, circumference]);

  const activeSegment = hoveredKey
    ? segments.find((s) => s.key === hoveredKey) || null
    : null;

  return (
    <ThemedPanelCard className="p-4 space-y-3 min-w-0 flex flex-col justify-between">
      <div className="space-y-0.5">
        <h3 className="font-pixel-display text-[13px] text-[var(--text-primary)]">
          Status Penyelesaian Tugas
        </h3>
        <p className="text-[12.5px] text-[var(--text-muted)]">
          Grafik Donat · {status.totalSlots} slot penilaian · Rata-rata skor{' '}
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {status.averageScore}
          </span>
        </p>
      </div>

      {status.totalSlots === 0 ? (
        <div className="pixel-box-inset p-5 text-center text-[13px] text-[var(--text-secondary)]">
          Belum ada slot tugas & siswa aktif pada filter ini.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
          <div className="relative w-[156px] h-[156px] shrink-0">
            <svg
              viewBox="0 0 160 160"
              className="w-full h-full -rotate-90"
              role="img"
              aria-label={`Grafik Donat Status Tugas: ${status.completionPercent}% Tuntas`}
            >
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--bg-inset)"
                strokeWidth="22"
              />
              {arcSlices.map((slice) => {
                const isHighlighted =
                  hoveredKey === null || hoveredKey === slice.key;
                return (
                  <circle
                    key={slice.key}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={hoveredKey === slice.key ? 25 : 22}
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    opacity={isHighlighted ? 1 : 0.35}
                    className="transition-opacity duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredKey(slice.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
              <span className="font-pixel-display text-[18px] text-[var(--text-primary)] tabular-nums leading-none">
                {activeSegment
                  ? `${activeSegment.percent}%`
                  : `${status.completionPercent}%`}
              </span>
              <span className="text-[11px] font-bold text-[var(--text-secondary)] mt-1 truncate max-w-[92px]">
                {activeSegment ? activeSegment.label : 'Tuntas'}
              </span>
              <span className="text-[10.5px] text-[var(--text-muted)] tabular-nums">
                {activeSegment
                  ? `${activeSegment.count} tugas`
                  : `${status.tuntas}/${status.totalSlots}`}
              </span>
            </div>
          </div>

          <div className="w-full min-w-0 flex-1 space-y-1.5">
            {segments.map((seg) => {
              const isActive = hoveredKey === seg.key;
              return (
                <button
                  key={seg.key}
                  type="button"
                  onMouseEnter={() => setHoveredKey(seg.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onFocus={() => setHoveredKey(seg.key)}
                  onBlur={() => setHoveredKey(null)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[var(--inset-radius)] border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-surface-alt)] border-[var(--border-pixel)]'
                      : 'bg-[var(--bg-inset)] border-transparent hover:border-[var(--border-pixel)]/40'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="w-3 h-3 rounded-[3px] shrink-0 border border-black/20"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">
                      {seg.label}
                    </span>
                    <span className="hidden min-[440px]:inline text-[11px] text-[var(--text-muted)] truncate">
                      · {seg.shortDesc}
                    </span>
                  </span>
                  <span className="text-[12.5px] font-bold text-[var(--text-primary)] tabular-nums shrink-0">
                    {seg.count}{' '}
                    <span className="text-[11px] font-normal text-[var(--text-muted)]">
                      ({seg.percent}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </ThemedPanelCard>
  );
};

const RANK_COLORS: Record<DashboardRankBucket['rank'], string> = {
  S: '#15803d',
  A: '#0284c7',
  B: '#7c3aed',
  C: '#d97706',
  D: '#dc2626',
};

export const RankHistogramChart: React.FC<{
  ranks: DashboardRankBucket[];
  gradedCount: number;
}> = ({ ranks, gradedCount }) => {
  const [hoveredRank, setHoveredRank] = useState<string | null>(null);
  const maxCount = Math.max(1, ...ranks.map((r) => r.count));

  return (
    <ThemedPanelCard className="p-4 space-y-3 min-w-0 flex flex-col justify-between">
      <div className="space-y-0.5">
        <h3 className="font-pixel-display text-[13px] text-[var(--text-primary)]">
          Sebaran Predikat Nilai (Rank)
        </h3>
        <p className="text-[12.5px] text-[var(--text-muted)]">
          Grafik Batang Vertikal · {gradedCount} nilai masuk
        </p>
      </div>

      {gradedCount === 0 ? (
        <div className="pixel-box-inset p-5 text-center text-[13px] text-[var(--text-secondary)]">
          Belum ada siswa yang dinilai untuk menampilkan sebaran predikat S–D.
        </div>
      ) : (
        <div className="pt-2 space-y-2">
          <div className="relative h-[148px] flex items-end justify-between gap-2 sm:gap-3 px-2 pt-5 pb-1 border-b-2 border-[var(--border-pixel)] bg-[var(--bg-inset)]/60 rounded-t-[var(--inset-radius)]">
            {/* Subtle horizontal reference lines */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-[25%] border-t border-dashed border-[var(--border-pixel)]/20 pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-[62%] border-t border-dashed border-[var(--border-pixel)]/20 pointer-events-none"
            />

            {ranks.map((bucket) => {
              const heightPct =
                bucket.count > 0
                  ? Math.max(10, Math.round((bucket.count / maxCount) * 100))
                  : 0;
              const isHighlighted =
                hoveredRank === null || hoveredRank === bucket.rank;
              const barColor = RANK_COLORS[bucket.rank];

              return (
                <div
                  key={bucket.rank}
                  className="relative z-10 flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0 group"
                  onMouseEnter={() => setHoveredRank(bucket.rank)}
                  onMouseLeave={() => setHoveredRank(null)}
                >
                  <span className="text-[11.5px] font-bold text-[var(--text-primary)] tabular-nums leading-none">
                    {bucket.count}
                  </span>
                  <div
                    className="w-full max-w-[44px] rounded-t-[4px] border-2 border-[var(--border-pixel)] transition-opacity duration-150"
                    style={{
                      height: bucket.count > 0 ? `${heightPct}%` : '4px',
                      backgroundColor:
                        bucket.count > 0 ? barColor : 'transparent',
                      opacity: isHighlighted ? 1 : 0.4,
                    }}
                    title={`${bucket.label} (${bucket.rangeLabel}): ${bucket.count} nilai (${bucket.percent}%)`}
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3 px-2 text-center">
            {ranks.map((bucket) => (
              <div key={bucket.rank} className="min-w-0">
                <p className="font-pixel-display text-[12px] text-[var(--text-primary)] leading-tight">
                  {bucket.rank}
                </p>
                <p className="text-[10.5px] text-[var(--text-muted)] tabular-nums truncate">
                  {bucket.rangeLabel}
                </p>
                <p className="text-[10.5px] font-semibold text-[var(--text-secondary)] tabular-nums">
                  {bucket.percent}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ThemedPanelCard>
  );
};

type ComparisonDimension = 'class' | 'realm' | 'category';
type ComparisonMetric = 'averageScore' | 'completionPercent';

export const ComparisonHorizontalBarChart: React.FC<{
  analytics: DashboardAnalytics;
}> = ({ analytics }) => {
  const [dimension, setDimension] = useState<ComparisonDimension>('class');
  const [metric, setMetric] = useState<ComparisonMetric>('averageScore');

  const rows: DashboardComparisonRow[] = useMemo(() => {
    if (dimension === 'realm') return analytics.byRealm;
    if (dimension === 'category') return analytics.byCategory;
    return analytics.byClass;
  }, [dimension, analytics]);

  const dimensionTitle =
    dimension === 'class'
      ? 'Per Kelas (Dungeon)'
      : dimension === 'realm'
        ? 'Per Mata Pelajaran'
        : 'Per Kategori Quest';

  const getMetricValue = (row: DashboardComparisonRow) =>
    metric === 'averageScore' ? row.averageScore : row.completionPercent;

  const getBarColor = (row: DashboardComparisonRow, value: number) => {
    if (row.totalSlots === 0 && row.gradedCount === 0) {
      return 'var(--border-pixel)';
    }
    if (value >= 75) return '#15803d';
    if (value >= 55) return '#0284c7';
    return '#d97706';
  };

  return (
    <ThemedPanelCard className="p-4 space-y-3.5 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h3 className="font-pixel-display text-[13px] text-[var(--text-primary)]">
            Perbandingan Capaian {dimensionTitle}
          </h3>
          <p className="text-[12.5px] text-[var(--text-muted)]">
            Grafik Batang Horizontal ·{' '}
            {metric === 'averageScore'
              ? 'Skor rata-rata (skala 0–100)'
              : 'Persentase tugas berstatus Tuntas (0–100%)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Dimension Segmented Tabs */}
          <div
            className="inline-flex items-center p-1 rounded-[var(--inset-radius)] bg-[var(--bg-inset)] border border-[var(--border-pixel)]/40"
            role="tablist"
            aria-label="Dimensi perbandingan grafik"
          >
            {(
              [
                { id: 'class', label: 'Per Kelas' },
                { id: 'realm', label: 'Per Mapel' },
                { id: 'category', label: 'Per Kategori' },
              ] as { id: ComparisonDimension; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={dimension === tab.id}
                onClick={() => setDimension(tab.id)}
                className={`px-2.5 py-1 text-[11.5px] font-bold rounded-[6px] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  dimension === tab.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-pixel)]/60 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Metric Segmented Switch */}
          <div
            className="inline-flex items-center p-1 rounded-[var(--inset-radius)] bg-[var(--bg-inset)] border border-[var(--border-pixel)]/40"
            role="tablist"
            aria-label="Metrik grafik batang"
          >
            <button
              type="button"
              role="tab"
              aria-selected={metric === 'averageScore'}
              onClick={() => setMetric('averageScore')}
              className={`px-2.5 py-1 text-[11.5px] font-bold rounded-[6px] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                metric === 'averageScore'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Rata-rata Nilai
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={metric === 'completionPercent'}
              onClick={() => setMetric('completionPercent')}
              className={`px-2.5 py-1 text-[11.5px] font-bold rounded-[6px] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                metric === 'completionPercent'
                  ? 'bg-[var(--accent-success)] text-[var(--text-on-success)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              % Ketuntasan
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="pixel-box-inset p-5 text-center text-[13px] text-[var(--text-secondary)]">
          Belum ada data {dimensionTitle.toLowerCase()} pada filter yang dipilih.
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => {
            const val = getMetricValue(row);
            const hasActivity =
              metric === 'averageScore'
                ? row.gradedCount > 0
                : row.totalSlots > 0;
            const barWidth = hasActivity ? Math.max(4, Math.min(100, val)) : 0;
            const barColor = getBarColor(row, val);

            return (
              <div
                key={row.id}
                className="pixel-box-inset p-2.5 sm:px-3 space-y-1.5 min-w-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-[13.5px] font-bold text-[var(--text-primary)] break-words">
                      {row.label}
                    </span>
                    {row.subLabel && (
                      <span className="text-[11.5px] text-[var(--text-muted)] ml-2">
                        {row.subLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-[12px] tabular-nums shrink-0">
                    <span className="text-[var(--text-muted)]">
                      {row.tuntasCount}/{row.totalSlots} tuntas
                      {row.remidialCount > 0
                        ? ` · ${row.remidialCount} remidial`
                        : ''}
                    </span>
                    <span className="font-pixel-display text-[13px] text-[var(--text-primary)] min-w-[44px] text-right">
                      {hasActivity
                        ? metric === 'averageScore'
                          ? `${val}`
                          : `${val}%`
                        : '-'}
                    </span>
                  </div>
                </div>

                <div
                  className="h-3.5 w-full rounded-[4px] bg-[var(--bg-surface)] border border-[var(--border-pixel)]/60 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={hasActivity ? val : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${row.label}: ${val}${metric === 'completionPercent' ? '%' : ''}`}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ThemedPanelCard>
  );
};
