import React from 'react';
import { Award, Sprout, Star, Zap } from 'lucide-react';
import { useActiveTheme } from '../context/ThemeContext';

/* ============================================================================
 * 1. COZY PIXEL QUEST (Parchment RPG) Components
 * ==========================================================================*/

export const RPGDialogueCard: React.FC<{
  speaker?: string;
  metaRight?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ speaker, metaRight, children, className = '' }) => (
  <div className={`rpg-dialogue-card relative p-4 space-y-2.5 overflow-hidden ${className}`}>
    {(speaker || metaRight) && (
      <div className="flex flex-wrap items-center justify-between gap-2 font-pixel-ui text-[12px] leading-none">
        {speaker && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e52521] text-white border-2 border-[#2e1d14] shadow-[0_2px_0_0_#7f1d1d] font-bold">
            <Star size={11} className="text-[#ffd000]" fill="currentColor" />
            {speaker}
          </span>
        )}
        {metaRight && (
          <span className="px-2 py-0.5 rounded-full bg-white/90 border border-[#2e1d14]/40 text-[#433025] font-bold tabular-nums">
            {metaRight}
          </span>
        )}
      </div>
    )}
    <div className="bg-white/95 border-2 border-[#2e1d14]/80 rounded-[14px] p-3 space-y-2 shadow-[0_3px_0_0_rgba(46,29,20,0.18)]">
      {children}
    </div>
  </div>
);

export const TomeReadingPaper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`tome-reading-paper p-4 sm:p-6 text-[15px] sm:text-[15.5px] leading-[1.75] whitespace-pre-line break-words [overflow-wrap:anywhere] ${className}`}
  >
    {children}
  </div>
);

export const QuestCard: React.FC<{
  children: React.ReactNode;
  urgent?: boolean;
  className?: string;
}> = ({ children, urgent = false, className = '' }) => (
  <ThemedPanelCard
    className={`space-y-2 ${urgent ? 'ring-2 ring-[#c53030]' : ''} ${className}`}
  >
    {children}
  </ThemedPanelCard>
);

/* ============================================================================
 * 2. POKÉMON CAFÉ REMIX (Patisserie & Turquoise Tray) Components
 * ==========================================================================*/

export const ChibiWelcomeCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`relative rounded-[22px] border-[2.5px] border-[#4e2a1e] bg-[#26b6b0] p-2 shadow-[0_5px_0_0_rgba(78,42,30,0.3)] overflow-hidden ${className}`}
  >
    <div className="rounded-[15px] border-2 border-[#4e2a1e]/70 bg-[#fffaf2] p-3.5 sm:p-4 space-y-2">
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-1.5 text-[#f58220]"
      >
        <span className="h-[2px] w-8 bg-[#e6c9ad] rounded-full" />
        <Star size={13} className="text-[#facc15] drop-shadow-[0_1px_0_#4e2a1e]" fill="currentColor" />
        <span className="h-[2px] w-8 bg-[#e6c9ad] rounded-full" />
      </div>
      {children}
    </div>
  </div>
);

