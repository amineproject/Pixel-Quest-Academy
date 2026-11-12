import React, { useCallback, useEffect, useState } from 'react';
import {
  AcademyState,
  ActiveQuest,
  AncientTome,
  AuthSession,
  Dungeon,
  ExpGrade,
  GameMasterProfile,
  GmMenuId,
  HeroMenuId,
  HeroStudent,
  PixelTheme,
  QuestNotice,
  Realm,
  SystemSettings,
  UserRole,
} from './types/lms';
import { INITIAL_ACADEMY_STATE, STORAGE_KEY } from './data/seedData';
import {
  ArcadeShell,
  GM_NAV_ITEMS,
  getGmMenuIcon,
} from './components/ArcadeShell';
import {
  AccessDeniedModal,
  PixelModal,
  PixelToast,
} from './components/PixelUI';
import { playRetroSound } from './utils/sound';
import {
  cloudDeleteDungeon,
  cloudDeleteHero,
  cloudDeleteNotice,
  cloudDeleteQuest,
  cloudDeleteRealm,
  cloudDeleteTome,
  cloudSyncDungeon,
  cloudSyncGrade,
  cloudSyncHero,
  cloudSyncNotice,
  cloudSyncQuest,
  cloudSyncRealm,
  cloudSyncSettings,
  cloudSyncTome,
  fetchAcademyFromSupabase,
} from './lib/supabase';

// Login Title View
import { LoginView } from './views/auth/LoginView';

// Game Master Views
import { GmDashboard } from './views/gm/GmDashboard';
import { GmDungeons } from './views/gm/GmDungeons';
import { GmHeroes } from './views/gm/GmHeroes';
import { GmQuestBoard } from './views/gm/GmQuestBoard';
import { GmRealms } from './views/gm/GmRealms';
import { GmScrolls } from './views/gm/GmScrolls';
import { GmActiveQuests } from './views/gm/GmActiveQuests';
import { GmExpLoot } from './views/gm/GmExpLoot';
import { GmSettings } from './views/gm/GmSettings';

// Hero (Read-Only) Views
import { HeroNotice } from './views/hero/HeroNotice';
import { HeroScrollLibrary } from './views/hero/HeroScrollLibrary';
import { HeroMyGuild } from './views/hero/HeroMyGuild';
import { HeroLog } from './views/hero/HeroLog';

const AUTH_KEY = 'pixel_quest_auth_session';

function loadInitialState(): AcademyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_ACADEMY_STATE;
    const parsed = JSON.parse(raw) as Partial<AcademyState>;
    if (!parsed || !Array.isArray(parsed.dungeons) || !Array.isArray(parsed.heroes)) {
      return INITIAL_ACADEMY_STATE;
    }
    return {
      ...INITIAL_ACADEMY_STATE,
      ...parsed,
      gmProfile: { ...INITIAL_ACADEMY_STATE.gmProfile, ...parsed.gmProfile },
      settings: { ...INITIAL_ACADEMY_STATE.settings, ...parsed.settings },
    };
  } catch {
    return INITIAL_ACADEMY_STATE;
  }
}

function loadInitialAuth(): AuthSession {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isLoggedIn: false, role: UserRole.HERO };
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed && typeof parsed.isLoggedIn === 'boolean') {
      return parsed;
    }
    return { isLoggedIn: false, role: UserRole.HERO };
  } catch {
    return { isLoggedIn: false, role: UserRole.HERO };
  }
}

