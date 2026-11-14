import React from 'react';
import { Award, Crown, Sparkles, Star, Zap } from 'lucide-react';
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
  <div className={`rpg-dialogue-card relative p-4 space-y-2 overflow-hidden ${className}`}>
    {/* Subtle wooden corner rivets */}
    <span aria-hidden="true" className="hidden sm:block absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-[#4a3525]/60" />
    <span aria-hidden="true" className="hidden sm:block absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#4a3525]/60" />
    {(speaker || metaRight) && (
      <div className="flex flex-wrap items-center justify-between gap-2 font-pixel-ui text-[12px] leading-none">
        {speaker && <span className="font-bold text-[#9a3412]">{speaker}</span>}
        {metaRight && <span className="text-[#6e533d] tabular-nums">{metaRight}</span>}
      </div>
    )}
    {children}
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
 * 2. SOFT CHIBI CLASSROOM (Pastel) Components
 * ==========================================================================*/

export const ChibiWelcomeCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`relative rounded-[22px] border-2 border-[#1e4e68] bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#ecfdf5] p-4 shadow-[0_5px_0_0_rgba(30,78,104,0.2)] overflow-hidden ${className}`}
  >
    <div
      aria-hidden="true"
      className="flex items-center gap-1 text-[#0284c7]/40 mb-1"
    >
      <Star size={11} fill="currentColor" />
      <Sparkles size={11} />
    </div>
    {children}
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
    className={`p-3 rounded-[18px] border-2 flex items-start gap-2.5 min-w-0 transition-transform duration-150 ${
      unlocked
        ? 'bg-white border-[#1e4e68] shadow-[0_4px_0_0_rgba(30,78,104,0.22)] hover:-translate-y-0.5'
        : 'bg-[#edf7fa]/80 border-[#1e4e68]/35 opacity-75'
    } ${className}`}
  >
    <span
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
        unlocked
          ? 'bg-[#a7f3d0] text-[#133142] border-[#1e4e68]'
          : 'bg-slate-200 text-slate-500 border-slate-400'
      }`}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[13px] font-bold text-[#133142] leading-tight truncate">
          {title}
        </p>
        <span className="text-[10.5px] font-bold text-[#0284c7] shrink-0">
          {statusLabel}
        </span>
      </div>
      <p className="text-[11.5px] text-[#2d5368] leading-snug mt-0.5 break-words">
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
  <div className="rounded-[24px] border-2 border-[#1e4e68] bg-white p-6 flex flex-col items-center text-center gap-3 shadow-[0_5px_0_0_rgba(30,78,104,0.18)]">
    <div className="w-24 h-24 rounded-full bg-[#e0f4fc] border-2 border-[#a7f3d0] flex items-center justify-center">
      {illustration}
    </div>
    <h3 className="font-pixel-display text-[15px] text-[#133142]">{title}</h3>
    <p className="text-[14px] text-[#2d5368] max-w-[32ch]">{description}</p>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

/* ============================================================================
 * 3. 16-BIT ROYAL CHRONICLE Components
 * ==========================================================================*/

export const RoyalFrameCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`royal-frame-card relative bg-white border-[2.5px] border-[#311b63] p-4 shadow-[3px_3px_0_0_#311b63] overflow-hidden ${className}`}
  >
    {/* 4 Golden 16-bit Pixel Corner Ornaments */}
    <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 bg-[#fbbf24] border-r-2 border-b-2 border-[#311b63]" />
    <span aria-hidden="true" className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#fbbf24] border-l-2 border-b-2 border-[#311b63]" />
    <span aria-hidden="true" className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-[#fbbf24] border-r-2 border-t-2 border-[#311b63]" />
    <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#fbbf24] border-l-2 border-t-2 border-[#311b63]" />
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
    className={`p-3 border-2 flex items-start gap-2.5 min-w-0 ${
      unlocked
        ? 'bg-[#fef9e7] border-[#311b63] shadow-[3px_3px_0_0_#311b63]'
        : 'bg-[#f5eedc]/80 border-[#311b63]/40 opacity-75'
    }`}
  >
    <span
      className={`w-9 h-9 border-2 flex items-center justify-center shrink-0 ${
        unlocked
          ? 'bg-[#fbbf24] text-[#1e113a] border-[#311b63]'
          : 'bg-stone-300 text-stone-600 border-stone-500'
      }`}
    >
      {unlocked ? <Crown size={17} /> : icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="font-pixel-ui text-[12px] font-bold text-[#1e113a] truncate">
          {title}
        </p>
        <span className="text-[10.5px] font-bold text-[#5b21b6] shrink-0">
          {statusLabel}
        </span>
      </div>
      <p className="text-[11.5px] text-[#442b78] leading-snug mt-0.5 break-words">
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
    <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#fbbf24]">
      <Crown size={14} className="text-[#b45309] shrink-0" />
      <span className="font-pixel-ui text-[11px] uppercase tracking-wider text-[#311b63]">
        {headerTitle}
      </span>
    </div>
    {children}
  </RoyalFrameCard>
);

/* ============================================================================
 * 4. COMIC-POP ARCADE Components
 * ==========================================================================*/

export const ComicPanel: React.FC<{
  children: React.ReactNode;
  halftone?: boolean;
  className?: string;
}> = ({ children, halftone = false, className = '' }) => (
  <div
    className={`relative bg-white border-[2.5px] border-[#09090f] rounded-[5px] p-4 shadow-[5px_5px_0_0_#09090f] overflow-hidden ${
      halftone ? 'comic-halftone' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const SpeechBubble: React.FC<{
  speaker?: string;
  metaRight?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ speaker, metaRight, children, className = '' }) => (
  <div className={`relative pb-2 ${className}`}>
    <div className="bg-white border-[2.5px] border-[#09090f] rounded-[6px] p-4 shadow-[4px_4px_0_0_#09090f] space-y-2">
      {(speaker || metaRight) && (
        <div className="flex flex-wrap items-center justify-between gap-2 font-pixel-ui text-[11px]">
          {speaker && (
            <span className="inline-flex items-center gap-1 font-bold text-[#5b21b6]">
              <Zap size={12} /> {speaker}
            </span>
          )}
          {metaRight && <span className="text-[#524b7a] tabular-nums">{metaRight}</span>}
        </div>
      )}
      {children}
    </div>
    {/* Comic Speech Tail */}
    <svg
      aria-hidden="true"
      width="22"
      height="12"
      viewBox="0 0 22 12"
      className="ml-6 -mt-[2.5px] block"
    >
      <polygon points="2,0 18,0 6,11" fill="#ffffff" />
      <polyline points="2,0 6,11 18,0" fill="none" stroke="#09090f" strokeWidth="2.5" />
    </svg>
  </div>
);

export const ArcadeActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: 'cyan' | 'gold' | 'magenta';
  }
> = ({ tone = 'cyan', className = '', children, ...rest }) => {
  const toneClass =
    tone === 'gold'
      ? 'bg-[#ffd000] text-[#09090f]'
      : tone === 'magenta'
        ? 'bg-[#e11d74] text-white'
        : 'bg-[#00d8ff] text-[#09090f]';
  return (
    <button
      className={`pixel-btn comic-slant font-pixel-display text-[12px] px-4 py-2 min-h-[42px] inline-flex items-center justify-center gap-2 cursor-pointer ${toneClass} ${className}`}
      {...rest}
    >
      <span className="comic-unslant inline-flex items-center gap-2">{children}</span>
    </button>
  );
};

/* ============================================================================
 * 5. CLEAN PAPER STUDIO (Minimalist Editorial) Components
 * ==========================================================================*/

export const EditorialCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`bg-white border border-[#d6d1c7] rounded-lg p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,24,27,0.05)] overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export const MinimalReadingCanvas: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`bg-[#fffefb] border border-[#e2ddd3] rounded-lg p-5 sm:p-6 text-[15px] sm:text-[16px] leading-[1.8] text-[#18181b] whitespace-pre-line break-words [overflow-wrap:anywhere] ${className}`}
  >
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
        <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#3f3f46] tabular-nums">
          <span>{labelLeft}</span>
          <span>{labelRight}</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-[#e8e3d9] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#15803d] transition-all duration-200"
          style={{ width: `${safe}%` }}
        />
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
      <KingdomQuestBoard headerTitle={speaker || 'Royal Proclamation'}>
        {metaRight && (
          <p className="text-[11.5px] font-semibold text-[#634a94] tabular-nums">
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold text-[#0284c7]">
            <span>{speaker}</span>
            <span className="text-[#4a6f85] font-semibold tabular-nums">{metaRight}</span>
          </div>
        )}
        {children}
        {footer}
      </ChibiWelcomeCard>
    );
  }

  return (
    <EditorialCard className="space-y-2">
      {(speaker || metaRight) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-semibold text-[#52525b] pb-1.5 border-b border-[#ece7dd]">
          <span>{speaker}</span>
          <span className="tabular-nums">{metaRight}</span>
        </div>
      )}
      {children}
      {footer}
    </EditorialCard>
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
        className={`p-3 rounded-lg border flex items-start gap-2.5 min-w-0 ${
          unlocked
            ? 'bg-white border-[#d6d1c7]'
            : 'bg-[#f4f1ea] border-[#e2ddd3] opacity-70'
        }`}
      >
        <span
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            unlocked ? 'bg-[#15803d] text-white' : 'bg-[#e5e0d5] text-[#52525b]'
          }`}
        >
          {unlocked ? icon : <Award size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <p className="text-[13px] font-bold text-[#18181b] truncate">{title}</p>
            <span className="text-[11px] font-semibold text-[#15803d] shrink-0">
              {statusLabel}
            </span>
          </div>
          <p className="text-[12px] text-[#52525b] leading-snug mt-0.5 break-words">
            {description}
          </p>
        </div>
      </div>
    );
  }

  // sunny_quest & cyber_retro
  return (
    <div
      className={`p-2.5 rounded-[var(--inset-radius)] border-2 flex items-start gap-2.5 min-w-0 ${
        theme === 'cyber_retro' && unlocked ? 'shadow-[3px_3px_0_0_#09090f]' : ''
      } ${fallbackToneClass}`}
    >
      <span
        className={`w-9 h-9 rounded-[var(--btn-radius)] border-2 flex items-center justify-center shrink-0 ${fallbackIconClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-[12.5px] font-bold text-[var(--text-primary)] leading-tight truncate">
            {title}
          </p>
          <span className="text-[10.5px] font-bold text-[var(--text-secondary)] shrink-0">
            {statusLabel}
          </span>
        </div>
        <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug mt-0.5 break-words">
          {description}
        </p>
      </div>
    </div>
  );
};
