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
  UserRole,
} from '../types/lms';
import { EraSelector } from './EraSelector';
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
  { id: 'quest_list', label: 'Quest Board', shortLabel: 'Board', standardName: 'Papan Tugas' },
  { id: 'exp_loot', label: 'EXP & Loot', shortLabel: 'EXP', standardName: 'Penilaian' },
  { id: 'guild_chronicles', label: 'Guild Chronicles', shortLabel: 'Chronicles', standardName: 'Statistik' },
  { id: 'hall_of_fame', label: 'Hall of Fame', shortLabel: 'Fame', standardName: 'Peringkat' },
  { id: 'settings', label: 'System Settings', shortLabel: 'Config', standardName: 'Pengaturan' },
  { id: 'about', label: 'Tentang Aplikasi', shortLabel: 'Tentang', standardName: 'Info v3.0' },
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
  { id: 'about', label: 'Tentang Aplikasi', shortLabel: 'Tentang', standardName: 'Info v3.0' },
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
    case 'quest_list':
      return <ClipboardList size={size} />;
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
  onSwitchEra?: (eraId: string) => void;
  onCreateEra?: (era: AcademicYear) => void;
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
  onSwitchEra,
  onCreateEra,
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

  const isMinimalPaper = theme === 'gameboy_green';
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
      className="relative min-h-[100dvh] w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-4 sm:px-4"
    >
      <ThemeBackdropIllustration theme={theme} />

      {/* Desktop Top Header */}
      <div
        className={`relative z-10 hidden sm:flex items-center justify-between w-full mb-2.5 px-1 gap-2 transition-all ${
          isWindowMaximized
            ? 'max-w-[1380px]'
            : 'max-w-[640px] md:max-w-[960px] lg:max-w-[1080px]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {!isMinimalPaper && (
            <div className="w-9 h-9 rounded-[var(--btn-radius)] bg-[var(--comic-gold)] border-2 border-[var(--border-pixel)] shadow-[3px_3px_0_var(--shadow-ink)] flex items-center justify-center shrink-0">
              <PixelStar size={19} className="animate-pixel-float" />
            </div>
          )}
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
        className={`relative z-10 w-full console-bezel transition-all ${
          isWindowMaximized
            ? 'max-w-[1380px]'
            : 'max-w-[560px] sm:max-w-[640px] md:max-w-[960px] lg:max-w-[1080px]'
        } ${
          isMinimalPaper
            ? 'sm:p-0 sm:rounded-xl sm:border sm:border-[#d6d1c7] sm:bg-white'
            : 'sm:p-3 sm:rounded-xl sm:bg-[var(--bezel-body)] sm:border-2 sm:border-[var(--bezel-trim)] sm:shadow-[6px_6px_0_0_var(--shadow-ink)]'
        }`}
      >
        {/* Console Hardware Top Trim (Desktop only — hidden in Clean Paper Studio) */}
        {!isMinimalPaper && (
          <div className="hidden sm:flex items-center justify-between px-2 pb-2 text-[var(--text-on-bezel)] font-bold">
            <div className="flex items-center gap-2 font-pixel-ui text-[11px] tracking-wider uppercase">
              <PixelCoin size={15} className="animate-coin-shine" />
              <span>
                {theme === 'sunny_quest'
                  ? 'COZY PIXEL QUEST · PARCHMENT RPG'
                  : theme === 'daylight_rpg'
                    ? 'SOFT CHIBI CLASSROOM · PASTEL EDITION'
                    : theme === 'nes_classic'
                      ? '16-BIT ROYAL CHRONICLE · RPG LMS'
                      : 'COMIC-POP ARCADE EDITION'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsWindowMinimized((prev) => !prev)}
                className="w-5 h-5 rounded-sm border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[#18181b] text-[10px] flex items-center justify-center leading-none font-bold hover:bg-[var(--comic-gold)] cursor-pointer"
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
                className="w-5 h-5 rounded-sm border-2 border-[var(--border-pixel)] bg-[var(--bg-surface)] text-[#18181b] text-[9px] flex items-center justify-center leading-none font-bold hover:bg-[var(--comic-gold)] cursor-pointer"
                title={isWindowMaximized ? 'Ukuran Normal' : 'Perbesar Jendela'}
                aria-label={isWindowMaximized ? 'Ukuran Normal' : 'Perbesar Jendela'}
              >
                □
              </button>
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-5 h-5 rounded-sm border-2 border-[var(--border-pixel)] bg-[#fb7185] text-[#18181b] text-[10px] flex items-center justify-center leading-none font-bold hover:bg-[#f43f5e] hover:text-white cursor-pointer"
                title="Keluar / Logout"
                aria-label="Keluar / Logout"
              >
                ×
              </button>
            </div>
          </div>
        )}

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
          className={`relative w-full h-[100dvh] flex flex-col md:flex-row bg-[var(--bg-canvas)] overflow-hidden ${
            isWindowMaximized
              ? 'sm:h-[calc(100dvh-110px)] sm:min-h-[500px]'
              : 'sm:h-[calc(100dvh-150px)] sm:min-h-[460px] sm:max-h-[860px]'
          } ${
            isMinimalPaper
              ? 'sm:rounded-xl'
              : theme === 'daylight_rpg'
                ? 'sm:rounded-[20px] sm:border-2 sm:border-[var(--border-pixel)]'
                : 'sm:rounded-lg sm:border-2 sm:border-[var(--border-pixel)]'
          } ${crtScanlines && !isMinimalPaper ? 'crt-scanlines' : ''}`}
        >
          {/* Persistent Sidebar Navigation (Desktop & Tablet >= 768px) */}
          <aside
            aria-label={isGm ? 'Game Master Sidebar Navigation' : 'Hero Sidebar Navigation'}
            className={`hidden md:flex md:flex-col md:w-[236px] lg:w-[258px] shrink-0 overflow-hidden ${
              isMinimalPaper
                ? 'bg-white border-r border-[#d6d1c7]'
                : theme === 'sunny_quest'
                  ? 'bg-[#f6ead0] border-r-2 border-[var(--border-pixel)]'
                  : theme === 'daylight_rpg'
                    ? 'bg-white border-r-2 border-[var(--border-pixel)]'
                    : theme === 'nes_classic'
                      ? 'bg-[#f8f1e0] border-r-2 border-[var(--border-pixel)]'
                      : 'bg-white border-r-[2.5px] border-[#09090f]'
            }`}
          >
            {/* Sidebar User Identity Block */}
            <div
              className={`p-3.5 shrink-0 ${
                isMinimalPaper
                  ? 'border-b border-[#ece7dd]'
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
                  <p className="font-pixel-ui text-[10px] uppercase tracking-wider flex items-center gap-1 text-[var(--accent-warning)]">
                    {isGm ? <Crown size={11} /> : <Shield size={11} />}
                    <span>{isGm ? 'Game Master' : 'Hero · Read-Only'}</span>
                  </p>
                  <p className="text-[13.5px] font-bold text-[var(--text-primary)] truncate mt-0.5">
                    {isGm ? gmName : activeHeroName}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Menu Links */}
            <nav className="flex-1 overflow-y-auto pixel-scroll p-2.5 space-y-1">
              <p className="px-2 pb-1 font-pixel-ui text-[9.5px] uppercase tracking-wider text-[var(--text-muted)]">
                {isGm ? 'Menu Pengelola' : 'Menu Petualang'}
              </p>

              {isGm
                ? GM_NAV_ITEMS.map((item) => {
                    const active = gmMenu === item.id;
                    const activeBtnClass = isMinimalPaper
                      ? 'bg-[#f2eee6] text-[#18181b] border border-[#d6d1c7] font-bold'
                      : theme === 'daylight_rpg'
                        ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-2 border-[var(--border-pixel)] rounded-[14px] shadow-[0_3px_0_0_var(--shadow-ink)] font-bold'
                        : theme === 'nes_classic'
                          ? 'bg-[#5b21b6] text-white border-2 border-[#fbbf24] shadow-[2px_2px_0_0_#311b63] font-bold'
                          : theme === 'cyber_retro'
                            ? 'bg-[#00d8ff] text-[#09090f] border-2 border-[#09090f] shadow-[3px_3px_0_0_#09090f] font-bold'
                            : 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-2 border-[var(--border-pixel)] shadow-[0_3px_0_0_var(--shadow-ink)] font-bold';

                    const idleBtnClass = isMinimalPaper
                      ? 'text-[#3f3f46] border border-transparent hover:bg-[#faf8f4] hover:text-[#18181b]'
                      : theme === 'daylight_rpg'
                        ? 'text-[var(--text-secondary)] border-2 border-transparent rounded-[14px] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] border-2 border-transparent rounded-[var(--btn-radius)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]';

                    const badgeCount = getBadgeCountForGm(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectGmMenu(item.id)}
                        className={`w-full min-h-[42px] px-2.5 py-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          active ? activeBtnClass : idleBtnClass
                        }`}
                      >
                        <span
                          className={`shrink-0 ${
                            active
                              ? theme === 'nes_classic'
                                ? 'text-[#fbbf24]'
                                : 'text-current'
                              : 'text-[var(--accent-warning)]'
                          }`}
                        >
                          {getGmMenuIcon(item.id, 18)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] leading-tight truncate">
                            {item.shortLabel}
                          </span>
                          <span
                            className={`block text-[10.5px] leading-tight truncate ${
                              active ? 'opacity-90' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {item.standardName}
                          </span>
                        </span>
                        {badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--accent-danger)] text-white font-pixel-ui text-[9px] font-bold shrink-0 tabular-nums">
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                : HERO_NAV_ITEMS.map((item) => {
                    const active = heroMenu === item.id;
                    const activeBtnClass = isMinimalPaper
                      ? 'bg-[#f2eee6] text-[#18181b] border border-[#d6d1c7] font-bold'
                      : theme === 'daylight_rpg'
                        ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-2 border-[var(--border-pixel)] rounded-[14px] shadow-[0_3px_0_0_var(--shadow-ink)] font-bold'
                        : theme === 'nes_classic'
                          ? 'bg-[#5b21b6] text-white border-2 border-[#fbbf24] shadow-[2px_2px_0_0_#311b63] font-bold'
                          : theme === 'cyber_retro'
                            ? 'bg-[#00d8ff] text-[#09090f] border-2 border-[#09090f] shadow-[3px_3px_0_0_#09090f] font-bold'
                            : 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-2 border-[var(--border-pixel)] shadow-[0_3px_0_0_var(--shadow-ink)] font-bold';

                    const idleBtnClass = isMinimalPaper
                      ? 'text-[#3f3f46] border border-transparent hover:bg-[#faf8f4] hover:text-[#18181b]'
                      : theme === 'daylight_rpg'
                        ? 'text-[var(--text-secondary)] border-2 border-transparent rounded-[14px] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] border-2 border-transparent rounded-[var(--btn-radius)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)]';

                    const badgeCount = getBadgeCountForHero(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectHeroMenu(item.id)}
                        className={`w-full min-h-[44px] px-2.5 py-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          active ? activeBtnClass : idleBtnClass
                        }`}
                      >
                        <span
                          className={`shrink-0 ${
                            active
                              ? theme === 'nes_classic'
                                ? 'text-[#fbbf24]'
                                : 'text-current'
                              : 'text-[var(--accent-warning)]'
                          }`}
                        >
                          {getHeroMenuIcon(item.id, 18)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] leading-tight truncate">
                            {item.shortLabel}
                          </span>
                          <span
                            className={`block text-[11px] leading-tight truncate ${
                              active ? 'opacity-90' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {item.standardName}
                          </span>
                        </span>
                        {badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--accent-danger)] text-white font-pixel-ui text-[9px] font-bold shrink-0 tabular-nums">
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
                isMinimalPaper
                  ? 'border-t border-[#ece7dd]'
                  : 'border-t-2 border-[var(--border-pixel)]/30'
              }`}
            >
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-full pixel-btn min-h-[38px] px-3 py-1.5 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[10.5px] flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <LogOut size={14} />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </aside>

          {/* Right Main Column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Top App Bar */}
            <header
              className={`z-30 min-h-[56px] shrink-0 bg-[var(--surface-tint)] comic-halftone px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 ${
                isMinimalPaper
                  ? 'border-b border-[#d6d1c7] bg-white'
                  : 'border-b-2 border-[var(--border-pixel)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <PixelAvatar
                  avatar={isGm ? gmAvatar : activeHeroAvatar}
                  size={34}
                  className="md:hidden shrink-0 animate-pixel-bounce"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="font-pixel-display text-[13px] sm:text-[14.5px] text-[var(--text-primary)] truncate leading-snug">
                    {activeTitle}
                  </h1>
                  <div className="text-[12px] text-[var(--text-secondary)] leading-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      {isGm ? (
                        <span className="text-[var(--accent-warning)] flex items-center gap-1 font-pixel-ui text-[11px] font-bold shrink-0">
                          <Crown size={12} /> GM
                        </span>
                      ) : (
                        <span className="text-[var(--accent-success)] flex items-center gap-1 font-pixel-ui text-[11px] font-bold shrink-0">
                          <Shield size={12} /> HERO
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="truncate font-semibold max-w-[150px] sm:max-w-[220px]">
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
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                      className={`pixel-btn min-w-[36px] min-h-[36px] px-2.5 flex items-center justify-center gap-1 cursor-pointer font-pixel-ui text-[9.5px] font-bold ${
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
                  className="sm:hidden pixel-btn min-w-[36px] min-h-[36px] px-2 py-1 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[10px] flex items-center justify-center gap-1 cursor-pointer font-bold"
                  title="Keluar / Logout"
                  aria-label="Keluar / Logout"
                >
                  <LogOut size={14} />
                  <span className="hidden min-[390px]:inline">Keluar</span>
                </button>
              </div>
            </header>

            {/* Main Scrollable Content Area */}
            <main className="flex-1 min-h-0 overflow-y-auto pixel-scroll p-3.5 sm:p-5 pb-8 space-y-4">
              {children}
            </main>

            {/* Mobile Bottom Tab Bar Navigation (hidden on md+ where Persistent Sidebar is active) */}
            <nav
              aria-label={isGm ? 'Game Master Navigation' : 'Hero Navigation'}
              className="md:hidden z-30 h-[62px] shrink-0 bg-[var(--bg-surface)] border-t-2 border-[var(--border-pixel)]"
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
                        className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors border-r-2 border-[var(--border-pixel)]/20 ${
                          active
                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                        }`}
                      >
                        {getGmMenuIcon(tabId, 19)}
                        {badgeCount > 0 && (
                          <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                            {badgeCount}
                          </span>
                        )}
                        <span className="font-pixel-ui text-[10px] sm:text-[10.5px] tracking-tight leading-none whitespace-nowrap truncate max-w-full">
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
                        : 'text-[var(--accent-warning)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <Grid size={19} />
                    {unreadNoticeCount > 0 && (
                      <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                        {unreadNoticeCount}
                      </span>
                    )}
                    <span className="font-pixel-ui text-[10px] sm:text-[10.5px] tracking-tight leading-none whitespace-nowrap">
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
                        className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors border-r-2 border-[var(--border-pixel)]/20 ${
                          active
                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                        }`}
                      >
                        {getHeroMenuIcon(tabId, 19)}
                        {badgeCount > 0 && (
                          <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                            {badgeCount}
                          </span>
                        )}
                        <span className="font-pixel-ui text-[10px] sm:text-[10.5px] tracking-tight leading-none whitespace-nowrap truncate max-w-full">
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
                        : 'text-[var(--accent-warning)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <Grid size={19} />
                    <span className="font-pixel-ui text-[10px] sm:text-[10.5px] tracking-tight leading-none whitespace-nowrap">
                      Menu
                    </span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
        )}

        {/* Handheld Console Footer Trim (Desktop only — hidden in Clean Paper Studio) */}
        {!isMinimalPaper && (
          <div className="hidden sm:flex items-center justify-between px-2 pt-2.5 text-[var(--text-on-bezel)] font-pixel-ui text-[9px] font-bold">
            <div className="flex items-center gap-1.5">
              <PixelStar size={12} />
              <span>PIXEL QUEST ACADEMY</span>
            </div>
            <span>PIXEL QUEST ACADEMY</span>
          </div>
        )}
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
                        className={`px-1.5 py-0.5 rounded font-pixel-ui text-[9px] font-bold uppercase ${
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
                  <span className="font-pixel-ui text-[10px] text-[var(--text-muted)] shrink-0 tabular-nums">
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
