import React from 'react';

export interface WoodenStatItem {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

interface WoodenQuestBoardProps {
  bannerTitle: string;
  bannerLeft?: React.ReactNode;
  bannerRight?: React.ReactNode;
  stats?: WoodenStatItem[];
  urgent?: boolean;
  selected?: boolean;
  children: React.ReactNode;
  className?: string;
}

const STAT_TONE_CLASSES: Record<NonNullable<WoodenStatItem['tone']>, string> = {
  default: 'bg-[#e3a764] text-[#261006] border-[#3d1b0c]',
  success: 'bg-[#a7f3d0] text-[#064e3b] border-[#14532d]',
  warning: 'bg-[#fde68a] text-[#451a03] border-[#78350f]',
  danger: 'bg-[#fecdd3] text-[#881337] border-[#881337]',
};

/**
 * Cozy wooden RPG quest/scroll plaque matching the carved-wood header,
 * dark mahogany stat board, and warm parchment content box.
 */
export const WoodenQuestBoard: React.FC<WoodenQuestBoardProps> = ({
  bannerTitle,
  bannerLeft,
  bannerRight,
  stats = [],
  urgent = false,
  selected = false,
  children,
  className = '',
}) => {
  return (
    <article
      className={`wood-board-frame p-2 sm:p-2.5 space-y-2 overflow-hidden transition-transform duration-150 ${
        selected
          ? 'ring-2 ring-[var(--comic-gold)]'
          : urgent
            ? 'ring-2 ring-[#dc2626]'
            : ''
      } ${className}`}
    >
      {/* Top Wooden Header Plaque */}
      <div className="wood-board-banner px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {bannerLeft && <div className="shrink-0 flex items-center">{bannerLeft}</div>}
          <span className="font-pixel-display text-[13px] sm:text-[14.5px] tracking-wider uppercase text-white drop-shadow-[0_2px_0_#2b1006] truncate">
            {bannerTitle}
          </span>
        </div>
        {bannerRight && <div className="shrink-0 flex items-center gap-1.5">{bannerRight}</div>}
      </div>

      {/* Mahogany Board + Stat Row + Parchment Inner Panel */}
      <div className="wood-board-mahogany p-2.5 sm:p-3 space-y-2.5">
        {stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-0.5">
            {stats.map((stat, idx) => (
              <div
                key={`${stat.label}-${idx}`}
                className="inline-flex items-center gap-1.5 min-w-0"
              >
                <span className="font-pixel-display text-[11px] sm:text-[12px] uppercase tracking-wide text-[#fff7eb] drop-shadow-[0_1px_0_#2b1006] shrink-0">
                  {stat.label}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-[6px] border text-[12px] sm:text-[12.5px] font-extrabold tabular-nums leading-tight truncate max-w-[180px] ${
                    STAT_TONE_CLASSES[stat.tone || 'default']
                  }`}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Warm Parchment Content Box */}
        <div className="wood-board-parchment p-3 sm:p-3.5 text-[#261006] space-y-2.5 min-w-0">
          {children}
        </div>
      </div>
    </article>
  );
};
