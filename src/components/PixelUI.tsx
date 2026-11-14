import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  X,
  XCircle,
} from 'lucide-react';
import { PixelShieldDenied } from './PixelArt';
import { Dungeon } from '../types/lms';
import {
  formatLinkDisplay,
  groupDungeonsByTier,
  normalizeExternalUrl,
} from '../utils/exp';
import { useActiveTheme } from '../context/ThemeContext';
import { ThemeEmptyIllustration } from './ThemeArtwork';
import { CleanProgressIndicator, MascotEmptyState } from './ThemePrimitives';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--text-on-accent)]',
  success:
    'bg-[var(--accent-success)] hover:brightness-110 text-[var(--text-on-success)]',
  warning:
    'bg-[var(--comic-gold)] hover:brightness-105 text-[#09090f] font-bold',
  danger:
    'bg-[var(--accent-danger)] hover:brightness-110 text-[var(--text-on-danger)]',
  neutral:
    'bg-[var(--bg-surface-alt)] hover:brightness-95 text-[var(--text-primary)]',
};

const SIZE_CLASSES = {
  sm: 'min-h-[40px] px-3 py-1.5 text-[11.5px]',
  md: 'min-h-[44px] px-4 py-2 text-[12.5px]',
  lg: 'min-h-[48px] px-5 py-2.5 text-[13.5px]',
};

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) => {
  const { theme } = useActiveTheme();
  const extraThemeBtn =
    theme === 'nes_classic'
      ? 'uppercase tracking-wider'
      : theme === 'daylight_rpg'
        ? 'font-semibold'
        : theme === 'gameboy_green'
          ? 'font-semibold shadow-none'
          : '';

  return (
    <button
      className={`pixel-btn font-pixel-ui inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${extraThemeBtn} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export const PixelSectionTitle: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => {
  const { theme } = useActiveTheme();

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-2.5 mb-3 min-w-0 ${
        theme === 'gameboy_green'
          ? 'pb-2 border-b border-[#e2ddd3]'
          : theme === 'nes_classic'
            ? 'pb-2 border-b-2 border-[#fbbf24]/70'
            : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <h2
          className={`font-pixel-display text-[14px] sm:text-[16px] leading-snug tracking-wide text-[var(--text-primary)] break-words [overflow-wrap:anywhere] ${
            theme === 'cyber_retro' ? 'uppercase' : ''
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12.5px] sm:text-[13px] text-[var(--text-secondary)] mt-0.5 leading-snug break-words">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const PixelLinkButton: React.FC<{
  url?: string;
  label?: string;
  compact?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}> = ({ url, label = 'Buka Tautan', compact = false, onClick }) => {
  const safeHref = normalizeExternalUrl(url);
  if (!safeHref) return null;
  const hostPreview = formatLinkDisplay(safeHref);

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`pixel-btn max-w-full bg-[var(--surface-tint)] hover:bg-[var(--bg-surface-alt)] text-[var(--text-primary)] inline-flex items-center gap-2 font-semibold cursor-pointer overflow-hidden ${
        compact
          ? 'min-h-[32px] px-2.5 py-1 text-[11.5px]'
          : 'min-h-[36px] px-3 py-1.5 text-[12px]'
      }`}
      title={safeHref}
    >
      <ExternalLink size={14} className="shrink-0 text-[var(--accent-success)]" />
      <span className="truncate">{label}</span>
      {hostPreview && (
        <span className="text-[11px] font-normal text-[var(--text-secondary)] truncate hidden xs:inline sm:inline">
          ({hostPreview})
        </span>
      )}
    </a>
  );
};

export const PixelFieldLabel: React.FC<{
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block font-pixel-ui text-[11px] uppercase tracking-wide text-[var(--text-secondary)] mb-1 leading-snug"
  >
    {children}
  </label>
);

export const PixelInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = ({ className = '', ...rest }) => (
  <input
    className={`pixel-box-inset pixel-focus w-full min-w-0 min-h-[42px] px-3 py-1.5 text-[14px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-inset)] outline-none ${className}`}
    {...rest}
  />
);

export const PixelSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement>
> = ({ className = '', children, ...rest }) => (
  <select
    className={`pixel-box-inset pixel-focus w-full min-w-0 min-h-[42px] px-3 py-1.5 text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-inset)] outline-none cursor-pointer ${className}`}
    {...rest}
  >
    {children}
  </select>
);

