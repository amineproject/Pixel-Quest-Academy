import React from 'react';
import { PixelTheme } from '../types/lms';
import { PixelChestEmpty, PixelMascotSlime } from './PixelArt';

/**
 * Full-viewport ambient atmospheric SVG backdrop tailored to each visual world.
 * Uses pointer-events-none and aria-hidden for zero interference & accessibility.
 */
export const ThemeBackdropIllustration: React.FC<{ theme: PixelTheme }> = ({
  theme,
}) => {
  if (theme === 'sunny_quest') {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        {/* Warm sun + pixel clouds */}
        <svg
          className="absolute top-6 right-8 w-20 h-20 opacity-85 hidden sm:block animate-pixel-float"
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
        >
          <rect x="8" y="2" width="8" height="2" fill="#fde047" />
          <rect x="6" y="4" width="12" height="2" fill="#facc15" />
          <rect x="4" y="6" width="16" height="12" fill="#fbbf24" />
          <rect x="6" y="18" width="12" height="2" fill="#f59e0b" />
          <rect x="8" y="20" width="8" height="2" fill="#f59e0b" />
          <rect x="8" y="8" width="4" height="4" fill="#fef08a" />
        </svg>

        <svg
          className="absolute top-12 left-6 w-36 h-16 opacity-80 hidden md:block"
          viewBox="0 0 36 16"
          shapeRendering="crispEdges"
        >
          <rect x="8" y="4" width="12" height="4" fill="#ffffff" />
          <rect x="4" y="8" width="24" height="5" fill="#ffffff" />
          <rect x="6" y="12" width="20" height="2" fill="#dbeafe" />
        </svg>

        {/* Bottom rolling pixel grassland hills & cozy pine trees */}
        <svg
          className="absolute bottom-0 left-0 w-full h-36 sm:h-48 opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1200 180"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="110" width="1200" height="70" fill="#48bb78" />
          <rect x="0" y="96" width="420" height="20" fill="#68d391" />
          <rect x="760" y="92" width="440" height="24" fill="#68d391" />
          <rect x="0" y="142" width="1200" height="38" fill="#2f855a" />
          {/* Left cozy pixel trees */}
          <rect x="52" y="80" width="12" height="32" fill="#744210" />
          <rect x="34" y="52" width="48" height="28" fill="#276749" />
          <rect x="42" y="34" width="32" height="18" fill="#38a169" />
          <rect x="128" y="88" width="10" height="24" fill="#744210" />
          <rect x="114" y="64" width="38" height="24" fill="#2f855a" />
          {/* Right cozy pixel trees */}
          <rect x="1080" y="76" width="12" height="36" fill="#744210" />
          <rect x="1060" y="48" width="52" height="28" fill="#276749" />
          <rect x="1070" y="30" width="32" height="18" fill="#38a169" />
        </svg>
      </div>
    );
  }

  if (theme === 'daylight_rpg') {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        {/* Kawaii clouds, floating stars & pastel flowers */}
        <svg
          className="absolute top-10 left-8 w-32 h-16 opacity-80 hidden sm:block animate-pixel-float"
          viewBox="0 0 32 16"
          shapeRendering="crispEdges"
        >
          <rect x="8" y="3" width="14" height="4" fill="#ffffff" />
          <rect x="4" y="7" width="24" height="5" fill="#ffffff" />
          <rect x="6" y="11" width="20" height="2" fill="#e0f2fe" />
        </svg>
        <svg
          className="absolute top-24 right-10 w-14 h-14 opacity-85 hidden sm:block animate-pixel-bounce"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
        >
          <rect x="7" y="1" width="2" height="14" fill="#fde047" />
          <rect x="1" y="7" width="14" height="2" fill="#fde047" />
          <rect x="5" y="5" width="6" height="6" fill="#fef08a" />
        </svg>
        <svg
          className="absolute bottom-14 left-12 w-12 h-12 opacity-80 hidden md:block"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
        >
          <rect x="6" y="2" width="4" height="4" fill="#f9a8d4" />
          <rect x="6" y="10" width="4" height="4" fill="#f9a8d4" />
          <rect x="2" y="6" width="4" height="4" fill="#f9a8d4" />
          <rect x="10" y="6" width="4" height="4" fill="#f9a8d4" />
          <rect x="6" y="6" width="4" height="4" fill="#fde047" />
        </svg>
        <svg
          className="absolute bottom-20 right-14 w-14 h-14 opacity-80 hidden md:block"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
        >
          <rect x="2" y="3" width="12" height="10" fill="#a7f3d0" />
          <rect x="3" y="4" width="10" height="8" fill="#ffffff" />
          <rect x="5" y="6" width="6" height="1" fill="#38bdf8" />
          <rect x="5" y="9" width="4" height="1" fill="#38bdf8" />
        </svg>
      </div>
    );
  }

  if (theme === 'nes_classic') {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        {/* Starry Royal Twilight + Distant Castle Battlements */}
        <svg
          className="absolute top-10 left-10 w-16 h-16 opacity-60 hidden sm:block"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
        >
          <rect x="7" y="2" width="2" height="12" fill="#fbbf24" />
          <rect x="2" y="7" width="12" height="2" fill="#fbbf24" />
          <rect x="6" y="6" width="4" height="4" fill="#fef08a" />
        </svg>
        <svg
          className="absolute bottom-0 left-0 w-full h-40 opacity-35"
          preserveAspectRatio="none"
          viewBox="0 0 1200 160"
          shapeRendering="crispEdges"
        >
          {/* Left castle tower */}
          <rect x="20" y="40" width="90" height="120" fill="#14092b" />
          <rect x="20" y="24" width="20" height="16" fill="#14092b" />
          <rect x="55" y="24" width="20" height="16" fill="#14092b" />
          <rect x="90" y="24" width="20" height="16" fill="#14092b" />
          <rect x="56" y="68" width="18" height="24" fill="#fbbf24" />
          {/* Right castle tower */}
          <rect x="1080" y="30" width="100" height="130" fill="#14092b" />
          <rect x="1080" y="14" width="22" height="16" fill="#14092b" />
          <rect x="1119" y="14" width="22" height="16" fill="#14092b" />
          <rect x="1158" y="14" width="22" height="16" fill="#14092b" />
          <rect x="1120" y="62" width="18" height="26" fill="#fbbf24" />
          <rect x="0" y="132" width="1200" height="28" fill="#14092b" />
        </svg>
      </div>
    );
  }

  if (theme === 'cyber_retro') {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        {/* Dynamic diagonal comic pop-art speed rays */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
        >
          <polygon points="0,0 260,0 80,800 0,800" fill="#00d8ff" />
          <polygon points="1020,0 1200,0 1200,800 880,800" fill="#e11d74" />
          <polygon points="480,0 560,0 410,800 350,800" fill="#ffd000" />
        </svg>
      </div>
    );
  }

  // Clean Paper Studio: quiet archival stationery feel
  return null;
};

