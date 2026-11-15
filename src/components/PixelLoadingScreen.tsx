import React, { useEffect, useState } from 'react';
import { PixelTheme } from '../types/lms';

const LOADING_QUOTES = [
  'Summoning knowledge...',
  'Membuka gerbang akademi...',
  'Menyiapkan gulungan materi & quests...',
];

export interface PixelLoadingScreenProps {
  /** Active visual theme used to style the splash frame. */
  theme: PixelTheme;
  /** Optional custom status message overriding the rotating RPG lore text. */
  message?: string;
}

/**
 * Thematic 8-bit RPG loading splash featuring an animated Health Potion vial
 * and retro progress bar shown briefly during initial boot/cloud hydration.
 */
export const PixelLoadingScreen: React.FC<PixelLoadingScreenProps> = ({
  theme,
  message,
}) => {
  const [percent, setPercent] = useState(24);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const progTimer = window.setInterval(() => {
      setPercent((prev) => (prev >= 94 ? 94 : prev + 16));
    }, 120);
    const quoteTimer = window.setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 700);
    return () => {
      window.clearInterval(progTimer);
      window.clearInterval(quoteTimer);
    };
  }, []);

  return (
    <div
      data-theme={theme}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--bg-outer)] pixel-grid-bg p-4"
    >
      <div className="pixel-box w-full max-w-[380px] p-6 bg-[var(--bg-surface)] text-center space-y-4">
        {/* Animated Pixel Health Potion SVG */}
        <div className="flex justify-center">
          <svg
            width="68"
            height="68"
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className="animate-pixel-bounce"
            aria-hidden="true"
          >
            {/* Cork & Neck */}
            <rect x="9" y="2" width="6" height="2" fill="#b45309" />
            <rect x="8" y="4" width="8" height="2" fill="#e2e8f0" />
            <rect x="9" y="6" width="6" height="2" fill="#cbd5e1" />
            {/* Flask outline */}
            <rect x="6" y="8" width="12" height="2" fill="#1e113a" />
            <rect x="4" y="10" width="2" height="9" fill="#1e113a" />
            <rect x="18" y="10" width="2" height="9" fill="#1e113a" />
            <rect x="6" y="19" width="12" height="2" fill="#1e113a" />
            {/* Glass interior & glowing ruby Health Potion */}
            <rect x="6" y="10" width="12" height="3" fill="#fffdf7" />
            <rect x="6" y="13" width="12" height="6" fill="#e11d48" />
            <rect x="7" y="12" width="10" height="2" fill="#fb7185" />
            {/* Specular pixel shine */}
            <rect x="7" y="14" width="2" height="3" fill="#ffe4e6" />
            <rect x="14" y="11" width="1" height="1" fill="#fb7185" />
          </svg>
        </div>

        <div className="space-y-1">
          <p className="font-pixel-ui text-[10px] uppercase tracking-widest text-[var(--accent-warning)]">
            PIXEL QUEST ACADEMY
          </p>
          <h2 className="font-pixel-display text-[14px] text-[var(--text-primary)] animate-press-start">
            {message || LOADING_QUOTES[quoteIdx]}
          </h2>
        </div>

        {/* Health Potion Progress Bar */}
        <div className="space-y-1.5">
          <div className="pixel-box-inset h-4 w-full p-0.5 overflow-hidden">
            <div
              className="h-full transition-all duration-150 bg-[#e11d48]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] tabular-nums">
            HP / MANA LOADING · {percent}%
          </p>
        </div>
      </div>
    </div>
  );
};
