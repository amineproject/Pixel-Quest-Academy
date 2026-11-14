import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AcademyState,
  ActiveQuest,
  AncientTome,
  AuthSession,
  AvatarClass,
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
import { OfflineIndicator } from './components/PWAInstallBanner';
import { ThemeProvider } from './context/ThemeContext';
import { playRetroSound } from './utils/sound';
import {
  AcademyFetchContext,
  bootstrapSupabaseFromUrl,
  changeOwnHeroPinCloud,
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
  CloudSyncResult,
  fetchAcademyFromSupabase,
  GmAuthCredentials,
  isSupabaseConfigured,
  subscribeAcademyRealtime,
  updateOwnHeroAvatarCloud,
  updateOwnHeroUsernameCloud,
} from './lib/supabase';

const BOOTSTRAPPED_CLOUD_FROM_URL = bootstrapSupabaseFromUrl();

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
const PERSONAL_THEME_KEY = 'pixel_quest_personal_theme';
const VALID_THEMES: PixelTheme[] = [
  'sunny_quest',
  'daylight_rpg',
  'nes_classic',
  'gameboy_green',
  'cyber_retro',
];

function loadPersonalTheme(): PixelTheme | null {
  try {
    const val = localStorage.getItem(PERSONAL_THEME_KEY) as PixelTheme | null;
    return val && VALID_THEMES.includes(val) ? val : null;
  } catch {
    return null;
  }
}

function loadInitialAuth(): AuthSession {
  try {
    // Always remove legacy localStorage auth key so sessions never leak across browser restarts or shared devices
    localStorage.removeItem(AUTH_KEY);
    // If opened via an admin-shared ?cloud= link, force a fresh login screen for the new user
    if (BOOTSTRAPPED_CLOUD_FROM_URL) {
      sessionStorage.removeItem(AUTH_KEY);
      return { isLoggedIn: false, role: UserRole.HERO };
    }
    const raw = sessionStorage.getItem(AUTH_KEY);
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

function loadInitialState(): AcademyState {
  const personalTheme = loadPersonalTheme();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const base = isSupabaseConfigured()
        ? {
            ...INITIAL_ACADEMY_STATE,
            grades: [],
            gmProfile: { ...INITIAL_ACADEMY_STATE.gmProfile, password: '' },
          }
        : INITIAL_ACADEMY_STATE;
      return personalTheme
        ? { ...base, settings: { ...base.settings, theme: personalTheme } }
        : base;
    }
    const parsed = JSON.parse(raw) as Partial<AcademyState>;
    if (!parsed || !Array.isArray(parsed.dungeons) || !Array.isArray(parsed.heroes)) {
      return personalTheme
        ? {
            ...INITIAL_ACADEMY_STATE,
            settings: { ...INITIAL_ACADEMY_STATE.settings, theme: personalTheme },
          }
        : INITIAL_ACADEMY_STATE;
    }
    const baseState: AcademyState = {
      ...INITIAL_ACADEMY_STATE,
      ...parsed,
      gmProfile: { ...INITIAL_ACADEMY_STATE.gmProfile, ...parsed.gmProfile },
      settings: {
        ...INITIAL_ACADEMY_STATE.settings,
        ...parsed.settings,
        ...(personalTheme ? { theme: personalTheme } : {}),
      },
    };
    if (isSupabaseConfigured()) {
      return {
        ...baseState,
        gmProfile: { ...baseState.gmProfile, password: '' },
      };
    }
    return baseState;
  } catch {
    return INITIAL_ACADEMY_STATE;
  }
}

