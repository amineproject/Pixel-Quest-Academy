import React from 'react';
import { PixelTheme } from '../types/lms';

/**
 * Full-viewport ambient 16-bit pixel-art atmospheric backdrop tailored to each game world.
 * All graphics use stepped `crispEdges` pixel geometry so every theme retains authentic 16-bit craft.
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
        {/* 16-Bit Super Mario Paper Pixel Clouds */}
        <svg
          className="absolute top-12 left-16 w-40 h-16 opacity-90 hidden md:block animate-cloud-drift pixelated-sprite"
          viewBox="0 0 32 14"
          shapeRendering="crispEdges"
        >
          <rect x="8" y="2" width="12" height="2" fill="#2e1d14" />
          <rect x="5" y="4" width="19" height="2" fill="#2e1d14" />
          <rect x="3" y="6" width="25" height="5" fill="#2e1d14" />
          <rect x="5" y="11" width="21" height="1" fill="#2e1d14" />
          <rect x="8" y="3" width="12" height="2" fill="#ffffff" />
          <rect x="5" y="5" width="19" height="4" fill="#ffffff" />
          <rect x="4" y="7" width="23" height="3" fill="#ffffff" />
          <rect x="6" y="9" width="19" height="1" fill="#dbeafe" />
          {/* Cute pixel eyes on cloud like Super Mario */}
          <rect x="11" y="6" width="1" height="2" fill="#2e1d14" />
          <rect x="16" y="6" width="1" height="2" fill="#2e1d14" />
        </svg>

        <svg
          className="absolute top-20 right-24 w-32 h-14 opacity-85 hidden lg:block animate-cloud-drift-slow pixelated-sprite"
          viewBox="0 0 32 14"
          shapeRendering="crispEdges"
        >
          <rect x="8" y="2" width="12" height="2" fill="#2e1d14" />
          <rect x="5" y="4" width="19" height="7" fill="#2e1d14" />
          <rect x="8" y="3" width="12" height="2" fill="#ffffff" />
          <rect x="6" y="5" width="17" height="5" fill="#ffffff" />
          <rect x="7" y="9" width="15" height="1" fill="#dbeafe" />
        </svg>

        {/* Bottom 16-Bit Mario Stage Diorama: Stepped Pixel Hills, Bush Trees & Wooden Stage Apron */}
        <svg
          className="absolute bottom-0 left-0 w-full h-44 sm:h-52 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 240 48"
          shapeRendering="crispEdges"
        >
          {/* Stepped Pixel Background Hills */}
          <rect x="8" y="22" width="44" height="18" fill="#1b4332" />
          <rect x="14" y="18" width="32" height="20" fill="#1b4332" />
          <rect x="20" y="14" width="20" height="24" fill="#1b4332" />
          <rect x="10" y="23" width="40" height="16" fill="#2e7d32" />
          <rect x="16" y="19" width="28" height="18" fill="#2e7d32" />
          <rect x="22" y="15" width="16" height="22" fill="#43a047" />

          <rect x="174" y="20" width="52" height="20" fill="#1b4332" />
          <rect x="182" y="15" width="36" height="24" fill="#1b4332" />
          <rect x="176" y="21" width="48" height="18" fill="#2e7d32" />
          <rect x="184" y="16" width="32" height="22" fill="#43a047" />

          {/* Bright Front Meadow */}
          <rect x="0" y="30" width="240" height="10" fill="#1b4332" />
          <rect x="0" y="31" width="240" height="9" fill="#4caf50" />
          <rect x="0" y="31" width="240" height="2" fill="#81c784" />

          {/* Pixel Mario Foliage Trees */}
          <rect x="18" y="22" width="4" height="10" fill="#6d3b1a" />
          <rect x="13" y="12" width="14" height="11" fill="#1b4332" />
          <rect x="14" y="13" width="12" height="9" fill="#66bb6a" />
          <rect x="16" y="13" width="8" height="3" fill="#a5d6a7" />

          <rect x="216" y="20" width="4" height="12" fill="#6d3b1a" />
          <rect x="211" y="10" width="14" height="11" fill="#1b4332" />
          <rect x="212" y="11" width="12" height="9" fill="#66bb6a" />
          <rect x="214" y="11" width="8" height="3" fill="#a5d6a7" />

          {/* Checkered 16-Bit Wooden Theater Stage Apron */}
          <rect x="0" y="38" width="240" height="10" fill="#2e1d14" />
          <rect x="0" y="39" width="240" height="2" fill="#facc15" />
          <rect x="0" y="41" width="240" height="7" fill="#b97a3c" />
          <rect x="0" y="44" width="240" height="4" fill="#9c612b" />
        </svg>

        {/* Left & Right 16-Bit Pixel Red Velvet Stage Curtains */}
        <svg
          className="hidden sm:block absolute inset-y-0 left-0 w-16 md:w-20 h-full opacity-95 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 16 120"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="0" width="14" height="40" fill="#450a0a" />
          <rect x="0" y="40" width="12" height="40" fill="#450a0a" />
          <rect x="0" y="80" width="10" height="40" fill="#450a0a" />
          <rect x="0" y="0" width="12" height="40" fill="#991b1b" />
          <rect x="0" y="40" width="10" height="40" fill="#991b1b" />
          <rect x="0" y="80" width="8" height="40" fill="#991b1b" />
          <rect x="2" y="0" width="3" height="120" fill="#dc2626" opacity="0.65" />
          <rect x="6" y="0" width="2" height="120" fill="#7f1d1d" opacity="0.7" />
        </svg>
        <svg
          className="hidden sm:block absolute inset-y-0 right-0 w-16 md:w-20 h-full opacity-95 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 16 120"
          shapeRendering="crispEdges"
        >
          <rect x="2" y="0" width="14" height="40" fill="#450a0a" />
          <rect x="4" y="40" width="12" height="40" fill="#450a0a" />
          <rect x="6" y="80" width="10" height="40" fill="#450a0a" />
          <rect x="4" y="0" width="12" height="40" fill="#991b1b" />
          <rect x="6" y="40" width="10" height="40" fill="#991b1b" />
          <rect x="8" y="80" width="8" height="40" fill="#991b1b" />
          <rect x="11" y="0" width="3" height="120" fill="#dc2626" opacity="0.65" />
          <rect x="8" y="0" width="2" height="120" fill="#7f1d1d" opacity="0.7" />
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
        {/* 16-Bit Pokémon Café ReMix Pixel Bunting Pennants */}
        <svg
          className="absolute top-0 left-0 w-full h-16 opacity-90 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 240 20"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="2" width="240" height="1" fill="#4e2a1e" />
          {/* Left Pennants */}
          <rect x="8" y="3" width="10" height="3" fill="#4e2a1e" />
          <rect x="9" y="3" width="8" height="2" fill="#e03e48" />
          <rect x="11" y="5" width="4" height="3" fill="#e03e48" />
          <rect x="12" y="8" width="2" height="1" fill="#4e2a1e" />

          <rect x="24" y="3" width="10" height="3" fill="#4e2a1e" />
          <rect x="25" y="3" width="8" height="2" fill="#26b6b0" />
          <rect x="27" y="5" width="4" height="3" fill="#26b6b0" />
          <rect x="28" y="8" width="2" height="1" fill="#4e2a1e" />

          <rect x="40" y="3" width="10" height="3" fill="#4e2a1e" />
          <rect x="41" y="3" width="8" height="2" fill="#ffe169" />
          <rect x="43" y="5" width="4" height="3" fill="#ffe169" />
          <rect x="44" y="8" width="2" height="1" fill="#4e2a1e" />

          {/* Right Pennants */}
          <rect x="190" y="3" width="10" height="3" fill="#4e2a1e" />
          <rect x="191" y="3" width="8" height="2" fill="#ffe169" />
          <rect x="193" y="5" width="4" height="3" fill="#ffe169" />
          <rect x="194" y="8" width="2" height="1" fill="#4e2a1e" />

          <rect x="206" y="3" width="10" height="3" fill="#4e2a1e" />
          <rect x="207" y="3" width="8" height="2" fill="#26b6b0" />
          <rect x="209" y="5" width="4" height="3" fill="#26b6b0" />
          <rect x="210" y="8" width="2" height="1" fill="#4e2a1e" />

          <rect x="222" y="3" width="10" height="3" fill="#4e2a1e" />
          <rect x="223" y="3" width="8" height="2" fill="#f58220" />
          <rect x="225" y="5" width="4" height="3" fill="#f58220" />
          <rect x="226" y="8" width="2" height="1" fill="#4e2a1e" />
        </svg>

        {/* Floating 16-Bit Pixel Golden Café Star & Berry Tart Sticker */}
        <svg
          className="absolute top-24 left-8 w-14 h-14 opacity-90 hidden sm:block animate-pixel-float pixelated-sprite"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
        >
          <rect x="7" y="1" width="2" height="3" fill="#4e2a1e" />
          <rect x="5" y="4" width="6" height="2" fill="#4e2a1e" />
          <rect x="2" y="6" width="12" height="3" fill="#4e2a1e" />
          <rect x="4" y="9" width="8" height="3" fill="#4e2a1e" />
          <rect x="3" y="12" width="3" height="2" fill="#4e2a1e" />
          <rect x="10" y="12" width="3" height="2" fill="#4e2a1e" />
          <rect x="7" y="2" width="2" height="2" fill="#ffe169" />
          <rect x="6" y="4" width="4" height="2" fill="#ffe169" />
          <rect x="3" y="6" width="10" height="2" fill="#ffe169" />
          <rect x="5" y="8" width="6" height="3" fill="#f59e0b" />
          <rect x="4" y="11" width="2" height="2" fill="#f59e0b" />
          <rect x="10" y="11" width="2" height="2" fill="#f59e0b" />
          <rect x="7" y="5" width="2" height="2" fill="#ffffff" />
        </svg>

        <svg
          className="absolute top-28 right-10 w-14 h-14 opacity-90 hidden sm:block animate-pixel-bounce pixelated-sprite"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
        >
          {/* 16-Bit Berry Macaron / Tart */}
          <rect x="4" y="3" width="8" height="10" fill="#4e2a1e" />
          <rect x="3" y="5" width="10" height="6" fill="#4e2a1e" />
          <rect x="5" y="4" width="6" height="2" fill="#f58220" />
          <rect x="4" y="6" width="8" height="2" fill="#fff9ef" />
          <rect x="4" y="8" width="8" height="2" fill="#ffe169" />
          <rect x="5" y="10" width="6" height="2" fill="#f58220" />
          <rect x="7" y="3" width="2" height="2" fill="#e03e6b" />
        </svg>

        {/* Bottom 16-Bit Pixel Turquoise Tile & Wooden Café Counter */}
        <svg
          className="absolute bottom-0 left-0 w-full h-24 opacity-90 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 240 24"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="6" width="240" height="1" fill="#4e2a1e" />
          <rect x="0" y="7" width="240" height="5" fill="#26b6b0" />
          <rect x="0" y="7" width="240" height="1" fill="#7ce3de" />
          <rect x="0" y="12" width="240" height="1" fill="#4e2a1e" />
          <rect x="0" y="13" width="240" height="11" fill="#8b5a3c" />
          <rect x="0" y="14" width="240" height="2" fill="#a8704d" />
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
          className="absolute top-10 left-8 w-20 h-14 opacity-75 hidden sm:block animate-cloud-drift pixelated-sprite"
          viewBox="0 0 32 22"
          shapeRendering="crispEdges"
        >
          <rect x="2" y="4" width="6" height="2" fill="#ffffff" opacity="0.7" />
          <rect x="14" y="9" width="8" height="2" fill="#ffffff" opacity="0.55" />
          <rect x="6" y="15" width="5" height="2" fill="#5ba89f" opacity="0.75" />
          <rect x="20" y="12" width="8" height="6" fill="#63a844" />
          <rect x="24" y="12" width="2" height="2" fill="#8ad6cf" />
          <rect x="21" y="13" width="2" height="2" fill="#f9a8d4" />
        </svg>

        <svg
          className="absolute top-16 right-12 w-24 h-16 opacity-75 hidden md:block animate-cloud-drift-slow pixelated-sprite"
          viewBox="0 0 36 24"
          shapeRendering="crispEdges"
        >
          <rect x="4" y="5" width="8" height="2" fill="#ffffff" opacity="0.75" />
          <rect x="20" y="12" width="6" height="2" fill="#ffffff" opacity="0.6" />
          <rect x="10" y="17" width="8" height="2" fill="#5ba89f" opacity="0.65" />
        </svg>

        {/* Bottom Sprout Lands Pixel Meadow Island, Apple Tree, Bridge & Wooden Cabin */}
        <svg
          className="absolute bottom-0 left-0 w-full h-44 sm:h-52 opacity-95 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 1200 200"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="124" width="1200" height="8" fill="#bfeae5" />
          <rect x="0" y="148" width="1200" height="52" fill="#a6744c" />
          <rect x="0" y="148" width="1200" height="5" fill="#7c5234" />
          <rect x="0" y="114" width="1200" height="36" fill="#9bd25e" />
          <rect x="0" y="144" width="1200" height="6" fill="#75a94c" />
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

          {/* Pixel Wooden Bridge / Dock */}
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
        {/* 16-Bit Mobile Legends: Bang Bang — Pixel Land of Dawn Horizon, Arcane Tower Beam & Lobby Ring */}
        <svg
          className="absolute inset-0 w-full h-full opacity-90 pixelated-sprite"
          preserveAspectRatio="none"
          viewBox="0 0 240 160"
          shapeRendering="crispEdges"
        >
          {/* 16-Bit Stepped Cyan Tower Energy Beam */}
          <rect x="172" y="0" width="12" height="118" fill="#26b6ff" opacity="0.16" />
          <rect x="175" y="0" width="6" height="118" fill="#7dd3fc" opacity="0.28" />
          <rect x="177" y="0" width="2" height="118" fill="#ffffff" opacity="0.24" />

          {/* Distant Stepped Land of Dawn Pixel Mountains & Ruins */}
          <rect x="0" y="128" width="240" height="32" fill="#0b1a36" opacity="0.78" />
          <rect x="0" y="118" width="28" height="12" fill="#0b1a36" opacity="0.78" />
          <rect x="34" y="108" width="18" height="22" fill="#0b1a36" opacity="0.78" />
          <rect x="38" y="102" width="10" height="8" fill="#10254a" />
          <rect x="166" y="94" width="24" height="36" fill="#10254a" />
          <rect x="170" y="82" width="16" height="14" fill="#163466" />
          <rect x="174" y="74" width="8" height="10" fill="#d4a94f" opacity="0.55" />

          {/* Stepped Pixel Gold Lobby Platform Rim */}
          <rect x="44" y="146" width="152" height="3" fill="#d4a94f" opacity="0.38" />
          <rect x="64" y="152" width="112" height="2" fill="#26b6ff" opacity="0.35" />

          {/* Floating Pixel Arcane Diamond Shards */}
          <rect x="20" y="24" width="4" height="4" fill="#26b6ff" opacity="0.6" />
          <rect x="21" y="22" width="2" height="8" fill="#7dd3fc" opacity="0.7" />
          <rect x="214" y="28" width="4" height="4" fill="#f5c84c" opacity="0.65" />
          <rect x="215" y="26" width="2" height="8" fill="#fef08a" opacity="0.7" />
        </svg>
      </div>
    );
  }

  // Phantom Persona Pop: 16-Bit Stepped Crimson-Black Slash Rays, Pixel Tokyo Skyline & Stars
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-95 pixelated-sprite"
        preserveAspectRatio="none"
        viewBox="0 0 240 160"
        shapeRendering="crispEdges"
      >
        {/* 16-Bit Stepped Diagonal Ink-Black & Crimson Split */}
        <rect x="0" y="0" width="108" height="32" fill="#09090f" />
        <rect x="0" y="32" width="96" height="32" fill="#09090f" />
        <rect x="0" y="64" width="84" height="32" fill="#09090f" />
        <rect x="0" y="96" width="72" height="32" fill="#09090f" />
        <rect x="0" y="128" width="60" height="32" fill="#09090f" />

        {/* Stepped White Lightning Seam */}
        <rect x="108" y="0" width="8" height="32" fill="#ffffff" />
        <rect x="96" y="32" width="8" height="32" fill="#ffffff" />
        <rect x="84" y="64" width="8" height="32" fill="#ffffff" />
        <rect x="72" y="96" width="8" height="32" fill="#ffffff" />
        <rect x="60" y="128" width="8" height="32" fill="#ffffff" />

        {/* Top-Right Pixel Speed Flash */}
        <rect x="184" y="0" width="56" height="28" fill="#09090f" />
        <rect x="172" y="18" width="68" height="10" fill="#ffffff" />
        <rect x="180" y="22" width="54" height="8" fill="#e60012" />

        {/* Bottom-Right 16-Bit Pixel Tokyo City Skyline */}
        <rect x="168" y="144" width="10" height="16" fill="#09090f" />
        <rect x="178" y="136" width="12" height="24" fill="#09090f" />
        <rect x="190" y="142" width="8" height="18" fill="#09090f" />
        <rect x="198" y="126" width="14" height="34" fill="#09090f" />
        <rect x="212" y="134" width="10" height="26" fill="#09090f" />
        <rect x="222" y="120" width="18" height="40" fill="#09090f" />
        <rect x="202" y="132" width="2" height="2" fill="#ffe600" />
        <rect x="226" y="126" width="2" height="2" fill="#ffe600" />
        <rect x="232" y="134" width="2" height="2" fill="#ffffff" />

        {/* 16-Bit Pixel Persona Stars */}
        <rect x="22" y="18" width="2" height="10" fill="#ffffff" />
        <rect x="18" y="22" width="10" height="2" fill="#ffffff" />
        <rect x="20" y="20" width="6" height="6" fill="#e60012" />
        <rect x="22" y="22" width="2" height="2" fill="#ffe600" />

        <rect x="214" y="88" width="2" height="8" fill="#09090f" />
        <rect x="211" y="91" width="8" height="2" fill="#09090f" />
        <rect x="213" y="90" width="4" height="4" fill="#ffe600" />
      </svg>
    </div>
  );
};

