import React from 'react';
import { useActiveTheme } from '../context/ThemeContext';
import { PixelTheme } from '../types/lms';

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

type StatTone = NonNullable<WoodenStatItem['tone']>;

interface BoardThemeStyle {
  frame: string;
  banner: string;
  bannerTitle: string;
  band: string;
  statLabel: string;
  inner: string;
  tones: Record<StatTone, string>;
}

const BOARD_THEME_STYLES: Record<PixelTheme, BoardThemeStyle> = {
  sunny_quest: {
    frame:
      'bg-[#f8e7ce] border-[2.5px] border-[#2e1d14] rounded-[6px] shadow-[inset_0_2px_0_#ffffff,4px_4px_0_0_rgba(46,29,20,0.85)]',
    banner:
      'bg-[#e52521] border-2 border-[#2e1d14] rounded-[4px] shadow-[inset_0_2px_0_rgba(255,255,255,0.45),2px_3px_0_0_#7f1d1d]',
    bannerTitle: 'text-white drop-shadow-[1px_2px_0_#7f1d1d]',
    band: 'bg-[#fce7e7] border-2 border-[#2e1d14]/70 rounded-[4px]',
    statLabel: 'text-[#991b1b]',
    inner:
      'bg-white border-2 border-[#2e1d14] rounded-[4px] text-[#1e140e] shadow-[2px_2px_0_0_rgba(46,29,20,0.18)]',
    tones: {
      default: 'bg-white text-[#1e140e] border-[#2e1d14] rounded-[3px]',
      success: 'bg-[#4ade80] text-[#052e16] border-[#166534] rounded-[3px]',
      warning: 'bg-[#ffd000] text-[#1e140e] border-[#2e1d14] rounded-[3px]',
      danger: 'bg-[#fb7185] text-white border-[#881337] rounded-[3px]',
    },
  },
  daylight_rpg: {
    frame:
      'bg-[#26b6b0] border-[2.5px] border-[#4e2a1e] rounded-[6px] shadow-[inset_0_2px_0_rgba(255,255,255,0.4),4px_4px_0_0_rgba(78,42,30,0.42)]',
    banner:
      'bg-[#c82a36] border-2 border-[#4e2a1e] rounded-[4px] shadow-[inset_0_2px_0_rgba(255,255,255,0.3),2px_2px_0_0_#7f1d1d]',
    bannerTitle: 'text-white drop-shadow-[1px_1px_0_#7f1d1d]',
    band: 'bg-[#fef3c7] border-2 border-[#4e2a1e]/70 rounded-[4px]',
    statLabel: 'text-[#683c2b]',
    inner: 'bg-[#fffaf2] border-2 border-[#4e2a1e] rounded-[4px] text-[#3f2117]',
    tones: {
      default: 'bg-white text-[#3f2117] border-[#4e2a1e]/75 rounded-[3px]',
      success: 'bg-[#a7f3d0] text-[#064e3b] border-[#16948e] rounded-[3px]',
      warning: 'bg-[#ffe169] text-[#3f2117] border-[#4e2a1e] rounded-[3px]',
      danger: 'bg-[#ffe4e6] text-[#9f1239] border-[#c82a36] rounded-[3px]',
    },
  },
  nes_classic: {
    frame:
      'bg-[#b87c4b] border-[2.5px] border-[#5c3822] rounded-[4px] shadow-[3px_3px_0_0_#5c3822]',
    banner:
      'bg-[#3f7d28] border-2 border-[#5c3822] rounded-[3px] shadow-[inset_0_2px_0_rgba(255,255,255,0.22),2px_2px_0_0_#3b2214]',
    bannerTitle: 'text-[#fff8df]',
    band: 'bg-[#e9f4d3] border-2 border-[#5c3822] rounded-[3px]',
    statLabel: 'text-[#3b2214]',
    inner: 'bg-[#fffdf6] border-2 border-[#5c3822] rounded-[3px] text-[#3b2214]',
    tones: {
      default: 'bg-[#fbf6e3] text-[#3b2214] border-[#5c3822] rounded-[2px]',
      success: 'bg-[#bbf7d0] text-[#14532d] border-[#3f7d28] rounded-[2px]',
      warning: 'bg-[#fde68a] text-[#3b2214] border-[#5c3822] rounded-[2px]',
      danger: 'bg-[#fecaca] text-[#7f1d1d] border-[#c0392b] rounded-[2px]',
    },
  },
  cyber_retro: {
    frame:
      'bg-[#102347] border-[2.5px] border-[#d4a94f] rounded-[4px] shadow-[4px_4px_0_0_#071022]',
    banner:
      'bg-[#163466] border-2 border-[#d4a94f] rounded-[3px] shadow-[inset_0_2px_0_rgba(255,255,255,0.2)]',
    bannerTitle: 'text-[#fde68a] drop-shadow-[1px_1px_0_#071022]',
    band: 'bg-[#162d59] border-2 border-[#3b66ab] rounded-[3px]',
    statLabel: 'text-[#93c5fd]',
    inner: 'bg-white border-2 border-[#d4a94f] rounded-[3px] text-[#0b1730]',
    tones: {
      default: 'bg-[#f0f5fc] text-[#0b1730] border-[#60a5fa] rounded-[3px]',
      success: 'bg-[#ccfbf1] text-[#134e4a] border-[#0d9488] rounded-[3px]',
      warning: 'bg-[#fef3c7] text-[#78350f] border-[#d4a94f] rounded-[3px]',
      danger: 'bg-[#fee2e2] text-[#7f1d1d] border-[#c83218] rounded-[3px]',
    },
  },
  gameboy_green: {
    frame:
      'bg-[#09090f] persona-stripes border-[2.5px] border-[#09090f] rounded-[2px] shadow-[5px_5px_0_0_#e60012]',
    banner:
      'bg-[#e60012] border-2 border-white rounded-[2px] shadow-[2px_2px_0_0_#09090f]',
    bannerTitle: 'text-white drop-shadow-[1px_1px_0_#09090f]',
    band: 'bg-[#12121b] border-2 border-[#27272a] rounded-[2px]',
    statLabel: 'text-[#ffe600]',
    inner: 'bg-white border-2 border-[#09090f] rounded-[2px] text-[#09090f]',
    tones: {
      default: 'bg-white text-[#09090f] border-[#09090f] rounded-[2px]',
      success: 'bg-[#a7f3d0] text-[#064e3b] border-[#09090f] rounded-[2px]',
      warning: 'bg-[#ffe600] text-[#09090f] border-[#09090f] rounded-[2px]',
      danger: 'bg-[#e60012] text-white border-white rounded-[2px]',
    },
  },
};