function sanitizeStateForLocalStorage(
  st: AcademyState,
  auth: AuthSession
): AcademyState {
  if (!isSupabaseConfigured()) return st;
  const isAdminSession = auth.isLoggedIn && auth.role === UserRole.GAME_MASTER;
  return {
    ...st,
    gmProfile: { ...st.gmProfile, password: '' },
    grades: isAdminSession ? st.grades : auth.isLoggedIn ? st.grades : [],
    heroes: st.heroes.map(({ pin: _pin, ...rest }) => rest),
  };
}

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession>(loadInitialAuth);
  const authSessionRef = useRef<AuthSession>(authSession);
  authSessionRef.current = authSession;

  const [state, setState] = useState<AcademyState>(loadInitialState);
  const stateRef = useRef<AcademyState>(state);
  stateRef.current = state;

  const [role, setRole] = useState<UserRole>(() => authSession.role || UserRole.HERO);
  const [gmMenu, setGmMenu] = useState<GmMenuId>('hq');
  const [heroMenu, setHeroMenu] = useState<HeroMenuId>('notice');
  const [activeHeroId, setActiveHeroId] = useState<string>(
    () => authSession.heroId || ''
  );
  const [gmDrawerOpen, setGmDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Persist State to localStorage (scrubbed when Cloud security is enabled)
  useEffect(() => {
    try {
      const safeToStore = sanitizeStateForLocalStorage(state, authSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeToStore));
    } catch {
      // Ignore quota error
    }
  }, [state, authSession]);

  // Persist Auth Session in sessionStorage only (auto-clears when tab/browser closes on shared devices)
  useEffect(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      if (authSession.isLoggedIn) {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(authSession));
      } else {
        sessionStorage.removeItem(AUTH_KEY);
      }
    } catch {
      // Ignore quota error
    }
  }, [authSession]);

  // Match only the authenticated Hero (never fall back to another student's account)
  const activeHero = activeHeroId
    ? state.heroes.find((h) => h.id === activeHeroId)
    : undefined;

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

  const getGmAuth = useCallback((): GmAuthCredentials | undefined => {
    const ses = authSessionRef.current;
    if (
      ses.isLoggedIn &&
      ses.role === UserRole.GAME_MASTER &&
      ses.gmUsername &&
      ses.gmPassword
    ) {
      return { username: ses.gmUsername, password: ses.gmPassword };
    }
    return undefined;
  }, []);

  const getFetchContext = useCallback(
    (overrideAuth?: AuthSession): AcademyFetchContext => {
      const ses = overrideAuth || authSessionRef.current;
      if (!ses.isLoggedIn) return { role: 'guest' };
      if (ses.role === UserRole.GAME_MASTER) {
        return {
          role: 'admin',
          gmUsername: ses.gmUsername,
          gmPassword: ses.gmPassword,
        };
      }
      return {
        role: 'student',
        heroId: ses.heroId,
        heroPin: ses.heroPin || '',
      };
    },
    []
  );

  // Sync from Cloud (Supabase) and Backend (Express / Cloud SQL if running)
  const syncFromRemote = useCallback(
    async (overrideAuth?: AuthSession): Promise<AcademyState | null> => {
      const mergeRemote = (remote: Partial<AcademyState>): AcademyState => {
        const prev = stateRef.current;
        const personalTheme = loadPersonalTheme();
        const next: AcademyState = {
          ...prev,
          ...remote,
          settings: {
            ...prev.settings,
            ...(remote.settings || {}),
            ...(personalTheme ? { theme: personalTheme } : {}),
          },
          gmProfile: { ...prev.gmProfile, ...(remote.gmProfile || {}) },
        };
        stateRef.current = next;
        setState(next);
        return next;
      };

      // 1. Try Supabase Cloud first (works across all devices anywhere)
      try {
        const cloudData = await fetchAcademyFromSupabase(getFetchContext(overrideAuth));
        if (cloudData && Array.isArray(cloudData.dungeons) && Array.isArray(cloudData.heroes)) {
          return mergeRemote(cloudData);
        }
      } catch (err) {
        console.warn('Supabase sync error:', err);
      }

      // 2. Fallback to Express backend if running
      try {
        const res = await fetch('/api/academy');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && Array.isArray(data.dungeons) && Array.isArray(data.heroes)) {
              return mergeRemote(data);
            }
          }
        }
      } catch {
        // Local mode or offline
      }
      return null;
    },
    [getFetchContext]
  );

  const handleLoginAsHero = (hero: HeroStudent, pin?: string) => {
    const nextAuth: AuthSession = {
      isLoggedIn: true,
      role: UserRole.HERO,
      heroId: hero.id,
      heroPin: pin || '',
    };
    authSessionRef.current = nextAuth;
    setAuthSession(nextAuth);
    setRole(UserRole.HERO);
    setActiveHeroId(hero.id);
    setHeroMenu('notice');
    window.location.hash = '#/hero/notice';
    showToast(`Selamat datang, Hero ${hero.name}!`, 'success');
    syncFromRemote(nextAuth);
  };

  const handleLoginAsGm = (username: string, password: string) => {
    const nextAuth: AuthSession = {
      isLoggedIn: true,
      role: UserRole.GAME_MASTER,
      gmUsername: username,
      gmPassword: password,
    };
    authSessionRef.current = nextAuth;
    setAuthSession(nextAuth);
    setRole(UserRole.GAME_MASTER);
    setGmMenu('hq');
    window.location.hash = '#/gm/hq';
    showToast(`Selamat datang kembali, Guild Master!`, 'success');
    syncFromRemote(nextAuth);
  };

  const handleLogout = () => {
    playRetroSound('logout', state.settings.soundEnabled);
    const emptyAuth: AuthSession = {
      isLoggedIn: false,
      role: UserRole.HERO,
    };
    authSessionRef.current = emptyAuth;
    try {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_KEY);
      if (isSupabaseConfigured()) {
        const scrubbed: AcademyState = {
          ...stateRef.current,
          grades: [],
          gmProfile: { ...stateRef.current.gmProfile, password: '' },
        };
        stateRef.current = scrubbed;
        setState(scrubbed);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(sanitizeStateForLocalStorage(scrubbed, emptyAuth))
        );
      }
    } catch {
      // Ignore storage error
    }
    setAuthSession(emptyAuth);
    setRole(UserRole.HERO);
    setActiveHeroId('');
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
    syncFromRemote();
  };

  const handleSelectHeroMenu = (id: HeroMenuId) => {
    playRetroSound('blip', state.settings.soundEnabled);
    setHeroMenu(id);
    window.location.hash = `#/hero/${id}`;
    syncFromRemote();
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
    try {
      localStorage.setItem(PERSONAL_THEME_KEY, theme);
    } catch {
      // Ignore storage error
    }
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

  useEffect(() => {
    if (BOOTSTRAPPED_CLOUD_FROM_URL) {
      showToast('Perangkat berhasil terhubung ke Cloud! Menyinkronkan data...', 'success');
    }
    syncFromRemote();

    // Cross-device auto-sync: Supabase Realtime + tab focus + visibility + 12s poll
    const unsubscribeRealtime = subscribeAcademyRealtime(() => {
      syncFromRemote();
    });

    const handleRecheck = () => {
      if (document.visibilityState === 'visible') {
        syncFromRemote();
      }
    };
    window.addEventListener('focus', handleRecheck);
    document.addEventListener('visibilitychange', handleRecheck);
    const pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncFromRemote();
      }
    }, 12000);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener('focus', handleRecheck);
      document.removeEventListener('visibilitychange', handleRecheck);
      window.clearInterval(pollTimer);
    };
  }, [syncFromRemote, showToast]);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    const updated = await syncFromRemote();
    setIsSyncing(false);
    if (updated) {
      playRetroSound('save', stateRef.current.settings.soundEnabled);
      showToast(
        `Data Cloud disinkronkan (${updated.dungeons.length} kelas, ${updated.heroes.length} siswa).`,
        'success'
      );
    } else if (!isSupabaseConfigured()) {
      showToast(
        'Cloud belum dihubungkan. Buka System Settings untuk menghubungkan Supabase.',
        'warning'
      );
    } else {
      showToast(
        `Data sudah mutakhir (${stateRef.current.dungeons.length} kelas, ${stateRef.current.heroes.length} siswa).`,
        'success'
      );
    }
  }, [syncFromRemote, showToast]);

  const reportCloudSync = useCallback(
    (promise: Promise<CloudSyncResult>) => {
      promise.then((res) => {
        if (!res.ok && res.error) {
          showToast(`Gagal sync ke Cloud: ${res.error}`, 'danger');
        }
      });
    },
    [showToast]
  );

  // CRUD Upsert & Delete Handlers
  const upsertItem = <T extends { id: string }>(list: T[], item: T): T[] => {
    const exists = list.some((x) => x.id === item.id);
    return exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
  };

  const handleSaveDungeon = (dungeon: Dungeon) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const next = { ...stateRef.current, dungeons: upsertItem(stateRef.current.dungeons, dungeon) };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncDungeon(dungeon, getGmAuth()));
    fetch('/api/dungeons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dungeon),
    }).catch(() => {});
    showToast(`Dungeon "${dungeon.name}" saved!`);
  };

  const handleDeleteDungeon = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      dungeons: stateRef.current.dungeons.filter((d) => d.id !== id),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteDungeon(id, getGmAuth()));
    fetch(`/api/dungeons/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Dungeon deleted.', 'warning');
  };

  const handleSaveHero = (hero: HeroStudent) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    // Do not keep raw PIN inside React/localStorage state when Cloud/Server handles hashing
    const sanitizedHero: HeroStudent = {
      ...hero,
      hasPin:
        typeof hero.pin === 'string'
          ? hero.pin.trim().length > 0
          : Boolean(hero.hasPin),
      ...(isSupabaseConfigured() ? { pin: undefined } : {}),
    };
    const next = { ...stateRef.current, heroes: upsertItem(stateRef.current.heroes, sanitizedHero) };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncHero(hero, getGmAuth()));
    fetch('/api/heroes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hero),
    }).catch(() => {});
    showToast(`Hero "${hero.name}" updated!`);
  };

  const handleImportHeroes = async (newHeroes: HeroStudent[]) => {
    if (newHeroes.length === 0) return;
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const sanitizedList: HeroStudent[] = newHeroes.map((hero) => ({
      ...hero,
      hasPin:
        typeof hero.pin === 'string'
          ? hero.pin.trim().length > 0
          : Boolean(hero.hasPin),
      ...(isSupabaseConfigured() ? { pin: undefined } : {}),
    }));

    const existingIds = new Set(stateRef.current.heroes.map((h) => h.id));
    const uniqueToAdd = sanitizedList.filter((h) => !existingIds.has(h.id));
    const next = {
      ...stateRef.current,
      heroes: [...uniqueToAdd, ...stateRef.current.heroes],
    };
    stateRef.current = next;
    setState(next);

    const gmAuth = getGmAuth();
    const results = await Promise.all(
      newHeroes.map((hero) => cloudSyncHero(hero, gmAuth))
    );
    const firstErr = results.find((r) => !r.ok && r.error);
    if (firstErr?.error) {
      showToast(`Sebagian data gagal sync ke Cloud: ${firstErr.error}`, 'danger');
    } else {
      showToast(`Berhasil mengimpor ${newHeroes.length} siswa!`);
    }

    newHeroes.forEach((hero) => {
      fetch('/api/heroes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hero),
      }).catch(() => {});
    });
  };

  const handleUpdateHeroAvatar = (avatar: AvatarClass) => {
    if (!activeHero) return;
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const updatedHero: HeroStudent = { ...activeHero, avatar };
    const next = {
      ...stateRef.current,
      heroes: upsertItem(stateRef.current.heroes, updatedHero),
    };
    stateRef.current = next;
    setState(next);

    if (isSupabaseConfigured()) {
      reportCloudSync(
        updateOwnHeroAvatarCloud(
          activeHero.id,
          authSessionRef.current.heroPin || '',
          avatar
        )
      );
    } else {
      fetch('/api/heroes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHero),
      }).catch(() => {});
    }
    showToast('Avatar Hero diperbarui!');
  };

  const handleUpdateHeroUsername = async (
    nextUsername: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!activeHero) return { ok: false, error: 'Sesi Hero tidak ditemukan.' };
    const clean = nextUsername.trim().replace(/\s+/g, '').toLowerCase();
    if (clean.length < 1 || clean.length > 5) {
      playRetroSound('error', stateRef.current.settings.soundEnabled);
      return { ok: false, error: 'Username harus 1 hingga 5 karakter (tanpa spasi).' };
    }

    const conflict = stateRef.current.heroes.some(
      (h) =>
        h.id !== activeHero.id &&
        ((h.username.trim() !== '' && h.username.toLowerCase() === clean) ||
          h.studentCode.toLowerCase() === clean)
    );
    if (conflict) {
      playRetroSound('error', stateRef.current.settings.soundEnabled);
      return { ok: false, error: 'Username sudah digunakan siswa lain!' };
    }

    if (isSupabaseConfigured()) {
      const res = await updateOwnHeroUsernameCloud(
        activeHero.id,
        authSessionRef.current.heroPin || '',
        clean
      );
      if (!res.ok) {
        playRetroSound('error', stateRef.current.settings.soundEnabled);
        return { ok: false, error: res.error || 'Gagal memperbarui username di Cloud.' };
      }
    } else {
      try {
        const apiRes = await fetch(`/api/heroes/${activeHero.id}/username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPin: authSessionRef.current.heroPin || '',
            username: clean,
          }),
        });
        if (apiRes.headers.get('content-type')?.includes('application/json')) {
          const data = await apiRes.json();
          if (!apiRes.ok || !data.ok) {
            playRetroSound('error', stateRef.current.settings.soundEnabled);
            return { ok: false, error: data.error || 'Gagal menyimpan username.' };
          }
        }
      } catch {
        // Pure local mode fallback
      }
    }

    const updatedHero: HeroStudent = { ...activeHero, username: clean };
    const next = {
      ...stateRef.current,
      heroes: upsertItem(stateRef.current.heroes, updatedHero),
    };
    stateRef.current = next;
    setState(next);

    playRetroSound('save', stateRef.current.settings.soundEnabled);
    showToast(`Username diperbarui menjadi @${clean}!`, 'success');
    return { ok: true };
  };

  const handleChangeOwnHeroPin = async (
    currentPin: string,
    newPin: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!activeHero) return { ok: false, error: 'Sesi Hero tidak ditemukan.' };
    const cleanNew = newPin.trim();
    const cleanCurrent = currentPin.trim() || authSessionRef.current.heroPin || '';

    if (isSupabaseConfigured()) {
      const res = await changeOwnHeroPinCloud(activeHero.id, cleanCurrent, cleanNew);
      if (!res.ok) {
        playRetroSound('error', stateRef.current.settings.soundEnabled);
        return { ok: false, error: res.error || 'Gagal menyimpan PIN di Cloud.' };
      }
    } else {
      try {
        const apiRes = await fetch(`/api/heroes/${activeHero.id}/pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPin: cleanCurrent, newPin: cleanNew }),
        });
        if (apiRes.headers.get('content-type')?.includes('application/json')) {
          const data = await apiRes.json();
          if (!apiRes.ok || !data.ok) {
            playRetroSound('error', stateRef.current.settings.soundEnabled);
            return { ok: false, error: data.error || 'PIN saat ini salah.' };
          }
        }
      } catch {
        if (activeHero.pin && activeHero.pin !== cleanCurrent) {
          playRetroSound('error', stateRef.current.settings.soundEnabled);
          return { ok: false, error: 'PIN saat ini salah.' };
        }
      }
    }

    const updatedAuth: AuthSession = {
      ...authSessionRef.current,
      heroPin: cleanNew,
    };
    authSessionRef.current = updatedAuth;
    setAuthSession(updatedAuth);

    const updatedHero: HeroStudent = {
      ...activeHero,
      hasPin: Boolean(cleanNew),
      ...(isSupabaseConfigured() ? {} : { pin: cleanNew }),
    };
    const next = {
      ...stateRef.current,
      heroes: upsertItem(stateRef.current.heroes, updatedHero),
    };
    stateRef.current = next;
    setState(next);

    playRetroSound('save', stateRef.current.settings.soundEnabled);
    showToast('PIN Rahasia berhasil diperbarui!', 'success');
    return { ok: true };
  };

  const handleDeleteHero = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      heroes: stateRef.current.heroes.filter((h) => h.id !== id),
      grades: stateRef.current.grades.filter((g) => g.heroId !== id),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteHero(id, getGmAuth()));
    fetch(`/api/heroes/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Hero removed from roster.', 'warning');
  };

  const handleSaveNotice = (notice: QuestNotice) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const next = { ...stateRef.current, notices: upsertItem(stateRef.current.notices, notice) };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncNotice(notice, getGmAuth()));
    fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice),
    }).catch(() => {});
    showToast('Broadcast published to Quest Board!');
  };

  const handleDeleteNotice = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      notices: stateRef.current.notices.filter((n) => n.id !== id),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteNotice(id, getGmAuth()));
    fetch(`/api/notices/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Notice deleted.', 'warning');
  };

  const handleSaveRealm = (realm: Realm) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const next = { ...stateRef.current, realms: upsertItem(stateRef.current.realms, realm) };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncRealm(realm, getGmAuth()));
    fetch('/api/realms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(realm),
    }).catch(() => {});
    showToast(`Realm "${realm.name}" saved!`);
  };

  const handleDeleteRealm = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      realms: stateRef.current.realms.filter((r) => r.id !== id),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteRealm(id, getGmAuth()));
    fetch(`/api/realms/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Realm deleted.', 'warning');
  };

  const handleSaveTome = (tome: AncientTome) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const next = { ...stateRef.current, tomes: upsertItem(stateRef.current.tomes, tome) };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncTome(tome, getGmAuth()));
    fetch('/api/tomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tome),
    }).catch(() => {});
    showToast(`Tome "${tome.title}" published!`);
  };

  const handleDeleteTome = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      tomes: stateRef.current.tomes.filter((t) => t.id !== id),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteTome(id, getGmAuth()));
    fetch(`/api/tomes/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Tome deleted.', 'warning');
  };

  const handleSaveQuest = (quest: ActiveQuest) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const next = { ...stateRef.current, quests: upsertItem(stateRef.current.quests, quest) };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncQuest(quest, getGmAuth()));
    fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quest),
    }).catch(() => {});
    showToast(`Quest "${quest.title}" saved!`);
  };

  const handleDeleteQuest = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      quests: stateRef.current.quests.filter((q) => q.id !== id),
      grades: stateRef.current.grades.filter((g) => g.questId !== id),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteQuest(id, getGmAuth()));
    fetch(`/api/quests/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Quest deleted.', 'warning');
  };

  const handleSaveGrade = (grade: ExpGrade) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const existing = stateRef.current.grades.find(
      (g) => g.heroId === grade.heroId && g.questId === grade.questId
    );
    const canonicalGrade: ExpGrade = existing ? { ...grade, id: existing.id } : grade;
    const nextGrades = existing
      ? stateRef.current.grades.map((g) => (g.id === existing.id ? canonicalGrade : g))
      : [canonicalGrade, ...stateRef.current.grades];
    const next = { ...stateRef.current, grades: nextGrades };
    stateRef.current = next;
    setState(next);

    reportCloudSync(cloudSyncGrade(canonicalGrade, getGmAuth()));
    fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(canonicalGrade),
    }).catch(() => {});
    const heroName = stateRef.current.heroes.find((h) => h.id === grade.heroId)?.name || 'Hero';
    showToast(`Saved ${grade.score}/100 (+${grade.expEarned} EXP) for ${heroName}!`);
  };

  const handleUpdateGmProfile = async (gmProfile: GameMasterProfile) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const prevGmAuth = getGmAuth();
    const nextProfileInState: GameMasterProfile = isSupabaseConfigured()
      ? { ...gmProfile, password: '' }
      : gmProfile;
    const next = { ...stateRef.current, gmProfile: nextProfileInState };
    stateRef.current = next;
    setState(next);

    const cloudRes = await cloudSyncSettings(next.settings, gmProfile, prevGmAuth);
    if (!cloudRes.ok && cloudRes.error) {
      showToast(`Gagal sync profil ke Cloud: ${cloudRes.error}`, 'danger');
    } else if (authSessionRef.current.role === UserRole.GAME_MASTER) {
      const updatedAuth: AuthSession = {
        ...authSessionRef.current,
        gmUsername: gmProfile.username || authSessionRef.current.gmUsername,
        gmPassword: gmProfile.password || authSessionRef.current.gmPassword,
      };
      authSessionRef.current = updatedAuth;
      setAuthSession(updatedAuth);
    }

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: next.settings, gmProfile }),
    }).catch(() => {});
    showToast('Game Master profile updated!');
  };

  const handleUpdateSettings = (settings: SystemSettings) => {
    playRetroSound('blip', settings.soundEnabled);
    try {
      localStorage.setItem(PERSONAL_THEME_KEY, settings.theme);
    } catch {
      // Ignore storage error
    }
    const next = { ...stateRef.current, settings };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncSettings(settings, next.gmProfile, getGmAuth()));
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, gmProfile: next.gmProfile }),
    }).catch(() => {});
  };

  const handleResetDemoData = () => {
    playRetroSound('confirm', state.settings.soundEnabled);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    setState(INITIAL_ACADEMY_STATE);
    setAuthSession({ isLoggedIn: false, role: UserRole.HERO });
    setRole(UserRole.HERO);
    setActiveHeroId('');
    showToast('Demo data restored to defaults!', 'warning');
  };

  // If user is not logged in (or Hero session lost/deleted), render the Retro Title & Login Screen!
  if (!authSession.isLoggedIn || (role === UserRole.HERO && !activeHero)) {
    return (
      <ThemeProvider theme={state.settings.theme} onChangeTheme={handleUpdateTheme}>
        <PixelToast message={toast?.message || null} tone={toast?.tone} />
        <OfflineIndicator />
        <LoginView
          state={state}
          onLoginAsHero={handleLoginAsHero}
          onLoginAsGm={handleLoginAsGm}
          onUpdateTheme={handleUpdateTheme}
          onToggleSound={handleToggleSound}
          onSyncData={syncFromRemote}
        />
      </ThemeProvider>
    );
  }

  // Once authenticated, render the Handheld Retro Arcade LMS
  return (
    <ThemeProvider theme={state.settings.theme} onChangeTheme={handleUpdateTheme}>
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
      onManualSync={handleManualSync}
      isSyncing={isSyncing}
      onLogout={handleLogout}
      onOpenGmDrawer={() => {
        playRetroSound('blip', state.settings.soundEnabled);
        setGmDrawerOpen(true);
      }}
    >
      <PixelToast message={toast?.message || null} tone={toast?.tone} />
      <OfflineIndicator />

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
              onImportHeroes={handleImportHeroes}
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
              gmAuth={getGmAuth()}
              onUpdateGmProfile={handleUpdateGmProfile}
              onUpdateSettings={handleUpdateSettings}
              onResetDemoData={handleResetDemoData}
              onPullCloudData={syncFromRemote}
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
                onUpdateAvatar={handleUpdateHeroAvatar}
                onChangePin={handleChangeOwnHeroPin}
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
                currentTheme={state.settings.theme}
                onUpdateTheme={handleUpdateTheme}
                onUpdateAvatar={handleUpdateHeroAvatar}
                onUpdateUsername={handleUpdateHeroUsername}
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
                <span className={active ? 'text-[var(--text-on-accent)]' : 'text-[var(--accent-warning)]'}>
                  {getGmMenuIcon(item.id, 22)}
                </span>
                <span className="font-pixel-ui text-[9.5px] sm:text-[10px] leading-tight">
                  {item.shortLabel}
                </span>
                <span className="text-[11px] sm:text-[11.5px] font-medium opacity-85 leading-none">
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
    </ThemeProvider>
  );
}