export const DungeonOptGroupOptions: React.FC<{ dungeons: Dungeon[] }> = ({
  dungeons,
}) => {
  const groups = groupDungeonsByTier(dungeons);
  return (
    <>
      {groups.map((group) => (
        <optgroup key={group.tier} label={group.tier}>
          {group.items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.guildCode} — {d.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
};

export const PixelTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ className = '', ...rest }) => (
  <textarea
    className={`pixel-box-inset pixel-focus w-full px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-inset)] outline-none leading-relaxed ${className}`}
    {...rest}
  />
);

export const PixelExpBar: React.FC<{
  percent: number;
  labelLeft?: string;
  labelRight?: string;
  color?: string;
}> = ({
  percent,
  labelLeft,
  labelRight,
  color = 'var(--accent-warning)',
}) => {
  const { theme } = useActiveTheme();
  const safePercent = Math.max(0, Math.min(100, percent));

  if (theme === 'gameboy_green') {
    return (
      <CleanProgressIndicator
        percent={safePercent}
        labelLeft={labelLeft}
        labelRight={labelRight}
      />
    );
  }

  return (
    <div>
      {(labelLeft || labelRight) && (
        <div className="flex items-center justify-between text-[13px] font-bold text-[var(--text-secondary)] mb-1 tabular-nums">
          <span>{labelLeft}</span>
          <span>{labelRight}</span>
        </div>
      )}
      <div
        className={`pixel-box-inset h-4 w-full p-0.5 ${
          theme === 'daylight_rpg' ? '!rounded-full overflow-hidden' : ''
        }`}
      >
        <div
          className={`h-full transition-all duration-200 ${
            theme === 'daylight_rpg' ? 'rounded-full candy-progress-fill' : ''
          }`}
          style={{
            width: `${safePercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export const PixelEmptyChest: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
}> = ({
  title = 'No Scrolls Found in This Chest!',
  description = 'Belum ada gulungan atau catatan di dalam peti ini.',
  action,
}) => {
  const { theme } = useActiveTheme();
  const illustration = <ThemeEmptyIllustration theme={theme} size={76} />;

  if (theme === 'daylight_rpg') {
    return (
      <MascotEmptyState
        illustration={illustration}
        title={title}
        description={description}
        action={action}
      />
    );
  }

  return (
    <div className="pixel-box p-6 flex flex-col items-center text-center gap-3">
      {illustration}
      <h3 className="font-pixel-display text-[13.5px] text-[var(--accent-warning)] leading-relaxed">
        {title}
      </h3>
      <p className="font-pixel-body text-[15px] text-[var(--text-secondary)] max-w-[32ch]">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export const PixelModal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  const { theme } = useActiveTheme();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`pixel-box w-full max-w-[480px] sm:max-w-[580px] max-h-[88vh] flex flex-col bg-[var(--bg-canvas)] overflow-hidden ${
          theme === 'daylight_rpg' ? '!rounded-t-[24px] sm:!rounded-[24px]' : ''
        }`}
      >
        <div
          className={`flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-[var(--border-pixel)] bg-[var(--surface-tint)] min-w-0 ${
            theme === 'gameboy_green' ? '!border-b border-[#d6d1c7]' : ''
          }`}
        >
          <h3 className="font-pixel-display text-[13px] sm:text-[14px] text-[var(--text-primary)] truncate min-w-0">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="pixel-btn min-w-[38px] min-h-[38px] shrink-0 flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto overflow-x-hidden pixel-scroll space-y-4 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PixelConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) => (
  <PixelModal open={open} title={title} onClose={onCancel}>
    <p className="font-pixel-body text-[16px] text-[var(--text-primary)]">
      {message}
    </p>
    <div className="grid grid-cols-2 gap-3 pt-2">
      <PixelButton type="button" variant="neutral" onClick={onCancel}>
        Cancel
      </PixelButton>
      <PixelButton type="button" variant="danger" onClick={onConfirm}>
        {confirmLabel}
      </PixelButton>
    </div>
  </PixelModal>
);

export const AccessDeniedModal: React.FC<{
  open: boolean;
  attemptedRoute: string | null;
  onReturnToHub: () => void;
}> = ({ open, attemptedRoute, onReturnToHub }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Access Denied"
    >
      <div className="pixel-box w-full max-w-[420px] p-5 bg-[var(--bg-canvas)] text-center space-y-4">
        <div className="flex justify-center">
          <PixelShieldDenied size={84} />
        </div>
        <h2 className="font-pixel-display text-[14px] text-[var(--accent-danger)] leading-relaxed">
          ACCESS DENIED! YOUR LEVEL IS TOO LOW!
        </h2>
        <p className="font-pixel-body text-[15px] text-[var(--text-secondary)]">
          Akun Hero beroperasi dalam mode Read-Only. Area{' '}
          <span className="text-[var(--accent-warning)] font-semibold">
            {attemptedRoute || 'Game Master'}
          </span>{' '}
          hanya dapat diakses oleh Guild Master.
        </p>
        <PixelButton
          type="button"
          variant="warning"
          fullWidth
          onClick={onReturnToHub}
        >
          Return to Town Hub
        </PixelButton>
      </div>
    </div>
  );
};

export const PixelToast: React.FC<{
  message: string | null;
  tone?: 'success' | 'warning' | 'danger';
}> = ({ message, tone = 'success' }) => {
  const { theme } = useActiveTheme();
  if (!message) return null;

  const toneStyles =
    tone === 'danger'
      ? 'bg-[#be123c] text-white border-[#18181b]'
      : tone === 'warning'
        ? 'bg-[#fef3c7] text-[#18181b] border-[#18181b]'
        : 'bg-[#15803d] text-white border-[#18181b]';

  const Icon =
    tone === 'danger'
      ? XCircle
      : tone === 'warning'
        ? AlertTriangle
        : CheckCircle2;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[440px] pointer-events-none"
    >
      <div
        className={`border-2 px-3.5 py-2.5 flex items-center justify-center gap-2 text-[12.5px] sm:text-[13px] font-semibold leading-snug text-center ${
          theme === 'daylight_rpg'
            ? 'rounded-2xl shadow-[0_4px_0_rgba(30,78,104,0.25)]'
            : theme === 'gameboy_green'
              ? 'rounded-lg shadow-sm'
              : 'rounded-[var(--btn-radius)] shadow-[3px_3px_0_0_#18181b]'
        } ${toneStyles}`}
      >
        <Icon size={16} className="shrink-0" />
        <span className="break-words min-w-0">{message}</span>
      </div>
    </div>
  );
};
