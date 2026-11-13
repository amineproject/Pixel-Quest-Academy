import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AcademyState,
  ActiveQuest,
  AncientTome,
  Dungeon,
  ExpGrade,
  GameMasterProfile,
  HeroStudent,
  PixelTheme,
  QuestNotice,
  Realm,
  SystemSettings,
} from '../types/lms';

export const SUPABASE_URL_KEY = 'pixel_quest_supabase_url';
export const SUPABASE_KEY_KEY = 'pixel_quest_supabase_anon_key';

export interface GmAuthCredentials {
  username: string;
  password: string;
}

export interface AcademyFetchContext {
  role: 'admin' | 'student' | 'guest';
  gmUsername?: string;
  gmPassword?: string;
  heroId?: string;
  heroPin?: string;
}

function isMissingRpcError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '');
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('Could not find the function') ||
    msg.includes('does not exist')
  );
}

/**
 * Reads ?cloud=<base64> or #cloud=<base64> share link on startup so any device
 * opening the link immediately inherits the public Supabase URL + Anon Key.
 */
export function bootstrapSupabaseFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    let token = searchParams.get('cloud');

    if (!token && window.location.hash.includes('cloud=')) {
      const hashPart = window.location.hash.split('cloud=')[1];
      if (hashPart) {
        token = hashPart.split('&')[0];
      }
    }

    if (!token) return false;

    const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
    const decodedJson = decodeURIComponent(escape(atob(normalized)));
    const parsed = JSON.parse(decodedJson) as { u?: string; k?: string };

    if (
      parsed &&
      typeof parsed.u === 'string' &&
      typeof parsed.k === 'string' &&
      parsed.u.startsWith('https://') &&
      parsed.k.length > 10
    ) {
      localStorage.setItem(SUPABASE_URL_KEY, parsed.u.trim());
      localStorage.setItem(SUPABASE_KEY_KEY, parsed.k.trim());
      cachedClient = null;

      // Clean ?cloud= parameter from URL bar without losing route hash
      searchParams.delete('cloud');
      const nextSearch = searchParams.toString();
      const cleanUrl =
        window.location.pathname +
        (nextSearch ? `?${nextSearch}` : '') +
        (window.location.hash.startsWith('#cloud=') ? '' : window.location.hash);
      window.history.replaceState({}, document.title, cleanUrl);
      return true;
    }
  } catch (err) {
    console.warn('Invalid cloud share token in URL:', err);
  }
  return false;
}

export function generateCloudShareLink(): string | null {
  if (typeof window === 'undefined') return null;
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();
  if (!isSupabaseConfigured()) return null;

  try {
    const payload = JSON.stringify({ u: url, k: key });
    const encoded = btoa(unescape(encodeURIComponent(payload)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const originAndPath = `${window.location.origin}${window.location.pathname}`;
    return `${originAndPath}?cloud=${encoded}`;
  } catch {
    return null;
  }
}

export function getStoredSupabaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const fromStorage = localStorage.getItem(SUPABASE_URL_KEY);
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim();
  return '';
}

export function getStoredSupabaseAnonKey(): string {
  if (typeof window === 'undefined') return '';
  const fromStorage = localStorage.getItem(SUPABASE_KEY_KEY);
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim();
  return '';
}

export function isSupabaseConfigured(): boolean {
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();
  return Boolean(
    url &&
      key &&
      url.startsWith('https://') &&
      !url.includes('placeholder') &&
      !url.includes('your-project')
  );
}

let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabase(): SupabaseClient | null {
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();

  if (!isSupabaseConfigured()) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && url === lastClientUrl && key === lastClientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
    lastClientUrl = url;
    lastClientKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    cachedClient = null; // force re-init
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
    cachedClient = null;
  }
}

export interface SupabaseConfigStatus {
  configured: boolean;
  url: string;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  const url = getStoredSupabaseUrl();
  return {
    configured: isSupabaseConfigured(),
    url: isSupabaseConfigured()
      ? url.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co'
      : 'Belum terhubung ke Supabase Cloud',
  };
}