/**
 * Theme-specific mascot / emblem shown on Login Hero & Welcome cards.
 */
export const ThemeMascotIllustration: React.FC<{
  theme: PixelTheme;
  size?: number;
}> = ({ theme, size = 52 }) => {
  if (theme === 'daylight_rpg') {
    // Cute Chibi Pastel Cat-Slime
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect x="5" y="3" width="3" height="3" fill="#38bdf8" />
        <rect x="16" y="3" width="3" height="3" fill="#38bdf8" />
        <rect x="6" y="5" width="12" height="3" fill="#7dd3fc" />
        <rect x="4" y="8" width="16" height="10" fill="#38bdf8" />
        <rect x="5" y="18" width="14" height="3" fill="#0284c7" />
        <rect x="7" y="11" width="2" height="3" fill="#0f172a" />
        <rect x="15" y="11" width="2" height="3" fill="#0f172a" />
        <rect x="5" y="14" width="2" height="2" fill="#f9a8d4" />
        <rect x="17" y="14" width="2" height="2" fill="#f9a8d4" />
        <rect x="10" y="14" width="4" height="1" fill="#0f172a" />
        <rect x="11" y="15" width="2" height="1" fill="#f472b6" />
        <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
      </svg>
    );
  }

  if (theme === 'nes_classic') {
    // Royal Golden Crown Emblem
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect x="3" y="6" width="3" height="8" fill="#fbbf24" />
        <rect x="10" y="4" width="4" height="10" fill="#fde047" />
        <rect x="18" y="6" width="3" height="8" fill="#fbbf24" />
        <rect x="4" y="12" width="16" height="6" fill="#f59e0b" />
        <rect x="4" y="18" width="16" height="2" fill="#78350f" />
        <rect x="11" y="13" width="2" height="3" fill="#be123c" />
        <rect x="6" y="14" width="2" height="2" fill="#38bdf8" />
        <rect x="16" y="14" width="2" height="2" fill="#38bdf8" />
      </svg>
    );
  }

  if (theme === 'cyber_retro') {
    // Comic-Pop Star Bolt Burst
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect x="10" y="2" width="6" height="4" fill="#00d8ff" />
        <rect x="7" y="6" width="8" height="4" fill="#00d8ff" />
        <rect x="5" y="10" width="12" height="3" fill="#ffd000" />
        <rect x="9" y="13" width="7" height="4" fill="#ffd000" />
        <rect x="7" y="17" width="6" height="4" fill="#e11d74" />
        <rect x="9" y="4" width="2" height="4" fill="#ffffff" />
      </svg>
    );
  }

  if (theme === 'gameboy_green') {
    // Clean Studio Minimalist Open Book Emblem
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[#18181b]"
        aria-hidden="true"
      >
        <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22V5.5z" fill="#ffffff" />
        <path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2V5.5z" fill="#f4f1ea" />
        <line x1="5" y1="8" x2="8.5" y2="8" />
        <line x1="5" y1="12" x2="8.5" y2="12" />
        <line x1="15.5" y1="8" x2="19" y2="8" />
      </svg>
    );
  }

  // Default sunny_quest: Cheerful Scholar Slime Mascot
  return <PixelMascotSlime size={size} />;
};