export const StickerAchievement: React.FC<{
  unlocked: boolean;
  title: string;
  description: string;
  statusLabel: string;
  icon: React.ReactNode;
  className?: string;
}> = ({ unlocked, title, description, statusLabel, icon, className = '' }) => (
  <div
    className={`relative p-3 rounded-[18px] border-2 flex items-start gap-2.5 min-w-0 transition-transform duration-150 ${
      unlocked
        ? 'bg-[#fffaf2] border-[#4e2a1e] shadow-[0_4px_0_0_rgba(78,42,30,0.25)] hover:-translate-y-0.5'
        : 'bg-[#f6eadc]/80 border-[#4e2a1e]/35 opacity-75'
    } ${className}`}
  >
    <span
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
        unlocked
          ? 'bg-[#ffe169] text-[#3f2117] border-[#4e2a1e] ring-2 ring-[#26b6b0]/50'
          : 'bg-stone-200 text-stone-500 border-stone-400'
      }`}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[13px] font-bold text-[#3f2117] leading-tight truncate">
          {title}
        </p>
        <span className="text-[10.5px] font-bold text-[#c82a36] shrink-0">
          {statusLabel}
        </span>
      </div>
      <p className="text-[11.5px] text-[#683c2b] leading-snug mt-0.5 break-words">
        {description}
      </p>
    </div>
  </div>
);

export const MascotEmptyState: React.FC<{
  illustration: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ illustration, title, description, action }) => (
  <div className="rounded-[22px] border-[2.5px] border-[#4e2a1e] bg-[#26b6b0] p-2 shadow-[0_5px_0_0_rgba(78,42,30,0.28)]">
    <div className="rounded-[16px] border-2 border-[#4e2a1e]/70 bg-[#fffaf2] p-6 flex flex-col items-center text-center gap-3">
      <div className="w-24 h-24 rounded-full bg-[#d6f5f3] border-2 border-[#4e2a1e] flex items-center justify-center shadow-[0_3px_0_0_rgba(78,42,30,0.2)]">
        {illustration}
      </div>
      <h3 className="font-pixel-display text-[15px] text-[#3f2117]">{title}</h3>
      <p className="text-[14px] text-[#683c2b] max-w-[32ch]">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  </div>
);

/* ============================================================================
 * 3. SPROUT PIXEL VILLAGE (Pixel Game Farming Island) Components
 * ==========================================================================*/

export const RoyalFrameCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`royal-frame-card relative bg-[#fffdf6] border-[2.5px] border-[#5c3822] rounded-[4px] p-4 shadow-[3px_3px_0_0_#5c3822] overflow-hidden ${className}`}
  >
    {/* 4 Pixel Sprout-Meadow & Timber Corner Rivets */}
    <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 bg-[#8ec252] border-r-2 border-b-2 border-[#5c3822]" />
    <span aria-hidden="true" className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#8ec252] border-l-2 border-b-2 border-[#5c3822]" />
    <span aria-hidden="true" className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-[#8ec252] border-r-2 border-t-2 border-[#5c3822]" />
    <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#8ec252] border-l-2 border-t-2 border-[#5c3822]" />
    {children}
  </div>
);

export const RoyalMedallion: React.FC<{
  unlocked: boolean;
  title: string;
  description: string;
  statusLabel: string;
  icon: React.ReactNode;
}> = ({ unlocked, title, description, statusLabel, icon }) => (
  <div
    className={`p-3 border-2 rounded-[4px] flex items-start gap-2.5 min-w-0 ${
      unlocked
        ? 'bg-[#fffdf6] border-[#5c3822] shadow-[3px_3px_0_0_#5c3822]'
        : 'bg-[#eee2c2]/85 border-[#5c3822]/40 opacity-75'
    }`}
  >
    <span
      className={`w-9 h-9 border-2 rounded-[3px] flex items-center justify-center shrink-0 ${
        unlocked
          ? 'bg-[#8ec252] text-[#2f1a0d] border-[#5c3822]'
          : 'bg-stone-300 text-stone-600 border-stone-500'
      }`}
    >
      {unlocked ? <Sprout size={17} /> : icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="font-pixel-ui text-[12px] font-bold text-[#3b2214] truncate">
          {title}
        </p>
        <span className="text-[10.5px] font-bold text-[#3f7d28] shrink-0">
          {statusLabel}
        </span>
      </div>
      <p className="text-[11.5px] text-[#5c3822] leading-snug mt-0.5 break-words">
        {description}
      </p>
    </div>
  </div>
);

export const KingdomQuestBoard: React.FC<{
  headerTitle: string;
  children: React.ReactNode;
}> = ({ headerTitle, children }) => (
  <RoyalFrameCard className="space-y-2.5">
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#b87c4b] border-2 border-[#5c3822] rounded-[3px] shadow-[inset_0_2px_0_rgba(255,248,223,0.3)]">
      <Sprout size={14} className="text-[#d9f99d] shrink-0" />
      <span className="font-pixel-ui text-[11px] font-bold uppercase tracking-wider text-[#fff8df] truncate">
        {headerTitle}
      </span>
    </div>
    {children}
  </RoyalFrameCard>
);

/* ============================================================================
 * 4. MOBILE LEGENDS: BANG BANG (Land of Dawn Armory) Components
 * ==========================================================================*/

export const ComicPanel: React.FC<{
  children: React.ReactNode;
  halftone?: boolean;
  className?: string;
}> = ({ children, halftone = false, className = '' }) => (
  <div
    className={`relative bg-white border-2 border-[#1e3a6e] rounded-[8px] p-4 shadow-[0_4px_0_0_rgba(12,24,48,0.22)] overflow-hidden ${
      halftone ? 'comic-halftone' : ''
    } ${className}`}
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1b4db3] via-[#d4a94f] to-[#1b4db3]"
    />
    {children}
  </div>
);

export const SpeechBubble: React.FC<{
  speaker?: string;
  metaRight?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ speaker, metaRight, children, className = '' }) => (
  <div className={`relative ${className}`}>
    <div className="bg-white border-2 border-[#1e3a6e] rounded-[8px] overflow-hidden shadow-[0_4px_0_0_rgba(12,24,48,0.22)]">
      {(speaker || metaRight) && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-[#0e1f40] via-[#173368] to-[#0e1f40] border-b-2 border-[#d4a94f] flex flex-wrap items-center justify-between gap-2 font-pixel-ui text-[11px]">
          {speaker && (
            <span className="inline-flex items-center gap-1.5 font-bold text-[#fde68a] tracking-wide">
              <Zap size={12} className="text-[#5ce1e6]" /> {speaker}
            </span>
          )}
          {metaRight && (
            <span className="text-[#bae6fd] font-semibold tabular-nums">{metaRight}</span>
          )}
        </div>
      )}
      <div className="p-4 space-y-2">{children}</div>
    </div>
  </div>
);

export const ArcadeActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: 'cyan' | 'gold' | 'magenta';
  }
> = ({ tone = 'cyan', className = '', children, ...rest }) => {
  const toneClass =
    tone === 'gold'
      ? 'bg-gradient-to-b from-[#f5c84c] to-[#d4a94f] text-[#0b1730] border-[#78350f]'
      : tone === 'magenta'
        ? 'bg-gradient-to-b from-[#dc4520] to-[#b5250c] text-white border-[#f5c84c]'
        : 'bg-gradient-to-b from-[#1e56c2] to-[#123780] text-white border-[#d4a94f]';
  return (
    <button
      className={`pixel-btn font-pixel-display text-[12px] px-4 py-2 min-h-[42px] inline-flex items-center justify-center gap-2 cursor-pointer ${toneClass} ${className}`}
      {...rest}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
};

/* ============================================================================
 * 5. PHANTOM PERSONA POP (Crimson Ink & Comic Cutouts) Components
 * ==========================================================================*/

export const EditorialCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`relative bg-white border-[2.5px] border-[#09090f] rounded-[2px] p-4 sm:p-5 shadow-[5px_5px_0_0_#e60012] overflow-hidden ${className}`}
  >
    {/* Subtle top-right crimson & ink diagonal Persona cut accent */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 w-10 h-2.5 bg-[#e60012] border-b-2 border-l-2 border-[#09090f]"
    />
    {children}
  </div>
);

export const MinimalReadingCanvas: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`relative bg-white border-[2.5px] border-[#09090f] rounded-[2px] p-5 sm:p-6 shadow-[4px_4px_0_0_#e60012] text-[15px] sm:text-[16px] leading-[1.8] text-[#09090f] whitespace-pre-line break-words [overflow-wrap:anywhere] ${className}`}
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 right-0 h-1.5 bg-[#e60012]"
    />
    {children}
  </div>
);

export const CleanProgressIndicator: React.FC<{
  percent: number;
  labelLeft?: string;
  labelRight?: string;
}> = ({ percent, labelLeft, labelRight }) => {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-1.5">
      {(labelLeft || labelRight) && (
        <div className="flex items-center justify-between text-[12.5px] font-bold text-[#09090f] tabular-nums">
          <span className="uppercase tracking-wide">{labelLeft}</span>
          <span className="text-[#e60012]">{labelRight}</span>
        </div>
      )}
      <div className="h-3.5 w-full rounded-[2px] border-2 border-[#09090f] bg-[#f0edf2] p-0.5 overflow-hidden">
        <div
          className="h-full bg-[#e60012] relative transition-all duration-200"
          style={{ width: `${safe}%` }}
        >
          {safe > 6 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#ffe600]"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * UNIFIED THEME-DISPATCHING ADAPTERS
 * Automatically delegate to each theme's authentic visual implementation
 * ==========================================================================*/

export const ThemedNoticeCard: React.FC<{
  speaker?: string;
  metaRight?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ speaker, metaRight, children, footer }) => {
  const { theme } = useActiveTheme();

  if (theme === 'sunny_quest') {
    return (
      <RPGDialogueCard speaker={speaker} metaRight={metaRight}>
        {children}
        {footer}
      </RPGDialogueCard>
    );
  }

  if (theme === 'cyber_retro') {
    return (
      <SpeechBubble speaker={speaker} metaRight={metaRight}>
        {children}
        {footer}
      </SpeechBubble>
    );
  }

  if (theme === 'nes_classic') {
    return (
      <KingdomQuestBoard headerTitle={speaker || 'Papan Desa Pixel'}>
        {metaRight && (
          <p className="text-[11.5px] font-semibold text-[#5c3822] tabular-nums">
            {metaRight}
          </p>
        )}
        {children}
        {footer}
      </KingdomQuestBoard>
    );
  }

  if (theme === 'daylight_rpg') {
    return (
      <ChibiWelcomeCard className="space-y-2">
        {(speaker || metaRight) && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold">
            {speaker && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c82a36] text-white border border-[#4e2a1e]">
                {speaker}
              </span>
            )}
            <span className="text-[#683c2b] font-semibold tabular-nums">{metaRight}</span>
          </div>
        )}
        {children}
        {footer}
      </ChibiWelcomeCard>
    );
  }

  // Phantom Persona Pop: Slanted speaker bar + jagged comic speech cutout
  return (
    <div className="relative pb-2">
      <div className="bg-white border-[2.5px] border-[#09090f] rounded-[2px] p-4 shadow-[5px_5px_0_0_#e60012] space-y-2.5">
        {(speaker || metaRight) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            {speaker && (
              <span className="persona-slant inline-flex items-center gap-1.5 bg-[#09090f] text-white border-2 border-[#09090f] shadow-[3px_3px_0_0_#e60012] px-2.5 py-1 font-pixel-ui text-[11px] font-bold uppercase tracking-wider">
                <span className="persona-unslant inline-flex items-center gap-1">
                  <Star size={11} className="text-[#ffe600]" fill="currentColor" />
                  {speaker}
                </span>
              </span>
            )}
            {metaRight && (
              <span className="font-pixel-ui text-[11px] font-bold text-[#e60012] tabular-nums">
                {metaRight}
              </span>
            )}
          </div>
        )}
        {children}
        {footer}
      </div>
      <svg
        aria-hidden="true"
        width="26"
        height="13"
        viewBox="0 0 26 13"
        className="ml-6 -mt-[2.5px] block"
      >
        <polygon points="3,0 22,0 6,12" fill="#ffffff" />
        <polyline points="3,0 6,12 22,0" fill="none" stroke="#09090f" strokeWidth="2.5" />
      </svg>
    </div>
  );
};

