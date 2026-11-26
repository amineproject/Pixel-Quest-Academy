import React from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Castle,
  Check,
  ClipboardList,
  Crown,
  Gamepad2,
  Grid,
  History,
  Info,
  LogOut,
  Map,
  Medal,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  Star,
  Sword,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AcademicYear,
  AvatarClass,
  GmMenuId,
  HeroMenuId,
  PixelTheme,
  SeasonId,
  UserRole,
} from '../types/lms';
import { EraSelector } from './EraSelector';
import { SeasonSelector } from './SeasonSelector';
import { PixelAvatar, PixelCoin, PixelStar } from './PixelArt';
import { PixelButton, PixelConfirmDialog, PixelModal } from './PixelUI';
import { PWAInstallButton } from './PWAInstallBanner';
import { ThemeBackdropIllustration } from './ThemeArtwork';

export interface GmNavItem {
  id: GmMenuId;
  label: string;
  shortLabel: string;
  standardName: string;
}

export const GM_NAV_ITEMS: GmNavItem[] = [
  { id: 'hq', label: 'HQ / Tavern Hall', shortLabel: 'HQ', standardName: 'Dashboard' },
  { id: 'dungeons', label: 'Dungeons / Guilds', shortLabel: 'Dungeons', standardName: 'Kelas' },
  { id: 'heroes', label: 'Adventurers / Heroes', shortLabel: 'Heroes', standardName: 'Siswa' },
  { id: 'quest_board', label: 'Quest Board', shortLabel: 'Notice', standardName: 'Pengumuman' },
  { id: 'realms', label: 'Realms / Skill Trees', shortLabel: 'Realms', standardName: 'Mapel' },
  { id: 'scrolls', label: 'Ancient Tomes', shortLabel: 'Tomes', standardName: 'Materi' },
  { id: 'active_quests', label: 'Active Quests', shortLabel: 'Quests', standardName: 'Tugas' },
  { id: 'exp_loot', label: 'EXP & Loot', shortLabel: 'EXP', standardName: 'Penilaian' },
  { id: 'guild_chronicles', label: 'Guild Chronicles', shortLabel: 'Chronicles', standardName: 'Statistik' },
  { id: 'hall_of_fame', label: 'Hall of Fame', shortLabel: 'Fame', standardName: 'Peringkat' },
  { id: 'settings', label: 'System Settings', shortLabel: 'Config', standardName: 'Pengaturan' },
  { id: 'about', label: 'Tentang Aplikasi', shortLabel: 'Tentang', standardName: 'Info v3.15' },
];

export const HERO_NAV_ITEMS: {
  id: HeroMenuId;
  label: string;
  shortLabel: string;
  standardName: string;
}[] = [
  { id: 'notice', label: 'Guild Notice', shortLabel: 'Town Hub', standardName: 'Pengumuman' },
  { id: 'scroll_library', label: 'Scroll Library', shortLabel: 'Scrolls', standardName: 'Materi' },
  { id: 'quest_list', label: 'Quest Board', shortLabel: 'Board', standardName: 'Papan Tugas' },
  { id: 'my_guild', label: 'My Guild / Party', shortLabel: 'My Guild', standardName: 'Kelas' },
  { id: 'hall_of_fame', label: 'Hall of Fame', shortLabel: 'Fame', standardName: 'Peringkat' },
  { id: 'hero_log', label: 'Hero Log / Status', shortLabel: 'Hero Log', standardName: 'Status' },
  { id: 'about', label: 'Tentang Aplikasi', shortLabel: 'Tentang', standardName: 'Info v3.15' },
];

export function getGmMenuIcon(id: GmMenuId, size = 18) {
  switch (id) {
    case 'hq':
      return <Gamepad2 size={size} />;
    case 'dungeons':
      return <Castle size={size} />;
    case 'heroes':
      return <Users size={size} />;
    case 'quest_board':
      return <ScrollText size={size} />;
    case 'realms':
      return <Map size={size} />;
    case 'scrolls':
      return <BookOpen size={size} />;
    case 'active_quests':
      return <Sword size={size} />;
    case 'exp_loot':
      return <Trophy size={size} />;
    case 'guild_chronicles':
      return <BarChart3 size={size} />;
    case 'hall_of_fame':
      return <Medal size={size} />;
    case 'settings':
      return <Settings size={size} />;
    case 'about':
      return <Info size={size} />;
  }
}

export function getHeroMenuIcon(id: HeroMenuId, size = 18) {
  switch (id) {
    case 'notice':
      return <ScrollText size={size} />;
    case 'scroll_library':
      return <BookOpen size={size} />;
    case 'quest_list':
      return <ClipboardList size={size} />;
    case 'my_guild':
      return <Castle size={size} />;
    case 'hall_of_fame':
      return <Medal size={size} />;
    case 'hero_log':
      return <Star size={size} />;
    case 'about':
      return <Info size={size} />;
  }
}

