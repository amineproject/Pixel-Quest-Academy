import React from 'react';
import { AvatarClass, RealmIconType } from '../types/lms';

export const PixelAvatar: React.FC<{
  avatar: AvatarClass;
  size?: number;
  className?: string;
}> = ({ avatar, size = 40, className = '' }) => {
  const paletteMap: Record<
    AvatarClass,
    {
      bg: string;
      bgShade: string;
      primary: string;
      primaryLight: string;
      primaryDark: string;
      secondary: string;
      secondaryDark: string;
      accent: string;
      hair: string;
    }
  > = {
    knight: {
      bg: '#1c2541',
      bgShade: '#28365c',
      primary: '#94b0c2',
      primaryLight: '#d8e6f2',
      primaryDark: '#5d768a',
      secondary: '#2563eb',
      secondaryDark: '#1e3a8a',
      accent: '#facc15',
      hair: '#4a2e1f',
    },
    mage: {
      bg: '#24143b',
      bgShade: '#352057',
      primary: '#3b5dc9',
      primaryLight: '#73eff7',
      primaryDark: '#1e2f78',
      secondary: '#7e22ce',
      secondaryDark: '#4c1d95',
      accent: '#fbbf24',
      hair: '#1e1b4b',
    },
    alchemist: {
      bg: '#163022',
      bgShade: '#224732',
      primary: '#38b764',
      primaryLight: '#a7f070',
      primaryDark: '#20753f',
      secondary: '#0d9488',
      secondaryDark: '#115e59',
      accent: '#fb923c',
      hair: '#78350f',
    },
    ranger: {
      bg: '#1a2e1e',
      bgShade: '#26422b',
      primary: '#38b764',
      primaryLight: '#86efac',
      primaryDark: '#1e6b37',
      secondary: '#9e6b43',
      secondaryDark: '#6b4226',
      accent: '#fde047',
      hair: '#3f2314',
    },
    scholar: {
      bg: '#261e36',
      bgShade: '#3a2d52',
      primary: '#ef7d57',
      primaryLight: '#fdba74',
      primaryDark: '#b44828',
      secondary: '#e2e8f0',
      secondaryDark: '#94a3b8',
      accent: '#facc15',
      hair: '#1e293b',
    },
    guild_master: {
      bg: '#381626',
      bgShade: '#521f37',
      primary: '#dc2626',
      primaryLight: '#fb7185',
      primaryDark: '#881337',
      secondary: '#f59e0b',
      secondaryDark: '#b45309',
      accent: '#73eff7',
      hair: '#fef3c7',
    },
  };

  const c = paletteMap[avatar] || paletteMap.knight;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className={`shrink-0 pixelated-sprite border-2 border-[var(--border-pixel)] ${className}`}
      aria-hidden="true"
    >
      {/* 16-bit checkerboard pixel sky backdrop */}
      <rect width="24" height="24" fill={c.bg} />
      <rect x="0" y="0" width="24" height="8" fill={c.bgShade} />
      <rect x="2" y="2" width="1" height="1" fill={c.accent} opacity="0.7" />
      <rect x="21" y="4" width="1" height="1" fill="#ffffff" opacity="0.6" />

      {/* Head / Hat Dark Pixel Outline */}
      <rect x="6" y="4" width="12" height="11" fill="#18121e" />
      <rect x="5" y="6" width="14" height="7" fill="#18121e" />

      {/* Class-Specific 16-bit Headgear */}
      {avatar === 'guild_master' ? (
        <>
          {/* Crown Base & Horns */}
          <rect x="6" y="1" width="2" height="4" fill={c.secondary} />
          <rect x="11" y="1" width="2" height="4" fill={c.secondary} />
          <rect x="16" y="1" width="2" height="4" fill={c.secondary} />
          <rect x="6" y="3" width="12" height="3" fill={c.secondary} />
          <rect x="6" y="5" width="12" height="1" fill={c.secondaryDark} />
          <rect x="11" y="3" width="2" height="2" fill={c.accent} />
          <rect x="7" y="6" width="10" height="2" fill={c.hair} />
        </>
      ) : avatar === 'mage' ? (
        <>
          {/* Pointed 16-bit Wizard Hat */}
          <rect x="10" y="1" width="4" height="2" fill={c.primary} />
          <rect x="8" y="3" width="8" height="2" fill={c.primary} />
          <rect x="9" y="3" width="3" height="1" fill={c.primaryLight} />
          <rect x="5" y="5" width="14" height="2" fill={c.primaryDark} />
          <rect x="6" y="5" width="12" height="1" fill={c.accent} />
          <rect x="7" y="7" width="10" height="1" fill={c.hair} />
        </>
      ) : avatar === 'alchemist' ? (
        <>
          {/* Alchemist Goggles Band */}
          <rect x="6" y="4" width="12" height="3" fill={c.primary} />
          <rect x="7" y="4" width="4" height="2" fill={c.primaryLight} />
          <rect x="13" y="4" width="4" height="2" fill={c.primaryLight} />
          <rect x="8" y="4" width="2" height="2" fill="#e0f2fe" />
          <rect x="14" y="4" width="2" height="2" fill="#e0f2fe" />
          <rect x="6" y="7" width="12" height="1" fill={c.hair} />
        </>
      ) : avatar === 'ranger' ? (
        <>
          {/* Plumed Forest Hood */}
          <rect x="5" y="3" width="13" height="4" fill={c.primary} />
          <rect x="7" y="2" width="9" height="2" fill={c.primaryLight} />
          <rect x="16" y="1" width="3" height="2" fill={c.accent} />
          <rect x="6" y="6" width="12" height="2" fill={c.primaryDark} />
        </>
      ) : avatar === 'scholar' ? (
        <>
          {/* Scholar Cap & Tassel */}
          <rect x="5" y="2" width="14" height="2" fill={c.primaryDark} />
          <rect x="7" y="4" width="10" height="2" fill={c.primary} />
          <rect x="18" y="3" width="1" height="4" fill={c.accent} />
          <rect x="7" y="6" width="10" height="2" fill={c.hair} />
        </>
      ) : (
        <>
          {/* Knight Visor Helmet & Plume */}
          <rect x="10" y="1" width="4" height="2" fill={c.accent} />
          <rect x="7" y="3" width="10" height="4" fill={c.primary} />
          <rect x="8" y="3" width="6" height="2" fill={c.primaryLight} />
          <rect x="6" y="6" width="12" height="2" fill={c.primaryDark} />
        </>
      )}

      {/* Multi-Tone Shaded Face */}
      <rect x="7" y="8" width="10" height="6" fill="#f9c9a2" />
      <rect x="7" y="8" width="10" height="1" fill="#e0a379" />
      <rect x="8" y="13" width="8" height="1" fill="#e0a379" />

      {/* Side Hair / Ear Pixels */}
      <rect x="6" y="8" width="1" height="4" fill={c.hair} />
      <rect x="17" y="8" width="1" height="4" fill={c.hair} />

      {/* 16-bit Expressive Eyes with White Specular Glints */}
      <rect x="8" y="9" width="2" height="3" fill="#18121e" />
      <rect x="8" y="9" width="1" height="1" fill="#ffffff" />
      <rect x="14" y="9" width="2" height="3" fill="#18121e" />
      <rect x="14" y="9" width="1" height="1" fill="#ffffff" />

      {/* Subtle Rosy Pixel Cheeks */}
      <rect x="7" y="11" width="1" height="1" fill="#f48fb1" />
      <rect x="16" y="11" width="1" height="1" fill="#f48fb1" />

      {/* Scholar Glasses Frame Overlay */}
      {avatar === 'scholar' && (
        <>
          <rect x="7" y="9" width="4" height="1" fill="#1e293b" />
          <rect x="13" y="9" width="4" height="1" fill="#1e293b" />
          <rect x="11" y="10" width="2" height="1" fill="#1e293b" />
        </>
      )}

      {/* Shoulders, Cape & Shaded Tunic (y 15..23) */}
      <rect x="4" y="15" width="16" height="9" fill="#18121e" />
      <rect x="5" y="16" width="14" height="8" fill={c.secondary} />
      <rect x="5" y="16" width="3" height="6" fill={c.primary} />
      <rect x="16" y="16" width="3" height="6" fill={c.primaryDark} />
      {/* Center Breastplate / Collar */}
      <rect x="9" y="15" width="6" height="9" fill={c.primary} />
      <rect x="10" y="15" width="4" height="2" fill={c.primaryLight} />
      {/* Belt & Golden Clasp */}
      <rect x="5" y="19" width="14" height="2" fill={c.secondaryDark} />
      <rect x="10" y="19" width="4" height="2" fill={c.accent} />
      <rect x="11" y="19" width="2" height="1" fill="#ffffff" />
    </svg>
  );
};