export async function checkHardenedSecurityStatus(): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.rpc('verify_gm_login', {
      p_username: '__probe__',
      p_password: '',
    });
    if (error && isMissingRpcError(error)) {
      return false;
    }
    return !error;
  } catch {
    return false;
  }
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  hasCloudData: boolean;
  hardened: boolean;
  message: string;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      ok: false,
      hasCloudData: false,
      hardened: false,
      message: 'URL atau Anon Key Supabase belum valid.',
    };
  }
  try {
    const [dRes, hRes, hardened] = await Promise.all([
      client.from('dungeons').select('id', { count: 'exact', head: true }),
      client.from('heroes').select('id', { count: 'exact', head: true }),
      checkHardenedSecurityStatus(),
    ]);

    if (dRes.error || hRes.error) {
      const errMsg = dRes.error?.message || hRes.error?.message || 'Error koneksi';
      if (errMsg.includes('does not exist') || errMsg.includes('schema cache')) {
        return {
          ok: false,
          hasCloudData: false,
          hardened: false,
          message:
            'Terhubung ke Supabase, tetapi tabel belum dibuat! Jalankan isi file supabase-schema.sql di Supabase SQL Editor.',
        };
      }
      return {
        ok: false,
        hasCloudData: false,
        hardened: false,
        message: `Gagal akses Supabase: ${errMsg}`,
      };
    }

    const totalRows = (dRes.count || 0) + (hRes.count || 0);
    return {
      ok: true,
      hasCloudData: totalRows > 0,
      hardened,
      message:
        totalRows > 0
          ? `Terhubung! Ditemukan data aktif (${dRes.count || 0} kelas, ${hRes.count || 0} siswa). ${
              hardened
                ? 'Enkripsi & RLS Ketat Aktif.'
                : 'Tips: Jalankan pembaruan supabase-schema.sql untuk enkripsi password & PIN siswa.'
            }`
          : 'Terhubung! Tabel Supabase siap digunakan (masih kosong, klik Kirim ke Cloud).',
    };
  } catch (err: any) {
    return {
      ok: false,
      hasCloudData: false,
      hardened: false,
      message: err?.message || 'Gagal menghubungi server Supabase.',
    };
  }
}

// ----------------------------------------------------------------------------
// Secure Authentication RPCs (with Legacy Fallback)
// ----------------------------------------------------------------------------

export async function verifyGmLoginCloud(
  username: string,
  password: string
): Promise<{ ok: boolean; hardened: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, hardened: false, error: 'not_configured' };
  }

  try {
    const { data, error } = await client.rpc('verify_gm_login', {
      p_username: username.trim(),
      p_password: password,
    });

    if (!error && data && typeof data === 'object') {
      return {
        ok: Boolean((data as any).ok),
        hardened: true,
        error: (data as any).error,
      };
    }

    if (error && !isMissingRpcError(error)) {
      return { ok: false, hardened: true, error: error.message };
    }

    // Legacy fallback if SQL RPC has not been applied yet
    const { data: sData } = await client.from('settings').select('*').limit(1);
    const sRow = sData?.[0];
    if (!sRow) return { ok: false, hardened: false, error: 'no_settings' };

    const expectedUser = (sRow.gm_username || 'admin').trim().toLowerCase();
    const expectedPass = sRow.gm_password || 'admin';
    if (expectedPass === '[PROTECTED]') {
      return { ok: false, hardened: true, error: 'rpc_required' };
    }
    const matched =
      username.trim().toLowerCase() === expectedUser && password === expectedPass;
    return { ok: matched, hardened: false };
  } catch (err: any) {
    return { ok: false, hardened: false, error: err?.message };
  }
}

export async function verifyHeroLoginCloud(
  identifier: string,
  pin: string
): Promise<{
  ok: boolean;
  heroId?: string;
  hasPin?: boolean;
  hardened: boolean;
  error?: string;
}> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, hardened: false, error: 'not_configured' };
  }

  try {
    const { data, error } = await client.rpc('verify_hero_login', {
      p_identifier: identifier.trim(),
      p_pin: pin.trim(),
    });

    if (!error && data && typeof data === 'object') {
      const res = data as any;
      return {
        ok: Boolean(res.ok),
        heroId: res.hero_id,
        hasPin: Boolean(res.has_pin),
        hardened: true,
        error: res.error,
      };
    }

    if (error && isMissingRpcError(error)) {
      return { ok: false, hardened: false, error: 'rpc_missing' };
    }

    return { ok: false, hardened: true, error: error?.message || 'verify_failed' };
  } catch (err: any) {
    return { ok: false, hardened: false, error: err?.message };
  }
}

