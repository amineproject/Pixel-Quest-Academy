import React from 'react';
import { PixelTheme } from '../types/lms';

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
        {/* Papercraft clouds with white sticker cutouts */}
        <svg
          className="absolute top-12 left-16 w-40 h-16 opacity-90 hidden md:block animate-cloud-drift"
          viewBox="0 0 120 48"
        >
          <path
            d="M24 38 H96 A12 12 0 0 0 98 15 A18 18 0 0 0 64 8 A16 16 0 0 0 32 16 A12 12 0 0 0 24 38 Z"
            fill="#ffffff"
            stroke="#2e1d14"
            strokeWidth="3"
          />
        </svg>

        <svg
          className="absolute top-20 right-24 w-32 h-14 opacity-85 hidden lg:block animate-cloud-drift-slow"
          viewBox="0 0 120 48"
        >
          <path
            d="M24 38 H96 A12 12 0 0 0 98 15 A18 18 0 0 0 64 8 A16 16 0 0 0 32 16 A12 12 0 0 0 24 38 Z"
            fill="#ffffff"
            stroke="#2e1d14"
            strokeWidth="3"
          />
        </svg>

        {/* Bottom Paper Diorama: Rolling hills, cardboard fence & wooden stage plank */}
        <svg
          className="absolute bottom-0 left-0 w-full h-44 sm:h-52"
          preserveAspectRatio="none"
          viewBox="0 0 1200 210"
        >
          {/* Back teal-green paper hills */}
          <path
            d="M0 135 Q160 65 340 125 T700 120 T1060 115 L1200 130 L1200 210 L0 210 Z"
            fill="#2e7d32"
            stroke="#1b4332"
            strokeWidth="4"
          />
          {/* Front bright paper green meadow */}
          <path
            d="M0 155 Q240 118 480 150 T960 145 L1200 152 L1200 210 L0 210 Z"
            fill="#4caf50"
            stroke="#1b4332"
            strokeWidth="4"
          />
          {/* Papercraft trees */}
          <rect x="85" y="102" width="16" height="52" fill="#8d5524" stroke="#2e1d14" strokeWidth="3" />
          <circle cx="93" cy="86" r="32" fill="#66bb6a" stroke="#1b4332" strokeWidth="3.5" />
          <rect x="1085" y="96" width="16" height="58" fill="#8d5524" stroke="#2e1d14" strokeWidth="3" />
          <circle cx="1093" cy="80" r="34" fill="#66bb6a" stroke="#1b4332" strokeWidth="3.5" />
          {/* Wooden Theater Stage Apron */}
          <rect x="0" y="176" width="1200" height="34" fill="#b97a3c" stroke="#2e1d14" strokeWidth="4" />
          <rect x="0" y="176" width="1200" height="7" fill="#eab308" opacity="0.85" />
        </svg>

        {/* Left & Right Red Velvet Stage Curtains */}
        <svg
          className="hidden sm:block absolute inset-y-0 left-0 w-16 md:w-24 h-full opacity-95"
          preserveAspectRatio="none"
          viewBox="0 0 100 600"
        >
          <path
            d="M0 0 H88 C74 140 82 280 58 430 C76 500 74 560 66 600 H0 Z"
            fill="#991b1b"
            stroke="#450a0a"
            strokeWidth="3"
          />
          <path d="M18 0 V600" stroke="#dc2626" strokeWidth="8" opacity="0.55" />
          <path d="M44 0 V600" stroke="#7f1d1d" strokeWidth="6" opacity="0.65" />
        </svg>
        <svg
          className="hidden sm:block absolute inset-y-0 right-0 w-16 md:w-24 h-full opacity-95"
          preserveAspectRatio="none"
          viewBox="0 0 100 600"
        >
          <path
            d="M100 0 H12 C26 140 18 280 42 430 C24 500 26 560 34 600 H100 Z"
            fill="#991b1b"
            stroke="#450a0a"
            strokeWidth="3"
          />
          <path d="M82 0 V600" stroke="#dc2626" strokeWidth="8" opacity="0.55" />
          <path d="M56 0 V600" stroke="#7f1d1d" strokeWidth="6" opacity="0.65" />
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
        {/* Pokémon Café ReMix Peach Patisserie Wall Pattern + Festive Top Bunting */}
        <svg
          className="absolute top-0 left-0 w-full h-24 opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1200 96"
        >
          <path d="M0 10 Q300 40 600 12 T1200 10" fill="none" stroke="#4e2a1e" strokeWidth="3" />
          <polygon points="45,14 95,18 68,54" fill="#e03e48" stroke="#4e2a1e" strokeWidth="2.5" />
          <polygon points="135,20 185,22 158,58" fill="#26b6b0" stroke="#4e2a1e" strokeWidth="2.5" />
          <polygon points="225,22 275,20 250,58" fill="#ffe169" stroke="#4e2a1e" strokeWidth="2.5" />
          <polygon points="925,20 975,22 950,58" fill="#ffe169" stroke="#4e2a1e" strokeWidth="2.5" />
          <polygon points="1015,20 1065,18 1040,56" fill="#26b6b0" stroke="#4e2a1e" strokeWidth="2.5" />
          <polygon points="1105,16 1155,12 1132,52" fill="#f58220" stroke="#4e2a1e" strokeWidth="2.5" />
        </svg>

        {/* Floating Golden Café Stars & Cream Polka Accents */}
        <svg
          className="absolute top-24 left-8 w-14 h-14 opacity-85 hidden sm:block animate-pixel-float"
          viewBox="0 0 32 32"
        >
          <polygon
            points="16,3 19.8,11.2 28.8,12.2 22,18.4 23.9,27.3 16,22.8 8.1,27.3 10,18.4 3.2,12.2 12.2,11.2"
            fill="#ffe169"
            stroke="#4e2a1e"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className="absolute top-28 right-10 w-16 h-16 opacity-85 hidden sm:block animate-pixel-bounce"
          viewBox="0 0 32 32"
        >
          <circle cx="16" cy="17" r="10" fill="#fff9ef" stroke="#4e2a1e" strokeWidth="2.2" />
          <circle cx="16" cy="17" r="6" fill="#f58220" />
          <circle cx="16" cy="17" r="2.2" fill="#ffe169" />
        </svg>

        {/* Warm Wooden Café Counter Sill at Bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full h-28 opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1200 110"
        >
          <rect x="0" y="54" width="1200" height="56" fill="#8b5a3c" stroke="#4e2a1e" strokeWidth="4" />
          <rect x="0" y="42" width="1200" height="16" fill="#26b6b0" stroke="#4e2a1e" strokeWidth="3.5" />
          <rect x="0" y="62" width="1200" height="6" fill="#a8704d" opacity="0.7" />
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
        {/* Sprout Lands Rippled Aqua Water Sparks & Lily Pads */}
        <svg
          className="absolute top-10 left-8 w-20 h-14 opacity-70 hidden sm:block animate-cloud-drift"
          viewBox="0 0 32 22"
          shapeRendering="crispEdges"
        >
          <rect x="2" y="4" width="6" height="2" fill="#ffffff" opacity="0.7" />
          <rect x="14" y="9" width="8" height="2" fill="#ffffff" opacity="0.55" />
          <rect x="6" y="15" width="5" height="2" fill="#5ba89f" opacity="0.75" />
          {/* Cute pixel lily pad */}
          <rect x="20" y="12" width="8" height="6" fill="#63a844" />
          <rect x="24" y="12" width="2" height="2" fill="#8ad6cf" />
          <rect x="21" y="13" width="2" height="2" fill="#f9a8d4" />
        </svg>

        <svg
          className="absolute top-16 right-12 w-24 h-16 opacity-75 hidden md:block animate-cloud-drift-slow"
          viewBox="0 0 36 24"
          shapeRendering="crispEdges"
        >
          <rect x="4" y="5" width="8" height="2" fill="#ffffff" opacity="0.75" />
          <rect x="20" y="12" width="6" height="2" fill="#ffffff" opacity="0.6" />
          <rect x="10" y="17" width="8" height="2" fill="#5ba89f" opacity="0.65" />
        </svg>

        {/* Bottom Sprout Lands Pixel Meadow Island, Apple Tree, Bridge & Wooden Cabin */}
        <svg
          className="absolute bottom-0 left-0 w-full h-44 sm:h-52 opacity-95"
          preserveAspectRatio="none"
          viewBox="0 0 1200 200"
          shapeRendering="crispEdges"
        >
          {/* Aqua shoreline foam */}
          <rect x="0" y="124" width="1200" height="8" fill="#bfeae5" />
          {/* Soil cliff base */}
          <rect x="0" y="148" width="1200" height="52" fill="#a6744c" />
          <rect x="0" y="148" width="1200" height="5" fill="#7c5234" />
          {/* Sunny pastel grass plateau */}
          <rect x="0" y="114" width="1200" height="36" fill="#9bd25e" />
          <rect x="0" y="144" width="1200" height="6" fill="#75a94c" />
          {/* Pixel grass tufts & wildflowers */}
          <rect x="190" y="126" width="8" height="4" fill="#63a844" />
          <rect x="340" y="132" width="6" height="6" fill="#fde047" />
          <rect x="520" y="124" width="8" height="4" fill="#63a844" />
          <rect x="770" y="130" width="6" height="6" fill="#f472b6" />
          <rect x="920" y="126" width="8" height="4" fill="#63a844" />

          {/* Left Pixel Apple Tree */}
          <rect x="58" y="88" width="18" height="34" fill="#8e5c3e" />
          <rect x="36" y="42" width="62" height="50" fill="#75a94c" />
          <rect x="44" y="34" width="46" height="12" fill="#9bd25e" />
          <rect x="48" y="54" width="8" height="8" fill="#ef4444" />
          <rect x="74" y="62" width="8" height="8" fill="#ef4444" />
          <rect x="62" y="44" width="8" height="8" fill="#fb923c" />

          {/* Pixel Wooden Bridge / Dock on Left-Center */}
          <rect x="135" y="138" width="68" height="12" fill="#b87c4b" />
          <rect x="143" y="138" width="4" height="12" fill="#5c3822" />
          <rect x="159" y="138" width="4" height="12" fill="#5c3822" />
          <rect x="175" y="138" width="4" height="12" fill="#5c3822" />
          <rect x="191" y="138" width="4" height="12" fill="#5c3822" />

          {/* Cozy Pixel Farm Garden Plot & Sprouts */}
          <rect x="240" y="124" width="84" height="20" fill="#d9b186" />
          <rect x="252" y="118" width="6" height="8" fill="#3f7d28" />
          <rect x="276" y="116" width="8" height="10" fill="#63a844" />
          <rect x="302" y="118" width="6" height="8" fill="#3f7d28" />

          {/* Right Pixel Wooden House & Golden Chest */}
          <rect x="965" y="96" width="28" height="22" fill="#b87c4b" />
          <rect x="965" y="96" width="28" height="5" fill="#5c3822" />
          <rect x="976" y="104" width="6" height="6" fill="#f6c445" />
          <rect x="1032" y="54" width="110" height="72" fill="#d6a575" />
          <rect x="1024" y="42" width="126" height="20" fill="#a66838" />
          <rect x="1076" y="92" width="22" height="34" fill="#6b3e21" />
          <rect x="1044" y="76" width="18" height="18" fill="#bae6fd" />
          <rect x="1110" y="76" width="18" height="18" fill="#bae6fd" />
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
        {/* Mobile Legends: Bang Bang — Land of Dawn Horizon, Arcane Tower Beam & Lobby Ring */}
        <svg
          className="absolute inset-0 w-full h-full opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
        >
          {/* Radiant cyan Land of Dawn sky beam (Image 4 citadel spire) */}
          <polygon points="840,0 915,0 950,620 805,620" fill="#26b6ff" opacity="0.16" />
          <polygon points="866,0 890,0 902,620 854,620" fill="#7dd3fc" opacity="0.28" />
          {/* Distant Land of Dawn citadel spires */}
          <path
            d="M0 800 L0 640 L80 610 L140 650 L210 560 L270 630 L340 660 L1200 660 L1200 800 Z"
            fill="#0b1a36"
            opacity="0.7"
          />
          <path
            d="M780 660 L820 510 L850 510 L862 420 L895 420 L908 510 L938 510 L975 660 Z"
            fill="#10254a"
            stroke="#d4a94f"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          {/* Subtle glowing circular draft / rank lobby platform */}
          <ellipse
            cx="600"
            cy="770"
            rx="470"
            ry="95"
            fill="none"
            stroke="#d4a94f"
            strokeOpacity="0.35"
            strokeWidth="3"
          />
          <ellipse
            cx="600"
            cy="770"
            rx="340"
            ry="62"
            fill="none"
            stroke="#26b6ff"
            strokeOpacity="0.32"
            strokeWidth="2"
          />
          {/* Arcane diamond shards */}
          <polygon points="110,120 126,144 110,168 94,144" fill="#26b6ff" opacity="0.55" stroke="#d4a94f" strokeWidth="1.5" />
          <polygon points="1080,140 1094,160 1080,180 1066,160" fill="#f5c84c" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Phantom Persona Pop: Crimson-Black diagonal slash rays, halftone stars & skyline corner
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-95"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        {/* Dramatic diagonal black & crimson split inspired by Persona 5 Confidant menu */}
        <polygon points="0,0 560,0 320,800 0,800" fill="#09090f" />
        <polygon points="560,0 605,0 365,800 320,800" fill="#ffffff" />
        <polygon points="605,0 638,0 398,800 365,800" fill="#09090f" />
        {/* Sharp speed lightning shards */}
        <polygon points="940,0 1200,0 1200,260 850,120" fill="#09090f" />
        <polygon points="880,95 1170,220 960,265" fill="#ffffff" opacity="0.92" />
        <polygon points="905,112 1140,214 975,248" fill="#e60012" />
        {/* Bottom-right city skyline silhouettes */}
        <path
          d="M840 800 L840 720 L875 720 L875 680 L920 680 L920 735 L955 735 L955 640 L1015 640 L1015 705 L1055 705 L1055 615 L1125 615 L1125 690 L1160 690 L1160 655 L1200 655 L1200 800 Z"
          fill="#09090f"
        />
        {/* Bottom-left halftone & star burst accents */}
        <polygon points="0,610 210,800 0,800" fill="#e60012" />
        <polygon points="0,660 155,800 0,800" fill="#ffffff" opacity="0.16" />
        {/* Iconic 5-point Persona stars */}
        <polygon
          points="120,105 130,132 158,132 135,148 144,175 120,158 96,175 105,148 82,132 110,132"
          fill="#e60012"
          stroke="#ffffff"
          strokeWidth="3"
        />
        <polygon
          points="1085,430 1094,454 1120,454 1099,469 1107,493 1085,478 1063,493 1071,469 1050,454 1076,454"
          fill="#ffe600"
          stroke="#09090f"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
};

