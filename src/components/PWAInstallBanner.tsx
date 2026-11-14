import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { PixelButton, PixelModal } from './PixelUI';

export const PWAInstallButton: React.FC<{
  compact?: boolean;
  showGuideFallback?: boolean;
}> = ({ compact = false, showGuideFallback = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`pixel-btn bg-[var(--comic-gold)] text-[#09090f] font-pixel-ui font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
          compact
            ? 'min-h-[34px] px-2.5 py-1 text-[10px]'
            : 'min-h-[42px] px-3.5 py-2 text-[11px] w-full'
        }`}
        title="Pasang aplikasi ke Layar Utama HP"
      >
        <Download size={compact ? 14 : 16} className="shrink-0" />
        <span className="whitespace-nowrap">
          {compact ? 'Install App' : 'Pasang ke Layar Utama HP (PWA)'}
        </span>
      </button>
    );
  }

  if (isIOS || showGuideFallback) {
    return (
      <>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className={`pixel-btn bg-[var(--comic-gold)] text-[#09090f] font-pixel-ui font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
            compact
              ? 'min-h-[34px] px-2.5 py-1 text-[10px]'
              : 'min-h-[42px] px-3.5 py-2 text-[11px] w-full'
          }`}
          title="Panduan pasang ke Layar Utama HP"
        >
          <Smartphone size={compact ? 14 : 16} className="shrink-0" />
          <span className="whitespace-nowrap">
            {compact ? 'Pasang App' : 'Pasang ke Layar Utama HP (PWA)'}
          </span>
        </button>

        <PixelModal
          open={guideOpen}
          title="Pasang ke Layar Utama HP"
          onClose={() => setGuideOpen(false)}
        >
          <div className="space-y-3 text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <p className="text-[var(--text-primary)] font-semibold">
              Buka Pixel Quest Academy langsung dari layar utama HP seperti aplikasi native:
            </p>
            {isIOS ? (
              <div className="pixel-box-inset p-3 space-y-2">
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Share size={15} className="text-[var(--accent-success)]" />
                  Untuk iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[12.5px]">
                  <li>
                    Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah Safari.
                  </li>
                  <li>
                    Gulir ke bawah lalu pilih{' '}
                    <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="pixel-box-inset p-3 space-y-2">
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Smartphone size={15} className="text-[var(--accent-success)]" />
                  Untuk Android (Chrome / Edge):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[12.5px]">
                  <li>
                    Ketuk ikon titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.
                  </li>
                  <li>
                    Pilih <strong>Tambahkan ke layar utama</strong> atau{' '}
                    <strong>Instal aplikasi</strong>.
                  </li>
                  <li>
                    Ketuk <strong>Instal</strong> dan ikon aplikasi akan muncul di layar utama HP.
                  </li>
                </ol>
              </div>
            )}
            <PixelButton
              type="button"
              variant="primary"
              fullWidth
              onClick={() => setGuideOpen(false)}
            >
              Mengerti
            </PixelButton>
          </div>
        </PixelModal>
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 sm:bottom-4 left-3 z-50 flex items-center gap-2 rounded-md border-2 border-[#09090f] bg-[var(--comic-gold)] px-3 py-1.5 text-[11.5px] font-bold text-[#09090f] shadow-[3px_3px_0_0_#09090f]"
    >
      <WifiOff size={14} className="shrink-0" />
      <span>Mode Offline — Data tersimpan lokal digunakan</span>
    </div>
  );
};
