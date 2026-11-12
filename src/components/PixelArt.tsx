import React from 'react';
import { AvatarClass, RealmIconType } from '../types/lms';

export const PixelAvatar: React.FC<{
  avatar: AvatarClass;
  size?: number;
  className?: string;
}> = ({ avatar, size = 40, className = '' }) => {
  const paletteMap: Record<
    AvatarClass,
    { bg: string; primary: string; secondary: string; accent: string }
  > = {
    knight: {
      bg: '#232C4B',
      primary: '#94B0C2',
      secondary: '#3B5DC9',
      accent: '#FEAE34',
    },
    mage: {
      bg: '#2A1B42',
      primary: '#3B5DC9',
      secondary: '#73EFF7',
      accent: '#FEAE34',
    },
    alchemist: {
      bg: '#1A3828',
      primary: '#38B764',
      secondary: '#A7F070',
      accent: '#EF7D57',
    },
    ranger: {
      bg: '#1F3424',
      primary: '#38B764',
      secondary: '#9E6B43',
      accent: '#FEAE34',
    },
    scholar: {
      bg: '#2E263D',
      primary: '#EF7D57',
      secondary: '#F4F4F4',
      accent: '#FEAE34',
    },
    guild_master: {
      bg: '#3B1E2E',
      primary: '#B13E53',
      secondary: '#FEAE34',
      accent: '#73EFF7',
    },
  };

  const c = paletteMap[avatar] || paletteMap.knight;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`shrink-0 border-2 border-[var(--border-pixel)] ${className}`}
      aria-hidden="true"
    >
      <rect width="16" height="16" fill={c.bg} />
      {/* Hat / Helmet */}
      <rect x="4" y="2" width="8" height="2" fill={c.primary} />
      <rect x="3" y="4" width="10" height="2" fill={c.primary} />
      {avatar === 'guild_master' && (
        <>
          <rect x="5" y="1" width="2" height="1" fill={c.secondary} />
          <rect x="9" y="1" width="2" height="1" fill={c.secondary} />
          <rect x="7" y="1" width="2" height="2" fill={c.accent} />
        </>
      )}
      {avatar === 'mage' && (
        <rect x="6" y="1" width="4" height="1" fill={c.secondary} />
      )}
      {/* Face */}
      <rect x="4" y="6" width="8" height="4" fill="#F9C9A2" />
      {/* Eyes */}
      <rect x="5" y="7" width="2" height="2" fill="#1A1C2C" />
      <rect x="9" y="7" width="2" height="2" fill="#1A1C2C" />
      {/* Body / Tunic */}
      <rect x="3" y="10" width="10" height="5" fill={c.secondary} />
      <rect x="6" y="10" width="4" height="5" fill={c.primary} />
      {/* Belt / Emblem */}
      <rect x="3" y="12" width="10" height="1" fill="#1A1C2C" />
      <rect x="7" y="12" width="2" height="1" fill={c.accent} />
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

