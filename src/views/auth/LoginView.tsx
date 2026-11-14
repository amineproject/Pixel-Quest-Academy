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
  EditorialCard,
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
    }

    const synced = await onSyncData();
    const latestState = synced || state;
    setIsCheckingGm(false);

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
  const isMinimalPaper = activeTheme === 'gameboy_green';

  return (
    <div
      data-theme={activeTheme}
      className="relative min-h-screen w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-6 sm:px-4"
    >
      <ThemeBackdropIllustration theme={activeTheme} />

      {/* Theme-Adaptive Exterior Cabinet / Frame */}
      <div
        className={`relative z-10 w-full max-w-[560px] sm:max-w-[640px] md:max-w-[700px] console-bezel transition-all ${
          isMinimalPaper
            ? 'sm:p-0 sm:rounded-xl sm:border sm:border-[#d6d1c7] sm:bg-white'
            : 'sm:p-3 sm:rounded-xl sm:bg-[var(--bezel-body)] sm:border-2 sm:border-[var(--bezel-trim)] sm:shadow-[6px_6px_0_0_var(--shadow-ink)]'
        }`}
      >
        {/* Hardware Trim Top (Hidden in Clean Paper Studio) */}
        {!isMinimalPaper && (
          <div className="hidden sm:flex items-center justify-between px-2 pb-2 text-[var(--text-on-bezel)] font-pixel-ui text-[10px] tracking-wider uppercase font-bold">
            <span>
              {activeTheme === 'sunny_quest'
                ? '★ COZY PIXEL QUEST · PARCHMENT RPG ★'
                : activeTheme === 'daylight_rpg'
                  ? '★ SOFT CHIBI CLASSROOM · PASTEL ★'
                  : activeTheme === 'nes_classic'
                    ? '★ 16-BIT ROYAL CHRONICLE ★'
                    : '★ COMIC-POP ARCADE CONSOLE ★'}
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
        )}

        {/* Screen Viewport */}
        <div
          className={`relative w-full min-h-screen sm:min-h-[780px] flex flex-col bg-[var(--bg-canvas)] overflow-y-auto pixel-scroll ${
            isMinimalPaper
              ? 'sm:rounded-xl'
              : activeTheme === 'daylight_rpg'
                ? 'sm:rounded-[20px] sm:border-2 sm:border-[var(--border-pixel)]'
                : 'sm:rounded-lg sm:border-2 sm:border-[var(--border-pixel)]'
          } ${state.settings.crtScanlines && !isMinimalPaper ? 'crt-scanlines' : ''}`}
        >
          {/* Top Audio & Brand Bar */}
          <div
            className={`flex items-center justify-between px-3 py-2 bg-[var(--surface-tint)] comic-halftone shrink-0 ${
              isMinimalPaper
                ? 'border-b border-[#d6d1c7] bg-white'
                : 'border-b-2 border-[var(--border-pixel)]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {!isMinimalPaper && <PixelStar size={16} className="animate-pixel-float shrink-0" />}
              <span className="font-pixel-ui text-[10.5px] font-bold text-[var(--text-primary)] truncate">
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
              <ComicPanel halftone className="!bg-[#1b0d42] text-white text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2.5">
                  <PixelStar size={20} className="animate-pixel-float" />
                  <div className="animate-pixel-bounce">
                    <ThemeMascotIllustration theme="cyber_retro" size={50} />
                  </div>
                  <PixelCoin size={22} className="animate-coin-shine" />
                </div>
                <div className="space-y-1">
                  <div className="inline-block comic-slant bg-[#00d8ff] text-[#09090f] border-2 border-[#09090f] shadow-[3px_3px_0_0_#09090f] px-3.5 py-1">
                    <h1 className="comic-unslant font-pixel-display text-[17px] sm:text-[19px] tracking-wide">
                      PIXEL QUEST
                    </h1>
                  </div>
                  <p className="font-pixel-display text-[12px] text-white tracking-wider pt-0.5">
                    ACADEMY LMS
                  </p>
                  <p className="text-[12.5px] font-semibold text-[#00d8ff]">
                    ✦ Select Your Adventure Role ✦
                  </p>
                </div>
                <div className="pt-0.5">
                  <span className="comic-slant font-pixel-ui text-[11px] font-bold text-[#09090f] animate-press-start bg-[#ffd000] px-3.5 py-1 rounded-md border-2 border-[#09090f] shadow-[2px_2px_0_#09090f] inline-block">
                    <span className="comic-unslant inline-block">▶ PRESS START TO BEGIN</span>
                  </span>
                </div>
              </ComicPanel>
            ) : activeTheme === 'sunny_quest' ? (
              <RPGDialogueCard
                speaker="Guild Guide"
                metaRight="Parchment RPG"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-[#4a3525] bg-gradient-to-b from-[#74ccf0] via-[#bae6fd] to-[#48bb78] flex items-center justify-center shrink-0">
                    <div className="animate-pixel-bounce">
                      <ThemeMascotIllustration theme="sunny_quest" size={44} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-pixel-display text-[20px] sm:text-[22px] text-[#2b1d12] leading-tight">
                      Pixel Quest Academy
                    </h1>
                    <p className="font-pixel-ui text-[14.5px] text-[#543c29] leading-snug mt-0.5">
                      &ldquo;Selamat datang, Petualang! Pilih peranmu untuk mulai belajar.&rdquo;
                    </p>
                  </div>
                </div>
              </RPGDialogueCard>
            ) : activeTheme === 'daylight_rpg' ? (
              <ChibiWelcomeCard className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-[#e0f4fc] border-2 border-[#a7f3d0] flex items-center justify-center animate-pixel-bounce">
                    <ThemeMascotIllustration theme="daylight_rpg" size={44} />
                  </div>
                </div>
                <h1 className="font-pixel-display text-[21px] text-[#133142]">
                  Pixel Quest Academy
                </h1>
                <p className="text-[13.5px] font-semibold text-[#2d5368]">
                  Selamat datang di kelas ceria! Masuk untuk membaca materi &amp; cek tugasmu.
                </p>
              </ChibiWelcomeCard>
            ) : activeTheme === 'nes_classic' ? (
              <KingdomQuestBoard headerTitle="Royal Academy Gate">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 border-2 border-[#311b63] bg-[#3b1d72] flex items-center justify-center shrink-0">
                    <ThemeMascotIllustration theme="nes_classic" size={40} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-pixel-display text-[19px] sm:text-[21px] text-[#1e113a] leading-tight">
                      Pixel Quest Academy
                    </h1>
                    <p className="text-[12.5px] font-semibold text-[#442b78] mt-0.5">
                      Gerbang Kerajaan 16-Bit · Pilih Peran Petualanganmu
                    </p>
                  </div>
                </div>
              </KingdomQuestBoard>
            ) : (
              <EditorialCard className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg border border-[#d6d1c7] bg-[#faf8f4] flex items-center justify-center shrink-0">
                    <ThemeMascotIllustration theme="gameboy_green" size={26} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-pixel-display text-[19px] text-[#18181b] leading-tight">
                      Pixel Quest Academy
                    </h1>
                    <p className="text-[13px] text-[#52525b] mt-0.5">
                      Ruang Belajar Terfokus · Pilih akun siswa atau pengajar untuk melanjutkan.
                    </p>
                  </div>
                </div>
              </EditorialCard>
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

        {/* Hardware Trim Bottom (Hidden in Clean Paper Studio) */}
        {!isMinimalPaper && (
          <div className="hidden sm:flex items-center justify-between px-2 pt-2 text-[var(--text-on-bezel)] font-pixel-ui text-[9px] font-bold">
            <span>© 2026 PIXEL QUEST ACADEMY</span>
            <span>SELECT / START</span>
          </div>
        )}
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