export const PixelChestEmpty: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    aria-hidden="true"
  >
    {/* Shadow */}
    <rect x="3" y="20" width="18" height="2" fill="rgba(0,0,0,0.4)" />
    {/* Open Lid */}
    <rect x="4" y="5" width="16" height="4" fill="#7A4841" />
    <rect x="5" y="4" width="14" height="1" fill="#A06B58" />
    <rect x="4" y="5" width="2" height="4" fill="#FEAE34" />
    <rect x="18" y="5" width="2" height="4" fill="#FEAE34" />
    {/* Dark Empty Interior */}
    <rect x="4" y="9" width="16" height="4" fill="#141624" />
    <rect x="6" y="10" width="12" height="2" fill="#232740" />
    {/* Chest Base */}
    <rect x="4" y="13" width="16" height="7" fill="#8B5A3C" />
    <rect x="4" y="13" width="16" height="2" fill="#FEAE34" />
    <rect x="4" y="13" width="2" height="7" fill="#FEAE34" />
    <rect x="18" y="13" width="2" height="7" fill="#FEAE34" />
    {/* Lock */}
    <rect x="10" y="12" width="4" height="4" fill="#F4F4F4" />
    <rect x="11" y="13" width="2" height="2" fill="#1A1C2C" />
    {/* Cobweb pixels */}
    <rect x="6" y="10" width="1" height="1" fill="#94B0C2" />
    <rect x="7" y="11" width="1" height="1" fill="#94B0C2" />
    <rect x="16" y="10" width="1" height="1" fill="#94B0C2" />
  </svg>
);

