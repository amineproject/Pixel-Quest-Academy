import React, { useState } from 'react';
import {
  ArrowRight,
  Cloud,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AcademyState,
  HeroStudent,
  PixelTheme,
  UserRole,
} from '../../types/lms';
import {
  PixelAvatar,
  PixelCoin,
  PixelMascotSlime,
  PixelStar,
} from '../../components/PixelArt';
import {
  PixelButton,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
} from '../../components/PixelUI';
import { PWAInstallButton } from '../../components/PWAInstallBanner';
import {
  ThemeBackdropIllustration,
  ThemeMascotIllustration,
} from '../../components/ThemeArtwork';
import {
  ChibiWelcomeCard,
  ComicPanel,
  KingdomQuestBoard,
  RPGDialogueCard,
} from '../../components/ThemePrimitives';
import { THEME_STYLES } from '../../utils/themes';
import { playRetroSound } from '../../utils/sound';
import {
  isSupabaseConfigured,
  saveSupabaseConfig,
  testSupabaseConnection,
  verifyGmLoginCloud,
  verifyHeroLoginCloud,
} from '../../lib/supabase';

interface LoginViewProps {
  state: AcademyState;
  onLoginAsHero: (hero: HeroStudent, pin?: string) => void;
  onLoginAsGm: (username: string, password: string) => void;
  onUpdateTheme: (theme: PixelTheme) => void;
  onToggleSound: () => void;
  onSyncData: () => Promise<AcademyState | null>;
}

