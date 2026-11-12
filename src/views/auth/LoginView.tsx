import React, { useState } from 'react';
import {
  ArrowRight,
  Crown,
  Lock,
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
} from '../../components/PixelUI';
import { playRetroSound } from '../../utils/sound';

interface LoginViewProps {
  state: AcademyState;
  onLoginAsHero: (hero: HeroStudent) => void;
  onLoginAsGm: () => void;
  onUpdateTheme: (theme: PixelTheme) => void;
  onToggleSound: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  state,
  onLoginAsHero,
  onLoginAsGm,
  onUpdateTheme,
  onToggleSound,
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(UserRole.HERO);

  // Hero manual input
  const [heroIdentifier, setHeroIdentifier] = useState('');
  const [heroError, setHeroError] = useState<string | null>(null);

  // GM manual input (start empty, never pre-fill dummy dots or bypass passwords)
  const [gmUsername, setGmUsername] = useState('');
  const [gmPassword, setGmPassword] = useState('');
  const [gmError, setGmError] = useState<string | null>(null);

  const requireGmPassword = state.gmProfile.requirePassword !== false;

  const handleHeroManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError(null);
    const query = heroIdentifier.trim().toLowerCase();
    if (!query) {
      setHeroError('Masukkan NIS atau Username Hero!');
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    const matched = state.heroes.find(
      (h) =>
        h.username.toLowerCase() === query ||
        h.studentCode.toLowerCase() === query
    );

    if (!matched) {
      setHeroError('Akun Hero tidak ditemukan! Periksa kembali NIS atau Username Anda.');
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    if (!matched.active) {
      setHeroError('Akun Hero ini sedang dinonaktifkan oleh Guru (Game Master).');
      playRetroSound('error', state.settings.soundEnabled);
      return;
    }

    playRetroSound('start', state.settings.soundEnabled);
    onLoginAsHero(matched);
  };

  const handleGmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGmError(null);
    const expectedUsername = (state.gmProfile.username || 'admin').trim().toLowerCase();
    const expectedPassword = state.gmProfile.password || 'admin';

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

    // Strict credential verification: exact match with configured username & password only
    const isMatch =
      inputUser === expectedUsername && inputPass === expectedPassword;

    if (isMatch) {
      playRetroSound('start', state.settings.soundEnabled);
      onLoginAsGm();
    } else {
      setGmError('Username atau Password Game Master salah!');
      playRetroSound('error', state.settings.soundEnabled);
    }
  };