export const ThemedPanelCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { theme } = useActiveTheme();
  if (theme === 'nes_classic') {
    return <RoyalFrameCard className={className}>{children}</RoyalFrameCard>;
  }
  if (theme === 'cyber_retro') {
    return <ComicPanel className={className}>{children}</ComicPanel>;
  }
  if (theme === 'gameboy_green') {
    return <EditorialCard className={className}>{children}</EditorialCard>;
  }
  return <div className={`pixel-box p-4 overflow-hidden ${className}`}>{children}</div>;
};

export const ThemedReadingSurface: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { theme } = useActiveTheme();
  if (theme === 'gameboy_green') {
    return <MinimalReadingCanvas className={className}>{children}</MinimalReadingCanvas>;
  }
  return <TomeReadingPaper className={className}>{children}</TomeReadingPaper>;
};

export const ThemedAchievementCard: React.FC<{
  unlocked: boolean;
  title: string;
  description: string;
  statusLabel: string;
  icon: React.ReactNode;
  fallbackToneClass?: string;
  fallbackIconClass?: string;
}> = ({
  unlocked,
  title,
  description,
  statusLabel,
  icon,
  fallbackToneClass = 'bg-[var(--bg-inset)] border-[var(--border-pixel)]',
  fallbackIconClass = 'bg-[var(--surface-tint)] text-[var(--text-primary)] border-[var(--border-pixel)]',
}) => {
  const { theme } = useActiveTheme();

  if (theme === 'daylight_rpg') {
    return (
      <StickerAchievement
        unlocked={unlocked}
        title={title}
        description={description}
        statusLabel={statusLabel}
        icon={icon}
      />
    );
  }

  if (theme === 'nes_classic') {
    return (
      <RoyalMedallion
        unlocked={unlocked}
        title={title}
        description={description}
        statusLabel={statusLabel}
        icon={icon}
      />
    );
  }

  if (theme === 'gameboy_green') {
    return (
      <div
        className={`p-3 rounded-[2px] border-[2.5px] flex items-start gap-2.5 min-w-0 transition-transform duration-150 ${
          unlocked
            ? 'bg-white border-[#09090f] shadow-[3px_3px_0_0_#e60012]'
            : 'bg-[#f0edf2] border-[#09090f]/40 opacity-75'
        }`}
      >
        <span
          className={`persona-slant w-9 h-9 border-2 border-[#09090f] flex items-center justify-center shrink-0 ${
            unlocked
              ? 'bg-[#09090f] text-[#ffe600] shadow-[2px_2px_0_0_#e60012]'
              : 'bg-zinc-300 text-zinc-600'
          }`}
        >
          <span className="persona-unslant">
            {unlocked ? icon : <Award size={15} />}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <p className="font-pixel-ui text-[12.5px] font-bold text-[#09090f] truncate">
              {title}
            </p>
            <span
              className={`font-pixel-ui text-[10.5px] font-bold shrink-0 ${
                unlocked ? 'text-[#e60012]' : 'text-[#52525b]'
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-[12px] text-[#27272a] leading-snug mt-0.5 break-words">
            {description}
          </p>
        </div>
      </div>
    );
  }

  if (theme === 'sunny_quest') {
    return (
      <div
        className={`p-3 rounded-[16px] border-2 flex items-start gap-2.5 min-w-0 transition-transform duration-150 ${
          unlocked
            ? 'bg-white border-[#2e1d14] shadow-[inset_0_0_0_1.5px_#ffffff,0_4px_0_0_rgba(46,29,20,0.7)] hover:-translate-y-0.5'
            : 'bg-[#efeadd]/85 border-[#2e1d14]/40 opacity-75'
        }`}
      >
        <span
          className={`w-10 h-10 rounded-full border-2 border-[#2e1d14] flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#2e1d14] ${
            unlocked
              ? 'bg-[#ffd000] text-[#1e140e] ring-2 ring-white'
              : 'bg-stone-200 text-stone-500'
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <p className="text-[13px] font-bold text-[#1e140e] leading-tight truncate">
              {title}
            </p>
            <span
              className={`text-[10.5px] font-bold shrink-0 ${
                unlocked ? 'text-[#e52521]' : 'text-[#664d3e]'
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-[11.5px] text-[#433025] leading-snug mt-0.5 break-words">
            {description}
          </p>
        </div>
      </div>
    );
  }

  // cyber_retro: Mobile Legends: Bang Bang Armored Rank Crest Achievement
  return (
    <div
      className={`p-3 rounded-[7px] border-2 flex items-start gap-2.5 min-w-0 transition-transform duration-150 ${
        unlocked
          ? 'bg-white border-[#1e3a6e] shadow-[0_3px_0_0_rgba(12,24,48,0.22)] hover:-translate-y-0.5'
          : 'bg-[#e8f0fb]/80 border-[#1e3a6e]/35 opacity-75'
      }`}
    >
      <span
        className={`w-9 h-9 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
          unlocked
            ? 'bg-[#102347] text-[#f5c84c] border-[#d4a94f] shadow-[0_2px_0_0_#071022]'
            : 'bg-slate-200 text-slate-500 border-slate-400'
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p className="font-pixel-ui text-[12.5px] font-bold text-[#0b1730] leading-tight truncate">
            {title}
          </p>
          <span
            className={`text-[10.5px] font-bold shrink-0 ${
              unlocked ? 'text-[#1b4db3]' : 'text-[#4b628a]'
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-[11.5px] text-[#243b61] leading-snug mt-0.5 break-words">
          {description}
        </p>
      </div>
    </div>
  );
};