export const PixelShieldDenied: React.FC<{ size?: number }> = ({
  size = 84,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    aria-hidden="true"
  >
    <rect x="5" y="3" width="14" height="2" fill="#EF7D57" />
    <rect x="4" y="5" width="16" height="8" fill="#B13E53" />
    <rect x="6" y="5" width="12" height="7" fill="#EF7D57" />
    <rect x="6" y="13" width="12" height="4" fill="#B13E53" />
    <rect x="8" y="17" width="8" height="3" fill="#B13E53" />
    <rect x="10" y="20" width="4" height="2" fill="#B13E53" />
    {/* X mark */}
    <rect x="8" y="7" width="2" height="2" fill="#F4F4F4" />
    <rect x="14" y="7" width="2" height="2" fill="#F4F4F4" />
    <rect x="10" y="9" width="4" height="2" fill="#F4F4F4" />
    <rect x="8" y="11" width="2" height="2" fill="#F4F4F4" />
    <rect x="14" y="11" width="2" height="2" fill="#F4F4F4" />
  </svg>
);

export const PixelRealmGlyph: React.FC<{
  icon: RealmIconType;
  color?: string;
  size?: number;
}> = ({ icon, color = '#38B764', size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="shrink-0"
      aria-hidden="true"
    >
      {icon === 'flask' && (
        <>
          <rect x="6" y="2" width="4" height="2" fill="#94B0C2" />
          <rect x="7" y="4" width="2" height="3" fill="#F4F4F4" />
          <rect x="5" y="7" width="6" height="2" fill="#F4F4F4" />
          <rect x="3" y="9" width="10" height="5" fill={color} />
          <rect x="5" y="10" width="2" height="2" fill="#F4F4F4" />
        </>
      )}
      {icon === 'compass' && (
        <>
          <rect x="5" y="2" width="6" height="2" fill="#FEAE34" />
          <rect x="3" y="4" width="10" height="8" fill={color} />
          <rect x="5" y="12" width="6" height="2" fill="#FEAE34" />
          <rect x="7" y="5" width="2" height="6" fill="#F4F4F4" />
          <rect x="5" y="7" width="6" height="2" fill="#F4F4F4" />
          <rect x="7" y="7" width="2" height="2" fill="#EF7D57" />
        </>
      )}
      {icon === 'leaf' && (
        <>
          <rect x="8" y="2" width="5" height="3" fill={color} />
          <rect x="5" y="4" width="8" height="4" fill={color} />
          <rect x="4" y="7" width="7" height="4" fill={color} />
          <rect x="7" y="6" width="2" height="6" fill="#A7F070" />
          <rect x="3" y="11" width="3" height="3" fill="#8B5A3C" />
        </>
      )}
      {icon === 'book' && (
        <>
          <rect x="3" y="2" width="10" height="12" fill={color} />
          <rect x="3" y="2" width="2" height="12" fill="#1A1C2C" />
          <rect x="6" y="4" width="5" height="2" fill="#F4F4F4" />
          <rect x="6" y="7" width="5" height="1" fill="#FEAE34" />
          <rect x="6" y="9" width="4" height="1" fill="#FEAE34" />
        </>
      )}
      {icon === 'bolt' && (
        <>
          <rect x="8" y="1" width="4" height="3" fill={color} />
          <rect x="6" y="4" width="5" height="3" fill={color} />
          <rect x="4" y="7" width="8" height="2" fill="#FEAE34" />
          <rect x="7" y="9" width="4" height="3" fill={color} />
          <rect x="5" y="12" width="3" height="3" fill={color} />
        </>
      )}
    </svg>
  );
};

export const PixelStar: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="5" y="1" width="2" height="2" fill="#FFE066" />
    <rect x="4" y="3" width="4" height="2" fill="#FFC837" />
    <rect x="1" y="4" width="10" height="2" fill="#FFC837" />
    <rect x="2" y="6" width="8" height="2" fill="#FFB703" />
    <rect x="3" y="8" width="6" height="2" fill="#FB8500" />
    <rect x="2" y="10" width="2" height="2" fill="#FB8500" />
    <rect x="8" y="10" width="2" height="2" fill="#FB8500" />
    <rect x="5" y="4" width="2" height="2" fill="#FFFFFF" />
  </svg>
);