export default function App() {
  const [state, setState] = useState<AcademyState>(loadInitialState);
  const [authSession, setAuthSession] = useState<AuthSession>(loadInitialAuth);
  const [role, setRole] = useState<UserRole>(() => authSession.role || UserRole.GAME_MASTER);
  const [gmMenu, setGmMenu] = useState<GmMenuId>('hq');
  const [heroMenu, setHeroMenu] = useState<HeroMenuId>('notice');
  const [activeHeroId, setActiveHeroId] = useState<string>(
    () => authSession.heroId || 'hr-rian'
  );
  const [gmDrawerOpen, setGmDrawerOpen] = useState(false);

  // EC-01 Access Denied Guard State
  const [deniedRoute, setDeniedRoute] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'warning' | 'danger';
  } | null>(null);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'warning' | 'danger' = 'success') => {
      setToast({ message, tone });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Persist State to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota error
    }
  }, [state]);

  // Persist Auth Session
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authSession));
    } catch {
      // Ignore quota error
    }
  }, [authSession]);

  // Sync active Hero fallback if edited/deleted
  const activeHero =
    state.heroes.find((h) => h.id === activeHeroId) ||
    state.heroes.find((h) => h.active) ||
    state.heroes[0];

  // Hash-based route & EC-01 RBAC Guard listener
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      if (hash.startsWith('#/gm/')) {
        if (role === UserRole.HERO) {
          playRetroSound('error', state.settings.soundEnabled);
          setDeniedRoute(hash);
          window.location.hash = `#/hero/${heroMenu}`;
          return;
        }
        const slug = hash.replace('#/gm/', '').split('/')[0] as GmMenuId;
        if (GM_NAV_ITEMS.some((i) => i.id === slug)) {
          setGmMenu(slug);
        }
      } else if (hash.startsWith('#/hero/')) {
        const slug = hash.replace('#/hero/', '').split('/')[0] as HeroMenuId;
        if (
          ['notice', 'scroll_library', 'my_guild', 'hero_log'].includes(slug)
        ) {
          setHeroMenu(slug);
        }
      }
    };

    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [role, heroMenu, state.settings.soundEnabled]);

  const handleLoginAsHero = (hero: HeroStudent) => {
    setAuthSession({
      isLoggedIn: true,
      role: UserRole.HERO,
      heroId: hero.id,
    });
    setRole(UserRole.HERO);
    setActiveHeroId(hero.id);
    setHeroMenu('notice');
    window.location.hash = '#/hero/notice';
    showToast(`Selamat datang, Hero ${hero.name}!`, 'success');
  };

  const handleLoginAsGm = () => {
    setAuthSession({
      isLoggedIn: true,
      role: UserRole.GAME_MASTER,
    });
    setRole(UserRole.GAME_MASTER);
    setGmMenu('hq');
    window.location.hash = '#/gm/hq';
    showToast(`Selamat datang kembali, Guild Master!`, 'success');
  };

  const handleLogout = () => {
    playRetroSound('logout', state.settings.soundEnabled);
    setAuthSession({
      isLoggedIn: false,
      role: UserRole.HERO,
    });
    window.location.hash = '';
    showToast('Berhasil keluar ke Title Screen.', 'warning');
  };

  const handleSelectGmMenu = (id: GmMenuId) => {
    if (role !== UserRole.GAME_MASTER) {
      playRetroSound('error', state.settings.soundEnabled);
      setDeniedRoute(`#/gm/${id}`);
      return;
    }
    playRetroSound('blip', state.settings.soundEnabled);
    setGmMenu(id);
    setGmDrawerOpen(false);
    window.location.hash = `#/gm/${id}`;
  };

  const handleSelectHeroMenu = (id: HeroMenuId) => {
    playRetroSound('blip', state.settings.soundEnabled);
    setHeroMenu(id);
    window.location.hash = `#/hero/${id}`;
  };

  const handleToggleSound = () => {
    const nextVal = !state.settings.soundEnabled;
    playRetroSound('blip', true);
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, soundEnabled: nextVal },
    }));
    showToast(nextVal ? 'Sound Effects ON' : 'Sound Effects Muted', 'warning');
  };

  const handleUpdateTheme = (theme: PixelTheme) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  };

  const handleTriggerAccessDenied = (route: string) => {
    playRetroSound('error', state.settings.soundEnabled);
    if (role !== UserRole.HERO) {
      setRole(UserRole.HERO);
    }
    setDeniedRoute(route);
  };

  const handleReturnFromDenied = () => {
    playRetroSound('blip', state.settings.soundEnabled);
    setDeniedRoute(null);
    setHeroMenu('notice');
    window.location.hash = '#/hero/notice';
  };

  // Sync from Cloud (Supabase) and Backend (Express / Cloud SQL if running)
  const syncFromRemote = useCallback(async () => {
    // 1. Try Supabase Cloud first (works across all devices anywhere)
    try {
      const cloudData = await fetchAcademyFromSupabase();
      if (cloudData && Array.isArray(cloudData.dungeons) && Array.isArray(cloudData.heroes)) {
        setState((prev) => ({
          ...prev,
          ...cloudData,
          settings: { ...prev.settings, ...(cloudData.settings || {}) },
          gmProfile: { ...prev.gmProfile, ...(cloudData.gmProfile || {}) },
        }));
        return;
      }
    } catch (err) {
      console.warn('Supabase sync error:', err);
    }

    // 2. Fallback to Express backend if running
    try {
      const res = await fetch('/api/academy');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.dungeons) && Array.isArray(data.heroes)) {
          setState((prev) => ({
            ...prev,
            ...data,
            settings: { ...prev.settings, ...(data.settings || {}) },
            gmProfile: { ...prev.gmProfile, ...(data.gmProfile || {}) },
          }));
        }
      }
    } catch {
      // Local mode or offline
    }
  }, []);

  useEffect(() => {
    syncFromRemote();

    // Cross-device auto-sync on tab focus or visibility change
    const handleRecheck = () => {
      syncFromRemote();
    };
    window.addEventListener('focus', handleRecheck);
    window.addEventListener('visibilitychange', handleRecheck);

    return () => {
      window.removeEventListener('focus', handleRecheck);
      window.removeEventListener('visibilitychange', handleRecheck);
    };
  }, [syncFromRemote]);

  // CRUD Upsert & Delete Handlers
  const upsertItem = <T extends { id: string }>(list: T[], item: T): T[] => {
    const exists = list.some((x) => x.id === item.id);
    return exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
  };

  const handleSaveDungeon = (dungeon: Dungeon) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      dungeons: upsertItem(prev.dungeons, dungeon),
    }));
    cloudSyncDungeon(dungeon).catch(() => {});
    fetch('/api/dungeons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dungeon),
    }).catch(() => {});
    showToast(`Dungeon "${dungeon.name}" saved!`);
  };

  const handleDeleteDungeon = (id: string) => {
    playRetroSound('confirm', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      dungeons: prev.dungeons.filter((d) => d.id !== id),
    }));
    cloudDeleteDungeon(id).catch(() => {});
    fetch(`/api/dungeons/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Dungeon deleted.', 'warning');
  };

  const handleSaveHero = (hero: HeroStudent) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      heroes: upsertItem(prev.heroes, hero),
    }));
    cloudSyncHero(hero).catch(() => {});
    fetch('/api/heroes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hero),
    }).catch(() => {});
    showToast(`Hero "${hero.name}" updated!`);
  };

  const handleDeleteHero = (id: string) => {
    playRetroSound('confirm', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      heroes: prev.heroes.filter((h) => h.id !== id),
      grades: prev.grades.filter((g) => g.heroId !== id),
    }));
    cloudDeleteHero(id).catch(() => {});
    fetch(`/api/heroes/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Hero removed from roster.', 'warning');
  };

  const handleSaveNotice = (notice: QuestNotice) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      notices: upsertItem(prev.notices, notice),
    }));
    cloudSyncNotice(notice).catch(() => {});
    fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice),
    }).catch(() => {});
    showToast('Broadcast published to Quest Board!');
  };

  const handleDeleteNotice = (id: string) => {
    playRetroSound('confirm', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      notices: prev.notices.filter((n) => n.id !== id),
    }));
    cloudDeleteNotice(id).catch(() => {});
    fetch(`/api/notices/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Notice deleted.', 'warning');
  };

  const handleSaveRealm = (realm: Realm) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      realms: upsertItem(prev.realms, realm),
    }));
    cloudSyncRealm(realm).catch(() => {});
    fetch('/api/realms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(realm),
    }).catch(() => {});
    showToast(`Realm "${realm.name}" saved!`);
  };

  const handleDeleteRealm = (id: string) => {
    playRetroSound('confirm', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      realms: prev.realms.filter((r) => r.id !== id),
    }));
    cloudDeleteRealm(id).catch(() => {});
    fetch(`/api/realms/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Realm deleted.', 'warning');
  };

  const handleSaveTome = (tome: AncientTome) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      tomes: upsertItem(prev.tomes, tome),
    }));
    cloudSyncTome(tome).catch(() => {});
    fetch('/api/tomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tome),
    }).catch(() => {});
    showToast(`Tome "${tome.title}" published!`);
  };

  const handleDeleteTome = (id: string) => {
    playRetroSound('confirm', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      tomes: prev.tomes.filter((t) => t.id !== id),
    }));
    cloudDeleteTome(id).catch(() => {});
    fetch(`/api/tomes/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Tome deleted.', 'warning');
  };

  const handleSaveQuest = (quest: ActiveQuest) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      quests: upsertItem(prev.quests, quest),
    }));
    cloudSyncQuest(quest).catch(() => {});
    fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quest),
    }).catch(() => {});
    showToast(`Quest "${quest.title}" saved!`);
  };

  const handleDeleteQuest = (id: string) => {
    playRetroSound('confirm', state.settings.soundEnabled);
    setState((prev) => ({
      ...prev,
      quests: prev.quests.filter((q) => q.id !== id),
      grades: prev.grades.filter((g) => g.questId !== id),
    }));
    cloudDeleteQuest(id).catch(() => {});
    fetch(`/api/quests/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Quest deleted.', 'warning');
  };

  const handleSaveGrade = (grade: ExpGrade) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => {
      const existing = prev.grades.find(
        (g) => g.heroId === grade.heroId && g.questId === grade.questId
      );
      const nextGrades = existing
        ? prev.grades.map((g) => (g.id === existing.id ? { ...grade, id: existing.id } : g))
        : [grade, ...prev.grades];
      return { ...prev, grades: nextGrades };
    });
    cloudSyncGrade(grade).catch(() => {});
    fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grade),
    }).catch(() => {});
    const heroName = state.heroes.find((h) => h.id === grade.heroId)?.name || 'Hero';
    showToast(`Saved ${grade.score}/100 (+${grade.expEarned} EXP) for ${heroName}!`);
  };

  const handleUpdateGmProfile = (gmProfile: GameMasterProfile) => {
    playRetroSound('save', state.settings.soundEnabled);
    setState((prev) => ({ ...prev, gmProfile }));
    cloudSyncSettings(state.settings, gmProfile).catch(() => {});
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: state.settings, gmProfile }),
    }).catch(() => {});
    showToast('Game Master profile updated!');
  };

  const handleUpdateSettings = (settings: SystemSettings) => {
    playRetroSound('blip', settings.soundEnabled);
    setState((prev) => ({ ...prev, settings }));
    cloudSyncSettings(settings, state.gmProfile).catch(() => {});
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, gmProfile: state.gmProfile }),
    }).catch(() => {});
  };

  const handleResetDemoData = () => {
    playRetroSound('confirm', state.settings.soundEnabled);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_KEY);
    setState(INITIAL_ACADEMY_STATE);
    setAuthSession({ isLoggedIn: false, role: UserRole.HERO });
    setActiveHeroId('hr-rian');
    showToast('Demo data restored to defaults!', 'warning');
  };

  // If user is not logged in, render the cheerful Retro Title & Login Screen!
  if (!authSession.isLoggedIn) {
    return (
      <>
        <PixelToast message={toast?.message || null} tone={toast?.tone} />
        <LoginView
          state={state}
          onLoginAsHero={handleLoginAsHero}
          onLoginAsGm={handleLoginAsGm}
          onUpdateTheme={handleUpdateTheme}
          onToggleSound={handleToggleSound}
        />
      </>
    );
  }

  // Once authenticated, render the Handheld Retro Arcade LMS
  return (
    <ArcadeShell
      theme={state.settings.theme}
      crtScanlines={state.settings.crtScanlines}
      soundEnabled={state.settings.soundEnabled}
      role={role}
      gmMenu={gmMenu}
      heroMenu={heroMenu}
      activeHeroName={activeHero?.name || 'Adventurer'}
      activeHeroAvatar={activeHero?.avatar || 'knight'}
      gmName={state.gmProfile.name}
      gmAvatar={state.gmProfile.avatar}
      onSelectGmMenu={handleSelectGmMenu}
      onSelectHeroMenu={handleSelectHeroMenu}
      onToggleSound={handleToggleSound}
      onLogout={handleLogout}
      onOpenGmDrawer={() => {
        playRetroSound('blip', state.settings.soundEnabled);
        setGmDrawerOpen(true);
      }}
    >
      <PixelToast message={toast?.message || null} tone={toast?.tone} />

      {role === UserRole.GAME_MASTER ? (
        <>
          {gmMenu === 'hq' && (
            <GmDashboard
              state={state}
              onNavigate={handleSelectGmMenu}
            />
          )}
          {gmMenu === 'dungeons' && (
            <GmDungeons
              state={state}
              onSaveDungeon={handleSaveDungeon}
              onDeleteDungeon={handleDeleteDungeon}
            />
          )}
          {gmMenu === 'heroes' && (
            <GmHeroes
              state={state}
              onSaveHero={handleSaveHero}
              onDeleteHero={handleDeleteHero}
            />
          )}
          {gmMenu === 'quest_board' && (
            <GmQuestBoard
              state={state}
              onSaveNotice={handleSaveNotice}
              onDeleteNotice={handleDeleteNotice}
            />
          )}
          {gmMenu === 'realms' && (
            <GmRealms
              state={state}
              onSaveRealm={handleSaveRealm}
              onDeleteRealm={handleDeleteRealm}
            />
          )}
          {gmMenu === 'scrolls' && (
            <GmScrolls
              state={state}
              onSaveTome={handleSaveTome}
              onDeleteTome={handleDeleteTome}
            />
          )}
          {gmMenu === 'active_quests' && (
            <GmActiveQuests
              state={state}
              onSaveQuest={handleSaveQuest}
              onDeleteQuest={handleDeleteQuest}
            />
          )}
          {gmMenu === 'exp_loot' && (
            <GmExpLoot state={state} onSaveGrade={handleSaveGrade} />
          )}
          {gmMenu === 'settings' && (
            <GmSettings
              state={state}
              onUpdateGmProfile={handleUpdateGmProfile}
              onUpdateSettings={handleUpdateSettings}
              onResetDemoData={handleResetDemoData}
              onTestAccessDenied={() =>
                handleTriggerAccessDenied('#/gm/exp-loot/edit')
              }
            />
          )}
        </>
      ) : (
        activeHero && (
          <>
            {heroMenu === 'notice' && (
              <HeroNotice
                state={state}
                hero={activeHero}
                onNavigate={handleSelectHeroMenu}
                onAttemptRestrictedRoute={handleTriggerAccessDenied}
              />
            )}
            {heroMenu === 'scroll_library' && (
              <HeroScrollLibrary state={state} hero={activeHero} />
            )}
            {heroMenu === 'my_guild' && (
              <HeroMyGuild state={state} hero={activeHero} />
            )}
            {heroMenu === 'hero_log' && (
              <HeroLog
                state={state}
                hero={activeHero}
              />
            )}
          </>
        )
      )}

      {/* Game Master 9-Menu Drawer */}
      <PixelModal
        open={gmDrawerOpen}
        title="Game Master — 9 Menus"
        onClose={() => setGmDrawerOpen(false)}
      >
        <div className="grid grid-cols-3 gap-2.5">
          {GM_NAV_ITEMS.map((item) => {
            const active = gmMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGmMenu(item.id)}
                className={`pixel-btn min-h-[78px] p-2 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                }`}
              >
                <span className="text-[var(--accent-warning)]">
                  {getGmMenuIcon(item.id, 20)}
                </span>
                <span className="font-pixel-ui text-[10px] leading-tight">
                  {item.shortLabel}
                </span>
                <span className="font-pixel-body text-[13px] opacity-80 leading-none">
                  {item.standardName}
                </span>
              </button>
            );
          })}
        </div>
      </PixelModal>

      {/* EC-01 Access Denied Guard Dialog */}
      <AccessDeniedModal
        open={Boolean(deniedRoute)}
        attemptedRoute={deniedRoute}
        onReturnToHub={handleReturnFromDenied}
      />
    </ArcadeShell>
  );
}