export const LoginView: React.FC<LoginViewProps> = ({
  state,
  onLoginAsHero,
  onLoginAsGm,
  onUpdateTheme,
  onToggleSound,
  onSyncData,
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(UserRole.HERO);

  // Hero manual input
  const [heroIdentifier, setHeroIdentifier] = useState('');
  const [heroPin, setHeroPin] = useState('');
  const [showHeroPin, setShowHeroPin] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [isCheckingHero, setIsCheckingHero] = useState(false);

  // GM manual input (start empty, never pre-fill dummy dots or bypass passwords)
  const [gmUsername, setGmUsername] = useState('');
  const [gmPassword, setGmPassword] = useState('');
  const [showGmPass, setShowGmPass] = useState(false);
  const [gmError, setGmError] = useState<string | null>(null);
  const [isCheckingGm, setIsCheckingGm] = useState(false);

  // Cross-Device Cloud Connect Modal (for opening on a fresh device)
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [cloudInput, setCloudInput] = useState('');
  const [cloudKeyInput, setCloudKeyInput] = useState('');
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);

  const handleHeroManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError(null);
    const query = heroIdentifier.trim().toLowerCase();
    const cleanPin = heroPin.trim();
    if (!query) {
      setHeroError('Masukkan NIS atau Username Hero!');
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    setIsCheckingHero(true);
    const synced = await onSyncData();
    const latestState = synced || state;

    const matched = latestState.heroes.find(
      (h) =>
        (h.username.trim() !== '' && h.username.toLowerCase() === query) ||
        h.studentCode.toLowerCase() === query
    );

    if (isSupabaseConfigured()) {
      const cloudRes = await verifyHeroLoginCloud(query, cleanPin);
      setIsCheckingHero(false);

      if (cloudRes.hardened) {
        if (!cloudRes.ok) {
          const errMap: Record<string, string> = {
            not_found:
              'Akun Hero tidak ditemukan! Pastikan NIS atau Username akunmu sudah benar.',
            inactive:
              'Akun Hero ini sedang dinonaktifkan oleh Guru (Game Master).',
            pin_required:
              'Akun ini dilindungi PIN Rahasia! Masukkan PIN Rahasia akunmu.',
            invalid_pin: 'PIN Rahasia salah! Periksa kembali PIN akunmu.',
          };
          setHeroError(
            errMap[cloudRes.error || ''] ||
              cloudRes.error ||
              'Gagal masuk ke akun Hero.'
          );
          playRetroSound('error', latestState.settings.soundEnabled);
          return;
        }

        const verifiedHero =
          latestState.heroes.find((h) => h.id === cloudRes.heroId) || matched;
        if (!verifiedHero) {
          setHeroError('Data profil Hero belum tersinkron. Klik tombol Sync lalu coba lagi.');
          playRetroSound('error', latestState.settings.soundEnabled);
          return;
        }
        playRetroSound('start', latestState.settings.soundEnabled);
        onLoginAsHero({ ...verifiedHero, hasPin: cloudRes.hasPin ?? verifiedHero.hasPin }, cleanPin);
        return;
      }
    }

    // Non-Supabase mode: verify via Express/Cloud SQL API if running, else local roster
    try {
      const apiRes = await fetch('/api/auth/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: query, pin: cleanPin }),
      });
      const contentType = apiRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await apiRes.json();
        setIsCheckingHero(false);
        if (!apiRes.ok || !data.ok) {
          const errMap: Record<string, string> = {
            not_found: 'Akun Hero tidak ditemukan! Pastikan NIS/Username benar.',
            inactive: 'Akun Hero ini sedang dinonaktifkan oleh Guru (Game Master).',
            pin_required: 'Akun ini dilindungi PIN Rahasia! Masukkan PIN Rahasia akunmu.',
            invalid_pin: 'PIN Rahasia salah! Periksa kembali PIN akunmu.',
          };
          setHeroError(errMap[data.error || ''] || 'Gagal masuk ke akun Hero.');
          playRetroSound('error', latestState.settings.soundEnabled);
          return;
        }
        const verifiedHero =
          latestState.heroes.find((h) => h.id === data.heroId) || matched;
        if (verifiedHero) {
          playRetroSound('start', latestState.settings.soundEnabled);
          onLoginAsHero({ ...verifiedHero, hasPin: Boolean(data.hasPin) }, cleanPin);
          return;
        }
      }
    } catch {
      // Static local mode without Express server
    }

    setIsCheckingHero(false);

    if (!matched) {
      setHeroError('Akun Hero tidak ditemukan! Pastikan NIS atau Username akunmu sudah benar.');
      playRetroSound('error', latestState.settings.soundEnabled);
      return;
    }

    if (!matched.active) {
      setHeroError('Akun Hero ini sedang dinonaktifkan oleh Guru (Game Master).');
      playRetroSound('error', latestState.settings.soundEnabled);
      return;
    }

    if (matched.pin && matched.pin !== cleanPin) {
      setHeroError(
        cleanPin
          ? 'PIN Rahasia salah! Periksa kembali PIN akunmu.'
          : 'Akun ini dilindungi PIN Rahasia! Masukkan PIN Rahasia akunmu.'
      );
      playRetroSound('error', latestState.settings.soundEnabled);
      return;
    }

    playRetroSound('start', latestState.settings.soundEnabled);
    onLoginAsHero(matched, cleanPin);
  };

  const handleGmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGmError(null);

    const inputUser = gmUsername.trim().toLowerCase();
    const inputPass = gmPassword;

    if (!inputUser) {
      setGmError('Masukkan username Game Master!');
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    if (!inputPass) {
      setGmError('Masukkan password Game Master!');
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    setIsCheckingGm(true);

    if (isSupabaseConfigured()) {
      const gmRes = await verifyGmLoginCloud(inputUser, inputPass);
      if (gmRes.hardened) {
        setIsCheckingGm(false);
        if (gmRes.ok) {
          playRetroSound('start', state.settings.soundEnabled);
          onLoginAsGm(gmUsername.trim(), inputPass);
        } else if (gmRes.error === 'rpc_required') {
          setGmError(
            'Database memakai proteksi terenkripsi baru. Jalankan ulang supabase-schema.sql di Supabase SQL Editor.'
          );
          playRetroSound('error', state.settings.soundEnabled);
        } else {
          setGmError('Username atau Password Game Master salah!');
          playRetroSound('error', state.settings.soundEnabled);
        }
        return;
      }

      if (gmRes.ok) {
        setIsCheckingGm(false);
        playRetroSound('start', state.settings.soundEnabled);
        onLoginAsGm(gmUsername.trim(), inputPass);
        return;
      }

      // If legacy Cloud settings row existed and failed, or password is protected, never fall back to local 'admin'
      if (!gmRes.error) {
        setIsCheckingGm(false);
        setGmError('Username atau Password Game Master salah!');
        playRetroSound('error', state.settings.soundEnabled);
        return;
      }

      if (gmRes.error !== 'no_settings') {
        setIsCheckingGm(false);
        setGmError(
          `Gagal memverifikasi kredensial GM di Cloud (${gmRes.error}). Periksa koneksi Supabase atau jalankan supabase-schema.sql.`
        );
        playRetroSound('error', state.settings.soundEnabled);
        return;
      }
    }

    const synced = await onSyncData();
    const latestState = synced || state;
    setIsCheckingGm(false);

    if (
      isSupabaseConfigured() &&
      (!latestState.gmProfile.password ||
        latestState.gmProfile.password === '[PROTECTED]')
    ) {
      setGmError(
        'Kredensial GM Cloud tidak dapat diverifikasi. Pastikan skema supabase-schema.sql sudah dijalankan.'
      );
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    const expectedUsername = (latestState.gmProfile.username || 'admin').trim().toLowerCase();
    const expectedPassword = latestState.gmProfile.password || 'admin';

    // Strict credential verification: exact match with configured username & password only
    const isMatch =
      inputUser === expectedUsername && inputPass === expectedPassword;

    if (isMatch) {
      playRetroSound('start', latestState.settings.soundEnabled);
      onLoginAsGm(gmUsername.trim(), inputPass);
    } else {
      setGmError('Username atau Password Game Master salah!');
      playRetroSound('error', latestState.settings.soundEnabled);
    }
  };

  const handleManualSyncClick = async () => {
    setIsCloudBusy(true);
    setCloudStatus(null);
    const synced = await onSyncData();
    setIsCloudBusy(false);
    if (synced) {
      setCloudStatus(
        `✓ Data diperbarui (${synced.dungeons.length} kelas, ${synced.heroes.length} siswa).`
      );
    } else {
      setCloudStatus(
        isSupabaseConfigured()
          ? 'Tidak ada data baru di Cloud atau tabel belum diisi.'
          : 'Perangkat ini belum terhubung ke Supabase Cloud. Klik "Hubungkan Cloud" atau buka Link Akses dari Guru.'
      );
    }
  };

  const handleConnectDeviceCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloudStatus(null);

    const raw = cloudInput.trim();
    // Support pasting full ?cloud=... share link directly into the first box!
    if (raw.includes('cloud=')) {
      try {
        const token = raw.split('cloud=')[1].split('&')[0];
        const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(decodeURIComponent(escape(atob(normalized))));
        if (decoded?.u && decoded?.k) {
          saveSupabaseConfig(decoded.u, decoded.k);
          setIsCloudBusy(true);
          const test = await testSupabaseConnection();
          if (test.ok && test.hasCloudData) {
            await onSyncData();
          }
          setIsCloudBusy(false);
          setCloudStatus(test.message);
          if (test.ok) setCloudModalOpen(false);
          return;
        }
      } catch {
        setCloudStatus('Link akses cloud tidak valid.');
        return;
      }
    }

    if (!raw || !cloudKeyInput.trim()) {
      setCloudStatus('Tempel Link Akses Cloud dari Guru atau isi URL & Anon Key Supabase.');
      return;
    }

    saveSupabaseConfig(raw, cloudKeyInput.trim());
    setIsCloudBusy(true);
    const test = await testSupabaseConnection();
    if (test.ok && test.hasCloudData) {
      await onSyncData();
    }
    setIsCloudBusy(false);
    setCloudStatus(test.message);
    if (test.ok) setCloudModalOpen(false);
  };

  const activeTheme = state.settings.theme;
  const isPersonaTheme = activeTheme === 'gameboy_green';
  const isMlbbTheme = activeTheme === 'cyber_retro';

  return (
    <div
      data-theme={activeTheme}
      className="relative min-h-screen w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-6 sm:px-4"
    >
      <ThemeBackdropIllustration theme={activeTheme} />

      {/* Theme-Adaptive Exterior Cabinet / Frame */}
      <div
        className="relative z-10 w-full max-w-[560px] sm:max-w-[640px] md:max-w-[700px] console-bezel transition-all sm:p-3 sm:rounded-xl sm:bg-[var(--bezel-body)] sm:border-2 sm:border-[var(--bezel-trim)] sm:shadow-[6px_6px_0_0_var(--shadow-ink)]"
      >
        {/* Hardware Trim Top */}
        <div className="hidden sm:flex items-center justify-between px-2 pb-2 text-[var(--text-on-bezel)] font-pixel-ui text-[10px] tracking-wider uppercase font-bold">
          <span>
            {activeTheme === 'sunny_quest'
              ? '★ 16-BIT PIXEL · SUPER PAPER STAGE ★'
              : activeTheme === 'daylight_rpg'
                ? '★ 16-BIT PIXEL · POKÉMON CAFÉ REMIX ★'
                : activeTheme === 'nes_classic'
                  ? '★ 16-BIT PIXEL · SPROUT VILLAGE ★'
                  : activeTheme === 'gameboy_green'
                    ? '★ 16-BIT PIXEL · PHANTOM PERSONA ★'
                    : '★ 16-BIT PIXEL · MOBILE LEGENDS ★'}
          </span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-4 h-4 rounded-sm border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[#18181b] text-[9px] flex items-center justify-center leading-none font-bold">
              −
            </span>
            <span className="w-4 h-4 rounded-sm border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[#18181b] text-[8px] flex items-center justify-center leading-none font-bold">
              □
            </span>
            <span className="w-4 h-4 rounded-sm border-2 border-[var(--border-pixel)] bg-[#fb7185] text-[#18181b] text-[9px] flex items-center justify-center leading-none font-bold">
              ×
            </span>
          </div>
        </div>

        {/* Screen Viewport */}
        <div
          className={`relative w-full min-h-screen sm:min-h-[780px] flex flex-col bg-[var(--bg-canvas)] overflow-y-auto pixel-scroll ${
            activeTheme === 'gameboy_green'
              ? 'sm:rounded-[2px] sm:border-2 sm:border-[var(--border-pixel)]'
              : 'sm:rounded-[6px] sm:border-2 sm:border-[var(--border-pixel)]'
          } ${state.settings.crtScanlines ? 'crt-scanlines' : ''}`}
        >
          {/* Top Audio & Brand Bar */}
          <div
            className={`flex items-center justify-between px-3 py-2 shrink-0 ${
              isPersonaTheme
                ? 'bg-[#09090f] text-white border-b-[3px] border-[#e60012] persona-stripes'
                : isMlbbTheme
                  ? 'bg-[#0b1730] text-[#fde68a] border-b-2 border-[#d4a94f]'
                  : 'bg-[var(--surface-tint)] comic-halftone border-b-2 border-[var(--border-pixel)]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <PixelStar size={16} className="animate-pixel-float shrink-0" />
              <span
                className={`font-pixel-ui text-[10.5px] font-bold truncate ${
                  isPersonaTheme
                    ? 'text-white tracking-wider'
                    : isMlbbTheme
                      ? 'text-[#fde68a] tracking-wider'
                      : 'text-[var(--text-primary)]'
                }`}
              >
                PIXEL QUEST ACADEMY
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className="pixel-btn min-h-[32px] px-2 py-1 bg-[var(--bg-surface)] text-[var(--text-primary)] font-pixel-ui text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
              title={state.settings.soundEnabled ? 'Mute Audio SFX' : 'Enable Audio SFX'}
            >
              {state.settings.soundEnabled ? (
                <>
                  <Volume2 size={13} className="text-[var(--accent-success)]" />
                  <span>SFX ON</span>
                </>
              ) : (
                <>
                  <VolumeX size={13} className="text-[var(--text-muted)]" />
                  <span>SFX OFF</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
            {/* 5 Distinct Theme-Specific Title Cards */}
            {activeTheme === 'cyber_retro' ? (
              <ComicPanel className="!bg-gradient-to-b !from-[#12264d] !to-[#0b1730] !border-[#d4a94f] text-white text-center space-y-2.5">
                <div className="flex items-center justify-center gap-3">
                  <PixelStar size={18} className="animate-pixel-float" />
                  <div className="animate-pixel-bounce">
                    <ThemeMascotIllustration theme="cyber_retro" size={56} />
                  </div>
                  <PixelCoin size={20} className="animate-coin-shine" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-block bg-gradient-to-r from-[#f5c84c] via-[#fef08a] to-[#d4a94f] text-[#0b1730] border-2 border-[#78350f] shadow-[0_3px_0_0_#071022] px-4 py-1 rounded-[5px]">
                    <h1 className="font-pixel-display text-[17px] sm:text-[19px] tracking-wide">
                      PIXEL QUEST
                    </h1>
                  </div>
                  <p className="font-pixel-display text-[11.5px] text-[#fde68a] tracking-widest uppercase">
                    LAND OF DAWN · ACADEMY LMS
                  </p>
                  <p className="text-[12.5px] font-semibold text-[#7dd3fc]">
                    ✦ Select Your Hero Role &amp; Push Rank ✦
                  </p>
                </div>
                <div className="pt-0.5">
                  <span className="font-pixel-ui text-[11px] font-bold text-white bg-gradient-to-r from-[#c83218] to-[#df4a26] px-4 py-1 rounded-[5px] border-2 border-[#f5c84c] shadow-[0_3px_0_0_#071022] inline-block">
                    ▶ RANK BATTLE START
                  </span>
                </div>
              </ComicPanel>
            ) : activeTheme === 'sunny_quest' ? (
              <div className="space-y-0">
                {/* 16-Bit Paper Mario TTYD Iconic 5-Color Folder Tabs */}
                <div
                  aria-hidden="true"
                  className="flex items-end gap-1.5 px-3 overflow-hidden"
                >
                  <span className="px-3 py-1 rounded-t-[5px] bg-[#e52521] text-white border-2 border-b-0 border-[#2e1d14] font-pixel-ui text-[11px] font-bold shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]">
                    Hero
                  </span>
                  <span className="px-2.5 py-0.5 rounded-t-[4px] bg-[#7e3f73] text-white/95 border-2 border-b-0 border-[#2e1d14] font-pixel-ui text-[10px] font-bold">
                    Party
                  </span>
                  <span className="px-2.5 py-0.5 rounded-t-[4px] bg-[#a16207] text-white/95 border-2 border-b-0 border-[#2e1d14] font-pixel-ui text-[10px] font-bold">
                    Quests
                  </span>
                  <span className="px-2.5 py-0.5 rounded-t-[4px] bg-[#15803d] text-white/95 border-2 border-b-0 border-[#2e1d14] font-pixel-ui text-[10px] font-bold hidden xs:inline-block sm:inline-block">
                    Badges
                  </span>
                  <span className="px-2.5 py-0.5 rounded-t-[4px] bg-[#1d4ed8] text-white/95 border-2 border-b-0 border-[#2e1d14] font-pixel-ui text-[10px] font-bold hidden sm:inline-block">
                    Journal
                  </span>
                </div>
                <RPGDialogueCard
                  speaker="Stage Guide"
                  metaRight="16-Bit Paper"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-[6px] border-2 border-[#2e1d14] bg-gradient-to-b from-[#60a5fa] via-[#bae6fd] to-[#4ade80] flex items-center justify-center shrink-0 shadow-[3px_3px_0_0_rgba(46,29,20,0.3)]">
                      <div className="animate-pixel-bounce">
                        <ThemeMascotIllustration theme="sunny_quest" size={46} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="font-pixel-display text-[20px] sm:text-[22px] text-[#1e140e] leading-tight">
                        Pixel Quest Academy
                      </h1>
                      <p className="text-[13px] font-bold text-[#433025] leading-snug mt-0.5">
                        Panggung Mario Paper 16-bit! Pilih peranmu untuk memulai petualangan belajar.
                      </p>
                    </div>
                  </div>
                </RPGDialogueCard>
              </div>
            ) : activeTheme === 'daylight_rpg' ? (
              <ChibiWelcomeCard className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-0.5 rounded-[4px] bg-[#c82a36] text-white border-2 border-[#4e2a1e] font-pixel-ui text-[10.5px] font-bold uppercase tracking-wide shadow-[2px_2px_0_0_#7f1d1d]">
                    Café Order · 16-Bit
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3 text-left pt-1">
                  <div className="w-15 h-15 rounded-[6px] bg-[#d6f5f3] border-2 border-[#4e2a1e] flex items-center justify-center shrink-0 animate-pixel-bounce shadow-[3px_3px_0_0_rgba(78,42,30,0.28)]">
                    <ThemeMascotIllustration theme="daylight_rpg" size={46} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="inline-block font-pixel-display text-[20px] sm:text-[22px] text-[#3f2117] leading-tight bg-gradient-to-t from-[#ffe169] via-[#ffe169]/65 to-transparent px-1 rounded-[3px]">
                      Pixel Quest Academy
                    </h1>
                    <p className="text-[13px] font-bold text-[#683c2b] leading-snug mt-1">
                      Selamat datang di Café Piksel 16-bit! Pilih peranmu untuk sajikan materi &amp; selesaikan misi.
                    </p>
                  </div>
                </div>
              </ChibiWelcomeCard>
            ) : activeTheme === 'nes_classic' ? (
              <KingdomQuestBoard headerTitle="Sprout Village Gate">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 border-2 border-[#5c3822] rounded-[4px] bg-[#8ad6cf] flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#5c3822] animate-pixel-bounce">
                    <ThemeMascotIllustration theme="nes_classic" size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-pixel-display text-[19px] sm:text-[21px] text-[#3b2214] leading-tight">
                      Pixel Quest Academy
                    </h1>
                    <p className="text-[12.5px] font-semibold text-[#5c3822] mt-0.5">
                      Desa Game Pixel Pastel · Pilih Peran Petualanganmu
                    </p>
                  </div>
                </div>
              </KingdomQuestBoard>
            ) : (
              <div className="relative bg-[#09090f] text-white border-[2.5px] border-[#09090f] rounded-[2px] p-4 shadow-[6px_6px_0_0_#e60012] overflow-hidden space-y-3">
                {/* Diagonal Crimson Ribbon Cutout */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-6 -right-8 w-32 h-36 bg-[#e60012] rotate-12 border-l-4 border-white/90"
                />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-13 h-13 border-2 border-white bg-[#e60012] shadow-[3px_3px_0_0_#ffe600] flex items-center justify-center shrink-0 animate-pixel-bounce">
                    <ThemeMascotIllustration theme="gameboy_green" size={38} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-block persona-slant bg-[#e60012] border-2 border-white px-2.5 py-0.5 shadow-[2px_2px_0_0_#ffe600]">
                      <h1 className="persona-unslant font-pixel-display text-[17px] sm:text-[19px] text-white tracking-wide leading-tight">
                        PIXEL QUEST
                      </h1>
                    </div>
                    <p className="font-pixel-ui text-[11px] font-bold text-[#ffe600] tracking-widest uppercase mt-1">
                      ACADEMY · PHANTOM EDITION
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[12.5px] font-medium text-zinc-200">
                    Pilih peranmu &amp; taklukkan setiap misi kelas!
                  </p>
                  <span className="persona-slant inline-block bg-[#ffe600] text-[#09090f] border-2 border-[#09090f] px-2.5 py-0.5 font-pixel-ui text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#e60012]">
                    <span className="persona-unslant inline-block">★ TAKE YOUR QUEST</span>
                  </span>
                </div>
              </div>
            )}

            {/* Role Tabs: Hero (Siswa) vs Game Master (Guru) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleTab(UserRole.HERO);
                  playRetroSound('blip', state.settings.soundEnabled);
                }}
                className={`pixel-btn min-h-[46px] p-2 flex items-center justify-center gap-2 font-pixel-ui text-[11px] cursor-pointer ${
                  selectedRoleTab === UserRole.HERO
                    ? 'bg-[var(--accent-success)] text-[var(--text-on-success)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <UserCheck size={16} />
                Hero (Siswa)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoleTab(UserRole.GAME_MASTER);
                  playRetroSound('blip', state.settings.soundEnabled);
                }}
                className={`pixel-btn min-h-[46px] p-2 flex items-center justify-center gap-2 font-pixel-ui text-[11px] cursor-pointer ${
                  selectedRoleTab === UserRole.GAME_MASTER
                    ? 'bg-[var(--comic-gold)] text-[#09090f] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <Crown size={16} />
                Game Master
              </button>
            </div>

            {/* Tab 1: Hero (Student) Mode — Individual Account Login Only */}
            {selectedRoleTab === UserRole.HERO ? (
              <div className="space-y-4">
                <div className="pixel-box p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-pixel-ui text-[11px] text-[var(--accent-success)] flex items-center gap-1.5">
                      <UserCheck size={14} />
                      PORTAL AKUN SISWA
                    </span>
                    <span className="font-pixel-body text-[14px] text-[var(--text-secondary)]">
                      Mode Read-Only
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    Masukkan NIS atau Username akun Hero milikmu untuk melihat pengumuman guild, materi, dan status tugas.
                  </p>
                </div>

                <form onSubmit={handleHeroManualSubmit} autoComplete="off" className="pixel-box p-4 space-y-3">
                  <div>
                    <PixelFieldLabel htmlFor="hero-id-input">
                      NIS Siswa / Username
                    </PixelFieldLabel>
                    <PixelInput
                      id="hero-id-input"
                      name="hero-login-id"
                      autoComplete="off"
                      placeholder="Masukkan NIS atau Username..."
                      value={heroIdentifier}
                      onChange={(e) => {
                        setHeroIdentifier(e.target.value);
                        if (heroError) setHeroError(null);
                      }}
                    />
                  </div>

                  <div>
                    <PixelFieldLabel htmlFor="hero-pin-input">
                      <span className="inline-flex items-center gap-1">
                        <KeyRound size={12} className="text-[var(--accent-warning)]" />
                        PIN Rahasia Siswa
                      </span>
                    </PixelFieldLabel>
                    <div className="flex items-center gap-1.5">
                      <PixelInput
                        id="hero-pin-input"
                        name="hero-login-pin"
                        type={showHeroPin ? 'text' : 'password'}
                        inputMode="numeric"
                        autoComplete="new-password"
                        placeholder="PIN akun (kosongkan jika tidak ada)"
                        value={heroPin}
                        onChange={(e) => {
                          setHeroPin(e.target.value);
                          if (heroError) setHeroError(null);
                        }}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setShowHeroPin((v) => !v)}
                        aria-label={showHeroPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                        className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer shrink-0"
                      >
                        {showHeroPin ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {heroError && (
                    <p className="font-pixel-body text-[16px] text-[var(--accent-danger)] leading-tight">
                      [!] {heroError}
                    </p>
                  )}

                  <PixelButton
                    type="submit"
                    variant="success"
                    fullWidth
                    size="lg"
                    disabled={isCheckingHero}
                  >
                    <ArrowRight size={16} />
                    {isCheckingHero ? 'Menyinkronkan...' : 'Masuk Sebagai Hero'}
                  </PixelButton>

                  <p className="text-[11.5px] text-[var(--text-muted)] text-center leading-snug">
                    Menggunakan perangkat bersama? Pastikan klik <strong>Logout</strong> atau tutup tab setelah selesai.
                  </p>
                </form>
              </div>
            ) : (
              /* Tab 2: Game Master Mode */
              <div className="space-y-4">
                <div className="pixel-box p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <PixelAvatar avatar={state.gmProfile.avatar} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-warning)]">
                        <Crown size={12} />
                        GUILD MASTER
                      </div>
                      <h3 className="font-pixel-display text-[13px] text-[var(--text-primary)] truncate mt-0.5">
                        {state.gmProfile.name}
                      </h3>
                      <p className="font-pixel-body text-[16px] text-[var(--text-secondary)] truncate">
                        {state.gmProfile.title}
                      </p>
                    </div>
                  </div>

                  <div className="pixel-box-inset p-2.5 text-[var(--text-secondary)] font-pixel-body text-[16px] leading-snug">
                    <p className="flex items-center gap-1.5 text-[var(--accent-success)] font-pixel-ui text-[10px] mb-1">
                      <ShieldCheck size={13} />
                      FULL ACCESS PRIVILEGE
                    </p>
                    Akses penuh untuk mengelola 9 Modul: Dungeons, Siswa, Quest Board, Realms, Tomes, Quests, & Penilaian.
                  </div>

                  <div className="pixel-box-inset p-2.5 text-center border-2 border-[var(--accent-warning)] bg-[var(--bg-inset)]">
                    <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)] flex items-center justify-center gap-1.5">
                      <Lock size={13} />
                      WAJIB MASUK DENGAN USERNAME & PASSWORD
                    </span>
                  </div>
                </div>

                {/* GM Credentials Form */}
                <form onSubmit={handleGmSubmit} autoComplete="off" className="pixel-box p-3.5 space-y-2.5">
                  <span className="font-pixel-ui text-[10px] text-[var(--text-muted)] block uppercase">
                    Kredensial Login GM
                  </span>
                  <div>
                    <PixelFieldLabel htmlFor="gm-user-input">
                      Username GM
                    </PixelFieldLabel>
                    <PixelInput
                      id="gm-user-input"
                      name="gm-login-user"
                      autoComplete="off"
                      placeholder="Masukkan username guru..."
                      value={gmUsername}
                      onChange={(e) => {
                        setGmUsername(e.target.value);
                        if (gmError) setGmError(null);
                      }}
                    />
                  </div>
                  <div>
                    <PixelFieldLabel htmlFor="gm-pass-input">
                      Password Guild
                    </PixelFieldLabel>
                    <div className="flex items-center gap-1.5">
                      <PixelInput
                        id="gm-pass-input"
                        name="gm-login-pass"
                        type={showGmPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Masukkan password guru..."
                        value={gmPassword}
                        onChange={(e) => {
                          setGmPassword(e.target.value);
                          if (gmError) setGmError(null);
                        }}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGmPass((v) => !v)}
                        aria-label={showGmPass ? 'Sembunyikan password' : 'Lihat password'}
                        className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer shrink-0"
                      >
                        {showGmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {gmError && (
                    <p className="font-pixel-body text-[16px] text-[var(--accent-danger)] leading-tight">
                      [!] {gmError}
                    </p>
                  )}
                  <PixelButton
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isCheckingGm}
                  >
                    {isCheckingGm ? 'Memeriksa...' : 'Login GM Account'}
                  </PixelButton>
                </form>
              </div>
            )}

            {/* Cross-Device Cloud Sync Helper Bar (Admin / Game Master Only) */}
            {selectedRoleTab === UserRole.GAME_MASTER && (
              <div className="pixel-box-inset p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11.5px] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Cloud size={14} className={isSupabaseConfigured() ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'} />
                    {isSupabaseConfigured()
                      ? 'Cloud Terhubung (Siap Lintas Perangkat)'
                      : 'Buka dari perangkat lain? Hubungkan Cloud'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isCloudBusy}
                      onClick={handleManualSyncClick}
                      className="pixel-btn min-h-[30px] px-2 py-1 text-[10px] font-pixel-ui bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} className={isCloudBusy ? 'animate-spin' : ''} />
                      Sync
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCloudStatus(null);
                        setCloudModalOpen(true);
                      }}
                      className="pixel-btn min-h-[30px] px-2 py-1 text-[10px] font-pixel-ui bg-[var(--bg-surface-alt)] text-[var(--accent-warning)] cursor-pointer"
                    >
                      Hubungkan Cloud
                    </button>
                  </div>
                </div>
                {cloudStatus && (
                  <p className="text-[11.5px] text-[var(--accent-warning)] leading-snug">
                    {cloudStatus}
                  </p>
                )}
              </div>
            )}

            {/* PWA Install Action (Install to Mobile Home Screen) */}
            <PWAInstallButton showGuideFallback />

            {/* Multi-Style Theme Switcher at Bottom of Title Screen */}
            <div className="pt-2 border-t-2 border-[var(--border-pixel)]/20 space-y-2">
              <span className="font-pixel-ui text-[11px] text-[var(--text-secondary)] block text-center">
                PILIH GAYA TAMPILAN &amp; FONT SESUAI SELERAMU
              </span>
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                {THEME_STYLES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      onUpdateTheme(th.id);
                      playRetroSound('blip', state.settings.soundEnabled);
                    }}
                    title={th.label}
                    className={`px-1 py-1.5 rounded-md text-center font-pixel-ui text-[9.5px] sm:text-[10.5px] leading-tight cursor-pointer border-2 transition-all overflow-hidden ${
                      state.settings.theme === th.id
                        ? 'border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)] font-bold shadow-[2px_2px_0_var(--shadow-ink)]'
                        : 'border-[var(--border-pixel)]/40 bg-[var(--bg-surface)] text-[var(--text-primary)] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full mx-auto block mb-1 border-2 border-[var(--border-pixel)]"
                      style={{ backgroundColor: th.previewColors[0] }}
                    />
                    <span className="block truncate">{th.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Trim Bottom */}
        <div className="hidden sm:flex items-center justify-between px-2 pt-2 text-[var(--text-on-bezel)] font-pixel-ui text-[9px] font-bold">
          <span>© 2026 PIXEL QUEST ACADEMY</span>
          <span>SELECT / START</span>
        </div>
      </div>

      {/* Modal Connect New Device to Cloud (Game Master / Admin Only) */}
      <PixelModal
        open={selectedRoleTab === UserRole.GAME_MASTER && cloudModalOpen}
        title="Hubungkan Perangkat ke Cloud"
        onClose={() => setCloudModalOpen(false)}
      >
        <form onSubmit={handleConnectDeviceCloud} className="space-y-3">
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            Agar akun dan data sekolah yang diinput dari perangkat lain muncul di perangkat ini, tempelkan <strong>Link Akses Cloud</strong> dari Guru atau masukkan <strong>Supabase Project URL & Anon Key</strong>:
          </p>
          <div>
            <PixelFieldLabel htmlFor="login-cloud-url">
              Link Akses Cloud / Supabase URL
            </PixelFieldLabel>
            <PixelInput
              id="login-cloud-url"
              placeholder="https://...?cloud=... atau https://xxxx.supabase.co"
              value={cloudInput}
              onChange={(e) => setCloudInput(e.target.value)}
            />
          </div>
          {!cloudInput.includes('cloud=') && (
            <div>
              <PixelFieldLabel htmlFor="login-cloud-key">
                Supabase Anon Key (Kosongkan jika pakai Link Akses)
              </PixelFieldLabel>
              <PixelInput
                id="login-cloud-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={cloudKeyInput}
                onChange={(e) => setCloudKeyInput(e.target.value)}
              />
            </div>
          )}

          {cloudStatus && (
            <p className="text-[12.5px] text-[var(--accent-warning)] bg-[var(--bg-inset)] p-2 border border-[var(--border-pixel)]">
              {cloudStatus}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <PixelButton
              type="button"
              variant="neutral"
              onClick={() => setCloudModalOpen(false)}
            >
              Tutup
            </PixelButton>
            <PixelButton type="submit" variant="success" disabled={isCloudBusy}>
              {isCloudBusy ? 'Menghubungkan...' : 'Hubungkan & Sync'}
            </PixelButton>
          </div>
        </form>
      </PixelModal>
    </div>
  );
};
