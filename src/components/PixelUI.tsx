import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { PixelChestEmpty, PixelShieldDenied } from './PixelArt';
import { Dungeon } from '../types/lms';
import {
  formatLinkDisplay,
  groupDungeonsByTier,
  normalizeExternalUrl,
} from '../utils/exp';

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
    'bg-[var(--accent-warning)] hover:brightness-110 text-[var(--text-on-warning)]',
  danger:
    'bg-[var(--accent-danger)] hover:brightness-110 text-[var(--text-on-danger)]',
  neutral:
    'bg-[var(--bg-surface-alt)] hover:brightness-95 text-[var(--text-primary)]',
};

const SIZE_CLASSES = {
  sm: 'min-h-[40px] px-3 py-1.5 text-[11px]',
  md: 'min-h-[44px] px-4 py-2 text-[12px]',
  lg: 'min-h-[48px] px-5 py-2.5 text-[13px]',
};

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <button
      className={`pixel-btn font-pixel-ui inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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
}> = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-2.5 mb-2.5 min-w-0">
    <div className="min-w-0 flex-1">
      <h2 className="font-pixel-display text-[11.5px] sm:text-[13px] tracking-wide text-[var(--text-primary)] break-words [overflow-wrap:anywhere]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5 leading-snug break-words">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

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
      <ExternalLink size={14} className="shrink-0 text-[var(--accent-primary)]" />
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
    className="block font-pixel-ui text-[9.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-1"
  >
    {children}
  </label>
);

export const PixelInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = ({ className = '', ...rest }) => (
  <input
    className={`pixel-box-inset pixel-focus w-full min-h-[40px] px-3 py-1.5 text-[14px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-inset)] outline-none ${className}`}
    {...rest}
  />
);

export const PixelSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement>
> = ({ className = '', children, ...rest }) => (
  <select
    className={`pixel-box-inset pixel-focus w-full min-h-[40px] px-3 py-1.5 text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-inset)] outline-none cursor-pointer ${className}`}
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
  const safePercent = Math.max(0, Math.min(100, percent));
  return (
    <div>
      {(labelLeft || labelRight) && (
        <div className="flex items-center justify-between text-[15px] font-pixel-body text-[var(--text-secondary)] mb-1 tabular-nums">
          <span>{labelLeft}</span>
          <span>{labelRight}</span>
        </div>
      )}
      <div className="pixel-box-inset h-4 w-full p-0.5">
        <div
          className="h-full transition-all duration-200"
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
}) => (
  <div className="pixel-box p-6 flex flex-col items-center text-center gap-3">
    <PixelChestEmpty size={76} />
    <h3 className="font-pixel-display text-[12px] text-[var(--accent-warning)] leading-relaxed">
      {title}
    </h3>
    <p className="font-pixel-body text-[18px] text-[var(--text-secondary)] max-w-[30ch]">
      {description}
    </p>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

export const PixelModal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="pixel-box w-full max-w-[468px] sm:max-w-[540px] max-h-[88vh] flex flex-col bg-[var(--bg-canvas)] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-[var(--border-pixel)] bg-[var(--surface-tint)] min-w-0">
          <h3 className="font-pixel-display text-[11px] text-[var(--text-primary)] truncate min-w-0">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="pixel-btn min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
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
    <p className="font-pixel-body text-[19px] text-[var(--text-primary)]">
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
        <h2 className="font-pixel-display text-[13px] text-[var(--accent-danger)] leading-relaxed">
          ACCESS DENIED! YOUR LEVEL IS TOO LOW!
        </h2>
        <p className="font-pixel-body text-[19px] text-[var(--text-secondary)]">
          Akun Hero beroperasi dalam mode Read-Only. Area{' '}
          <span className="text-[var(--accent-warning)]">
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
  if (!message) return null;
  const bg =
    tone === 'danger'
      ? 'bg-[var(--accent-danger)] text-[var(--text-on-danger)]'
      : tone === 'warning'
        ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
        : 'bg-[var(--accent-success)] text-[var(--text-on-success)]';

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[432px] pointer-events-none">
      <div
        className={`pixel-box px-4 py-2.5 font-pixel-ui text-[11px] text-center ${bg}`}
      >
        {message}
      </div>
    </div>
  );
};