/** Chronological entry recorded in the Cloud/Local sync history modal. */
export interface SyncLogEntry {
  id: string;
  timestamp: string;
  timeLabel: string;
  action: string;
  status: 'success' | 'error' | 'info';
  detail: string;
}

export interface ArcadeShellProps {
  theme: PixelTheme;
  crtScanlines: boolean;
  soundEnabled: boolean;
  role: UserRole;
  gmMenu: GmMenuId;
  heroMenu: HeroMenuId;
  activeHeroName: string;
  activeHeroAvatar?: AvatarClass;
  gmName: string;
  gmAvatar?: AvatarClass;
  onSelectGmMenu: (id: GmMenuId) => void;
  onSelectHeroMenu: (id: HeroMenuId) => void;
  onToggleSound: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTimeLabel?: string | null;
  syncLogs?: SyncLogEntry[];
  onClearSyncLogs?: () => void;
  unreadNoticeCount?: number;
  unreadQuestCount?: number;
  academicYears?: AcademicYear[];
  activeEraId?: string;
  activeSeason?: SeasonId;
  onSwitchEra?: (eraId: string) => void;
  onCreateEra?: (era: AcademicYear) => void;
  onSwitchSeason?: (season: SeasonId) => void;
  onOpenGmDrawer: () => void;
  onOpenHeroDrawer?: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

/**
 * Main retro handheld / editorial shell framing navigation, hardware window controls,
 * cloud sync status indicator, sync history modal, and Guild notification badges.
 */
export const ArcadeShell: React.FC<ArcadeShellProps> = ({
  theme,
  crtScanlines,
  soundEnabled,
  role,
  gmMenu,
  heroMenu,
  activeHeroName,
  activeHeroAvatar = 'knight',
  gmName,
  gmAvatar = 'guild_master',
  onSelectGmMenu,
  onSelectHeroMenu,
  onToggleSound,
  onManualSync,
  isSyncing = false,
  syncStatus = 'idle',
  lastSyncTimeLabel = null,
  syncLogs = [],
  onClearSyncLogs,
  unreadNoticeCount = 0,
  unreadQuestCount = 0,
  academicYears = [],
  activeEraId = '',
  activeSeason = 'ganjil',
  onSwitchEra,
  onCreateEra,
  onSwitchSeason,
  onOpenGmDrawer,
  onOpenHeroDrawer,
  onLogout,
  children,
}) => {
  const [isWindowMinimized, setIsWindowMinimized] = React.useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = React.useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false);
  const [syncHistoryOpen, setSyncHistoryOpen] = React.useState(false);

  const isGm = role === UserRole.GAME_MASTER;
  const activeTitle = isGm
    ? GM_NAV_ITEMS.find((i) => i.id === gmMenu)?.label || 'HQ / Tavern Hall'
    : HERO_NAV_ITEMS.find((i) => i.id === heroMenu)?.label || 'Guild Notice';

  const quickGmTabs: GmMenuId[] = ['hq', 'dungeons', 'active_quests', 'exp_loot'];
  const quickHeroTabs: HeroMenuId[] = ['notice', 'quest_list', 'scroll_library', 'hall_of_fame'];

  const isPersonaTheme = theme === 'gameboy_green';
  const isMlbbTheme = theme === 'cyber_retro';
  const totalUnreadGuild = unreadNoticeCount + unreadQuestCount;

  const getBadgeCountForGm = (id: GmMenuId): number => {
    if (id === 'quest_board') return unreadNoticeCount;
    if (id === 'active_quests') return unreadQuestCount;
    return 0;
  };

  const getBadgeCountForHero = (id: HeroMenuId): number => {
    if (id === 'notice') return totalUnreadGuild;
    return 0;
  };