export async function changeOwnHeroPinCloud(
  heroId: string,
  currentPin: string,
  newPin: string
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const { data, error } = await client.rpc('change_own_hero_pin', {
      p_hero_id: heroId,
      p_current_pin: currentPin.trim(),
      p_new_pin: newPin.trim(),
    });
    if (error) {
      if (isMissingRpcError(error)) {
        return {
          ok: false,
          error: 'Fitur PIN Cloud aktif setelah admin menjalankan pembaruan supabase-schema.sql.',
        };
      }
      return { ok: false, error: error.message };
    }
    const res = data as any;
    if (!res?.ok) {
      return { ok: false, error: res?.error || 'Gagal memperbarui PIN.' };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function updateOwnHeroAvatarCloud(
  heroId: string,
  pin: string,
  avatar: string
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const { data, error } = await client.rpc('update_own_hero_avatar', {
      p_hero_id: heroId,
      p_pin: pin.trim(),
      p_avatar: avatar,
    });
    if (error && isMissingRpcError(error)) {
      const { error: fbErr } = await client
        .from('heroes')
        .update({ avatar })
        .eq('id', heroId);
      if (fbErr) return { ok: false, error: fbErr.message };
      return { ok: true };
    }
    if (error) return { ok: false, error: error.message };
    const res = data as any;
    if (res && res.ok === false) return { ok: false, error: res.error };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function updateOwnHeroUsernameCloud(
  heroId: string,
  pin: string,
  username: string
): Promise<{ ok: boolean; username?: string; error?: string }> {
  const clean = username.trim().replace(/\s+/g, '').toLowerCase();
  if (clean.length < 1 || clean.length > 5) {
    return { ok: false, error: 'Username harus 1 hingga 5 karakter (tanpa spasi).' };
  }

  const client = getSupabase();
  if (!client) return { ok: true, username: clean };
  try {
    const { data, error } = await client.rpc('update_own_hero_username', {
      p_hero_id: heroId,
      p_pin: pin.trim(),
      p_username: clean,
    });
    if (error && isMissingRpcError(error)) {
      const { error: fbErr } = await client
        .from('heroes')
        .update({ username: clean })
        .eq('id', heroId);
      if (fbErr) return { ok: false, error: fbErr.message };
      return { ok: true, username: clean };
    }
    if (error) return { ok: false, error: error.message };
    const res = data as any;
    if (res && res.ok === false) {
      return { ok: false, error: res.error || 'Gagal memperbarui username.' };
    }
    return { ok: true, username: res?.username || clean };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

// ----------------------------------------------------------------------------
// Cloud Fetch (Respects Role & Confidentiality)
// ----------------------------------------------------------------------------

function mapGradeRows(rows: any[], hideScores = false): ExpGrade[] {
  return (rows || []).map((g: any) => ({
    id: g.id,
    heroId: g.hero_id || '',
    questId: g.quest_id || '',
    realmId: g.realm_id || '',
    score: hideScores ? 0 : Number(g.score) || 0,
    expEarned: hideScores ? 0 : Number(g.exp_earned) || 0,
    status: g.status || ((Number(g.score) || 0) >= 70 ? 'tuntas' : 'remidial'),
    feedback: g.feedback || '',
    gradedDate: g.graded_date || '',
  }));
}

export async function fetchAcademyFromSupabase(
  ctx: AcademyFetchContext = { role: 'guest' }
): Promise<Partial<AcademyState> | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const [
      dungeonsRes,
      heroesRes,
      noticesRes,
      realmsRes,
      tomesRes,
      questsRes,
      settingsRes,
    ] = await Promise.all([
      client.from('dungeons').select('*'),
      client.from('heroes').select('*'),
      client.from('notices').select('*'),
      client.from('realms').select('*'),
      client.from('tomes').select('*'),
      client.from('quests').select('*'),
      client.from('settings').select('*').limit(1),
    ]);

    if (dungeonsRes.error || heroesRes.error) {
      console.warn('Supabase fetch returned error:', dungeonsRes.error || heroesRes.error);
      return null;
    }

    const dList = dungeonsRes.data || [];
    const hList = heroesRes.data || [];
    const nList = noticesRes.data || [];
    const rList = realmsRes.data || [];
    const tList = tomesRes.data || [];
    const qList = questsRes.data || [];
    const sRow = settingsRes.data?.[0];

    if (dList.length === 0 && hList.length === 0 && rList.length === 0 && !sRow) {
      return null;
    }

    // Fetch grades strictly scoped to authenticated role
    let gradesList: ExpGrade[] = [];
    if (ctx.role === 'admin' && ctx.gmUsername && ctx.gmPassword) {
      const { data: gRpc, error: gErr } = await client.rpc('get_gm_grades', {
        p_gm_user: ctx.gmUsername,
        p_gm_pass: ctx.gmPassword,
      });
      if (!gErr && (gRpc as any)?.ok) {
        gradesList = mapGradeRows((gRpc as any).grades || [], false);
      } else if (gErr && isMissingRpcError(gErr)) {
        const { data: legacyGrades } = await client.from('grades').select('*');
        gradesList = mapGradeRows(legacyGrades || [], false);
      }
    } else if (ctx.role === 'student' && ctx.heroId) {
      const { data: sRpc, error: sErr } = await client.rpc('get_hero_grade_statuses', {
        p_hero_id: ctx.heroId,
        p_pin: ctx.heroPin || '',
      });
      if (!sErr && (sRpc as any)?.ok) {
        gradesList = mapGradeRows((sRpc as any).grades || [], true);
      } else if (sErr && isMissingRpcError(sErr)) {
        const { data: legacyGrades } = await client
          .from('grades')
          .select('*')
          .eq('hero_id', ctx.heroId);
        gradesList = mapGradeRows(legacyGrades || [], true);
      }
    }

    const isProtectedPass = !sRow?.gm_password || sRow.gm_password === '[PROTECTED]';

    return {
      dungeons: dList.map((d: any) => {
        let rIds: string[] = [];
        try {
          if (d.realm_ids) {
            rIds = Array.isArray(d.realm_ids) ? d.realm_ids : JSON.parse(d.realm_ids);
          }
        } catch {}
        return {
          id: d.id,
          name: d.name,
          tier: d.tier,
          guildCode: d.guild_code,
          capacity: Number(d.capacity) || 30,
          description: d.description || '',
          realmIds: rIds,
        };
      }),
      heroes: hList.map((h: any) => {
        let erIds: string[] = [];
        try {
          if (h.enrolled_realm_ids) {
            erIds = Array.isArray(h.enrolled_realm_ids)
              ? h.enrolled_realm_ids
              : JSON.parse(h.enrolled_realm_ids);
          }
        } catch {}
        return {
          id: h.id,
          name: h.name,
          username: h.username,
          studentCode: h.student_code,
          dungeonId: h.dungeon_id || '',
          avatar: h.avatar || 'knight',
          heroClass: h.hero_class || 'Adventurer',
          active: Boolean(h.active),
          joinedDate: h.joined_date || '',
          enrolledRealmIds: erIds,
          hasPin: Boolean(h.has_pin),
        };
      }),
      notices: nList.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        linkUrl: n.link_url || '',
        priority: n.priority || 'Medium',
        targetDungeonId: n.target_dungeon_id || 'all',
        releaseDate: n.release_date || '',
        author: n.author || 'Guild Master',
      })),
      realms: rList.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        icon: r.icon || 'flask',
        accentColor: r.accent_color || '#38B764',
        description: r.description || '',
      })),
      tomes: tList.map((t: any) => ({
        id: t.id,
        realmId: t.realm_id || '',
        title: t.title,
        chapter: Number(t.chapter) || 1,
        readMinutes: Number(t.read_minutes) || 8,
        summary: t.summary || '',
        content: t.content || '',
        linkUrl: t.link_url || '',
        publishedDate: t.published_date || '',
      })),
      quests: qList.map((q: any) => ({
        id: q.id,
        realmId: q.realm_id || '',
        dungeonId: q.dungeon_id || 'all',
        title: q.title,
        instructions: q.instructions || '',
        linkUrl: q.link_url || '',
        deadline: q.deadline || '',
        maxExp: Number(q.max_exp) || 200,
        difficulty: q.difficulty || 'Normal',
      })),
      grades: gradesList,
      settings: sRow
        ? {
            theme: sRow.theme as PixelTheme,
            crtScanlines: Boolean(sRow.crt_scanlines),
            soundEnabled: Boolean(sRow.sound_enabled),
            academicTerm: sRow.academic_term || 'Semester Ganjil 2026/2027',
          }
        : undefined,
      gmProfile: sRow
        ? {
            name: sRow.gm_name || 'Pak Budi Santoso',
            title: sRow.gm_title || 'Guild Master of Science',
            specialty: sRow.gm_specialty || 'Guru IPA & Pembina Sains',
            avatar: sRow.gm_avatar || 'guild_master',
            ...(sRow.gm_username ? { username: sRow.gm_username } : {}),
            // Never leak plaintext GM password to students or guest screens!
            ...(ctx.role === 'admin' && !isProtectedPass && sRow.gm_password
              ? { password: sRow.gm_password }
              : { password: '' }),
            requirePassword: true,
          }
        : undefined,
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

