import React from 'react';
import {
  Award,
  CheckCircle2,
  Code2,
  History,
  Info,
  Layers,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { PixelTheme, UserRole } from '../../types/lms';
import { PixelStar } from '../../components/PixelArt';
import { PixelSectionTitle } from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import { THEME_STYLES } from '../../utils/themes';

interface AboutViewProps {
  role: UserRole;
  currentTheme: PixelTheme;
}

const APP_VERSION = '3.0';
const APP_DEVELOPER = 'Amin Wayudi, S.Pd.';

interface VersionLog {
  version: string;
  title: string;
  badge: string;
  isCurrent?: boolean;
  changes: string[];
}

const CHANGELOG: VersionLog[] = [
  {
    version: '3.0',
    title: 'Pengelompokan Kelas-Mapel, Pop-Up Reader & Kolektif Excel',
    badge: 'TERBARU · SAAT INI',
    isCurrent: true,
    changes: [
      'Penambahan mode Pop-Up detail materi dan instruksi tugas pada akun Guru maupun Siswa agar daftar lebih ringkas dan mudah dibaca.',
      'Pengelompokan menu Tugas dan Penilaian berdasarkan Kelas serta Mata Pelajaran yang diajarkan.',
      'Penjadwalan tayang otomatis Per-Kelas (menyesuaikan hari & jam pelajaran tiap kelas) untuk Pengumuman, Materi, dan Tugas.',
      'Fitur unggah & unduh file Excel (.xlsx) kolektif untuk Data Siswa (pembacaan presisi NIM/NIS/NISN) dan Tabel Penilaian.',
      'Penambahan fitur Hapus Data Terpilih dan Hapus Semua data dengan dialog konfirmasi di menu Kelas, Siswa, Mapel, Materi, dan Tugas.',
      'Peningkatan 10 Lencana Prestasi & Streak privat pada akun Siswa serta optimasi tampilan layar HP Portrait.',
    ],
  },
  {
    version: '2.0',
    title: '5 Identitas Tema Visual, Sidebar Permanen & Cloud Sync',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Hadir dengan 5 dunia tema visual berbeda: Cozy Pixel Quest, Soft Chibi Classroom, 16-Bit Royal Chronicle, Comic-Pop Arcade, dan Clean Paper Studio.',
      'Navigasi sidebar permanen untuk tampilan tablet & desktop serta sinkronisasi Cloud real-time.',
      'Dukungan Progressive Web App (PWA) agar aplikasi dapat dipasang dan tetap stabil di berbagai perangkat.',
    ],
  },
  {
    version: '1.0',
    title: 'Rilis Awal Pixel Quest Academy LMS',
    badge: 'FONDASI AWAL',
    changes: [
      'Sistem akses terpisah antara akun Guru/Admin (Game Master) dan akun Siswa (Hero Read-Only) dengan Username/NIS/NIM & PIN.',
      'Pengelolaan lengkap Kelas (Dungeons), Siswa (Heroes), Mapel (Realms), Pengumuman, Materi, Tugas, dan Penilaian simbolik + EXP.',
    ],
  },
];