  return (
    <div
      data-theme={theme}
      className="print-unclip relative min-h-[100dvh] w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-4 sm:px-4"
    >
      <div className="no-print print:hidden">
        <ThemeBackdropIllustration theme={theme} />
      </div>

      {/* Desktop Top Header */}
      <div
        className={`no-print print:hidden relative z-10 hidden sm:flex items-center justify-between w-full mb-2.5 px-1 gap-2 transition-all ${
          isWindowMaximized
            ? 'max-w-[1380px]'
            : 'max-w-[640px] md:max-w-[960px] lg:max-w-[1080px]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-[var(--btn-radius)] bg-[var(--comic-gold)] border-2 border-[var(--border-pixel)] shadow-[3px_3px_0_var(--shadow-ink)] flex items-center justify-center shrink-0">
            <PixelStar size={19} className="animate-pixel-float" />
          </div>
          <div className="min-w-0">
            <p className="font-pixel-display text-[14px] text-[var(--outer-title)] tracking-wide truncate">
              PIXEL QUEST ACADEMY
            </p>
            <p className="text-[13px] font-bold text-[var(--outer-sub)] truncate">
              {isGm ? `Guild Master: ${gmName}` : `Hero: ${activeHeroName} (Read-Only)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="md:hidden pixel-btn min-h-[34px] px-3 py-1 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[10.5px] flex items-center gap-1.5 cursor-pointer font-bold"
            title="Keluar ke Halaman Login"
          >
            <LogOut size={13} />
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Theme-Adaptive Console / Editorial Frame */}
      <div
        className={`print-unclip relative z-10 w-full console-bezel transition-all ${
          isWindowMaximized
            ? 'max-w-[1380px]'
            : 'max-w-[560px] sm:max-w-[640px] md:max-w-[960px] lg:max-w-[1080px]'
        } sm:p-3 sm:rounded-xl sm:bg-[var(--bezel-body)] sm:border-2 sm:border-[var(--bezel-trim)] sm:shadow-[6px_6px_0_0_var(--shadow-ink)]`}
      >
        {/* Console Hardware Top Trim */}
        <div className="no-print print:hidden hidden sm:flex items-center justify-between px-2 pb-2 text-[var(--text-on-bezel)] font-bold">
          <div className="flex items-center gap-2 font-pixel-ui text-[11px] tracking-wide uppercase min-w-0 flex-1">
            <PixelCoin size={15} className="animate-coin-shine shrink-0" />
            <span className="truncate">
              {theme === 'sunny_quest'
                ? '16-BIT PIXEL · SUPER PAPER STAGE'
                : theme === 'daylight_rpg'
                  ? '16-BIT PIXEL · POKÉMON CAFÉ REMIX'
                  : theme === 'nes_classic'
                    ? '16-BIT PIXEL · SPROUT VILLAGE'
                    : theme === 'gameboy_green'
                      ? '16-BIT PIXEL · PHANTOM PERSONA'
                      : '16-BIT PIXEL · MOBILE LEGENDS'}
            </span>
          </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsWindowMinimized((prev) => !prev)}
                className="w-5 h-5 rounded-sm border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[#18181b] text-[11px] flex items-center justify-center leading-none font-bold hover:bg-[var(--comic-gold)] cursor-pointer"
                title={isWindowMinimized ? 'Pulihkan Jendela' : 'Minimize Jendela'}
                aria-label={isWindowMinimized ? 'Pulihkan Jendela' : 'Minimize Jendela'}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWindowMinimized(false);
                  setIsWindowMaximized((prev) => !prev);
                }}
                className="w-5 h-5 rounded-sm border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[#18181b] text-[10px] flex items-center justify-center leading-none font-bold hover:bg-[var(--comic-gold)] cursor-pointer"
                title={isWindowMaximized ? 'Ukuran Normal' : 'Perbesar Jendela'}
                aria-label={isWindowMaximized ? 'Ukuran Normal' : 'Perbesar Jendela'}
              >
                □
              </button>
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-5 h-5 rounded-sm border-2 border-[var(--border-pixel)] bg-[#fb7185] text-[#18181b] text-[11px] flex items-center justify-center leading-none font-bold hover:bg-[#f43f5e] hover:text-white cursor-pointer"
                title="Keluar / Logout"
                aria-label="Keluar / Logout"
              >
                ×
              </button>
            </div>
          </div>

        {isWindowMinimized ? (
          <div className="hidden sm:flex items-center justify-between gap-3 p-4 bg-[var(--bg-canvas)] rounded-lg border-2 border-[var(--border-pixel)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <PixelAvatar avatar={isGm ? gmAvatar : activeHeroAvatar} size={34} />
              <div className="min-w-0">
                <p className="font-pixel-display text-[12px] text-[var(--text-primary)] truncate">
                  {activeTitle} — Cartridge Minimized
                </p>
                <p className="text-[12px] text-[var(--text-secondary)] truncate">
                  Klik tombol Pulihkan untuk melanjutkan petualangan belajar.
                </p>
              </div>
            </div>
            <PixelButton
              type="button"
              size="sm"
              variant="warning"
              onClick={() => setIsWindowMinimized(false)}
            >
              Pulihkan Layar
            </PixelButton>
          </div>
        ) : (
        /* Screen Viewport: Persistent Left Sidebar (md+) + Main Pane */
        <div
          className={`print-unclip relative w-full h-[100dvh] flex flex-col md:flex-row bg-[var(--bg-canvas)] overflow-hidden ${
            isWindowMaximized
              ? 'sm:h-[calc(100dvh-110px)] sm:min-h-[500px]'
              : 'sm:h-[calc(100dvh-150px)] sm:min-h-[460px] sm:max-h-[860px]'
          } ${
            theme === 'gameboy_green'
              ? 'sm:rounded-[2px] sm:border-2 sm:border-[var(--border-pixel)]'
              : 'sm:rounded-[6px] sm:border-2 sm:border-[var(--border-pixel)]'
          } ${crtScanlines ? 'crt-scanlines' : ''}`}
        >
          {/* Persistent Sidebar Navigation (Desktop & Tablet >= 768px) */}
          <aside
            aria-label={isGm ? 'Game Master Sidebar Navigation' : 'Hero Sidebar Navigation'}
            className={`no-print print:hidden hidden md:flex md:flex-col md:w-[236px] lg:w-[258px] shrink-0 overflow-hidden ${
              isPersonaTheme
                ? 'bg-[#0d0d14] text-white border-r-[3px] border-[#09090f]'
                : isMlbbTheme
                  ? 'bg-[#0b1730] text-white border-r-2 border-[#d4a94f]'
                  : theme === 'sunny_quest'
                    ? 'bg-[#fde8e8] border-r-2 border-[var(--border-pixel)]'
                    : theme === 'daylight_rpg'
                      ? 'bg-[#fff5e8] border-r-2 border-[var(--border-pixel)]'
                      : 'bg-[#f4ebd0] border-r-2 border-[var(--border-pixel)]'
            }`}
          >
            {/* Sidebar User Identity Block */}
            <div
              className={`p-3.5 shrink-0 ${
                isPersonaTheme
                  ? 'border-b-[3px] border-[#e60012] bg-[#09090f] persona-stripes'
                  : isMlbbTheme
                    ? 'border-b-2 border-[#d4a94f] bg-gradient-to-r from-[#102347] to-[#163466]'
                    : 'border-b-2 border-[var(--border-pixel)]/30 bg-[var(--surface-tint)]/35 comic-halftone'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PixelAvatar
                  avatar={isGm ? gmAvatar : activeHeroAvatar}
                  size={40}
                  className="shrink-0 animate-pixel-bounce"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-pixel-ui text-[10.5px] uppercase tracking-wide flex items-center gap-1 ${
                      isPersonaTheme
                        ? 'text-[#ffe600]'
                        : isMlbbTheme
                          ? 'text-[#f5c84c]'
                          : 'text-[var(--accent-warning)]'
                    }`}
                  >
                    {isGm ? <Crown size={11} /> : <Shield size={11} />}
                    <span>{isGm ? 'Game Master' : 'Hero · Read-Only'}</span>
                  </p>
                  <p
                    className={`text-[13.5px] font-bold truncate mt-0.5 ${
                      isPersonaTheme || isMlbbTheme ? 'text-white' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {isGm ? gmName : activeHeroName}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Menu Links */}
            <nav className="flex-1 overflow-y-auto pixel-scroll p-2.5 space-y-1">
              <p
                className={`px-2 pb-1 font-pixel-ui text-[10.5px] uppercase tracking-wide ${
                  isPersonaTheme
                    ? 'text-[#ffe600]'
                    : isMlbbTheme
                      ? 'text-[#7dd3fc]'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                {isGm ? 'Menu Pengelola' : 'Menu Petualang'}
              </p>

              {isGm
                ? GM_NAV_ITEMS.map((item) => {
                    const active = gmMenu === item.id;
                    const activeBtnClass = isPersonaTheme
                      ? 'persona-slant bg-[#e60012] text-white border-2 border-white shadow-[3px_3px_0_0_#ffe600] font-bold'
                      : theme === 'daylight_rpg'
                        ? 'bg-[#c75008] text-white border-2 border-[#4e2a1e] rounded-[5px] shadow-[2px_3px_0_0_#4e2a1e] font-bold'
                        : theme === 'nes_classic'
                          ? 'bg-[#3f7d28] text-white border-2 border-[#5c3822] shadow-[2px_2px_0_0_#5c3822] font-bold'
                          : isMlbbTheme
                            ? 'bg-gradient-to-r from-[#c83218] to-[#df4a26] text-white border-2 border-[#f5c84c] rounded-[4px] shadow-[3px_3px_0_0_#071022] font-bold'
                            : 'bg-[#e52521] text-white border-2 border-white ring-2 ring-[#2e1d14] rounded-[5px] shadow-[3px_3px_0_0_#7f1d1d] font-bold';

                    const idleBtnClass = isPersonaTheme
                      ? 'text-[#f4f4f5] border-2 border-transparent hover:bg-[#1b1b26] hover:border-[#e60012]/70 hover:text-white'
                      : isMlbbTheme
                        ? 'text-slate-100 border-2 border-transparent rounded-[4px] hover:bg-[#163466] hover:border-[#d4a94f]/60 hover:text-white'
                        : 'text-[var(--text-secondary)] border-2 border-transparent rounded-[var(--btn-radius)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]';

                    const badgeCount = getBadgeCountForGm(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectGmMenu(item.id)}
                        className={`min-h-[42px] px-2.5 py-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          isPersonaTheme && active ? 'mx-0.5 w-[calc(100%-4px)]' : 'w-full'
                        } ${active ? activeBtnClass : idleBtnClass}`}
                      >
                        <span
                          className={`shrink-0 ${
                            isPersonaTheme && active ? 'persona-unslant' : ''
                          } ${
                            active
                              ? theme === 'nes_classic'
                                ? 'text-[#f6c445]'
                                : isMlbbTheme
                                  ? 'text-[#fde68a]'
                                  : 'text-current'
                              : isPersonaTheme
                                ? 'text-[#ffe600]'
                                : isMlbbTheme
                                  ? 'text-[#5ce1e6]'
                                  : 'text-[var(--accent-warning)]'
                          }`}
                        >
                          {getGmMenuIcon(item.id, 18)}
                        </span>
                        <span
                          className={`min-w-0 flex-1 ${
                            isPersonaTheme && active ? 'persona-unslant' : ''
                          }`}
                        >
                          <span className="block font-pixel-ui text-[12px] font-bold leading-tight truncate">
                            {item.shortLabel}
                          </span>
                          <span
                            className={`block text-[11px] font-medium leading-tight truncate ${
                              active
                                ? 'opacity-90'
                                : isPersonaTheme
                                  ? 'text-[#a1a1aa]'
                                  : isMlbbTheme
                                    ? 'text-[#93c5fd]'
                                    : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {item.standardName}
                          </span>
                        </span>
                        {badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded bg-[var(--accent-danger)] text-white font-pixel-ui text-[10.5px] font-bold shrink-0 tabular-nums ${
                              isPersonaTheme && active ? 'persona-unslant ' : ''
                            }${isPersonaTheme ? 'border border-white' : ''}`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                : HERO_NAV_ITEMS.map((item) => {
                    const active = heroMenu === item.id;
                    const activeBtnClass = isPersonaTheme
                      ? 'persona-slant bg-[#e60012] text-white border-2 border-white shadow-[3px_3px_0_0_#ffe600] font-bold'
                      : theme === 'daylight_rpg'
                        ? 'bg-[#c75008] text-white border-2 border-[#4e2a1e] rounded-[5px] shadow-[2px_3px_0_0_#4e2a1e] font-bold'
                        : theme === 'nes_classic'
                          ? 'bg-[#3f7d28] text-white border-2 border-[#5c3822] shadow-[2px_2px_0_0_#5c3822] font-bold'
                          : isMlbbTheme
                            ? 'bg-gradient-to-r from-[#c83218] to-[#df4a26] text-white border-2 border-[#f5c84c] rounded-[4px] shadow-[3px_3px_0_0_#071022] font-bold'
                            : 'bg-[#e52521] text-white border-2 border-white ring-2 ring-[#2e1d14] rounded-[5px] shadow-[3px_3px_0_0_#7f1d1d] font-bold';

                    const idleBtnClass = isPersonaTheme
                      ? 'text-[#f4f4f5] border-2 border-transparent hover:bg-[#1b1b26] hover:border-[#e60012]/70 hover:text-white'
                      : isMlbbTheme
                        ? 'text-slate-100 border-2 border-transparent rounded-[4px] hover:bg-[#163466] hover:border-[#d4a94f]/60 hover:text-white'
                        : 'text-[var(--text-secondary)] border-2 border-transparent rounded-[var(--btn-radius)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]';

                    const badgeCount = getBadgeCountForHero(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectHeroMenu(item.id)}
                        className={`min-h-[42px] px-2.5 py-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          isPersonaTheme && active ? 'mx-0.5 w-[calc(100%-4px)]' : 'w-full'
                        } ${active ? activeBtnClass : idleBtnClass}`}
                      >
                        <span
                          className={`shrink-0 ${
                            isPersonaTheme && active ? 'persona-unslant' : ''
                          } ${
                            active
                              ? theme === 'nes_classic'
                                ? 'text-[#f6c445]'
                                : isMlbbTheme
                                  ? 'text-[#fde68a]'
                                  : 'text-current'
                              : isPersonaTheme
                                ? 'text-[#ffe600]'
                                : isMlbbTheme
                                  ? 'text-[#5ce1e6]'
                                  : 'text-[var(--accent-warning)]'
                          }`}
                        >
                          {getHeroMenuIcon(item.id, 18)}
                        </span>
                        <span
                          className={`min-w-0 flex-1 ${
                            isPersonaTheme && active ? 'persona-unslant' : ''
                          }`}
                        >
                          <span className="block font-pixel-ui text-[12px] font-bold leading-tight truncate">
                            {item.shortLabel}
                          </span>
                          <span
                            className={`block text-[11px] font-medium leading-tight truncate ${
                              active
                                ? 'opacity-90'
                                : isPersonaTheme
                                  ? 'text-[#a1a1aa]'
                                  : isMlbbTheme
                                    ? 'text-[#93c5fd]'
                                    : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {item.standardName}
                          </span>
                        </span>
                        {badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded bg-[var(--accent-danger)] text-white font-pixel-ui text-[10.5px] font-bold shrink-0 tabular-nums ${
                              isPersonaTheme && active ? 'persona-unslant ' : ''
                            }${isPersonaTheme ? 'border border-white' : ''}`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
            </nav>

            {/* Sidebar Bottom Actions */}
            <div
              className={`p-2.5 shrink-0 space-y-2 ${
                isPersonaTheme
                  ? 'border-t-2 border-[#e60012]/60 bg-[#09090f]'
                  : isMlbbTheme
                    ? 'border-t-2 border-[#d4a94f]/60 bg-[#091428]'
                    : 'border-t-2 border-[var(--border-pixel)]/30'
              }`}
            >
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-full pixel-btn min-h-[38px] px-3 py-1.5 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[11px] flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <LogOut size={14} />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </aside>

          {/* Right Main Column */}
          <div className="print-unclip flex-1 flex flex-col min-w-0 min-h-0">
            {/* Top App Bar */}
            <header
              className={`no-print print:hidden z-30 min-h-[56px] shrink-0 px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 ${
                isPersonaTheme
                  ? 'bg-[#09090f] text-white border-b-[3px] border-[#e60012] persona-stripes'
                  : isMlbbTheme
                    ? 'bg-gradient-to-r from-[#0b1730] via-[#132952] to-[#0b1730] text-white border-b-2 border-[#d4a94f]'
                    : 'bg-[var(--surface-tint)] comic-halftone border-b-2 border-[var(--border-pixel)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <PixelAvatar
                  avatar={isGm ? gmAvatar : activeHeroAvatar}
                  size={34}
                  className="md:hidden shrink-0 animate-pixel-bounce"
                />
                <div className="min-w-0 flex-1">
                  <h1
                    className={`font-pixel-display text-[12.5px] sm:text-[14px] truncate leading-snug ${
                      isPersonaTheme
                        ? 'text-white uppercase tracking-[0.02em]'
                        : isMlbbTheme
                          ? 'text-[#fde68a] uppercase tracking-[0.02em]'
                          : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {activeTitle}
                  </h1>
                  <div
                    className={`text-[11.5px] sm:text-[12px] leading-tight mt-0.5 flex items-center gap-1.5 flex-wrap ${
                      isPersonaTheme || isMlbbTheme ? 'text-zinc-200' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 min-w-0">
                      {isGm ? (
                        <span
                          className={`flex items-center gap-1 font-pixel-ui text-[10.5px] sm:text-[11px] font-bold shrink-0 ${
                            isPersonaTheme
                              ? 'text-[#ffe600]'
                              : isMlbbTheme
                                ? 'text-[#f5c84c]'
                                : 'text-[var(--accent-warning)]'
                          }`}
                        >
                          <Crown size={12} /> GM
                        </span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 font-pixel-ui text-[10.5px] sm:text-[11px] font-bold shrink-0 ${
                            isPersonaTheme
                              ? 'text-[#ffe600]'
                              : isMlbbTheme
                                ? 'text-[#5ce1e6]'
                                : 'text-[var(--accent-success)]'
                          }`}
                        >
                          <Shield size={12} /> HERO
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="truncate font-semibold max-w-[140px] sm:max-w-[220px]">
                        {isGm ? gmName : activeHeroName}
                      </span>
                    </span>
                    {academicYears.length > 0 && (
                      <EraSelector
                        academicYears={academicYears}
                        activeEraId={activeEraId}
                        canManage={isGm}
                        onSwitchEra={onSwitchEra}
                        onCreateEra={onCreateEra}
                      />
                    )}
                    <SeasonSelector
                      activeSeason={activeSeason}
                      canManage={isGm}
                      onSwitchSeason={onSwitchSeason}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <div className="sm:hidden">
                  <PWAInstallButton compact />
                </div>
                {/* Real Cloud Sync Status Indicator + Sync History Trigger (Items 2.2 & 3.5) */}
                {onManualSync && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={onManualSync}
                      disabled={isSyncing}
                      className={`pixel-btn min-w-[36px] min-h-[36px] px-2.5 flex items-center justify-center gap-1 cursor-pointer font-pixel-ui text-[11px] font-bold ${
                        syncStatus === 'error'
                          ? 'bg-[#fef2f2] text-[var(--accent-danger)]'
                          : syncStatus === 'synced'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      }`}
                      title={
                        isSyncing
                          ? 'Sedang menyinkronkan data...'
                          : lastSyncTimeLabel
                            ? `Terakhir sinkron: ${lastSyncTimeLabel} (klik untuk sync ulang)`
                            : 'Sinkronkan Data Cloud'
                      }
                      aria-label="Sinkronkan Data Cloud"
                    >
                      {isSyncing || syncStatus === 'syncing' ? (
                        <>
                          <RefreshCw size={14} className="animate-spin shrink-0" />
                          <span className="hidden sm:inline">Syncing...</span>
                        </>
                      ) : syncStatus === 'error' ? (
                        <>
                          <AlertCircle size={14} className="shrink-0" />
                          <span className="hidden sm:inline">Retry</span>
                        </>
                      ) : syncStatus === 'synced' && lastSyncTimeLabel ? (
                        <>
                          <Check size={14} className="shrink-0 text-emerald-700" />
                          <span className="hidden sm:inline tabular-nums">
                            Synced {lastSyncTimeLabel}
                          </span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} className="shrink-0" />
                          <span className="hidden sm:inline">Sync</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSyncHistoryOpen(true)}
                      className="pixel-btn min-w-[34px] min-h-[36px] px-1.5 flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer relative"
                      title="Riwayat Sinkronisasi"
                      aria-label="Riwayat Sinkronisasi"
                    >
                      <History size={15} />
                      {syncLogs.some((l) => l.status === 'error') && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-danger)] border border-white" />
                      )}
                    </button>
                  </div>
                )}

                {/* Audio toggle button */}
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="pixel-btn min-w-[36px] min-h-[36px] flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer"
                  title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
                  aria-label="Toggle sound"
                >
                  {soundEnabled ? (
                    <Volume2 size={16} className="text-[var(--accent-success)]" />
                  ) : (
                    <VolumeX size={16} className="text-[var(--text-muted)]" />
                  )}
                </button>

                {/* Exit/Logout Button (mobile <640px — sm uses outer bar, md+ uses sidebar) */}
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="sm:hidden pixel-btn min-w-[36px] min-h-[36px] px-2 py-1 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[11px] flex items-center justify-center gap-1 cursor-pointer font-bold"
                  title="Keluar / Logout"
                  aria-label="Keluar / Logout"
                >
                  <LogOut size={14} />
                  <span className="hidden min-[390px]:inline">Keluar</span>
                </button>
              </div>
            </header>

            {/* Main Scrollable Content Area */}
            <main className="print-unclip flex-1 min-h-0 overflow-y-auto pixel-scroll p-3.5 sm:p-5 pb-8 space-y-4">
              {children}
            </main>

            {/* Mobile Bottom Tab Bar Navigation (hidden on md+ where Persistent Sidebar is active) */}
            <nav
              aria-label={isGm ? 'Game Master Navigation' : 'Hero Navigation'}
              className={`no-print print:hidden md:hidden z-30 h-[62px] shrink-0 ${
                isPersonaTheme
                  ? 'bg-[#09090f] text-white border-t-[3px] border-[#e60012]'
                  : 'bg-[var(--bg-surface)] border-t-2 border-[var(--border-pixel)]'
              }`}
            >
              {isGm ? (
                <div className="grid grid-cols-5 h-full">
                  {quickGmTabs.map((tabId) => {
                    const item = GM_NAV_ITEMS.find((i) => i.id === tabId)!;
                    const active = gmMenu === tabId;
                    const badgeCount = getBadgeCountForGm(tabId);
                    return (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => onSelectGmMenu(tabId)}
                        className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors ${
                          isPersonaTheme
                            ? 'border-r border-[#e60012]/35'
                            : 'border-r-2 border-[var(--border-pixel)]/20'
                        } ${
                          active
                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                            : isPersonaTheme
                              ? 'text-zinc-200 hover:text-white hover:bg-[#1b1b26]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                        }`}
                      >
                        {getGmMenuIcon(tabId, 19)}
                        {badgeCount > 0 && (
                          <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                            {badgeCount}
                          </span>
                        )}
                        <span className="font-pixel-ui text-[10.5px] sm:text-[11px] tracking-normal leading-tight truncate max-w-full px-0.5">
                          {item.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={onOpenGmDrawer}
                    className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors ${
                      !quickGmTabs.includes(gmMenu)
                        ? 'bg-[var(--comic-gold)] text-[#09090f] font-bold'
                        : isPersonaTheme
                          ? 'text-[#ffe600] hover:bg-[#1b1b26]'
                          : 'text-[var(--accent-warning)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <Grid size={19} />
                    {unreadNoticeCount > 0 && (
                      <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {unreadNoticeCount}
                      </span>
                    )}
                    <span className="font-pixel-ui text-[10.5px] sm:text-[11px] tracking-normal leading-tight truncate max-w-full px-0.5">
                      Menu
                    </span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-5 h-full">
                  {quickHeroTabs.map((tabId) => {
                    const item = HERO_NAV_ITEMS.find((i) => i.id === tabId)!;
                    const active = heroMenu === tabId;
                    const badgeCount = getBadgeCountForHero(tabId);
                    return (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => onSelectHeroMenu(tabId)}
                        className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors ${
                          isPersonaTheme
                            ? 'border-r border-[#e60012]/35'
                            : 'border-r-2 border-[var(--border-pixel)]/20'
                        } ${
                          active
                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                            : isPersonaTheme
                              ? 'text-zinc-200 hover:text-white hover:bg-[#1b1b26]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                        }`}
                      >
                        {getHeroMenuIcon(tabId, 19)}
                        {badgeCount > 0 && (
                          <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                            {badgeCount}
                          </span>
                        )}
                        <span className="font-pixel-ui text-[10.5px] sm:text-[11px] tracking-normal leading-tight truncate max-w-full px-0.5">
                          {item.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenHeroDrawer) onOpenHeroDrawer();
                      else onSelectHeroMenu('my_guild');
                    }}
                    className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors ${
                      !quickHeroTabs.includes(heroMenu)
                        ? 'bg-[var(--comic-gold)] text-[#09090f] font-bold'
                        : isPersonaTheme
                          ? 'text-[#ffe600] hover:bg-[#1b1b26]'
                          : 'text-[var(--accent-warning)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <Grid size={19} />
                    <span className="font-pixel-ui text-[10.5px] sm:text-[11px] tracking-normal leading-tight truncate max-w-full px-0.5">
                      Menu
                    </span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
        )}

        {/* Handheld Console Footer Trim */}
        <div className="no-print print:hidden hidden sm:flex items-center justify-between px-2 pt-2.5 text-[var(--text-on-bezel)] font-pixel-ui text-[10.5px] font-bold">
          <div className="flex items-center gap-1.5">
            <PixelStar size={12} />
            <span>PIXEL QUEST ACADEMY</span>
          </div>
          <span>PIXEL QUEST ACADEMY</span>
        </div>
      </div>

      {/* Window Close Button Logout Confirmation Modal (Item 1.2) */}
      <PixelConfirmDialog
        open={logoutConfirmOpen}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sesi saat ini dan kembali ke Layar Login?"
        confirmLabel="Ya, Keluar"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          onLogout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      {/* Sync History Log Modal (Item 3.5) */}
      <PixelModal
        open={syncHistoryOpen}
        title="Riwayat Sinkronisasi"
        onClose={() => setSyncHistoryOpen(false)}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] text-[var(--text-secondary)]">
              Catatan sinkronisasi Cloud &amp; penyimpanan lokal terbaru ({syncLogs.length} log).
            </p>
            <div className="flex items-center gap-1.5">
              {onClearSyncLogs && syncLogs.length > 0 && (
                <PixelButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  onClick={onClearSyncLogs}
                >
                  Bersihkan
                </PixelButton>
              )}
              {onManualSync && (
                <PixelButton
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={isSyncing}
                  onClick={onManualSync}
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  Sync Sekarang
                </PixelButton>
              )}
            </div>
          </div>

          {syncLogs.length === 0 ? (
            <div className="pixel-box-inset p-4 text-center text-[13px] text-[var(--text-secondary)]">
              Belum ada aktivitas sinkronisasi tercatat pada sesi ini.
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pixel-scroll pr-1">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="pixel-box-inset p-2.5 flex items-start justify-between gap-2.5 text-[12.5px]"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded font-pixel-ui text-[10.5px] font-bold uppercase ${
                          log.status === 'error'
                            ? 'bg-rose-100 text-rose-800 border border-rose-700'
                            : log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-700'
                              : 'bg-amber-100 text-amber-900 border border-amber-700'
                        }`}
                      >
                        {log.status === 'error'
                          ? 'GAGAL'
                          : log.status === 'success'
                            ? 'SUKSES'
                            : 'INFO'}
                      </span>
                      <span className="font-bold text-[var(--text-primary)] truncate">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] break-words">
                      {log.detail}
                    </p>
                  </div>
                  <span className="font-pixel-ui text-[11px] text-[var(--text-muted)] shrink-0 tabular-nums">
                    {log.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PixelModal>
    </div>
  );
};
