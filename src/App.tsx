import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AcademicYear,
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
  SeasonId,
  SystemSettings,
  UserRole,
} from './types/lms';
import {
  DEFAULT_ERA_ID,
  DEFAULT_SEASON_ID,
  INITIAL_ACADEMY_STATE,
  STORAGE_KEY,
} from './data/seedData';
import {
  ArcadeShell,
  GM_NAV_ITEMS,
  HERO_NAV_ITEMS,
  SyncLogEntry,
  getGmMenuIcon,
  getHeroMenuIcon,
} from './components/ArcadeShell';
import {
  AccessDeniedModal,
  PixelButton,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelToast,
} from './components/PixelUI';
import { PixelErrorBoundary } from './components/PixelErrorBoundary';
import { PixelLoadingScreen } from './components/PixelLoadingScreen';
import { PixelCardSkeleton } from './components/PixelSkeleton';
import { OfflineIndicator } from './components/PWAInstallBanner';
import { ThemeProvider } from './context/ThemeContext';
import {
  buildAcademicPeriodLabel,
  getEffectiveGradeStatus,
  getHeroLevelProgress,
  getHeroTotalExp,
  getQuestCategoryMeta,
  getSeasonLabel,
  isContentVisibleToHero,
  isQuestAssignedToHero,
  normalizeQuestCategory,
  syncHeroesRealmsWithDungeonUpdate,
} from './utils/exp';
import {
  loadOfflineContentSnapshot,
  saveOfflineContentSnapshot,
} from './utils/offlineCache';
import { playRetroSound, playThrottledHoverBlip } from './utils/sound';
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
  cloudSetActiveEra,
  cloudSyncAcademicYear,
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
  verifyGmLoginCloud,
} from './lib/supabase';

const BOOTSTRAPPED_CLOUD_FROM_URL = bootstrapSupabaseFromUrl();

// Eager critical entry & HQ views
import { LoginView } from './views/auth/LoginView';
import { GmDashboard } from './views/gm/GmDashboard';

// Lazy-loaded Game Master, Hero, and Shared views (Item 5.3 Performance Audit)
const GmDungeons = lazy(() =>
  import('./views/gm/GmDungeons').then((m) => ({ default: m.GmDungeons }))
);
const GmHeroes = lazy(() =>
  import('./views/gm/GmHeroes').then((m) => ({ default: m.GmHeroes }))
);
const GmQuestBoard = lazy(() =>
  import('./views/gm/GmQuestBoard').then((m) => ({ default: m.GmQuestBoard }))
);
const GmRealms = lazy(() =>
  import('./views/gm/GmRealms').then((m) => ({ default: m.GmRealms }))
);
const GmScrolls = lazy(() =>
  import('./views/gm/GmScrolls').then((m) => ({ default: m.GmScrolls }))
);
const GmActiveQuests = lazy(() =>
  import('./views/gm/GmActiveQuests').then((m) => ({ default: m.GmActiveQuests }))
);
const GmExpLoot = lazy(() =>
  import('./views/gm/GmExpLoot').then((m) => ({ default: m.GmExpLoot }))
);
const GmSettings = lazy(() =>
  import('./views/gm/GmSettings').then((m) => ({ default: m.GmSettings }))
);

const HeroNotice = lazy(() =>
  import('./views/hero/HeroNotice').then((m) => ({ default: m.HeroNotice }))
);
const HeroScrollLibrary = lazy(() =>
  import('./views/hero/HeroScrollLibrary').then((m) => ({ default: m.HeroScrollLibrary }))
);
const HeroMyGuild = lazy(() =>
  import('./views/hero/HeroMyGuild').then((m) => ({ default: m.HeroMyGuild }))
);
const HeroLog = lazy(() =>
  import('./views/hero/HeroLog').then((m) => ({ default: m.HeroLog }))
);
const QuestBoardView = lazy(() =>
  import('./views/shared/QuestBoardView').then((m) => ({ default: m.QuestBoardView }))
);
const GmGuildChronicles = lazy(() =>
  import('./views/gm/GmGuildChronicles').then((m) => ({ default: m.GmGuildChronicles }))
);
const HallOfFameView = lazy(() =>
  import('./views/shared/HallOfFameView').then((m) => ({ default: m.HallOfFameView }))
);
const AboutView = lazy(() =>
  import('./views/shared/AboutView').then((m) => ({ default: m.AboutView }))
);

const AUTH_KEY = 'pixel_quest_auth_session';
const PERSONAL_THEME_KEY = 'pixel_quest_personal_theme';
const SYNC_LOGS_KEY = 'pixel_quest_sync_logs_v1';
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
      academicYears:
        Array.isArray(parsed.academicYears) && parsed.academicYears.length > 0
          ? parsed.academicYears
          : INITIAL_ACADEMY_STATE.academicYears,
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