export const AboutView: React.FC<AboutViewProps> = ({ role, currentTheme }) => {
  const isGm = role === UserRole.GAME_MASTER;
  const activeThemeMeta = THEME_STYLES.find((t) => t.id === currentTheme);

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Tentang Aplikasi"
        subtitle="Informasi versi, riwayat perkembangan, dan pengembang sistem"
      />

      {/* App Identity & Developer Card */}
      <ThemedPanelCard className="p-4 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[var(--border-pixel)]/40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--comic-gold)] flex items-center justify-center shrink-0 shadow-[2px_2px_0_var(--shadow-ink)]">
              <PixelStar size={24} className="animate-pixel-float" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-pixel-display text-[13px] sm:text-[15px] text-[var(--text-primary)] leading-snug">
                  Pixel Quest Academy
                </h2>
                <span className="font-pixel-ui text-[10px] px-2 py-0.5 border border-[var(--border-pixel)] bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold">
                  VERSI {APP_VERSION}
                </span>
              </div>
              <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-snug">
                Learning Management System (LMS) interaktif berbasis gamifikasi dengan pengelompokan kelas &amp; mata pelajaran.
              </p>
            </div>
          </div>
        </div>

        {/* Highlighted Developer & Version Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="pixel-box-inset p-3 bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 flex items-center gap-3">
            <span className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--accent-success)] text-[var(--text-on-success)] flex items-center justify-center shrink-0">
              <UserCheck size={19} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-ui text-[9.5px] text-[var(--text-muted)] uppercase">
                Pengembang Aplikasi
              </p>
              <p className="text-[14px] font-bold text-[var(--text-primary)] break-words">
                {APP_DEVELOPER}
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-3 bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 flex items-center gap-3">
            <span className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--accent-warning)] text-[var(--text-on-warning)] flex items-center justify-center shrink-0">
              <Code2 size={19} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-ui text-[9.5px] text-[var(--text-muted)] uppercase">
                Versi Rilis Aktif
              </p>
              <p className="text-[14px] font-bold text-[var(--text-primary)]">
                Versi {APP_VERSION} (Stabil)
              </p>
            </div>
          </div>
        </div>

        {/* Context Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-pixel)]/50 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-semibold">
            <Shield size={13} className="text-[var(--accent-primary)]" />
            Mode Akses: {isGm ? 'Akun Guru / Admin (Game Master)' : 'Akun Siswa (Hero · Read-Only)'}
          </span>
          {activeThemeMeta && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-pixel)]/50 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-semibold">
              <Layers size={13} className="text-[var(--accent-warning)]" />
              Tema Aktif: {activeThemeMeta.label}
            </span>
          )}
        </div>
      </ThemedPanelCard>

      {/* Development History / Changelog */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <History size={16} className="text-[var(--accent-warning)] shrink-0" />
          <h3 className="font-pixel-ui text-[11px] sm:text-[12px] text-[var(--text-primary)] uppercase tracking-wide">
            Perkembangan yang Telah Dibuat
          </h3>
        </div>

        {CHANGELOG.map((release) => (
          <ThemedPanelCard
            key={release.version}
            className={`p-3.5 sm:p-4 space-y-2.5 ${
              release.isCurrent ? 'ring-2 ring-[var(--accent-primary)]/70' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={`font-pixel-ui text-[10px] px-2 py-0.5 border border-[var(--border-pixel)] font-bold ${
                    release.isCurrent
                      ? 'bg-[var(--accent-success)] text-[var(--text-on-success)]'
                      : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  }`}
                >
                  v{release.version}
                </span>
                <h4 className="text-[13.5px] sm:text-[14px] font-bold text-[var(--text-primary)] leading-snug">
                  {release.title}
                </h4>
              </div>
              <span className="font-pixel-ui text-[9px] px-2 py-0.5 bg-[var(--bg-surface-alt)] border border-[var(--border-pixel)]/50 text-[var(--accent-warning)] shrink-0">
                {release.badge}
              </span>
            </div>

            <ul className="space-y-1.5">
              {release.changes.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[12.5px] sm:text-[13px] text-[var(--text-secondary)] leading-relaxed"
                >
                  <CheckCircle2
                    size={15}
                    className={`mt-0.5 shrink-0 ${
                      release.isCurrent
                        ? 'text-[var(--accent-success)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ThemedPanelCard>
        ))}
      </div>

      {/* Footer Note */}
      <ThemedPanelCard className="p-3.5 flex items-start gap-3 bg-[var(--bg-surface-alt)]">
        <span className="w-8 h-8 rounded-[var(--btn-radius)] border border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
          {isGm ? <Award size={16} /> : <Sparkles size={16} />}
        </span>
        <div className="min-w-0 text-[12px] text-[var(--text-secondary)] leading-relaxed">
          <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Info size={13} className="text-[var(--accent-warning)]" />
            Pixel Quest Academy v{APP_VERSION}
          </p>
          <p className="mt-0.5">
            Dikembangkan oleh <strong className="text-[var(--text-primary)]">{APP_DEVELOPER}</strong> untuk mendukung pembelajaran yang lebih terstruktur, menyenangkan, dan mudah diakses di perangkat HP maupun komputer.
          </p>
        </div>
      </ThemedPanelCard>
    </div>
  );
};