/**
 * Theme-adaptive Quest & Scroll Board card container.
 * Renders papercraft stage in Super Paper Stage, turquoise café tray in Pokémon Café ReMix,
 * pixel timber & meadow in Sprout Pixel Village, sapphire & gold in MLBB, and crimson-ink in Persona.
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
  const { theme } = useActiveTheme();
  const style = BOARD_THEME_STYLES[theme] || BOARD_THEME_STYLES.sunny_quest;

  return (
    <article
      className={`${style.frame} p-2 sm:p-2.5 space-y-2 overflow-hidden transition-transform duration-150 ${
        selected
          ? 'ring-2 ring-[var(--comic-gold)]'
          : urgent
            ? 'ring-2 ring-[#dc2626]'
            : ''
      } ${className}`}
    >
      {/* Top Banner Header */}
      <div
        className={`${style.banner} px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 min-w-0`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {bannerLeft && <div className="shrink-0 flex items-center">{bannerLeft}</div>}
          <span
            className={`font-pixel-display text-[12.5px] sm:text-[13.5px] tracking-[0.015em] leading-snug line-clamp-2 break-words uppercase ${style.bannerTitle}`}
          >
            {bannerTitle}
          </span>
        </div>
        {bannerRight && (
          <div className="shrink-0 flex items-center gap-1.5">{bannerRight}</div>
        )}
      </div>

      {/* Stat Band + Inner Content Panel */}
      <div className={`${style.band} p-2.5 sm:p-3 space-y-2.5`}>
        {stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-0.5">
            {stats.map((stat, idx) => (
              <div
                key={`${stat.label}-${idx}`}
                className="inline-flex items-center gap-1.5 min-w-0"
              >
                <span
                  className={`font-pixel-ui text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.02em] shrink-0 ${style.statLabel}`}
                >
                  {stat.label}
                </span>
                <span
                  className={`px-2 py-0.5 border text-[11.5px] sm:text-[12px] font-extrabold tabular-nums leading-tight truncate max-w-[190px] sm:max-w-[230px] ${
                    style.tones[stat.tone || 'default']
                  }`}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Inner Content Card */}
        <div className={`${style.inner} p-3 sm:p-3.5 space-y-2.5 min-w-0`}>
          {children}
        </div>
      </div>
    </article>
  );
};