/**
 * Theme-specific Empty State Illustration
 */
export const ThemeEmptyIllustration: React.FC<{
  theme: PixelTheme;
  size?: number;
}> = ({ theme, size = 76 }) => {
  if (theme === 'daylight_rpg') {
    // Cute Smiling Notebook / Pastel Pouch
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="16" height="16" fill="#bae6fd" />
        <rect x="5" y="5" width="14" height="14" fill="#ffffff" />
        <rect x="4" y="4" width="16" height="4" fill="#38bdf8" />
        <rect x="7" y="11" width="2" height="2" fill="#1e4e68" />
        <rect x="15" y="11" width="2" height="2" fill="#1e4e68" />
        <rect x="10" y="14" width="4" height="1" fill="#f472b6" />
        <rect x="18" y="2" width="2" height="2" fill="#fde047" />
        <rect x="2" y="14" width="2" height="2" fill="#a7f3d0" />
      </svg>
    );
  }

  if (theme === 'nes_classic') {
    // Royal Sealed Heraldic Scroll
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="4" y="5" width="16" height="3" fill="#fbbf24" />
        <rect x="5" y="8" width="14" height="9" fill="#fef3c7" />
        <rect x="4" y="17" width="16" height="3" fill="#fbbf24" />
        <rect x="10" y="10" width="4" height="4" fill="#be123c" />
        <rect x="11" y="11" width="2" height="2" fill="#fde047" />
      </svg>
    );
  }

  if (theme === 'cyber_retro') {
    // Pop-Art Empty Radar / Exclamation Crate
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" fill="#09090f" />
        <rect x="5" y="6" width="14" height="12" fill="#00d8ff" />
        <rect x="11" y="8" width="2" height="5" fill="#09090f" />
        <rect x="11" y="14" width="2" height="2" fill="#e11d74" />
      </svg>
    );
  }

  if (theme === 'gameboy_green') {
    // Minimalist Clean Folder Outline
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#52525b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="#f4f1ea" />
        <line x1="8" y1="13" x2="16" y2="13" />
      </svg>
    );
  }

  return <PixelChestEmpty size={size} />;
};
