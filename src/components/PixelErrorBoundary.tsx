import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { PixelButton } from './PixelUI';

export interface PixelErrorBoundaryProps {
  /** Optional label for the section protected by this boundary. */
  scopeLabel?: string;
  /** Optional callback to reset navigation or state to a safe fallback route. */
  onRecoverHome?: () => void;
  children: React.ReactNode;
}

interface PixelErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global and section-level React Error Boundary with retro RPG crash recovery UI.
 * Prevents unexpected component runtime errors from blanking out the entire screen.
 */
export class PixelErrorBoundary extends React.Component<
  PixelErrorBoundaryProps,
  PixelErrorBoundaryState
> {
  constructor(props: PixelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): PixelErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Terjadi kesalahan komponen yang tidak terduga.';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[PixelErrorBoundary]', this.props.scopeLabel || 'App', error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleReturnHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onRecoverHome) {
      this.props.onRecoverHome();
    } else {
      window.location.hash = '';
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="w-full max-w-[520px] mx-auto my-6 pixel-box p-5 space-y-4 bg-[var(--bg-surface)] text-center"
      >
        <div className="w-12 h-12 mx-auto rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[#fef2f2] text-[var(--accent-danger)] flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1.5">
          <p className="font-pixel-ui text-[10px] uppercase tracking-wider text-[var(--accent-danger)]">
            Portal Terganggu · {this.props.scopeLabel || 'System Guard'}
          </p>
          <h2 className="font-pixel-display text-[15px] text-[var(--text-primary)]">
            Ups! Terjadi Gangguan di Layar Ini
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed break-words">
            {this.state.errorMessage || 'Komponen gagal dimuat sementara.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <PixelButton type="button" variant="warning" onClick={this.handleRetry}>
            <RotateCcw size={15} />
            Coba Lagi
          </PixelButton>
          <PixelButton type="button" variant="primary" onClick={this.handleReturnHome}>
            <Home size={15} />
            Kembali Aman
          </PixelButton>
        </div>
      </div>
    );
  }
}
