import React from 'react';
import {
  BookOpen,
  Castle,
  Crown,
  Gamepad2,
  Grid,
  LogOut,
  Map,
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
  AvatarClass,
  GmMenuId,
  HeroMenuId,
  PixelTheme,
  UserRole,
} from '../types/lms';
import { PixelAvatar, PixelCoin, PixelStar } from './PixelArt';
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
  { id: 'settings', label: 'System Settings', shortLabel: 'Config', standardName: 'Pengaturan' },
];

export const HERO_NAV_ITEMS: {
  id: HeroMenuId;
  label: string;
  shortLabel: string;
  standardName: string;
}[] = [
  { id: 'notice', label: 'Guild Notice', shortLabel: 'Town Hub', standardName: 'Pengumuman' },
  { id: 'scroll_library', label: 'Scroll Library', shortLabel: 'Scrolls', standardName: 'Materi' },
  { id: 'my_guild', label: 'My Guild / Party', shortLabel: 'My Guild', standardName: 'Kelas' },
  { id: 'hero_log', label: 'Hero Log / Status', shortLabel: 'Hero Log', standardName: 'Status' },
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
    case 'settings':
      return <Settings size={size} />;
  }
}

export function getHeroMenuIcon(id: HeroMenuId, size = 18) {
  switch (id) {
    case 'notice':
      return <ScrollText size={size} />;
    case 'scroll_library':
      return <BookOpen size={size} />;
    case 'my_guild':
      return <Castle size={size} />;
    case 'hero_log':
      return <Star size={size} />;
  }
}