/**
 * Theme-specific mascot / emblem shown on Login Hero & Welcome cards.
 */
export const ThemeMascotIllustration: React.FC<{
  theme: PixelTheme;
  size?: number;
}> = ({ theme, size = 52 }) => {
  if (theme === 'daylight_rpg') {
    // Pokémon Café ReMix Latte Art Cup & Saucer Emblem
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 drop-shadow-[0_2px_0_rgba(78,42,30,0.35)]"
        aria-hidden="true"
      >
        {/* Saucer */}
        <ellipse cx="16" cy="25" rx="12" ry="3.5" fill="#ffffff" stroke="#4e2a1e" strokeWidth="1.8" />
        {/* Cup Handle */}
        <path d="M23 15 C27 15 27 21 22.5 21" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M23 15 C27 15 27 21 22.5 21" fill="none" stroke="#4e2a1e" strokeWidth="1.8" strokeLinecap="round" />
        {/* Berry-Pink & White Poké-Café Cup Body */}
        <path d="M7 13 H24 C23.5 21.5 20.5 24 15.5 24 C10.5 24 7.5 21.5 7 13 Z" fill="#ffffff" stroke="#4e2a1e" strokeWidth="1.8" />
        <path d="M7.3 13 H23.7 C23.6 15.8 23.2 17.3 22.8 17.8 H8.2 C7.8 17.3 7.4 15.8 7.3 13 Z" fill="#e03e6b" stroke="#4e2a1e" strokeWidth="1.5" />
        {/* Cute Cream Foam Latte Face */}
        <ellipse cx="15.5" cy="12.5" rx="8.5" ry="4" fill="#fff8eb" stroke="#4e2a1e" strokeWidth="1.6" />
        <ellipse cx="15.5" cy="12" rx="5.8" ry="2.6" fill="#d99b66" />
        <circle cx="13.5" cy="11.6" r="1" fill="#4e2a1e" />
        <circle cx="17.5" cy="11.6" r="1" fill="#4e2a1e" />
        <path d="M14.6 12.7 Q15.5 13.5 16.4 12.7" fill="none" stroke="#4e2a1e" strokeWidth="1" strokeLinecap="round" />
        {/* Golden Café Star Garnish */}
        <polygon
          points="24.5,4.5 25.5,6.8 28,7 26,8.6 26.6,11 24.5,9.7 22.4,11 23,8.6 21,7 23.5,6.8"
          fill="#ffe169"
          stroke="#4e2a1e"
          strokeWidth="1.1"
        />
      </svg>
    );
  }

  if (theme === 'nes_classic') {
    // Sprout Pixel Village Cute Farmer Cat Mascot & Leaf Sprout
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Pixel outline */}
        <rect x="5" y="4" width="3" height="3" fill="#5c3822" />
        <rect x="16" y="4" width="3" height="3" fill="#5c3822" />
        <rect x="4" y="7" width="16" height="12" fill="#5c3822" />
        <rect x="7" y="19" width="10" height="2" fill="#5c3822" />
        {/* Cream cat ears & head */}
        <rect x="6" y="5" width="2" height="3" fill="#fffdf6" />
        <rect x="16" y="5" width="2" height="3" fill="#fffdf6" />
        <rect x="6" y="6" width="1" height="2" fill="#c4b5fd" />
        <rect x="17" y="6" width="1" height="2" fill="#c4b5fd" />
        <rect x="5" y="8" width="14" height="10" fill="#fffdf6" />
        {/* Tiny green sprout on head */}
        <rect x="11" y="3" width="2" height="3" fill="#3f7d28" />
        <rect x="9" y="2" width="3" height="2" fill="#8ec252" />
        <rect x="13" y="2" width="2" height="2" fill="#63a844" />
        {/* Happy pixel eyes & cheeks */}
        <rect x="8" y="11" width="2" height="2" fill="#3b2214" />
        <rect x="14" y="11" width="2" height="2" fill="#3b2214" />
        <rect x="6" y="13" width="2" height="2" fill="#fda4af" />
        <rect x="16" y="13" width="2" height="2" fill="#fda4af" />
        <rect x="11" y="13" width="2" height="1" fill="#f59e0b" />
        {/* Cute bandana scarf */}
        <rect x="6" y="16" width="12" height="2" fill="#63a844" />
        <rect x="8" y="18" width="8" height="2" fill="#fbf6e3" />
      </svg>
    );
  }

  if (theme === 'cyber_retro') {
    // Mobile Legends Mythic / Legend Golden Rank Shield & Crossed Swords Crest
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 drop-shadow-[0_2px_0_rgba(7,16,34,0.65)]"
        aria-hidden="true"
      >
        {/* Crossed blades behind shield */}
        <path d="M6 6 L26 26 M26 6 L6 26" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
        {/* Silver-gold wing guards */}
        <path d="M5 10 C3 14 5 20 10 23 L16 28 L22 23 C27 20 29 14 27 10 L22 12 L16 8 L10 12 Z" fill="#132a52" stroke="#d4a94f" strokeWidth="1.8" />
        {/* Inner golden armored lion/rank plate */}
        <polygon points="16,9 23,13 21,22 16,26 11,22 9,13" fill="#f5c84c" stroke="#78350f" strokeWidth="1.4" />
        {/* Arcane cyan Mythic diamond core */}
        <polygon points="16,12 19.5,16.5 16,21 12.5,16.5" fill="#26b6ff" stroke="#ffffff" strokeWidth="1.2" />
        {/* Top crown star */}
        <polygon points="16,3 17.1,5.6 19.8,5.8 17.7,7.5 18.4,10.2 16,8.7 13.6,10.2 14.3,7.5 12.2,5.8 14.9,5.6" fill="#fde68a" stroke="#78350f" strokeWidth="0.9" />
      </svg>
    );
  }

  if (theme === 'gameboy_green') {
    // Phantom Persona Crimson & Ink Star Emblem
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        className="shrink-0"
        aria-hidden="true"
      >
        <polygon points="3,6 25,2 22,22 2,25" fill="#09090f" />
        <polygon points="5,4 26,5 20,24 4,21" fill="#e60012" stroke="#09090f" strokeWidth="1.5" />
        <polygon
          points="14,6.5 16.3,11.6 21.8,12.1 17.6,15.8 18.9,21.2 14,18.2 9.1,21.2 10.4,15.8 6.2,12.1 11.7,11.6"
          fill="#ffffff"
          stroke="#09090f"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="1.4" fill="#ffe600" />
      </svg>
    );
  }

  // Default sunny_quest: Paper Craft Super Hero Cap & Star Sticker
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="shrink-0 drop-shadow-[0_2px_0_rgba(46,29,20,0.65)]"
      aria-hidden="true"
    >
      {/* White paper die-cut sticker backing */}
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" stroke="#2e1d14" strokeWidth="2" />
      {/* Paper Red Hero Cap */}
      <path d="M6 17 C6 9 24 9 25 16 Z" fill="#e52521" stroke="#2e1d14" strokeWidth="1.6" />
      <path d="M5 17 H27 C27 20 22 21 15 21 C8 21 5 19.5 5 17 Z" fill="#b91c1c" stroke="#2e1d14" strokeWidth="1.6" />
      {/* White cap badge + golden star */}
      <circle cx="16" cy="13.5" r="4.2" fill="#ffffff" stroke="#2e1d14" strokeWidth="1.2" />
      <polygon
        points="16,10.5 16.9,12.5 19.1,12.7 17.4,14.1 17.9,16.2 16,15 14.1,16.2 14.6,14.1 12.9,12.7 15.1,12.5"
        fill="#ffd000"
        stroke="#2e1d14"
        strokeWidth="0.9"
      />
      {/* Sparkling paper shine */}
      <circle cx="11" cy="23.5" r="2" fill="#ffd000" stroke="#2e1d14" strokeWidth="1" />
      <circle cx="21" cy="23.5" r="2" fill="#4ade80" stroke="#2e1d14" strokeWidth="1" />
    </svg>
  );
};