export type CloudSyncResult = { ok: boolean; error?: string };

export function subscribeAcademyRealtime(onRemoteChange: () => void): () => void {
  const client = getSupabase();
  if (!client) return () => {};

  let debounceTimer: number | null = null;
  const trigger = () => {
    if (debounceTimer) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onRemoteChange();
    }, 350);
  };

  try {
    const channel = client
      .channel('pixel-quest-academy-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          trigger();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      client.removeChannel(channel).catch(() => {});
    };
  } catch {
    return () => {};
  }
}

async function runGmRpc(
  client: SupabaseClient,
  fnName: string,
  gmAuth: GmAuthCredentials | undefined,
  extraArgs: Record<string, any>
): Promise<{ handled: boolean; result: CloudSyncResult }> {
  if (!gmAuth?.username || !gmAuth?.password) {
    return { handled: false, result: { ok: false, error: 'Sesi GM belum terverifikasi.' } };
  }
  const { data, error } = await client.rpc(fnName, {
    p_gm_user: gmAuth.username,
    p_gm_pass: gmAuth.password,
    ...extraArgs,
  });
  if (error) {
    if (isMissingRpcError(error)) {
      return { handled: false, result: { ok: false } };
    }
    return { handled: true, result: { ok: false, error: error.message } };
  }
  const res = data as any;
  if (res && res.ok === false) {
    return { handled: true, result: { ok: false, error: res.error || 'Akses ditolak.' } };
  }
  return { handled: true, result: { ok: true } };
}

