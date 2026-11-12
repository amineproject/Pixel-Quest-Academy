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

// ----------------------------------------------------------------------------
// Cloud CRUD Sync Functions
// ----------------------------------------------------------------------------

export async function fetchAcademyFromSupabase(): Promise<Partial<AcademyState> | null> {
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
      gradesRes,
      settingsRes,
    ] = await Promise.all([
      client.from('dungeons').select('*'),
      client.from('heroes').select('*'),
      client.from('notices').select('*'),
      client.from('realms').select('*'),
      client.from('tomes').select('*'),
      client.from('quests').select('*'),
      client.from('grades').select('*'),
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
    const gList = gradesRes.data || [];
    const sRow = settingsRes.data?.[0];

    // If tables are completely empty, return null to let local seed populate them
    if (dList.length === 0 && hList.length === 0) {
      return null;
    }

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
        };
      }),
      notices: nList.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
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
        publishedDate: t.published_date || '',
      })),
      quests: qList.map((q: any) => ({
        id: q.id,
        realmId: q.realm_id || '',
        dungeonId: q.dungeon_id || 'all',
        title: q.title,
        instructions: q.instructions || '',
        deadline: q.deadline || '',
        maxExp: Number(q.max_exp) || 200,
        difficulty: q.difficulty || 'Normal',
      })),
      grades: gList.map((g: any) => ({
        id: g.id,
        heroId: g.hero_id || '',
        questId: g.quest_id || '',
        realmId: g.realm_id || '',
        score: Number(g.score) || 0,
        expEarned: Number(g.exp_earned) || 0,
        status: g.status || ((Number(g.score) || 0) >= 70 ? 'tuntas' : 'remidial'),
        feedback: g.feedback || '',
        gradedDate: g.graded_date || '',
      })),
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
            ...(sRow.gm_password ? { password: sRow.gm_password } : {}),
            ...(typeof sRow.gm_require_password === 'boolean'
              ? { requirePassword: sRow.gm_require_password }
              : {}),
          }
        : undefined,
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

export async function cloudSyncDungeon(dungeon: Dungeon): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('dungeons').upsert({
      id: dungeon.id,
      name: dungeon.name,
      tier: dungeon.tier,
      guild_code: dungeon.guildCode,
      capacity: dungeon.capacity,
      description: dungeon.description,
      realm_ids: JSON.stringify(dungeon.realmIds || []),
    });
  } catch (err) {
    console.warn('Cloud sync dungeon failed:', err);
  }
}

export async function cloudDeleteDungeon(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('dungeons').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete dungeon failed:', err);
  }
}

export async function cloudSyncHero(hero: HeroStudent): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('heroes').upsert({
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
  } catch (err) {
    console.warn('Cloud sync hero failed:', err);
  }
}

export async function cloudDeleteHero(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('heroes').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete hero failed:', err);
  }
}

export async function cloudSyncNotice(notice: QuestNotice): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('notices').upsert({
      id: notice.id,
      title: notice.title,
      description: notice.description,
      priority: notice.priority,
      target_dungeon_id: notice.targetDungeonId,
      release_date: notice.releaseDate,
      author: notice.author,
    });
  } catch (err) {
    console.warn('Cloud sync notice failed:', err);
  }
}

export async function cloudDeleteNotice(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('notices').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete notice failed:', err);
  }
}

export async function cloudSyncRealm(realm: Realm): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('realms').upsert({
      id: realm.id,
      name: realm.name,
      code: realm.code,
      icon: realm.icon,
      accent_color: realm.accentColor,
      description: realm.description,
    });
  } catch (err) {
    console.warn('Cloud sync realm failed:', err);
  }
}

export async function cloudDeleteRealm(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('grades').delete().eq('realm_id', id);
    await client.from('tomes').delete().eq('realm_id', id);
    await client.from('quests').delete().eq('realm_id', id);
    await client.from('realms').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete realm failed:', err);
  }
}

export async function cloudSyncTome(tome: AncientTome): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('tomes').upsert({
      id: tome.id,
      realm_id: tome.realmId || null,
      title: tome.title,
      chapter: tome.chapter,
      read_minutes: tome.readMinutes,
      summary: tome.summary,
      content: tome.content,
      published_date: tome.publishedDate,
    });
  } catch (err) {
    console.warn('Cloud sync tome failed:', err);
  }
}

export async function cloudDeleteTome(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('tomes').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete tome failed:', err);
  }
}

export async function cloudSyncQuest(quest: ActiveQuest): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('quests').upsert({
      id: quest.id,
      realm_id: quest.realmId || null,
      dungeon_id: quest.dungeonId,
      title: quest.title,
      instructions: quest.instructions,
      deadline: quest.deadline,
      max_exp: quest.maxExp,
      difficulty: quest.difficulty,
    });
  } catch (err) {
    console.warn('Cloud sync quest failed:', err);
  }
}

export async function cloudDeleteQuest(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('quests').delete().eq('id', id);
  } catch (err) {
    console.warn('Cloud delete quest failed:', err);
  }
}

export async function cloudSyncGrade(grade: ExpGrade): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const resolvedStatus = grade.status || (grade.score >= 70 ? 'tuntas' : 'remidial');
  try {
    const { error } = await client.from('grades').upsert({
      id: grade.id,
      hero_id: grade.heroId,
      quest_id: grade.questId,
      realm_id: grade.realmId,
      score: grade.score,
      exp_earned: grade.expEarned,
      status: resolvedStatus,
      feedback: grade.feedback || '',
      graded_date: grade.gradedDate,
    });
    if (error) {
      await client.from('grades').upsert({
        id: grade.id,
        hero_id: grade.heroId,
        quest_id: grade.questId,
        realm_id: grade.realmId,
        score: grade.score,
        exp_earned: grade.expEarned,
        feedback: grade.feedback || '',
        graded_date: grade.gradedDate,
      });
    }
  } catch (err) {
    console.warn('Cloud sync grade failed:', err);
  }
}