/**
 * Theme-specific 16-bit pixel-art mascot / emblem shown on Login Hero & Welcome cards.
 */
export const ThemeMascotIllustration: React.FC<{
  theme: PixelTheme;
  size?: number;
}> = ({ theme, size = 52 }) => {
  if (theme === 'daylight_rpg') {
    // 16-Bit Pokémon Café ReMix Berry-Pink Latte Art Cup & Saucer
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0 pixelated-sprite"
        aria-hidden="true"
      >
        {/* Dark Brown Pixel Outline */}
        <rect x="4" y="19" width="16" height="3" fill="#4e2a1e" />
        <rect x="5" y="9" width="14" height="10" fill="#4e2a1e" />
        <rect x="18" y="11" width="4" height="5" fill="#4e2a1e" />
        {/* White Saucer */}
        <rect x="5" y="19" width="14" height="2" fill="#ffffff" />
        <rect x="7" y="20" width="10" height="1" fill="#e6c9ad" />
        {/* Cup Handle */}
        <rect x="18" y="12" width="3" height="3" fill="#ffffff" />
        <rect x="18" y="13" width="2" height="1" fill="#4e2a1e" />
        {/* Cup Body (Berry Pink Band + Cream Base) */}
        <rect x="6" y="10" width="12" height="4" fill="#e03e6b" />
        <rect x="6" y="14" width="12" height="4" fill="#ffffff" />
        <rect x="7" y="18" width="10" height="1" fill="#f6eadc" />
        {/* Latte Foam & Smiling Face */}
        <rect x="6" y="8" width="12" height="3" fill="#fff8eb" />
        <rect x="8" y="8" width="8" height="2" fill="#d99b66" />
        <rect x="9" y="8" width="1" height="1" fill="#4e2a1e" />
        <rect x="14" y="8" width="1" height="1" fill="#4e2a1e" />
        <rect x="11" y="9" width="2" height="1" fill="#4e2a1e" />
        {/* Golden 16-bit Star Garnish */}
        <rect x="18" y="3" width="2" height="4" fill="#4e2a1e" />
        <rect x="17" y="4" width="4" height="2" fill="#4e2a1e" />
        <rect x="18" y="4" width="2" height="2" fill="#ffe169" />
      </svg>
    );
  }

  if (theme === 'nes_classic') {
    // 16-Bit Sprout Pixel Village Cute Farmer Cat Mascot & Leaf Sprout
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0 pixelated-sprite"
        aria-hidden="true"
      >
        <rect x="5" y="4" width="3" height="3" fill="#5c3822" />
        <rect x="16" y="4" width="3" height="3" fill="#5c3822" />
        <rect x="4" y="7" width="16" height="12" fill="#5c3822" />
        <rect x="7" y="19" width="10" height="2" fill="#5c3822" />
        <rect x="6" y="5" width="2" height="3" fill="#fffdf6" />
        <rect x="16" y="5" width="2" height="3" fill="#fffdf6" />
        <rect x="6" y="6" width="1" height="2" fill="#c4b5fd" />
        <rect x="17" y="6" width="1" height="2" fill="#c4b5fd" />
        <rect x="5" y="8" width="14" height="10" fill="#fffdf6" />
        <rect x="11" y="3" width="2" height="3" fill="#3f7d28" />
        <rect x="9" y="2" width="3" height="2" fill="#8ec252" />
        <rect x="13" y="2" width="2" height="2" fill="#63a844" />
        <rect x="8" y="11" width="2" height="2" fill="#3b2214" />
        <rect x="14" y="11" width="2" height="2" fill="#3b2214" />
        <rect x="6" y="13" width="2" height="2" fill="#fda4af" />
        <rect x="16" y="13" width="2" height="2" fill="#fda4af" />
        <rect x="11" y="13" width="2" height="1" fill="#f59e0b" />
        <rect x="6" y="16" width="12" height="2" fill="#63a844" />
        <rect x="8" y="18" width="8" height="2" fill="#fbf6e3" />
      </svg>
    );
  }

  if (theme === 'cyber_retro') {
    // 16-Bit Mobile Legends Golden Mythic Rank Crest & Crossed Swords
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0 pixelated-sprite"
        aria-hidden="true"
      >
        {/* Crossed Silver Blades */}
        <rect x="3" y="3" width="2" height="2" fill="#e2e8f0" />
        <rect x="5" y="5" width="2" height="2" fill="#cbd5e1" />
        <rect x="19" y="3" width="2" height="2" fill="#e2e8f0" />
        <rect x="17" y="5" width="2" height="2" fill="#cbd5e1" />
        <rect x="3" y="19" width="2" height="2" fill="#d4a94f" />
        <rect x="19" y="19" width="2" height="2" fill="#d4a94f" />

        {/* Sapphire & Gold Armor Wing Outline */}
        <rect x="5" y="6" width="14" height="11" fill="#071022" />
        <rect x="7" y="17" width="10" height="3" fill="#071022" />
        <rect x="10" y="20" width="4" height="2" fill="#071022" />

        {/* Wing Armor Plate */}
        <rect x="4" y="7" width="3" height="7" fill="#d4a94f" />
        <rect x="17" y="7" width="3" height="7" fill="#d4a94f" />
        <rect x="6" y="7" width="12" height="9" fill="#132a52" />
        <rect x="7" y="8" width="10" height="8" fill="#f5c84c" />
        <rect x="8" y="16" width="8" height="3" fill="#d4a94f" />
        <rect x="10" y="19" width="4" height="2" fill="#b45309" />

        {/* Glowing Cyan Mythic Diamond Core */}
        <rect x="11" y="9" width="2" height="7" fill="#ffffff" />
        <rect x="9" y="11" width="6" height="3" fill="#ffffff" />
        <rect x="10" y="10" width="4" height="5" fill="#26b6ff" />
        <rect x="11" y="11" width="2" height="2" fill="#bae6fd" />

        {/* Crown Top Gold Star */}
        <rect x="11" y="2" width="2" height="4" fill="#fde68a" />
        <rect x="9" y="3" width="6" height="2" fill="#f5c84c" />
      </svg>
    );
  }

  if (theme === 'gameboy_green') {
    // 16-Bit Phantom Persona Tilted Crimson & Ink Star Crest
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="shrink-0 pixelated-sprite"
        aria-hidden="true"
      >
        {/* Black Stepped Shadow Backdrop */}
        <rect x="4" y="5" width="16" height="15" fill="#09090f" />
        <rect x="2" y="7" width="19" height="11" fill="#09090f" />
        {/* Stepped Crimson Card */}
        <rect x="4" y="4" width="15" height="14" fill="#e60012" />
        <rect x="6" y="3" width="12" height="16" fill="#e60012" />
        <rect x="4" y="4" width="15" height="2" fill="#ff3b4d" />
        {/* Crisp 16-Bit White Persona Star */}
        <rect x="11" y="5" width="2" height="12" fill="#09090f" />
        <rect x="6" y="9" width="12" height="3" fill="#09090f" />
        <rect x="11" y="6" width="2" height="10" fill="#ffffff" />
        <rect x="7" y="9" width="10" height="2" fill="#ffffff" />
        <rect x="9" y="8" width="6" height="5" fill="#ffffff" />
        <rect x="8" y="14" width="2" height="2" fill="#ffffff" />
        <rect x="14" y="14" width="2" height="2" fill="#ffffff" />
        {/* Bright Yellow Center Spark */}
        <rect x="11" y="10" width="2" height="2" fill="#ffe600" />
      </svg>
    );
  }

  // Default sunny_quest: 16-Bit Super Mario Paper Hero Cap & Star Coin
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className="shrink-0 pixelated-sprite"
      aria-hidden="true"
    >
      {/* Crisp Ink Outline */}
      <rect x="5" y="4" width="14" height="14" fill="#2e1d14" />
      <rect x="3" y="8" width="18" height="8" fill="#2e1d14" />
      {/* Red Cap Crown */}
      <rect x="6" y="5" width="12" height="9" fill="#e52521" />
      <rect x="4" y="9" width="15" height="4" fill="#e52521" />
      <rect x="7" y="6" width="8" height="2" fill="#ff6b6b" />
      {/* Cap Visor Brim */}
      <rect x="4" y="13" width="16" height="3" fill="#991b1b" />
      <rect x="5" y="13" width="14" height="1" fill="#dc2626" />
      {/* White Emblem Circle + Gold Star */}
      <rect x="9" y="7" width="6" height="5" fill="#ffffff" />
      <rect x="11" y="8" width="2" height="3" fill="#ffd000" />
      <rect x="10" y="9" width="4" height="1" fill="#ffd000" />
      {/* Spark Coins Underneath */}
      <rect x="7" y="19" width="3" height="3" fill="#2e1d14" />
      <rect x="8" y="20" width="1" height="1" fill="#ffd000" />
      <rect x="14" y="19" width="3" height="3" fill="#2e1d14" />
      <rect x="15" y="20" width="1" height="1" fill="#4ade80" />
    </svg>
  );
};