function formatClockHHMM(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function loadSyncLogs(): SyncLogEntry[] {
  try {
    const raw = localStorage.getItem(SYNC_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 25) : [];
  } catch {
    return [];
  }
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
  const [heroDrawerOpen, setHeroDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTimeLabel, setLastSyncTimeLabel] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(loadSyncLogs);
  const [isInitialBooting, setIsInitialBooting] = useState(true);
  const [seenNoticeIds, setSeenNoticeIds] = useState<string[]>([]);
  const [seenQuestIds, setSeenQuestIds] = useState<string[]>([]);

  // EC-01 Access Denied Guard State
  const [deniedRoute, setDeniedRoute] = useState<string | null>(null);

  // GM Cloud Re-Verification Modal State
  const [gmReauthModalOpen, setGmReauthModalOpen] = useState(false);
  const [reauthUser, setReauthUser] = useState('');
  const [reauthPass, setReauthPass] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isVerifyingReauth, setIsVerifyingReauth] = useState(false);

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

  const appendSyncLog = useCallback(
    (action: string, status: 'success' | 'error' | 'info', detail: string) => {
      const now = new Date();
      const entry: SyncLogEntry = {
        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now.toISOString(),
        timeLabel: formatClockHHMM(now),
        action,
        status,
        detail,
      };
      setSyncLogs((prev) => {
        const next = [entry, ...prev].slice(0, 25);
        try {
          localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage error
        }
        return next;
      });
      if (status === 'success') {
        setSyncStatus('synced');
        setLastSyncTimeLabel(entry.timeLabel);
      } else if (status === 'error') {
        setSyncStatus('error');
      }
    },
    []
  );

  const clearSyncLogs = useCallback(() => {
    setSyncLogs([]);
    try {
      localStorage.removeItem(SYNC_LOGS_KEY);
    } catch {
      // Ignore storage error
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Thematic loading splash screen (Item 3.1)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsInitialBooting(false), 620);
    return () => window.clearTimeout(timer);
  }, []);

  // Persist State to localStorage & dedicated offline content cache (Item 3.3)
  useEffect(() => {
    try {
      const safeToStore = sanitizeStateForLocalStorage(state, authSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeToStore));
      saveOfflineContentSnapshot({
        tomes: state.tomes,
        quests: state.quests,
        notices: state.notices,
      });
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

  // Sync seen Guild notifications per logged-in user (Item 3.4)
  const seenStorageKey = `pixel_quest_seen_guild_${role}_${activeHeroId || 'gm'}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(seenStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { notices?: string[]; quests?: string[] };
        setSeenNoticeIds(Array.isArray(parsed.notices) ? parsed.notices : []);
        setSeenQuestIds(Array.isArray(parsed.quests) ? parsed.quests : []);
      } else {
        const initialNoticeIds = stateRef.current.notices.map((n) => n.id);
        const initialQuestIds = stateRef.current.quests.map((q) => q.id);
        setSeenNoticeIds(initialNoticeIds);
        setSeenQuestIds(initialQuestIds);
        localStorage.setItem(
          seenStorageKey,
          JSON.stringify({ notices: initialNoticeIds, quests: initialQuestIds })
        );
      }
    } catch {
      // Ignore storage error
    }
  }, [seenStorageKey]);

  // Active Era ("academic_years") derivation & query filtering for dungeons, quests, notices only
  const academicYears = useMemo<AcademicYear[]>(() => {
    if (state.academicYears && state.academicYears.length > 0) {
      return state.academicYears;
    }
    return INITIAL_ACADEMY_STATE.academicYears || [];
  }, [state.academicYears]);

  const activeEra = useMemo<AcademicYear | undefined>(
    () => academicYears.find((y) => y.isActive) || academicYears[0],
    [academicYears]
  );

  const activeEraId = activeEra?.id || DEFAULT_ERA_ID;
  const activeSeason: SeasonId =
    state.settings.activeSeason === 'genap' ? 'genap' : DEFAULT_SEASON_ID;

  const { eraFilteredState, eraAllSeasonsState } = useMemo(() => {
    const fallbackLegacyEraId =
      academicYears.some((y) => y.id === DEFAULT_ERA_ID)
        ? DEFAULT_ERA_ID
        : academicYears[0]?.id || DEFAULT_ERA_ID;
    const isInActiveEra = (itemEraId?: string) =>
      (itemEraId || fallbackLegacyEraId) === activeEraId;
    const isInActiveSeason = (itemSeason?: SeasonId) =>
      (itemSeason || DEFAULT_SEASON_ID) === activeSeason;

    const eraDungeons = state.dungeons.filter((d) => isInActiveEra(d.academicYearId));
    const eraAllQuests = state.quests.filter((q) => isInActiveEra(q.academicYearId));
    const seasonQuests = eraAllQuests.filter((q) => isInActiveSeason(q.season));
    const eraAllNotices = state.notices.filter((n) => isInActiveEra(n.academicYearId));
    const seasonNotices = eraAllNotices.filter((n) => isInActiveSeason(n.season));

    const seasonQuestIdSet = new Set(seasonQuests.map((q) => q.id));
    const eraAllQuestIdSet = new Set(eraAllQuests.map((q) => q.id));

    const seasonGrades = state.grades.filter((g) => seasonQuestIdSet.has(g.questId));
    const eraAllGrades = state.grades.filter((g) => eraAllQuestIdSet.has(g.questId));

    const filtered: AcademyState = {
      ...state,
      academicYears,
      dungeons: eraDungeons,
      quests: seasonQuests,
      notices: seasonNotices,
      grades: seasonGrades,
    };

    const allSeasonsInEra: AcademyState = {
      ...state,
      academicYears,
      dungeons: eraDungeons,
      quests: eraAllQuests,
      notices: eraAllNotices,
      grades: eraAllGrades,
    };

    return {
      eraFilteredState: filtered,
      eraAllSeasonsState: allSeasonsInEra,
    };
  }, [state, academicYears, activeEraId, activeSeason]);

  const { unreadNoticeCount, unreadQuestCount } = useMemo(() => {
    if (!authSession.isLoggedIn) {
      return { unreadNoticeCount: 0, unreadQuestCount: 0 };
    }
    const seenNoticeSet = new Set(seenNoticeIds);
    const seenQuestSet = new Set(seenQuestIds);
    const relevantNotices =
      role === UserRole.HERO && activeHero
        ? eraFilteredState.notices.filter((n) => isContentVisibleToHero(n, activeHero.dungeonId))
        : eraFilteredState.notices;
    const relevantQuests =
      role === UserRole.HERO && activeHero
        ? eraFilteredState.quests.filter((q) =>
            isQuestAssignedToHero(q, activeHero, eraFilteredState.dungeons)
          )
        : eraFilteredState.quests;
    return {
      unreadNoticeCount: relevantNotices.filter((n) => !seenNoticeSet.has(n.id)).length,
      unreadQuestCount: relevantQuests.filter((q) => !seenQuestSet.has(q.id)).length,
    };
  }, [
    authSession.isLoggedIn,
    role,
    activeHero,
    eraFilteredState.notices,
    eraFilteredState.quests,
    seenNoticeIds,
    seenQuestIds,
  ]);

  const markGuildNotificationsRead = useCallback(() => {
    const noticeIds = stateRef.current.notices.map((n) => n.id);
    const questIds = stateRef.current.quests.map((q) => q.id);
    setSeenNoticeIds(noticeIds);
    setSeenQuestIds(questIds);
    try {
      localStorage.setItem(
        seenStorageKey,
        JSON.stringify({ notices: noticeIds, quests: questIds })
      );
    } catch {
      // Ignore storage error
    }
  }, [seenStorageKey]);

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
        const rawSlug = hash.replace('#/gm/', '').split('/')[0];
        const slug = (rawSlug === 'quest_list' ? 'active_quests' : rawSlug) as GmMenuId;
        if (GM_NAV_ITEMS.some((i) => i.id === slug)) {
          setGmMenu(slug);
        }
      } else if (hash.startsWith('#/hero/')) {
        const slug = hash.replace('#/hero/', '').split('/')[0] as HeroMenuId;
        if (HERO_NAV_ITEMS.some((i) => i.id === slug)) {
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

        // Detect Hero auto-EXP & Level-Up upon sync (Item 4.1)
        const ses = overrideAuth || authSessionRef.current;
        if (ses.isLoggedIn && ses.role === UserRole.HERO && ses.heroId) {
          const prevExp = getHeroTotalExp(ses.heroId, prev.grades);
          const nextExp = getHeroTotalExp(ses.heroId, next.grades);
          if (nextExp > prevExp && prev.grades.length > 0) {
            const prevLvl = getHeroLevelProgress(prevExp).level;
            const nextLvl = getHeroLevelProgress(nextExp).level;
            if (nextLvl > prevLvl) {
              playRetroSound('levelup', next.settings.soundEnabled);
              showToast(`LEVEL UP! Hero naik ke Lv.${nextLvl} (+${nextExp - prevExp} EXP)!`, 'success');
            } else {
              playRetroSound('coin', next.settings.soundEnabled);
              showToast(`Quest Selesai! Kamu mendapat +${nextExp - prevExp} EXP!`, 'success');
            }
          }
        }

        stateRef.current = next;
        setState(next);
        return next;
      };

      // 1. Try Supabase Cloud first (works across all devices anywhere)
      try {
        const cloudData = await fetchAcademyFromSupabase(getFetchContext(overrideAuth));
        if (cloudData && Array.isArray(cloudData.dungeons) && Array.isArray(cloudData.heroes)) {
          const merged = mergeRemote(cloudData);
          setSyncStatus('synced');
          setLastSyncTimeLabel(formatClockHHMM(new Date()));
          return merged;
        }
      } catch (err) {
        console.warn('Supabase sync error:', err);
        appendSyncLog('Pull Cloud', 'error', err instanceof Error ? err.message : 'Gagal terhubung ke Cloud');
      }

      // 2. Fallback to Express backend if running
      try {
        const res = await fetch('/api/academy');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && Array.isArray(data.dungeons) && Array.isArray(data.heroes)) {
              const merged = mergeRemote(data);
              setSyncStatus('synced');
              setLastSyncTimeLabel(formatClockHHMM(new Date()));
              return merged;
            }
          }
        }
      } catch {
        // Local / offline fallback: hydrate cached offline Tomes/Quests/Notices if current list is empty
        const offlineSnap = loadOfflineContentSnapshot();
        if (offlineSnap && stateRef.current.tomes.length === 0 && offlineSnap.tomes.length > 0) {
          mergeRemote({
            tomes: offlineSnap.tomes,
            quests: offlineSnap.quests,
            notices: offlineSnap.notices,
          });
        }
      }
      return null;
    },
    [getFetchContext, appendSyncLog, showToast]
  );

  const handleLoginAsHero = (hero: HeroStudent, pin?: string) => {
    playRetroSound('coin', stateRef.current.settings.soundEnabled);
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
    playRetroSound('coin', stateRef.current.settings.soundEnabled);
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
    if (id === 'quest_board' || id === 'active_quests') {
      markGuildNotificationsRead();
    }
    syncFromRemote();
  };

  const handleSelectHeroMenu = (id: HeroMenuId) => {
    playRetroSound('blip', state.settings.soundEnabled);
    setHeroMenu(id);
    setHeroDrawerOpen(false);
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
    setSyncStatus('syncing');
    const updated = await syncFromRemote();
    setIsSyncing(false);
    if (updated) {
      playRetroSound('save', stateRef.current.settings.soundEnabled);
      const detail = `${updated.dungeons.length} kelas, ${updated.heroes.length} siswa, ${updated.tomes.length} materi`;
      appendSyncLog('Manual Sync', 'success', detail);
      showToast(`✓ Synced! (${updated.dungeons.length} kelas, ${updated.heroes.length} siswa)`, 'success');
    } else if (!isSupabaseConfigured()) {
      appendSyncLog('Manual Sync', 'info', 'Mode lokal aktif (Supabase belum terhubung).');
      showToast(
        'Cloud belum dihubungkan. Buka System Settings untuk menghubungkan Supabase.',
        'warning'
      );
    } else {
      appendSyncLog(
        'Manual Sync',
        'success',
        `Data mutakhir (${stateRef.current.dungeons.length} kelas, ${stateRef.current.heroes.length} siswa)`
      );
      showToast(
        `✓ Data sudah mutakhir (${stateRef.current.dungeons.length} kelas, ${stateRef.current.heroes.length} siswa).`,
        'success'
      );
    }
  }, [syncFromRemote, showToast, appendSyncLog]);

  const openGmReauthModal = useCallback(() => {
    setReauthUser(
      authSessionRef.current.gmUsername ||
        stateRef.current.gmProfile.username ||
        'admin'
    );
    setReauthPass('');
    setReauthError(null);
    setGmReauthModalOpen(true);
  }, []);

  const isCredentialSyncError = (msg?: string) =>
    Boolean(
      msg &&
        (msg.includes('Kredensial GM') ||
          msg.includes('Sesi GM') ||
          msg.includes('Akses ditolak'))
    );

  const reportCloudSync = useCallback(
    (promise: Promise<CloudSyncResult>) => {
      promise.then((res) => {
        if (res.ok) {
          appendSyncLog('Cloud Upsert', 'success', 'Perubahan data tersinkron ke Cloud.');
        } else if (res.error) {
          appendSyncLog('Cloud Upsert', 'error', res.error);
          showToast(`Gagal sync ke Cloud: ${res.error}`, 'danger');
          if (
            role === UserRole.GAME_MASTER &&
            isCredentialSyncError(res.error)
          ) {
            openGmReauthModal();
          }
        }
      });
    },
    [showToast, role, openGmReauthModal, appendSyncLog]
  );

  const handleSubmitGmReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setReauthError(null);
    const cleanUser = reauthUser.trim();
    if (!cleanUser || !reauthPass) {
      setReauthError('Masukkan Username dan Password GM Cloud.');
      return;
    }
    setIsVerifyingReauth(true);
    const verify = await verifyGmLoginCloud(cleanUser, reauthPass);
    setIsVerifyingReauth(false);
    if (!verify.ok) {
      setReauthError(
        verify.error === 'rpc_required'
          ? 'Jalankan ulang supabase-schema.sql di Supabase SQL Editor.'
          : 'Username atau Password GM Cloud salah!'
      );
      playRetroSound('error', stateRef.current.settings.soundEnabled);
      return;
    }
    const updatedAuth: AuthSession = {
      ...authSessionRef.current,
      isLoggedIn: true,
      role: UserRole.GAME_MASTER,
      gmUsername: cleanUser,
      gmPassword: reauthPass,
    };
    authSessionRef.current = updatedAuth;
    setAuthSession(updatedAuth);
    setGmReauthModalOpen(false);
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    showToast('Sesi GM Cloud terverifikasi! Silakan lanjutkan penyimpanan.', 'success');
    syncFromRemote(updatedAuth);
  };

  // Era ("Academic Year") Handlers — Guardrail: ONLY Game Master / Super Admin
  const handleSwitchEra = (eraId: string) => {
    if (
      role !== UserRole.GAME_MASTER ||
      authSessionRef.current.role !== UserRole.GAME_MASTER
    ) {
      playRetroSound('error', stateRef.current.settings.soundEnabled);
      setDeniedRoute('#/gm/era/switch');
      showToast('Akses ditolak: Hanya Super Admin yang dapat mengganti Era.', 'danger');
      return;
    }
    const currentYears =
      stateRef.current.academicYears && stateRef.current.academicYears.length > 0
        ? stateRef.current.academicYears
        : INITIAL_ACADEMY_STATE.academicYears || [];
    const targetEra = currentYears.find((y) => y.id === eraId);
    if (!targetEra) return;

    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const nextYears = currentYears.map((y) => ({ ...y, isActive: y.id === eraId }));
    const updatedSettings: SystemSettings = {
      ...stateRef.current.settings,
      activeSeason,
      academicTerm: buildAcademicPeriodLabel(targetEra.name, activeSeason),
    };
    const next = {
      ...stateRef.current,
      academicYears: nextYears,
      settings: updatedSettings,
    };
    stateRef.current = next;
    setState(next);

    reportCloudSync(cloudSetActiveEra(eraId, getGmAuth()));
    reportCloudSync(
      cloudSyncSettings(updatedSettings, next.gmProfile, getGmAuth(), false)
    );
    fetch(`/api/eras/${encodeURIComponent(eraId)}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pqa-role': 'admin',
      },
    }).catch(() => {});
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: updatedSettings,
        gmProfile: next.gmProfile,
      }),
    }).catch(() => {});
    showToast(`Era aktif dialihkan ke Era ${targetEra.name}!`, 'success');
  };

  const handleCreateEra = (newEra: AcademicYear) => {
    if (
      role !== UserRole.GAME_MASTER ||
      authSessionRef.current.role !== UserRole.GAME_MASTER
    ) {
      playRetroSound('error', stateRef.current.settings.soundEnabled);
      setDeniedRoute('#/gm/era/create');
      showToast('Akses ditolak: Hanya Super Admin yang dapat membuat Era.', 'danger');
      return;
    }
    const currentYears =
      stateRef.current.academicYears && stateRef.current.academicYears.length > 0
        ? stateRef.current.academicYears
        : INITIAL_ACADEMY_STATE.academicYears || [];

    const uniqueId = currentYears.some((y) => y.id === newEra.id)
      ? `${newEra.id}-${Date.now().toString().slice(-4)}`
      : newEra.id;
    const canonicalEra: AcademicYear = { ...newEra, id: uniqueId, isActive: true };

    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const nextYears = [
      canonicalEra,
      ...currentYears.map((y) => ({ ...y, isActive: false })),
    ];
    const updatedSettings: SystemSettings = {
      ...stateRef.current.settings,
      activeSeason,
      academicTerm: buildAcademicPeriodLabel(canonicalEra.name, activeSeason),
    };
    const next = {
      ...stateRef.current,
      academicYears: nextYears,
      settings: updatedSettings,
    };
    stateRef.current = next;
    setState(next);

    reportCloudSync(cloudSyncAcademicYear(canonicalEra, getGmAuth()));
    reportCloudSync(
      cloudSyncSettings(updatedSettings, next.gmProfile, getGmAuth(), false)
    );
    fetch('/api/eras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pqa-role': 'admin',
      },
      body: JSON.stringify(canonicalEra),
    }).catch(() => {});
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: updatedSettings,
        gmProfile: next.gmProfile,
      }),
    }).catch(() => {});
    showToast(`Era ${canonicalEra.name} dibuat & diaktifkan!`, 'success');
  };

  const handleSwitchSeason = (nextSeason: SeasonId) => {
    if (
      role !== UserRole.GAME_MASTER ||
      authSessionRef.current.role !== UserRole.GAME_MASTER
    ) {
      playRetroSound('error', stateRef.current.settings.soundEnabled);
      setDeniedRoute('#/gm/season/switch');
      showToast('Akses ditolak: Hanya Super Admin yang dapat mengganti Season.', 'danger');
      return;
    }

    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const updatedSettings: SystemSettings = {
      ...stateRef.current.settings,
      activeSeason: nextSeason,
      academicTerm: buildAcademicPeriodLabel(activeEra?.name, nextSeason),
    };
    const next: AcademyState = {
      ...stateRef.current,
      settings: updatedSettings,
    };
    stateRef.current = next;
    setState(next);

    reportCloudSync(
      cloudSyncSettings(updatedSettings, next.gmProfile, getGmAuth(), false)
    );
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: updatedSettings,
        gmProfile: next.gmProfile,
      }),
    }).catch(() => {});
    showToast(`Season aktif dialihkan ke ${getSeasonLabel(nextSeason)}!`, 'success');
  };

  // CRUD Upsert & Delete Handlers
  const upsertItem = <T extends { id: string }>(list: T[], item: T): T[] => {
    const exists = list.some((x) => x.id === item.id);
    return exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
  };

  const handleSaveDungeon = (dungeon: Dungeon) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const prevDungeon = stateRef.current.dungeons.find(
      (d) => d.id === dungeon.id
    );
    const taggedDungeon: Dungeon = {
      ...dungeon,
      academicYearId: dungeon.academicYearId || activeEraId,
    };
    const { nextHeroes, changedHeroes } = syncHeroesRealmsWithDungeonUpdate(
      stateRef.current.heroes,
      prevDungeon,
      taggedDungeon
    );
    const next = {
      ...stateRef.current,
      dungeons: upsertItem(stateRef.current.dungeons, taggedDungeon),
      heroes: nextHeroes,
    };
    stateRef.current = next;
    setState(next);
    const gmAuth = getGmAuth();
    reportCloudSync(cloudSyncDungeon(taggedDungeon, gmAuth));
    changedHeroes.forEach((hero) => {
      reportCloudSync(cloudSyncHero(hero, gmAuth));
      fetch('/api/heroes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hero),
      }).catch(() => {});
    });
    fetch('/api/dungeons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taggedDungeon),
    }).catch(() => {});
    showToast(`Dungeon "${taggedDungeon.name}" saved!`);
  };

  const syncBatchCloudDelete = async (
    promises: Promise<CloudSyncResult>[],
    successMsg: string
  ) => {
    const results = await Promise.all(promises);
    const firstErr = results.find((r) => !r.ok && r.error);
    if (firstErr?.error) {
      showToast(`Sebagian data gagal dihapus di Cloud: ${firstErr.error}`, 'danger');
      if (isCredentialSyncError(firstErr.error)) {
        openGmReauthModal();
      }
    } else {
      showToast(successMsg, 'warning');
    }
  };

  const handleDeleteDungeon = (id: string) => {
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const next = {
      ...stateRef.current,
      dungeons: stateRef.current.dungeons.filter((d) => d.id !== id),
      heroes: stateRef.current.heroes.map((h) =>
        h.dungeonId === id ? { ...h, dungeonId: '' } : h
      ),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteDungeon(id, getGmAuth()));
    fetch(`/api/dungeons/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Dungeon deleted.', 'warning');
  };

  const handleDeleteDungeonsBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const idSet = new Set(ids);
    const next = {
      ...stateRef.current,
      dungeons: stateRef.current.dungeons.filter((d) => !idSet.has(d.id)),
      heroes: stateRef.current.heroes.map((h) =>
        idSet.has(h.dungeonId) ? { ...h, dungeonId: '' } : h
      ),
    };
    stateRef.current = next;
    setState(next);
    const gmAuth = getGmAuth();
    ids.forEach((id) => {
      fetch(`/api/dungeons/${id}`, { method: 'DELETE' }).catch(() => {});
    });
    await syncBatchCloudDelete(
      ids.map((id) => cloudDeleteDungeon(id, gmAuth)),
      `Berhasil menghapus ${ids.length} data kelas!`
    );
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
      if (isCredentialSyncError(firstErr.error)) {
        openGmReauthModal();
      }
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

  const handleDeleteHeroesBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const idSet = new Set(ids);
    const next = {
      ...stateRef.current,
      heroes: stateRef.current.heroes.filter((h) => !idSet.has(h.id)),
      grades: stateRef.current.grades.filter((g) => !idSet.has(g.heroId)),
    };
    stateRef.current = next;
    setState(next);
    const gmAuth = getGmAuth();
    ids.forEach((id) => {
      fetch(`/api/heroes/${id}`, { method: 'DELETE' }).catch(() => {});
    });
    await syncBatchCloudDelete(
      ids.map((id) => cloudDeleteHero(id, gmAuth)),
      `Berhasil menghapus ${ids.length} data siswa!`
    );
  };

  const handleSaveNotice = (notice: QuestNotice) => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const taggedNotice: QuestNotice = {
      ...notice,
      academicYearId: notice.academicYearId || activeEraId,
      season: notice.season || activeSeason,
    };
    const next = {
      ...stateRef.current,
      notices: upsertItem(stateRef.current.notices, taggedNotice),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncNotice(taggedNotice, getGmAuth()));
    fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taggedNotice),
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
      tomes: stateRef.current.tomes.filter((t) => t.realmId !== id),
      quests: stateRef.current.quests.filter((q) => q.realmId !== id),
      grades: stateRef.current.grades.filter((g) => g.realmId !== id),
      dungeons: stateRef.current.dungeons.map((d) =>
        d.realmIds ? { ...d, realmIds: d.realmIds.filter((rid) => rid !== id) } : d
      ),
      heroes: stateRef.current.heroes.map((h) =>
        h.enrolledRealmIds
          ? { ...h, enrolledRealmIds: h.enrolledRealmIds.filter((rid) => rid !== id) }
          : h
      ),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudDeleteRealm(id, getGmAuth()));
    fetch(`/api/realms/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Realm deleted.', 'warning');
  };

  const handleDeleteRealmsBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const idSet = new Set(ids);
    const next = {
      ...stateRef.current,
      realms: stateRef.current.realms.filter((r) => !idSet.has(r.id)),
      tomes: stateRef.current.tomes.filter((t) => !idSet.has(t.realmId)),
      quests: stateRef.current.quests.filter((q) => !idSet.has(q.realmId)),
      grades: stateRef.current.grades.filter((g) => !idSet.has(g.realmId)),
      dungeons: stateRef.current.dungeons.map((d) =>
        d.realmIds
          ? { ...d, realmIds: d.realmIds.filter((rid) => !idSet.has(rid)) }
          : d
      ),
      heroes: stateRef.current.heroes.map((h) =>
        h.enrolledRealmIds
          ? {
              ...h,
              enrolledRealmIds: h.enrolledRealmIds.filter((rid) => !idSet.has(rid)),
            }
          : h
      ),
    };
    stateRef.current = next;
    setState(next);
    const gmAuth = getGmAuth();
    ids.forEach((id) => {
      fetch(`/api/realms/${id}`, { method: 'DELETE' }).catch(() => {});
    });
    await syncBatchCloudDelete(
      ids.map((id) => cloudDeleteRealm(id, gmAuth)),
      `Berhasil menghapus ${ids.length} mata pelajaran!`
    );
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

  const handleDeleteTomesBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const idSet = new Set(ids);
    const next = {
      ...stateRef.current,
      tomes: stateRef.current.tomes.filter((t) => !idSet.has(t.id)),
    };
    stateRef.current = next;
    setState(next);
    const gmAuth = getGmAuth();
    ids.forEach((id) => {
      fetch(`/api/tomes/${id}`, { method: 'DELETE' }).catch(() => {});
    });
    await syncBatchCloudDelete(
      ids.map((id) => cloudDeleteTome(id, gmAuth)),
      `Berhasil menghapus ${ids.length} materi!`
    );
  };

  const handleSaveQuest = (quest: ActiveQuest) => {
    playRetroSound('sword', stateRef.current.settings.soundEnabled);
    const taggedQuest: ActiveQuest = {
      ...quest,
      category: normalizeQuestCategory(quest.category),
      description: (quest.description || '').trim(),
      academicYearId: quest.academicYearId || activeEraId,
      season: quest.season || activeSeason,
    };
    const next = {
      ...stateRef.current,
      quests: upsertItem(stateRef.current.quests, taggedQuest),
    };
    stateRef.current = next;
    setState(next);
    reportCloudSync(cloudSyncQuest(taggedQuest, getGmAuth()));
    fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taggedQuest),
    }).catch(() => {});
    showToast(
      `Quest "${taggedQuest.title}" (${getQuestCategoryMeta(taggedQuest.category).label}) saved!`
    );
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

  const handleDeleteQuestsBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    playRetroSound('confirm', stateRef.current.settings.soundEnabled);
    const idSet = new Set(ids);
    const next = {
      ...stateRef.current,
      quests: stateRef.current.quests.filter((q) => !idSet.has(q.id)),
      grades: stateRef.current.grades.filter((g) => !idSet.has(g.questId)),
    };
    stateRef.current = next;
    setState(next);
    const gmAuth = getGmAuth();
    ids.forEach((id) => {
      fetch(`/api/quests/${id}`, { method: 'DELETE' }).catch(() => {});
    });
    await syncBatchCloudDelete(
      ids.map((id) => cloudDeleteQuest(id, gmAuth)),
      `Berhasil menghapus ${ids.length} tugas!`
    );
  };

  const handleSaveGrade = (grade: ExpGrade) => {
    const prevExp = getHeroTotalExp(grade.heroId, stateRef.current.grades);
    const prevLvl = getHeroLevelProgress(prevExp).level;

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

    const nextExp = getHeroTotalExp(grade.heroId, nextGrades);
    const nextLvl = getHeroLevelProgress(nextExp).level;
    const leveledUp = nextLvl > prevLvl && getEffectiveGradeStatus(canonicalGrade) === 'tuntas';

    playRetroSound(leveledUp ? 'levelup' : 'sword', stateRef.current.settings.soundEnabled);

    reportCloudSync(cloudSyncGrade(canonicalGrade, getGmAuth()));
    fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(canonicalGrade),
    }).catch(() => {});
    const heroName = stateRef.current.heroes.find((h) => h.id === grade.heroId)?.name || 'Hero';
    showToast(
      leveledUp
        ? `${heroName} LEVEL UP ke Lv.${nextLvl}! (+${grade.expEarned} EXP)`
        : `Saved ${grade.score}/100 (+${grade.expEarned} EXP) for ${heroName}!`
    );
  };

  const handleSaveGradesBatch = async (gradesToSave: ExpGrade[]) => {
    if (gradesToSave.length === 0) return;
    playRetroSound('sword', stateRef.current.settings.soundEnabled);

    const updatedGrades = [...stateRef.current.grades];
    const canonicalList: ExpGrade[] = [];

    gradesToSave.forEach((grade) => {
      const idx = updatedGrades.findIndex(
        (g) => g.heroId === grade.heroId && g.questId === grade.questId
      );
      if (idx >= 0) {
        const canonical: ExpGrade = { ...grade, id: updatedGrades[idx].id };
        updatedGrades[idx] = canonical;
        canonicalList.push(canonical);
      } else {
        updatedGrades.unshift(grade);
        canonicalList.push(grade);
      }
    });

    const next = { ...stateRef.current, grades: updatedGrades };
    stateRef.current = next;
    setState(next);

    const gmAuth = getGmAuth();
    const results = await Promise.all(
      canonicalList.map((g) => cloudSyncGrade(g, gmAuth))
    );
    const firstErr = results.find((r) => !r.ok && r.error);

    canonicalList.forEach((canonicalGrade) => {
      fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canonicalGrade),
      }).catch(() => {});
    });

    if (firstErr?.error) {
      appendSyncLog('Batch Grade', 'error', firstErr.error);
      showToast(`Sebagian nilai gagal sync ke Cloud: ${firstErr.error}`, 'danger');
      if (isCredentialSyncError(firstErr.error)) {
        openGmReauthModal();
      }
    } else {
      appendSyncLog('Batch Grade', 'success', `${canonicalList.length} nilai penilaian tersimpan.`);
      showToast(`Berhasil menyimpan ${canonicalList.length} nilai penilaian!`, 'success');
    }
  };

  const handleUpdateGmProfile = async (
    gmProfile: GameMasterProfile,
    updatedSettings?: SystemSettings
  ): Promise<boolean> => {
    playRetroSound('save', stateRef.current.settings.soundEnabled);
    const prevGmAuth = getGmAuth();
    const mergedSettings = updatedSettings || stateRef.current.settings;
    if (updatedSettings) {
      try {
        localStorage.setItem(PERSONAL_THEME_KEY, mergedSettings.theme);
      } catch {
        // Ignore storage error
      }
    }

    const nextProfileInState: GameMasterProfile = isSupabaseConfigured()
      ? { ...gmProfile, password: '' }
      : gmProfile;
    const next: AcademyState = {
      ...stateRef.current,
      settings: mergedSettings,
      gmProfile: nextProfileInState,
    };
    stateRef.current = next;
    setState(next);

    const cloudRes = await cloudSyncSettings(
      mergedSettings,
      gmProfile,
      prevGmAuth,
      true
    );
    if (!cloudRes.ok && cloudRes.error) {
      showToast(`Gagal sync profil ke Cloud: ${cloudRes.error}`, 'danger');
      if (isCredentialSyncError(cloudRes.error)) {
        openGmReauthModal();
      }
      return false;
    }

    if (authSessionRef.current.role === UserRole.GAME_MASTER) {
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
      body: JSON.stringify({ settings: mergedSettings, gmProfile }),
    }).catch(() => {});
    showToast('Profil & pengaturan Game Master disimpan!');
    return true;
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
    reportCloudSync(cloudSyncSettings(settings, next.gmProfile, getGmAuth(), false));
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

  // Thematic loading splash screen on initial hydration (Item 3.1)
  if (isInitialBooting) {
    return (
      <ThemeProvider theme={state.settings.theme} onChangeTheme={handleUpdateTheme}>
        <PixelLoadingScreen theme={state.settings.theme} />
      </ThemeProvider>
    );
  }

  // If user is not logged in (or Hero session lost/deleted), render the Retro Title & Login Screen!
  if (!authSession.isLoggedIn || (role === UserRole.HERO && !activeHero)) {
    return (
      <ThemeProvider theme={state.settings.theme} onChangeTheme={handleUpdateTheme}>
        <PixelToast message={toast?.message || null} tone={toast?.tone} />
        <OfflineIndicator />
        <PixelErrorBoundary scopeLabel="Login Screen">
          <LoginView
            state={state}
            onLoginAsHero={handleLoginAsHero}
            onLoginAsGm={handleLoginAsGm}
            onUpdateTheme={handleUpdateTheme}
            onToggleSound={handleToggleSound}
            onSyncData={syncFromRemote}
          />
        </PixelErrorBoundary>
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
      syncStatus={syncStatus}
      lastSyncTimeLabel={lastSyncTimeLabel}
      syncLogs={syncLogs}
      onClearSyncLogs={clearSyncLogs}
      unreadNoticeCount={unreadNoticeCount}
      unreadQuestCount={unreadQuestCount}
      academicYears={academicYears}
      activeEraId={activeEraId}
      activeSeason={activeSeason}
      onSwitchEra={handleSwitchEra}
      onCreateEra={handleCreateEra}
      onSwitchSeason={handleSwitchSeason}
      onLogout={handleLogout}
      onOpenGmDrawer={() => {
        playRetroSound('blip', state.settings.soundEnabled);
        setGmDrawerOpen(true);
      }}
      onOpenHeroDrawer={() => {
        playRetroSound('blip', state.settings.soundEnabled);
        setHeroDrawerOpen(true);
      }}
    >
      <PixelToast message={toast?.message || null} tone={toast?.tone} />
      <OfflineIndicator />

      <PixelErrorBoundary
        scopeLabel={role === UserRole.GAME_MASTER ? `GM · ${gmMenu}` : `Hero · ${heroMenu}`}
        onRecoverHome={() => {
          if (role === UserRole.GAME_MASTER) setGmMenu('hq');
          else setHeroMenu('notice');
        }}
      >
        <Suspense fallback={<PixelCardSkeleton />}>
          {role === UserRole.GAME_MASTER ? (
            <>
              {gmMenu === 'hq' && (
                <GmDashboard
                  state={eraFilteredState}
                  onNavigate={handleSelectGmMenu}
                  lastSyncTimeLabel={lastSyncTimeLabel}
                  syncStatus={syncStatus}
                />
              )}
              {gmMenu === 'dungeons' && (
                <GmDungeons
                  state={eraFilteredState}
                  onSaveDungeon={handleSaveDungeon}
                  onDeleteDungeon={handleDeleteDungeon}
                  onDeleteDungeonsBatch={handleDeleteDungeonsBatch}
                />
              )}
              {gmMenu === 'heroes' && (
                <GmHeroes
                  state={eraFilteredState}
                  onSaveHero={handleSaveHero}
                  onImportHeroes={handleImportHeroes}
                  onDeleteHero={handleDeleteHero}
                  onDeleteHeroesBatch={handleDeleteHeroesBatch}
                />
              )}
              {gmMenu === 'quest_board' && (
                <GmQuestBoard
                  state={eraFilteredState}
                  onSaveNotice={handleSaveNotice}
                  onDeleteNotice={handleDeleteNotice}
                />
              )}
              {gmMenu === 'realms' && (
                <GmRealms
                  state={eraFilteredState}
                  onSaveRealm={handleSaveRealm}
                  onDeleteRealm={handleDeleteRealm}
                  onDeleteRealmsBatch={handleDeleteRealmsBatch}
                />
              )}
              {gmMenu === 'scrolls' && (
                <GmScrolls
                  state={eraFilteredState}
                  onSaveTome={handleSaveTome}
                  onDeleteTome={handleDeleteTome}
                  onDeleteTomesBatch={handleDeleteTomesBatch}
                />
              )}
              {gmMenu === 'active_quests' && (
                <GmActiveQuests
                  state={eraFilteredState}
                  onSaveQuest={handleSaveQuest}
                  onDeleteQuest={handleDeleteQuest}
                  onDeleteQuestsBatch={handleDeleteQuestsBatch}
                  onNavigateGm={handleSelectGmMenu}
                />
              )}
              {gmMenu === 'exp_loot' && (
                <GmExpLoot
                  state={eraFilteredState}
                  eraAllSeasonsState={eraAllSeasonsState}
                  onSaveGrade={handleSaveGrade}
                  onSaveGradesBatch={handleSaveGradesBatch}
                />
              )}
              {gmMenu === 'guild_chronicles' && (
                <GmGuildChronicles state={eraFilteredState} />
              )}
              {gmMenu === 'hall_of_fame' && (
                <HallOfFameView state={eraFilteredState} role={UserRole.GAME_MASTER} />
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
                  onRequestGmReauth={openGmReauthModal}
                />
              )}
              {gmMenu === 'about' && (
                <AboutView
                  role={UserRole.GAME_MASTER}
                  currentTheme={state.settings.theme}
                />
              )}
            </>
          ) : (
            activeHero && (
              <>
                {heroMenu === 'notice' && (
                  <HeroNotice
                    state={eraFilteredState}
                    hero={activeHero}
                    onAttemptRestrictedRoute={handleTriggerAccessDenied}
                    unreadNoticeCount={unreadNoticeCount}
                    onMarkGuildNotificationsRead={markGuildNotificationsRead}
                  />
                )}
                {heroMenu === 'scroll_library' && (
                  <HeroScrollLibrary state={eraFilteredState} hero={activeHero} />
                )}
                {heroMenu === 'quest_list' && (
                  <QuestBoardView
                    state={eraFilteredState}
                    role={UserRole.HERO}
                    hero={activeHero}
                  />
                )}
                {heroMenu === 'my_guild' && (
                  <HeroMyGuild state={eraFilteredState} hero={activeHero} />
                )}
                {heroMenu === 'hall_of_fame' && (
                  <HallOfFameView
                    state={eraFilteredState}
                    role={UserRole.HERO}
                    hero={activeHero}
                  />
                )}
                {heroMenu === 'hero_log' && (
                  <HeroLog
                    state={eraFilteredState}
                    hero={activeHero}
                    currentTheme={state.settings.theme}
                    onUpdateTheme={handleUpdateTheme}
                    onUpdateAvatar={handleUpdateHeroAvatar}
                    onUpdateUsername={handleUpdateHeroUsername}
                    onChangePin={handleChangeOwnHeroPin}
                  />
                )}
                {heroMenu === 'about' && (
                  <AboutView
                    role={UserRole.HERO}
                    currentTheme={state.settings.theme}
                  />
                )}
              </>
            )
          )}
        </Suspense>
      </PixelErrorBoundary>

      {/* Game Master Menu Drawer */}
      <PixelModal
        open={gmDrawerOpen}
        title="Game Master"
        onClose={() => setGmDrawerOpen(false)}
      >
        <div className="grid grid-cols-2 min-[380px]:grid-cols-3 gap-2.5">
          {GM_NAV_ITEMS.map((item) => {
            const active = gmMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => playThrottledHoverBlip(state.settings.soundEnabled)}
                onClick={() => handleSelectGmMenu(item.id)}
                className={`pixel-btn pixel-module-card min-h-[78px] p-2 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
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

      {/* Hero Mobile Menu Drawer */}
      <PixelModal
        open={heroDrawerOpen}
        title="Menu Petualang"
        onClose={() => setHeroDrawerOpen(false)}
      >
        <div className="grid grid-cols-2 min-[380px]:grid-cols-3 gap-2.5">
          {HERO_NAV_ITEMS.map((item) => {
            const active = heroMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => playThrottledHoverBlip(state.settings.soundEnabled)}
                onClick={() => handleSelectHeroMenu(item.id)}
                className={`pixel-btn pixel-module-card min-h-[78px] p-2 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                }`}
              >
                <span className={active ? 'text-[var(--text-on-accent)]' : 'text-[var(--accent-warning)]'}>
                  {getHeroMenuIcon(item.id, 22)}
                </span>
                <span className="font-pixel-ui text-[10.5px] leading-tight">
                  {item.shortLabel}
                </span>
                <span className="text-[12px] font-medium opacity-85 leading-none">
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

      {/* GM Cloud Credential Re-Verification Modal */}
      <PixelModal
        open={gmReauthModalOpen}
        title="Verifikasi Sesi GM Cloud"
        onClose={() => setGmReauthModalOpen(false)}
      >
        <form onSubmit={handleSubmitGmReauth} autoComplete="off" className="space-y-3">
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            Database Cloud menolak sinkronisasi karena kredensial Game Master belum terverifikasi atau berubah di Cloud. Masukkan Username &amp; Password GM Cloud yang aktif agar semua menu admin bisa menyimpan data ke Cloud:
          </p>
          <div>
            <PixelFieldLabel htmlFor="reauth-gm-user">Username GM</PixelFieldLabel>
            <PixelInput
              id="reauth-gm-user"
              autoComplete="off"
              required
              value={reauthUser}
              onChange={(e) => setReauthUser(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="reauth-gm-pass">Password GM Cloud</PixelFieldLabel>
            <PixelInput
              id="reauth-gm-pass"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Masukkan password GM yang aktif di Cloud..."
              value={reauthPass}
              onChange={(e) => setReauthPass(e.target.value)}
            />
          </div>
          {reauthError && (
            <p className="text-[12.5px] font-semibold text-[var(--accent-danger)]">
              [!] {reauthError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <PixelButton
              type="button"
              variant="neutral"
              onClick={() => setGmReauthModalOpen(false)}
            >
              Tutup
            </PixelButton>
            <PixelButton type="submit" variant="success" disabled={isVerifyingReauth}>
              {isVerifyingReauth ? 'Memeriksa...' : 'Verifikasi'}
            </PixelButton>
          </div>
        </form>
      </PixelModal>
      </ArcadeShell>
    </ThemeProvider>
  );
}