  return (
    <div
      data-theme={state.settings.theme}
      className="min-h-screen w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-6 sm:px-4"
    >
      {/* Desktop Arcade Cabinet Exterior Trim */}
      <div className="w-full max-w-[560px] sm:max-w-[620px] md:max-w-[680px] sm:p-3 sm:bg-[var(--bezel-body)] sm:border-4 sm:border-[var(--bezel-trim)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all">
        {/* Hardware Trim Top */}
        <div className="hidden sm:flex items-center justify-between px-2 pb-2 text-[var(--text-on-warning)] font-pixel-ui text-[10px] tracking-wider uppercase font-bold">
          <span>★ ARCADE ADVENTURE CONSOLE ★</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-4 h-1.5 bg-black/30 inline-block" />
            <span className="w-4 h-1.5 bg-black/30 inline-block" />
            <span className="w-4 h-1.5 bg-black/30 inline-block" />
          </div>
        </div>

        {/* Arcade Screen Viewport */}
        <div
          className={`relative w-full min-h-screen sm:min-h-[780px] flex flex-col bg-[var(--bg-canvas)] sm:border-4 sm:border-black overflow-y-auto pixel-scroll ${
            state.settings.crtScanlines ? 'crt-scanlines' : ''
          }`}
        >
          {/* Top Audio & Quick Theme Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border-b-2 border-[var(--border-pixel)] shrink-0">
            <div className="flex items-center gap-1.5">
              <PixelStar size={16} className="animate-pixel-float" />
              <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)]">
                PIXEL QUEST ACADEMY
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className="pixel-btn min-h-[32px] px-2 py-1 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-pixel-ui text-[10px] flex items-center gap-1 cursor-pointer"
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
            {/* Cheerful Title & Mascot Hero Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="flex items-center justify-center gap-2">
                <PixelStar size={20} className="animate-pixel-float" />
                <div className="animate-pixel-bounce">
                  <PixelMascotSlime size={56} />
                </div>
                <PixelCoin size={22} className="animate-coin-shine" />
              </div>

              <div>
                <h1 className="font-pixel-display text-[16px] sm:text-[18px] text-[var(--accent-warning)] tracking-wide drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]">
                  PIXEL QUEST
                </h1>
                <p className="font-pixel-display text-[12px] text-[var(--text-primary)] mt-0.5">
                  ACADEMY LMS
                </p>
                <p className="font-pixel-body text-[16px] text-[var(--text-secondary)] mt-0.5">
                  ✦ Select Your Adventure Role ✦
                </p>
              </div>

              {/* Press Start Flashing Banner */}
              <div className="py-1">
                <span className="font-pixel-ui text-[11px] text-[var(--accent-success)] animate-press-start bg-[var(--bg-inset)] px-3 py-1 border border-[var(--border-pixel)] inline-block">
                  ▶ PRESS START TO BEGIN
                </span>
              </div>
            </div>

            {/* Role Tabs: Hero (Siswa) vs Game Master (Guru) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleTab(UserRole.HERO);
                  playRetroSound('blip', state.settings.soundEnabled);
                }}
                className={`pixel-btn min-h-[46px] p-2 flex items-center justify-center gap-2 font-pixel-ui text-[11px] cursor-pointer ${
                  selectedRoleTab === UserRole.HERO
                    ? 'bg-[var(--accent-success)] text-[#11131E] font-bold border-2 border-white'
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
                    ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold border-2 border-white'
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
                  <p className="font-pixel-body text-[16px] text-[var(--text-secondary)] leading-snug">
                    Masukkan NIS atau Username akun Hero milikmu untuk melihat pengumuman guild, materi, dan status tugas.
                  </p>
                </div>

                <form onSubmit={handleHeroManualSubmit} className="pixel-box p-4 space-y-3">
                  <div>
                    <PixelFieldLabel htmlFor="hero-id-input">
                      NIS Siswa / Username
                    </PixelFieldLabel>
                    <PixelInput
                      id="hero-id-input"
                      autoComplete="username"
                      placeholder="Masukkan NIS atau Username akunmu..."
                      value={heroIdentifier}
                      onChange={(e) => {
                        setHeroIdentifier(e.target.value);
                        if (heroError) setHeroError(null);
                      }}
                    />
                  </div>

                  {heroError && (
                    <p className="font-pixel-body text-[16px] text-[var(--accent-danger)] leading-tight">
                      [!] {heroError}
                    </p>
                  )}

                  <PixelButton type="submit" variant="success" fullWidth size="lg">
                    <ArrowRight size={16} />
                    Masuk Sebagai Hero
                  </PixelButton>
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

                  {requireGmPassword ? (
                    <div className="pixel-box-inset p-2.5 text-center border-2 border-[var(--accent-warning)] bg-[var(--bg-inset)]">
                      <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)] flex items-center justify-center gap-1.5">
                        <Lock size={13} />
                        WAJIB MASUK DENGAN USERNAME & PASSWORD
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <PixelButton
                        type="button"
                        variant="warning"
                        fullWidth
                        size="lg"
                        onClick={() => {
                          playRetroSound('start', state.settings.soundEnabled);
                          onLoginAsGm();
                        }}
                      >
                        <Crown size={18} />
                        Fast Enter as Game Master
                      </PixelButton>
                      <span className="font-pixel-body text-[13px] text-[var(--text-muted)] block text-center">
                        (Kunci password dinonaktifkan di Settings)
                      </span>
                    </div>
                  )}
                </div>

                {/* GM Credentials Form */}
                <form onSubmit={handleGmSubmit} className="pixel-box p-3.5 space-y-2.5">
                  <span className="font-pixel-ui text-[10px] text-[var(--text-muted)] block uppercase">
                    Kredensial Login GM
                  </span>
                  <div>
                    <PixelFieldLabel htmlFor="gm-user-input">
                      Username GM
                    </PixelFieldLabel>
                    <PixelInput
                      id="gm-user-input"
                      autoComplete="username"
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
                    <PixelInput
                      id="gm-pass-input"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Masukkan password guru..."
                      value={gmPassword}
                      onChange={(e) => {
                        setGmPassword(e.target.value);
                        if (gmError) setGmError(null);
                      }}
                    />
                  </div>
                  {gmError && (
                    <p className="font-pixel-body text-[16px] text-[var(--accent-danger)] leading-tight">
                      [!] {gmError}
                    </p>
                  )}
                  <PixelButton type="submit" variant="primary" fullWidth>
                    Login GM Account
                  </PixelButton>
                </form>
              </div>
            )}

            {/* Cheerful Theme Bar at Bottom of Title Screen */}
            <div className="pt-2 border-t border-[var(--border-pixel)]/40 space-y-2">
              <span className="font-pixel-ui text-[9px] text-[var(--text-secondary)] block text-center">
                CHOOSE RETRO THEME
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'sunny_quest' as PixelTheme, label: 'Sunny', color: '#ffd13b' },
                  { id: 'daylight_rpg' as PixelTheme, label: 'Daylight', color: '#38bdf8' },
                  { id: 'nes_classic' as PixelTheme, label: 'NES', color: '#3b5dc9' },
                  { id: 'cyber_retro' as PixelTheme, label: 'Cyber', color: '#ff4d6d' },
                  { id: 'gameboy_green' as PixelTheme, label: 'GameBoy', color: '#8bac0f' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      onUpdateTheme(th.id);
                      playRetroSound('blip', state.settings.soundEnabled);
                    }}
                    className={`p-1.5 text-center font-pixel-ui text-[8px] cursor-pointer border-2 transition-all ${
                      state.settings.theme === th.id
                        ? 'border-white bg-[var(--bg-surface-alt)] font-bold scale-105'
                        : 'border-[var(--border-pixel)]/50 bg-[var(--bg-inset)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full mx-auto block mb-1 border border-black/40"
                      style={{ backgroundColor: th.color }}
                    />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Trim Bottom */}
        <div className="hidden sm:flex items-center justify-between px-2 pt-2 text-[var(--text-on-warning)] font-pixel-ui text-[9px]">
          <span>© 2026 PIXEL QUEST ACADEMY</span>
          <span>SELECT / START</span>
        </div>
      </div>
    </div>
  );
};