/**
 * Theme-specific 16-bit pixel-art Empty State Illustration
 */
export const ThemeEmptyIllustration: React.FC<{
  theme: PixelTheme;
  size?: number;
}> = ({ theme, size = 76 }) => {
  if (theme === 'daylight_rpg') {
    // 16-Bit Pokémon Café ReMix Covered Turquoise Serving Cloche
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="pixelated-sprite"
        aria-hidden="true"
      >
        {/* Knob Handle */}
        <rect x="10" y="3" width="4" height="3" fill="#4e2a1e" />
        <rect x="11" y="4" width="2" height="2" fill="#ffe169" />
        {/* Cloche Dome Outline */}
        <rect x="6" y="6" width="12" height="10" fill="#4e2a1e" />
        <rect x="4" y="9" width="16" height="7" fill="#4e2a1e" />
        {/* Turquoise Dome Fill & Shine */}
        <rect x="7" y="7" width="10" height="8" fill="#26b6b0" />
        <rect x="5" y="10" width="14" height="5" fill="#26b6b0" />
        <rect x="7" y="8" width="4" height="2" fill="#99f6e4" />
        {/* Golden Center Star Badge */}
        <rect x="11" y="10" width="2" height="4" fill="#ffe169" />
        <rect x="10" y="11" width="4" height="2" fill="#ffe169" />
        {/* Cream Tray Plate */}
        <rect x="2" y="16" width="20" height="4" fill="#4e2a1e" />
        <rect x="3" y="17" width="18" height="2" fill="#fff9ef" />
        <rect x="5" y="18" width="14" height="1" fill="#e6c9ad" />
      </svg>
    );
  }

  if (theme === 'nes_classic') {
    // 16-Bit Sprout Pixel Village Treasure Chest on Grass Tile
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="pixelated-sprite"
        aria-hidden="true"
      >
        <rect x="2" y="18" width="20" height="4" fill="#8ec252" />
        <rect x="3" y="20" width="18" height="2" fill="#63a844" />
        <rect x="4" y="7" width="16" height="12" fill="#5c3822" />
        <rect x="5" y="8" width="14" height="4" fill="#c88d59" />
        <rect x="5" y="13" width="14" height="5" fill="#b07443" />
        <rect x="5" y="12" width="14" height="1" fill="#5c3822" />
        <rect x="10" y="10" width="4" height="4" fill="#f6c445" />
        <rect x="11" y="11" width="2" height="2" fill="#fff8df" />
        <rect x="18" y="4" width="2" height="3" fill="#3f7d28" />
        <rect x="16" y="3" width="2" height="2" fill="#9bd25e" />
        <rect x="20" y="3" width="2" height="2" fill="#63a844" />
      </svg>
    );
  }

  if (theme === 'cyber_retro') {
    // 16-Bit Mobile Legends Peti Medali (Armored Gold & Sapphire Chest)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="pixelated-sprite"
        aria-hidden="true"
      >
        {/* Outer Navy Ink Border */}
        <rect x="3" y="6" width="18" height="14" fill="#071022" />
        <rect x="5" y="4" width="14" height="2" fill="#071022" />
        {/* Golden Domed Lid */}
        <rect x="5" y="5" width="14" height="5" fill="#d4a94f" />
        <rect x="6" y="6" width="12" height="2" fill="#fde68a" />
        {/* Sapphire Base */}
        <rect x="4" y="10" width="16" height="9" fill="#163466" />
        <rect x="4" y="10" width="16" height="2" fill="#f5c84c" />
        <rect x="4" y="10" width="2" height="9" fill="#d4a94f" />
        <rect x="18" y="10" width="2" height="9" fill="#d4a94f" />
        {/* Glowing Cyan Arcane Diamond Lock */}
        <rect x="10" y="9" width="4" height="6" fill="#ffffff" />
        <rect x="11" y="10" width="2" height="4" fill="#26b6ff" />
        <rect x="7" y="15" width="2" height="2" fill="#f5c84c" />
        <rect x="15" y="15" width="2" height="2" fill="#f5c84c" />
      </svg>
    );
  }

  if (theme === 'gameboy_green') {
    // 16-Bit Persona Jagged Comic Exclamation Box
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="pixelated-sprite"
        aria-hidden="true"
      >
        {/* Crimson Drop Shadow */}
        <rect x="4" y="5" width="17" height="13" fill="#e60012" />
        <rect x="6" y="18" width="4" height="3" fill="#e60012" />
        {/* Ink Black Border & Crisp White Bubble */}
        <rect x="2" y="3" width="17" height="13" fill="#09090f" />
        <rect x="4" y="16" width="4" height="4" fill="#09090f" />
        <rect x="3" y="4" width="15" height="11" fill="#ffffff" />
        <rect x="5" y="15" width="2" height="3" fill="#ffffff" />
        {/* Bold Pixel "!" Exclamation Mark */}
        <rect x="9" y="5" width="3" height="6" fill="#09090f" />
        <rect x="9" y="12" width="3" height="2" fill="#e60012" />
      </svg>
    );
  }

  // sunny_quest: 16-Bit Super Mario Paper Golden "?" Mystery Block
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className="pixelated-sprite"
      aria-hidden="true"
    >
      {/* Sticker White Outline + Dark Shadow */}
      <rect x="2" y="2" width="20" height="20" fill="#2e1d14" />
      <rect x="3" y="3" width="18" height="18" fill="#ffffff" />
      <rect x="4" y="4" width="16" height="16" fill="#ffd000" />
      <rect x="4" y="4" width="16" height="2" fill="#fef08a" />
      <rect x="4" y="18" width="16" height="2" fill="#d97706" />
      {/* 4 Corner Block Rivets */}
      <rect x="5" y="5" width="2" height="2" fill="#2e1d14" />
      <rect x="17" y="5" width="2" height="2" fill="#2e1d14" />
      <rect x="5" y="17" width="2" height="2" fill="#2e1d14" />
      <rect x="17" y="17" width="2" height="2" fill="#2e1d14" />
      {/* Crisp Pixel "?" Question Mark */}
      <rect x="9" y="6" width="6" height="2" fill="#2e1d14" />
      <rect x="13" y="8" width="2" height="3" fill="#2e1d14" />
      <rect x="11" y="11" width="3" height="2" fill="#2e1d14" />
      <rect x="11" y="13" width="2" height="2" fill="#2e1d14" />
      <rect x="11" y="16" width="2" height="2" fill="#2e1d14" />
      <rect x="8" y="6" width="5" height="2" fill="#ffffff" />
      <rect x="12" y="8" width="2" height="3" fill="#ffffff" />
      <rect x="10" y="11" width="3" height="2" fill="#ffffff" />
      <rect x="10" y="13" width="2" height="2" fill="#ffffff" />
      <rect x="10" y="16" width="2" height="2" fill="#ffffff" />
    </svg>
  );
};
