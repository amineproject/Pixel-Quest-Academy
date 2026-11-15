import React from 'react';

export interface PixelSkeletonProps {
  /** Number of list cards to render below the header placeholder. */
  cards?: number;
}

/**
 * Pixel-framed skeleton loading placeholder used for lazy route Suspense
 * fallbacks and asynchronous data hydration states.
 */
export const PixelCardSkeleton: React.FC<PixelSkeletonProps> = ({ cards = 3 }) => (
  <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Memuat konten...">
    <div className="pixel-box p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-[var(--btn-radius)] bg-[var(--bg-inset)] border border-[var(--border-pixel)]/40 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3 w-28 rounded bg-[var(--bg-inset)]" />
          <div className="h-4 w-48 max-w-full rounded bg-[var(--surface-tint)]/60" />
          <div className="h-3 w-36 max-w-full rounded bg-[var(--bg-inset)]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="h-16 pixel-box-inset bg-[var(--bg-inset)]" />
        <div className="h-16 pixel-box-inset bg-[var(--bg-inset)]" />
      </div>
    </div>

    <div className="space-y-2.5">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="pixel-box p-4 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-[var(--surface-tint)]/50" />
          <div className="h-3 w-full rounded bg-[var(--bg-inset)]" />
          <div className="h-3 w-4/5 rounded bg-[var(--bg-inset)]" />
        </div>
      ))}
    </div>
  </div>
);