export async function cloudSyncDungeon(
  dungeon: Dungeon,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload = {
      id: dungeon.id,
      name: dungeon.name,
      tier: dungeon.tier,
      guild_code: dungeon.guildCode,
      capacity: dungeon.capacity,
      description: dungeon.description,
      realm_ids: JSON.stringify(dungeon.realmIds || []),
    };
    const rpc = await runGmRpc(client, 'gm_upsert_dungeon', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('dungeons').upsert(payload);
    if (error) {
      const { error: fallbackErr } = await client.from('dungeons').upsert({
        id: dungeon.id,
        name: dungeon.name,
        tier: dungeon.tier,
        guild_code: dungeon.guildCode,
        capacity: dungeon.capacity,
        description: dungeon.description,
      });
      if (fallbackErr) return { ok: false, error: fallbackErr.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal sinkronisasi kelas.' };
  }
}

export async function cloudDeleteDungeon(
  id: string,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const rpc = await runGmRpc(client, 'gm_delete_dungeon', gmAuth, { p_id: id });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('dungeons').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncHero(
  hero: HeroStudent,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload: Record<string, any> = {
      id: hero.id,
      name: hero.name,
      username: hero.username,
      student_code: hero.studentCode,
      dungeon_id: hero.dungeonId || null,
      avatar: hero.avatar,
      hero_class: hero.heroClass,
      active: hero.active,
      joined_date: hero.joinedDate,
      enrolled_realm_ids: JSON.stringify(hero.enrolledRealmIds || []),
      has_pin: Boolean(hero.pin ? true : hero.hasPin),
    };
    if (typeof hero.pin === 'string') {
      if (hero.pin.trim()) {
        payload.pin = hero.pin.trim();
      } else if (hero.hasPin === false) {
        payload.clear_pin = true;
      }
    }

    const rpc = await runGmRpc(client, 'gm_upsert_hero', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('heroes').upsert({
      id: hero.id,
      name: hero.name,
      username: hero.username,
      student_code: hero.studentCode,
      dungeon_id: hero.dungeonId || null,
      avatar: hero.avatar,
      hero_class: hero.heroClass,
      active: hero.active,
      joined_date: hero.joinedDate,
      enrolled_realm_ids: JSON.stringify(hero.enrolledRealmIds || []),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal sinkronisasi siswa.' };
  }
}

export async function cloudDeleteHero(
  id: string,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const rpc = await runGmRpc(client, 'gm_delete_hero', gmAuth, { p_id: id });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('heroes').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncNotice(
  notice: QuestNotice,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload = {
      id: notice.id,
      title: notice.title,
      description: notice.description,
      link_url: notice.linkUrl || '',
      priority: notice.priority,
      target_dungeon_id: notice.targetDungeonId,
      release_date: notice.releaseDate,
      author: notice.author,
    };
    const rpc = await runGmRpc(client, 'gm_upsert_notice', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('notices').upsert(payload);
    if (error) {
      const { error: fallbackErr } = await client.from('notices').upsert({
        id: notice.id,
        title: notice.title,
        description: notice.description,
        priority: notice.priority,
        target_dungeon_id: notice.targetDungeonId,
        release_date: notice.releaseDate,
        author: notice.author,
      });
      if (fallbackErr) return { ok: false, error: fallbackErr.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudDeleteNotice(
  id: string,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const rpc = await runGmRpc(client, 'gm_delete_notice', gmAuth, { p_id: id });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('notices').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncRealm(
  realm: Realm,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload = {
      id: realm.id,
      name: realm.name,
      code: realm.code,
      icon: realm.icon,
      accent_color: realm.accentColor,
      description: realm.description,
    };
    const rpc = await runGmRpc(client, 'gm_upsert_realm', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('realms').upsert(payload);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudDeleteRealm(
  id: string,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const rpc = await runGmRpc(client, 'gm_delete_realm', gmAuth, { p_id: id });
    if (rpc.handled) return rpc.result;

    await client.from('grades').delete().eq('realm_id', id);
    await client.from('tomes').delete().eq('realm_id', id);
    await client.from('quests').delete().eq('realm_id', id);
    const { error } = await client.from('realms').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncTome(
  tome: AncientTome,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload = {
      id: tome.id,
      realm_id: tome.realmId || null,
      title: tome.title,
      chapter: tome.chapter,
      read_minutes: tome.readMinutes,
      summary: tome.summary,
      content: tome.content,
      link_url: tome.linkUrl || '',
      published_date: tome.publishedDate,
    };
    const rpc = await runGmRpc(client, 'gm_upsert_tome', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('tomes').upsert(payload);
    if (error) {
      const { error: fallbackErr } = await client.from('tomes').upsert({
        id: tome.id,
        realm_id: tome.realmId || null,
        title: tome.title,
        chapter: tome.chapter,
        read_minutes: tome.readMinutes,
        summary: tome.summary,
        content: tome.content,
        published_date: tome.publishedDate,
      });
      if (fallbackErr) return { ok: false, error: fallbackErr.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudDeleteTome(
  id: string,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const rpc = await runGmRpc(client, 'gm_delete_tome', gmAuth, { p_id: id });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('tomes').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncQuest(
  quest: ActiveQuest,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload = {
      id: quest.id,
      realm_id: quest.realmId || null,
      dungeon_id: quest.dungeonId,
      title: quest.title,
      instructions: quest.instructions,
      link_url: quest.linkUrl || '',
      deadline: quest.deadline,
      max_exp: quest.maxExp,
      difficulty: quest.difficulty,
    };
    const rpc = await runGmRpc(client, 'gm_upsert_quest', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('quests').upsert(payload);
    if (error) {
      const { error: fallbackErr } = await client.from('quests').upsert({
        id: quest.id,
        realm_id: quest.realmId || null,
        dungeon_id: quest.dungeonId,
        title: quest.title,
        instructions: quest.instructions,
        deadline: quest.deadline,
        max_exp: quest.maxExp,
        difficulty: quest.difficulty,
      });
      if (fallbackErr) return { ok: false, error: fallbackErr.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudDeleteQuest(
  id: string,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const rpc = await runGmRpc(client, 'gm_delete_quest', gmAuth, { p_id: id });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('quests').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncGrade(
  grade: ExpGrade,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  const resolvedStatus = grade.status || (grade.score >= 70 ? 'tuntas' : 'remidial');
  try {
    const payload = {
      id: grade.id,
      hero_id: grade.heroId,
      quest_id: grade.questId,
      realm_id: grade.realmId,
      score: grade.score,
      exp_earned: grade.expEarned,
      status: resolvedStatus,
      feedback: grade.feedback || '',
      graded_date: grade.gradedDate,
    };
    const rpc = await runGmRpc(client, 'gm_upsert_grade', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('grades').upsert(payload);
    if (error) {
      const { error: fallbackErr } = await client.from('grades').upsert({
        id: grade.id,
        hero_id: grade.heroId,
        quest_id: grade.questId,
        realm_id: grade.realmId,
        score: grade.score,
        exp_earned: grade.expEarned,
        feedback: grade.feedback || '',
        graded_date: grade.gradedDate,
      });
      if (fallbackErr) return { ok: false, error: fallbackErr.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function cloudSyncSettings(
  settings: SystemSettings,
  gmProfile: GameMasterProfile,
  gmAuth?: GmAuthCredentials
): Promise<CloudSyncResult> {
  const client = getSupabase();
  if (!client) return { ok: true };
  try {
    const payload: Record<string, any> = {
      theme: settings.theme,
      crt_scanlines: settings.crtScanlines,
      sound_enabled: settings.soundEnabled,
      academic_term: settings.academicTerm,
      gm_name: gmProfile.name,
      gm_title: gmProfile.title,
      gm_specialty: gmProfile.specialty,
      gm_avatar: gmProfile.avatar,
      gm_username: gmProfile.username || gmAuth?.username || 'admin',
      gm_require_password: true,
    };
    if (gmProfile.password && gmProfile.password !== '[PROTECTED]') {
      payload.gm_password = gmProfile.password;
    }

    const rpc = await runGmRpc(client, 'gm_update_settings', gmAuth, { p_data: payload });
    if (rpc.handled) return rpc.result;

    const { error } = await client.from('settings').upsert({
      id: 'global',
      ...payload,
      gm_password: gmProfile.password || gmAuth?.password || 'admin',
    });
    if (error) {
      const { error: fallbackErr } = await client.from('settings').upsert({
        id: 'global',
        theme: settings.theme,
        crt_scanlines: settings.crtScanlines,
        sound_enabled: settings.soundEnabled,
        academic_term: settings.academicTerm,
        gm_name: gmProfile.name,
        gm_title: gmProfile.title,
        gm_specialty: gmProfile.specialty,
        gm_avatar: gmProfile.avatar,
      });
      if (fallbackErr) return { ok: false, error: fallbackErr.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function uploadAllLocalToSupabase(
  state: AcademyState,
  gmAuth?: GmAuthCredentials
): Promise<{ ok: boolean; errorMessage?: string }> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, errorMessage: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const validDungeonIds = new Set(state.dungeons.map((d) => d.id));
    const bulkPayload = {
      dungeons: state.dungeons.map((d) => ({
        id: d.id,
        name: d.name,
        tier: d.tier,
        guild_code: d.guildCode,
        capacity: d.capacity,
        description: d.description,
        realm_ids: JSON.stringify(d.realmIds || []),
      })),
      realms: state.realms.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        icon: r.icon,
        accent_color: r.accentColor,
        description: r.description,
      })),
      heroes: state.heroes.map((h) => ({
        id: h.id,
        name: h.name,
        username: h.username,
        student_code: h.studentCode,
        dungeon_id: h.dungeonId && validDungeonIds.has(h.dungeonId) ? h.dungeonId : null,
        avatar: h.avatar,
        hero_class: h.heroClass,
        active: h.active,
        joined_date: h.joinedDate,
        enrolled_realm_ids: JSON.stringify(h.enrolledRealmIds || []),
        ...(h.pin ? { pin: h.pin } : {}),
      })),
      tomes: state.tomes.map((t) => ({
        id: t.id,
        realm_id: t.realmId || null,
        title: t.title,
        chapter: t.chapter,
        read_minutes: t.readMinutes,
        summary: t.summary,
        content: t.content,
        link_url: t.linkUrl || '',
        published_date: t.publishedDate,
      })),
      quests: state.quests.map((q) => ({
        id: q.id,
        realm_id: q.realmId || null,
        dungeon_id: q.dungeonId,
        title: q.title,
        instructions: q.instructions,
        link_url: q.linkUrl || '',
        deadline: q.deadline,
        max_exp: q.maxExp,
        difficulty: q.difficulty,
      })),
      notices: state.notices.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        link_url: n.linkUrl || '',
        priority: n.priority,
        target_dungeon_id: n.targetDungeonId,
        release_date: n.releaseDate,
        author: n.author,
      })),
      grades: state.grades.map((g) => ({
        id: g.id,
        hero_id: g.heroId,
        quest_id: g.questId,
        realm_id: g.realmId,
        score: g.score,
        exp_earned: g.expEarned,
        status: g.status || (g.score >= 70 ? 'tuntas' : 'remidial'),
        feedback: g.feedback || '',
        graded_date: g.gradedDate,
      })),
      settings: {
        theme: state.settings.theme,
        crt_scanlines: state.settings.crtScanlines,
        sound_enabled: state.settings.soundEnabled,
        academic_term: state.settings.academicTerm,
        gm_name: state.gmProfile.name,
        gm_title: state.gmProfile.title,
        gm_specialty: state.gmProfile.specialty,
        gm_avatar: state.gmProfile.avatar,
        gm_username: state.gmProfile.username || gmAuth?.username || 'admin',
        ...(state.gmProfile.password && state.gmProfile.password !== '[PROTECTED]'
          ? { gm_password: state.gmProfile.password }
          : {}),
        gm_require_password: true,
      },
    };

    if (gmAuth?.username && gmAuth?.password) {
      const rpc = await runGmRpc(client, 'gm_bulk_sync', gmAuth, { p_payload: bulkPayload });
      if (rpc.handled) {
        return rpc.result.ok
          ? { ok: true }
          : { ok: false, errorMessage: rpc.result.error || 'Gagal mengunggah data.' };
      }
    }

    // Legacy fallback if RPCs not deployed yet
    if (bulkPayload.dungeons.length > 0) {
      const { error } = await client.from('dungeons').upsert(bulkPayload.dungeons);
      if (error) throw new Error(`Tabel dungeons: ${error.message}`);
    }
    if (bulkPayload.realms.length > 0) {
      const { error } = await client.from('realms').upsert(bulkPayload.realms);
      if (error) throw new Error(`Tabel realms: ${error.message}`);
    }
    if (bulkPayload.heroes.length > 0) {
      const { error } = await client.from('heroes').upsert(
        bulkPayload.heroes.map(({ pin: _pin, ...rest }) => rest)
      );
      if (error) throw new Error(`Tabel heroes: ${error.message}`);
    }
    if (bulkPayload.tomes.length > 0) {
      const { error } = await client.from('tomes').upsert(bulkPayload.tomes);
      if (error) throw new Error(`Tabel tomes: ${error.message}`);
    }
    if (bulkPayload.quests.length > 0) {
      const { error } = await client.from('quests').upsert(bulkPayload.quests);
      if (error) throw new Error(`Tabel quests: ${error.message}`);
    }
    if (bulkPayload.notices.length > 0) {
      const { error } = await client.from('notices').upsert(bulkPayload.notices);
      if (error) throw new Error(`Tabel notices: ${error.message}`);
    }
    if (bulkPayload.grades.length > 0) {
      const { error } = await client.from('grades').upsert(bulkPayload.grades);
      if (error) throw new Error(`Tabel grades: ${error.message}`);
    }
    const { error: settingsErr } = await client.from('settings').upsert({
      id: 'global',
      ...bulkPayload.settings,
      gm_password: state.gmProfile.password || gmAuth?.password || 'admin',
    });
    if (settingsErr) throw new Error(`Tabel settings: ${settingsErr.message}`);

    return { ok: true };
  } catch (err: any) {
    console.error('Failed to upload all data to Supabase:', err);
    return {
      ok: false,
      errorMessage:
        err?.message || 'Gagal mengunggah data. Pastikan tabel & SQL terbaru Supabase sudah dijalankan.',
    };
  }
}
