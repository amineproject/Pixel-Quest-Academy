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

  return (
    <div
      data-theme={theme}
      className="min-h-screen w-full pixel-grid-bg bg-[var(--bg-outer)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:py-6 sm:px-4"
    >
      {/* Desktop Arcade Console Top Switcher */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[620px] md:max-w-[680px] mb-3 px-2 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <PixelStar size={18} className="animate-pixel-float shrink-0" />
          <div className="min-w-0">
            <p className="font-pixel-display text-[11px] text-[var(--accent-warning)] truncate drop-shadow-sm">
              PIXEL QUEST ACADEMY
            </p>
            <p className="text-[13px] text-[var(--text-secondary)] truncate">
              {isGm ? `Guild Master: ${gmName}` : `Hero: ${activeHeroName} (Read-Only)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="pixel-btn min-h-[34px] px-3 py-1 bg-[var(--accent-danger)] text-[#11131E] font-pixel-ui text-[10px] flex items-center gap-1.5 cursor-pointer font-bold"
            title="Keluar ke Halaman Login"
          >
            <LogOut size={13} />
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Handheld Arcade Bezel (Proportional: 360px on mobile, up to 680px on desktop) */}
      <div className="w-full max-w-[560px] sm:max-w-[620px] md:max-w-[680px] sm:p-3 sm:bg-[var(--bezel-body)] sm:border-4 sm:border-[var(--bezel-trim)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all">
        {/* Console Hardware Top Trim (Desktop only) */}
        <div className="hidden sm:flex items-center justify-between px-2 pb-2 text-[var(--text-on-warning)] font-bold">
          <div className="flex items-center gap-2 font-pixel-ui text-[10px] tracking-widest uppercase">
            <PixelCoin size={15} className="animate-coin-shine" />
            <span>8-BIT RETRO ACADEMY LMS</span>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-4 h-1.5 bg-black/40 inline-block" />
            <span className="w-4 h-1.5 bg-black/40 inline-block" />
            <span className="w-4 h-1.5 bg-black/40 inline-block" />
          </div>
        </div>

        {/* Screen Viewport */}
        <div
          className={`relative w-full min-h-screen sm:min-h-[780px] sm:h-[86vh] sm:max-h-[920px] flex flex-col bg-[var(--bg-canvas)] sm:border-4 sm:border-black overflow-hidden ${
            crtScanlines ? 'crt-scanlines' : ''
          }`}
        >
          {/* Cheerful Top App Bar (<= 56px, within 15% mobile sticky cap) */}
          <header className="sticky top-0 z-30 h-[56px] shrink-0 bg-[var(--bg-surface)] border-b-3 border-[var(--border-pixel)] px-3 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <PixelAvatar
                avatar={isGm ? gmAvatar : activeHeroAvatar}
                size={34}
                className="shrink-0 animate-pixel-bounce"
              />
              <div className="min-w-0">
                <h1 className="font-pixel-display text-[11px] text-[var(--text-primary)] truncate">
                  {activeTitle}
                </h1>
                <p className="font-pixel-body text-[14px] text-[var(--text-secondary)] leading-none mt-0.5 truncate flex items-center gap-1">
                  {isGm ? (
                    <span className="text-[var(--accent-warning)] flex items-center gap-1 font-pixel-ui text-[9px]">
                      <Crown size={10} /> GM ACCESS
                    </span>
                  ) : (
                    <span className="text-[var(--accent-success)] flex items-center gap-1 font-pixel-ui text-[9px]">
                      <Shield size={10} /> HERO READ-ONLY
                    </span>
                  )}
                  <span>·</span>
                  <span className="truncate">{isGm ? gmName : activeHeroName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Cloud Sync button */}
              {onManualSync && (
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="pixel-btn min-w-[34px] min-h-[34px] px-2 flex items-center justify-center gap-1 bg-[var(--bg-surface-alt)] text-[var(--accent-warning)] cursor-pointer font-pixel-ui text-[9px]"
                  title="Sinkronkan Data Cloud"
                  aria-label="Sinkronkan Data Cloud"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Sync</span>
                </button>
              )}

              {/* Audio toggle button */}
              <button
                type="button"
                onClick={onToggleSound}
                className="pixel-btn min-w-[34px] min-h-[34px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer"
                title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
                aria-label="Toggle sound"
              >
                {soundEnabled ? (
                  <Volume2 size={15} className="text-[var(--accent-success)]" />
                ) : (
                  <VolumeX size={15} className="text-[var(--text-muted)]" />
                )}
              </button>

              {/* Exit/Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="pixel-btn min-h-[34px] px-2.5 py-1 bg-[var(--accent-danger)] text-[#11131E] font-pixel-ui text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                title="Keluar / Logout"
                aria-label="Keluar / Logout"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </header>

          {/* Main Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto pixel-scroll p-4 sm:p-5 pb-24 space-y-4">
            {children}
          </main>

          {/* Bottom Tab Bar Navigation */}
          <nav
            aria-label={isGm ? 'Game Master Navigation' : 'Hero Navigation'}
            className="sticky bottom-0 left-0 w-full z-30 h-[58px] shrink-0 bg-[var(--bg-surface)] border-t-2 border-[var(--border-pixel)] shadow-[0_-3px_12px_rgba(0,0,0,0.3)]"
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
                      className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 cursor-pointer transition-colors border-r border-[var(--border-pixel)]/40 ${
                        active
                          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                      }`}
                    >
                      {getGmMenuIcon(tabId, 18)}
                      <span className="font-pixel-ui text-[9px] whitespace-nowrap truncate max-w-full">
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={onOpenGmDrawer}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 cursor-pointer transition-colors ${
                    !quickGmTabs.includes(gmMenu)
                      ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)] font-bold'
                      : 'text-[var(--accent-warning)] hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  <Grid size={18} />
                  <span className="font-pixel-ui text-[9px] whitespace-nowrap">
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
                      className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 cursor-pointer transition-colors border-r last:border-r-0 border-[var(--border-pixel)]/40 ${
                        active
                          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                      }`}
                    >
                      {getHeroMenuIcon(item.id, 18)}
                      <span className="font-pixel-ui text-[9px] whitespace-nowrap truncate max-w-full">
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Handheld Console Footer Trim (Desktop only) */}
        <div className="hidden sm:flex items-center justify-between px-2 pt-2.5 text-[var(--text-on-warning)] font-pixel-ui text-[9px] font-bold">
          <div className="flex items-center gap-1.5">
            <PixelStar size={12} />
            <span>PIXEL QUEST ACADEMY</span>
          </div>
          <span>VIEWPORT 480PX</span>
        </div>
      </div>
    </div>
  );
};