/**
 * Theme-specific Empty State Illustration
 */
export const ThemeEmptyIllustration: React.FC<{
  theme: PixelTheme;
  size?: number;
}> = ({ theme, size = 76 }) => {
  if (theme === 'daylight_rpg') {
    // Pokémon Café ReMix Covered Serving Cloche & Star Dish
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="drop-shadow-[0_2px_0_rgba(78,42,30,0.3)]"
        aria-hidden="true"
      >
        <circle cx="16" cy="7.5" r="2.5" fill="#ffe169" stroke="#4e2a1e" strokeWidth="1.6" />
        <path
          d="M6 21 C6 13 10.5 9.5 16 9.5 C21.5 9.5 26 13 26 21 Z"
          fill="#26b6b0"
          stroke="#4e2a1e"
          strokeWidth="1.8"
        />
        <path d="M10.5 15 C12 12.5 14 12 16 12" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="4" y="21" width="24" height="4" rx="2" fill="#fff9ef" stroke="#4e2a1e" strokeWidth="1.8" />
        <polygon
          points="16,13.5 17,15.7 19.3,16 17.6,17.5 18,19.8 16,18.6 14,19.8 14.4,17.5 12.7,16 15,15.7"
          fill="#ffe169"
          stroke="#4e2a1e"
          strokeWidth="1.1"
        />
      </svg>
    );
  }

  if (theme === 'nes_classic') {
    // Sprout Pixel Village Treasure Chest on Grass Tile
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {/* Meadow grass patch */}
        <rect x="2" y="18" width="20" height="4" fill="#8ec252" />
        <rect x="3" y="20" width="18" height="2" fill="#63a844" />
        {/* Wooden pixel chest */}
        <rect x="4" y="7" width="16" height="12" fill="#5c3822" />
        <rect x="5" y="8" width="14" height="4" fill="#c88d59" />
        <rect x="5" y="13" width="14" height="5" fill="#b07443" />
        <rect x="5" y="12" width="14" height="1" fill="#5c3822" />
        {/* Gold lock clasp */}
        <rect x="10" y="10" width="4" height="4" fill="#f6c445" />
        <rect x="11" y="11" width="2" height="2" fill="#fff8df" />
        {/* Tiny sprout on corner */}
        <rect x="18" y="4" width="2" height="3" fill="#3f7d28" />
        <rect x="16" y="3" width="2" height="2" fill="#9bd25e" />
        <rect x="20" y="3" width="2" height="2" fill="#63a844" />
      </svg>
    );
  }

  if (theme === 'cyber_retro') {
    // Mobile Legends Peti Medali (Armored Gold & Sapphire Medal Chest)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="drop-shadow-[0_2px_0_rgba(12,24,48,0.35)]"
        aria-hidden="true"
      >
        {/* Chest base */}
        <rect x="5" y="12" width="22" height="14" rx="2.5" fill="#163466" stroke="#d4a94f" strokeWidth="2" />
        {/* Chest dome lid */}
        <path d="M5 13 C5 8 10 6 16 6 C22 6 27 8 27 13 Z" fill="#d4a94f" stroke="#78350f" strokeWidth="1.8" />
        <line x1="5" y1="14" x2="27" y2="14" stroke="#f5c84c" strokeWidth="2" />
        {/* Glowing cyan diamond lock */}
        <polygon points="16,11 19.5,15.5 16,20 12.5,15.5" fill="#26b6ff" stroke="#ffffff" strokeWidth="1.4" />
        <circle cx="9.5" cy="19.5" r="1.3" fill="#f5c84c" />
        <circle cx="22.5" cy="19.5" r="1.3" fill="#f5c84c" />
      </svg>
    );
  }

  if (theme === 'gameboy_green') {
    // Persona Jagged Comic Exclamation Box
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <polygon points="4,9 29,5 26,24 9,23 5,28 6,21" fill="#e60012" />
        <polygon
          points="2,7 27,3 24,21 8,20 4,25 5,19"
          fill="#ffffff"
          stroke="#09090f"
          strokeWidth="2.2"
          strokeLinejoin="miter"
        />
        <polygon points="13.5,6.5 17.5,6 16.5,14.5 14,14.5" fill="#09090f" />
        <rect x="13.8" y="15.8" width="3" height="2.8" fill="#e60012" />
      </svg>
    );
  }

  // sunny_quest: Paper Craft Golden "?" Question Block Sticker
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="drop-shadow-[0_3px_0_rgba(46,29,20,0.4)]"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#ffffff" stroke="#2e1d14" strokeWidth="2" />
      <rect x="4.5" y="4.5" width="23" height="23" rx="4" fill="#ffd000" stroke="#2e1d14" strokeWidth="1.8" />
      <circle cx="7.5" cy="7.5" r="1.1" fill="#2e1d14" />
      <circle cx="24.5" cy="7.5" r="1.1" fill="#2e1d14" />
      <circle cx="7.5" cy="24.5" r="1.1" fill="#2e1d14" />
      <circle cx="24.5" cy="24.5" r="1.1" fill="#2e1d14" />
      <path
        d="M12.5 12 C12.5 9.5 19.5 9.5 19.5 12.5 C19.5 14.5 16 15 16 17.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 12 C12.5 9.5 19.5 9.5 19.5 12.5 C19.5 14.5 16 15 16 17.5"
        fill="none"
        stroke="#2e1d14"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="21.5" r="1.8" fill="#ffffff" stroke="#2e1d14" strokeWidth="1.3" />
    </svg>
  );
};