export const PixelCoin: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    shapeRendering="crispEdges"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="4" y="1" width="6" height="1" fill="#FFB703" />
    <rect x="2" y="2" width="10" height="2" fill="#FFC837" />
    <rect x="1" y="4" width="12" height="6" fill="#FFD13B" />
    <rect x="2" y="10" width="10" height="2" fill="#FFB703" />
    <rect x="4" y="12" width="6" height="1" fill="#FB8500" />
    {/* Inner symbol 'P' */}
    <rect x="5" y="4" width="2" height="6" fill="#995D00" />
    <rect x="7" y="4" width="2" height="3" fill="#995D00" />
    <rect x="7" y="5" width="1" height="1" fill="#FFD13B" />
    {/* Shine highlight */}
    <rect x="3" y="3" width="2" height="2" fill="#FFFFFF" />
  </svg>
);

export const PixelHeart: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="2" y="1" width="3" height="2" fill="#FF4D6D" />
    <rect x="7" y="1" width="3" height="2" fill="#FF4D6D" />
    <rect x="1" y="3" width="10" height="3" fill="#FF4D6D" />
    <rect x="2" y="6" width="8" height="2" fill="#E63946" />
    <rect x="3" y="8" width="6" height="2" fill="#E63946" />
    <rect x="4" y="10" width="4" height="1" fill="#9D0208" />
    <rect x="5" y="11" width="2" height="1" fill="#9D0208" />
    {/* Highlight */}
    <rect x="2" y="2" width="1" height="2" fill="#FFF0F3" />
  </svg>
);

export const PixelMascotSlime: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Graduation Cap / Wizard Hat on Top */}
    <rect x="9" y="1" width="6" height="2" fill="#3B5DC9" />
    <rect x="6" y="3" width="12" height="2" fill="#3B5DC9" />
    <rect x="10" y="2" width="4" height="2" fill="#254194" />
    {/* Tassel */}
    <rect x="16" y="4" width="2" height="3" fill="#FFD13B" />
    <rect x="17" y="7" width="2" height="2" fill="#FFB703" />

    {/* Slime Jelly Body (Bright Emerald Green / Cyan Gradient) */}
    <rect x="8" y="6" width="8" height="2" fill="#38E078" />
    <rect x="6" y="8" width="12" height="3" fill="#38E078" />
    <rect x="4" y="11" width="16" height="8" fill="#2CC065" />
    <rect x="5" y="19" width="14" height="3" fill="#229B50" />
    <rect x="6" y="22" width="12" height="1" fill="#186F38" />

    {/* Cheerful Big Smiling Eyes */}
    <rect x="7" y="12" width="3" height="4" fill="#14213D" />
    <rect x="8" y="12" width="1" height="2" fill="#FFFFFF" />
    <rect x="14" y="12" width="3" height="4" fill="#14213D" />
    <rect x="15" y="12" width="1" height="2" fill="#FFFFFF" />

    {/* Rosy Cheeks */}
    <rect x="5" y="15" width="2" height="2" fill="#FF7096" />
    <rect x="17" y="15" width="2" height="2" fill="#FF7096" />

    {/* Happy Pixel Mouth */}
    <rect x="11" y="16" width="2" height="1" fill="#14213D" />
    <rect x="10" y="15" width="1" height="1" fill="#14213D" />
    <rect x="13" y="15" width="1" height="1" fill="#14213D" />

    {/* Body Highlight Shine */}
    <rect x="6" y="9" width="2" height="2" fill="#B7FFD8" />
  </svg>
);