export async function cloudSyncSettings(
  settings: SystemSettings,
  gmProfile: GameMasterProfile
): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    const { error } = await client.from('settings').upsert({
      id: 'global',
      theme: settings.theme,
      crt_scanlines: settings.crtScanlines,
      sound_enabled: settings.soundEnabled,
      academic_term: settings.academicTerm,
      gm_name: gmProfile.name,
      gm_title: gmProfile.title,
      gm_specialty: gmProfile.specialty,
      gm_avatar: gmProfile.avatar,
      gm_username: gmProfile.username || 'admin',
      gm_password: gmProfile.password || 'admin',
      gm_require_password: gmProfile.requirePassword ?? true,
    });
    if (error) {
      await client.from('settings').upsert({
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
    }
  } catch (err) {
    console.warn('Cloud sync settings failed:', err);
  }
}

export async function uploadAllLocalToSupabase(state: AcademyState): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    // 1. Dungeons
    if (state.dungeons.length > 0) {
      await client.from('dungeons').upsert(
        state.dungeons.map((d) => ({
          id: d.id,
          name: d.name,
          tier: d.tier,
          guild_code: d.guildCode,
          capacity: d.capacity,
          description: d.description,
          realm_ids: JSON.stringify(d.realmIds || []),
        }))
      );
    }

    // 2. Heroes
    if (state.heroes.length > 0) {
      await client.from('heroes').upsert(
        state.heroes.map((h) => ({
          id: h.id,
          name: h.name,
          username: h.username,
          student_code: h.studentCode,
          dungeon_id: h.dungeonId || null,
          avatar: h.avatar,
          hero_class: h.heroClass,
          active: h.active,
          joined_date: h.joinedDate,
          enrolled_realm_ids: JSON.stringify(h.enrolledRealmIds || []),
        }))
      );
    }

    // 3. Realms
    if (state.realms.length > 0) {
      await client.from('realms').upsert(
        state.realms.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          icon: r.icon,
          accent_color: r.accentColor,
          description: r.description,
        }))
      );
    }

    // 4. Tomes
    if (state.tomes.length > 0) {
      await client.from('tomes').upsert(
        state.tomes.map((t) => ({
          id: t.id,
          realm_id: t.realmId || null,
          title: t.title,
          chapter: t.chapter,
          read_minutes: t.readMinutes,
          summary: t.summary,
          content: t.content,
          published_date: t.publishedDate,
        }))
      );
    }

    // 5. Quests
    if (state.quests.length > 0) {
      await client.from('quests').upsert(
        state.quests.map((q) => ({
          id: q.id,
          realm_id: q.realmId || null,
          dungeon_id: q.dungeonId,
          title: q.title,
          instructions: q.instructions,
          deadline: q.deadline,
          max_exp: q.maxExp,
          difficulty: q.difficulty,
        }))
      );
    }

    // 6. Notices
    if (state.notices.length > 0) {
      await client.from('notices').upsert(
        state.notices.map((n) => ({
          id: n.id,
          title: n.title,
          description: n.description,
          priority: n.priority,
          target_dungeon_id: n.targetDungeonId,
          release_date: n.releaseDate,
          author: n.author,
        }))
      );
    }

    // 7. Grades
    if (state.grades.length > 0) {
      const { error: gradeErr } = await client.from('grades').upsert(
        state.grades.map((g) => ({
          id: g.id,
          hero_id: g.heroId,
          quest_id: g.questId,
          realm_id: g.realmId,
          score: g.score,
          exp_earned: g.expEarned,
          status: g.status || (g.score >= 70 ? 'tuntas' : 'remidial'),
          feedback: g.feedback || '',
          graded_date: g.gradedDate,
        }))
      );
      if (gradeErr) {
        await client.from('grades').upsert(
          state.grades.map((g) => ({
            id: g.id,
            hero_id: g.heroId,
            quest_id: g.questId,
            realm_id: g.realmId,
            score: g.score,
            exp_earned: g.expEarned,
            feedback: g.feedback || '',
            graded_date: g.gradedDate,
          }))
        );
      }
    }

    // 8. Settings
    const { error: settingsErr } = await client.from('settings').upsert({
      id: 'global',
      theme: state.settings.theme,
      crt_scanlines: state.settings.crtScanlines,
      sound_enabled: state.settings.soundEnabled,
      academic_term: state.settings.academicTerm,
      gm_name: state.gmProfile.name,
      gm_title: state.gmProfile.title,
      gm_specialty: state.gmProfile.specialty,
      gm_avatar: state.gmProfile.avatar,
      gm_username: state.gmProfile.username || 'admin',
      gm_password: state.gmProfile.password || 'admin',
      gm_require_password: state.gmProfile.requirePassword ?? true,
    });
    if (settingsErr) {
      await client.from('settings').upsert({
        id: 'global',
        theme: state.settings.theme,
        crt_scanlines: state.settings.crtScanlines,
        sound_enabled: state.settings.soundEnabled,
        academic_term: state.settings.academicTerm,
        gm_name: state.gmProfile.name,
        gm_title: state.gmProfile.title,
        gm_specialty: state.gmProfile.specialty,
        gm_avatar: state.gmProfile.avatar,
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to upload all data to Supabase:', err);
    return false;
  }
}