interface ArcadeShellProps {
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
  onOpenGmDrawer: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

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
  onOpenGmDrawer,
  onLogout,
  children,
}) => {
  const isGm = role === UserRole.GAME_MASTER;
  const activeTitle = isGm
    ? GM_NAV_ITEMS.find((i) => i.id === gmMenu)?.label || 'HQ / Tavern Hall'
    : HERO_NAV_ITEMS.find((i) => i.id === heroMenu)?.label || 'Guild Notice';

  const quickGmTabs: GmMenuId[] = ['hq', 'dungeons', 'active_quests', 'exp_loot'];

  const isMinimalPaper = theme === 'gameboy_green';

  return (
    <div
      data-theme={theme}
      className="relative min-h-screen w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-6 sm:px-4"
    >
      <ThemeBackdropIllustration theme={theme} />

      {/* Desktop Top Header */}
      <div className="relative z-10 hidden sm:flex items-center justify-between w-full max-w-[640px] md:max-w-[720px] lg:max-w-[800px] mb-3 px-1 gap-2">
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
            onClick={onLogout}
            className="pixel-btn min-h-[34px] px-3 py-1 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[10.5px] flex items-center gap-1.5 cursor-pointer font-bold"
            title="Keluar ke Halaman Login"
          >
            <LogOut size={13} />
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Theme-Adaptive Console / Editorial Frame */}
      <div
        className={`relative z-10 w-full max-w-[560px] sm:max-w-[640px] md:max-w-[720px] lg:max-w-[800px] console-bezel transition-all ${
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
          className={`relative w-full min-h-screen sm:min-h-[780px] sm:h-[86vh] sm:max-h-[920px] flex flex-col bg-[var(--bg-canvas)] overflow-hidden ${
            isMinimalPaper
              ? 'sm:rounded-xl'
              : theme === 'daylight_rpg'
                ? 'sm:rounded-[20px] sm:border-2 sm:border-[var(--border-pixel)]'
                : 'sm:rounded-lg sm:border-2 sm:border-[var(--border-pixel)]'
          } ${crtScanlines && !isMinimalPaper ? 'crt-scanlines' : ''}`}
        >
          {/* Top App Bar */}
          <header
            className={`sticky top-0 z-30 min-h-[56px] shrink-0 bg-[var(--surface-tint)] comic-halftone px-2.5 sm:px-3.5 py-1.5 flex items-center justify-between gap-2 ${
              isMinimalPaper
                ? 'border-b border-[#d6d1c7] bg-white'
                : 'border-b-2 border-[var(--border-pixel)]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PixelAvatar
                avatar={isGm ? gmAvatar : activeHeroAvatar}
                size={34}
                className="shrink-0 animate-pixel-bounce"
              />
              <div className="min-w-0 flex-1">
                <h1 className="font-pixel-display text-[12px] sm:text-[13.5px] text-[var(--text-primary)] truncate leading-snug">
                  {activeTitle}
                </h1>
                <p className="text-[11.5px] sm:text-[12px] text-[var(--text-secondary)] leading-tight mt-0.5 truncate flex items-center gap-1">
                  {isGm ? (
                    <span className="text-[var(--accent-warning)] flex items-center gap-1 font-pixel-ui text-[10.5px] font-bold shrink-0">
                      <Crown size={11} /> GM
                    </span>
                  ) : (
                    <span className="text-[var(--accent-success)] flex items-center gap-1 font-pixel-ui text-[10.5px] font-bold shrink-0">
                      <Shield size={11} /> HERO
                    </span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="truncate font-semibold">{isGm ? gmName : activeHeroName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="sm:hidden">
                <PWAInstallButton compact />
              </div>
              {/* Cloud Sync button */}
              {onManualSync && (
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="pixel-btn min-w-[36px] min-h-[36px] px-2 flex items-center justify-center gap-1 bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer font-pixel-ui text-[9.5px]"
                  title="Sinkronkan Data Cloud"
                  aria-label="Sinkronkan Data Cloud"
                >
                  <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Sync</span>
                </button>
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

              {/* Exit/Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="pixel-btn min-w-[36px] min-h-[36px] px-2 sm:px-2.5 py-1 bg-[var(--accent-danger)] text-[var(--text-on-danger)] font-pixel-ui text-[10px] flex items-center justify-center gap-1 cursor-pointer font-bold"
                title="Keluar / Logout"
                aria-label="Keluar / Logout"
              >
                <LogOut size={14} />
                <span className="hidden min-[390px]:inline">Keluar</span>
              </button>
            </div>
          </header>

          {/* Main Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto pixel-scroll p-3.5 sm:p-5 pb-24 space-y-4">
            {children}
          </main>

          {/* Bottom Tab Bar Navigation */}
          <nav
            aria-label={isGm ? 'Game Master Navigation' : 'Hero Navigation'}
            className="sticky bottom-0 left-0 w-full z-30 h-[62px] shrink-0 bg-[var(--bg-surface)] border-t-2 border-[var(--border-pixel)]"
          >
            {isGm ? (
              <div className="grid grid-cols-5 h-full">
                {quickGmTabs.map((tabId) => {
                  const item = GM_NAV_ITEMS.find((i) => i.id === tabId)!;
                  const active = gmMenu === tabId;
                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => onSelectGmMenu(tabId)}
                      className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors border-r-2 border-[var(--border-pixel)]/20 ${
                        active
                          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                      }`}
                    >
                      {getGmMenuIcon(tabId, 19)}
                      <span className="font-pixel-ui text-[8.5px] sm:text-[9.5px] tracking-tight leading-none whitespace-nowrap truncate max-w-full">
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={onOpenGmDrawer}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-0.5 cursor-pointer transition-colors ${
                    !quickGmTabs.includes(gmMenu)
                      ? 'bg-[var(--comic-gold)] text-[#09090f] font-bold'
                      : 'text-[var(--accent-warning)] hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  <Grid size={19} />
                  <span className="font-pixel-ui text-[8.5px] sm:text-[9.5px] tracking-tight leading-none whitespace-nowrap">
                    9 Menus
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 h-full">
                {HERO_NAV_ITEMS.map((item) => {
                  const active = heroMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectHeroMenu(item.id)}
                      className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 cursor-pointer transition-colors border-r-2 last:border-r-0 border-[var(--border-pixel)]/20 ${
                        active
                          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                      }`}
                    >
                      {getHeroMenuIcon(item.id, 19)}
                      <span className="font-pixel-ui text-[9px] sm:text-[9.5px] tracking-tight leading-none whitespace-nowrap truncate max-w-full">
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

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
    </div>
  );
};
