import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  deleteDungeon,
  deleteHero,
  deleteNotice,
  deleteQuest,
  deleteRealm,
  deleteTome,
  getAllAcademyData,
  seedInitialDataIfEmpty,
  updateSystemSettings,
  upsertDungeon,
  upsertGrade,
  upsertHero,
  upsertNotice,
  upsertQuest,
  upsertRealm,
  upsertTome,
} from './src/db/queries.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase if environment variables are provided
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
);

const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

if (isSupabaseConfigured) {
  console.log('✓ Connected to Supabase backend:', supabaseUrl);
} else {
  console.log('✓ Connected to Cloud SQL PostgreSQL backend');
}

// Seed initial data once
seedInitialDataIfEmpty().catch((err) => {
  console.error('Seed check failed:', err);
});

// Database status endpoint
app.get('/api/database-status', (req, res) => {
  res.json({
    engine: isSupabaseConfigured ? 'Supabase' : 'Cloud SQL (PostgreSQL)',
    supabaseConfigured: isSupabaseConfigured,
    supabaseUrl: isSupabaseConfigured ? supabaseUrl : null,
    cloudSqlConnected: Boolean(process.env.SQL_HOST || process.env.SQL_USER),
  });
});

// API Routes
app.get('/api/academy', async (req, res) => {
  try {
    // If Supabase is configured, we can also fetch from Supabase
    if (supabaseAdmin) {
      const [
        { data: dData },
        { data: hData },
        { data: rData },
        { data: tData },
        { data: qData },
        { data: nData },
        { data: gData },
        { data: sData },
      ] = await Promise.all([
        supabaseAdmin.from('dungeons').select('*'),
        supabaseAdmin.from('heroes').select('*'),
        supabaseAdmin.from('realms').select('*'),
        supabaseAdmin.from('tomes').select('*'),
        supabaseAdmin.from('quests').select('*'),
        supabaseAdmin.from('notices').select('*'),
        supabaseAdmin.from('grades').select('*'),
        supabaseAdmin.from('settings').select('*').limit(1),
      ]);

      if (dData && dData.length > 0) {
        const s = sData?.[0] || {};
        return res.json({
          gmProfile: {
            name: s.gm_name || 'Pak Budi Santoso',
            title: s.gm_title || 'Guild Master of Science',
            specialty: s.gm_specialty || 'Guru IPA & Pembina Sains',
            avatar: s.gm_avatar || 'guild_master',
          },
          settings: {
            theme: s.theme || 'sunny_quest',
            crtScanlines: s.crt_scanlines || false,
            soundEnabled: s.sound_enabled ?? true,
            academicTerm: s.academic_term || 'Semester Ganjil 2026/2027',
          },
          dungeons: dData.map((d: any) => ({
            id: d.id,
            name: d.name,
            tier: d.tier,
            guildCode: d.guild_code || d.guildCode,
            capacity: d.capacity,
            description: d.description || '',
          })),
          heroes: (hData || []).map((h: any) => ({
            id: h.id,
            name: h.name,
            username: h.username,
            studentCode: h.student_code || h.studentCode,
            dungeonId: h.dungeon_id || h.dungeonId,
            avatar: h.avatar,
            heroClass: h.hero_class || h.heroClass,
            active: h.active,
            joinedDate: h.joined_date || h.joinedDate,
          })),
          realms: (rData || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            icon: r.icon,
            accentColor: r.accent_color || r.accentColor,
            description: r.description || '',
          })),
          tomes: (tData || []).map((t: any) => ({
            id: t.id,
            realmId: t.realm_id || t.realmId,
            title: t.title,
            chapter: t.chapter,
            readMinutes: t.read_minutes || t.readMinutes,
            summary: t.summary,
            content: t.content,
            publishedDate: t.published_date || t.publishedDate,
          })),
          quests: (qData || []).map((q: any) => ({
            id: q.id,
            realmId: q.realm_id || q.realmId,
            dungeonId: q.dungeon_id || q.dungeonId,
            title: q.title,
            instructions: q.instructions,
            deadline: q.deadline,
            maxExp: q.max_exp || q.maxExp,
            difficulty: q.difficulty,
          })),
          notices: (nData || []).map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            priority: n.priority,
            targetDungeonId: n.target_dungeon_id || n.targetDungeonId,
            releaseDate: n.release_date || n.releaseDate,
            author: n.author,
          })),
          grades: (gData || []).map((g: any) => ({
            id: g.id,
            heroId: g.hero_id || g.heroId,
            questId: g.quest_id || g.questId,
            realmId: g.realm_id || g.realmId,
            score: g.score,
            expEarned: g.exp_earned || g.expEarned,
            feedback: g.feedback || '',
            gradedDate: g.graded_date || g.gradedDate,
          })),
        });
      }
    }

    // Default to Cloud SQL
    const data = await getAllAcademyData();
    res.json(data);
  } catch (error: any) {
    console.error('API /api/academy error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch academy data' });
  }
});

// Dungeons
app.post('/api/dungeons', async (req, res) => {
  try {
    await upsertDungeon(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('dungeons').upsert({
        id: req.body.id,
        name: req.body.name,
        tier: req.body.tier,
        guild_code: req.body.guildCode,
        capacity: req.body.capacity,
        description: req.body.description,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save dungeon' });
  }
});

app.delete('/api/dungeons/:id', async (req, res) => {
  try {
    await deleteDungeon(req.params.id);
    if (supabaseAdmin) {
      await supabaseAdmin.from('dungeons').delete().eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete dungeon' });
  }
});

// Heroes
app.post('/api/heroes', async (req, res) => {
  try {
    await upsertHero(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('heroes').upsert({
        id: req.body.id,
        name: req.body.name,
        username: req.body.username,
        student_code: req.body.studentCode,
        dungeon_id: req.body.dungeonId,
        avatar: req.body.avatar,
        hero_class: req.body.heroClass,
        active: req.body.active,
        joined_date: req.body.joinedDate,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save hero' });
  }
});

app.delete('/api/heroes/:id', async (req, res) => {
  try {
    await deleteHero(req.params.id);
    if (supabaseAdmin) {
      await supabaseAdmin.from('heroes').delete().eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete hero' });
  }
});

// Notices
app.post('/api/notices', async (req, res) => {
  try {
    await upsertNotice(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('notices').upsert({
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        target_dungeon_id: req.body.targetDungeonId,
        release_date: req.body.releaseDate,
        author: req.body.author,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save notice' });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    await deleteNotice(req.params.id);
    if (supabaseAdmin) {
      await supabaseAdmin.from('notices').delete().eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete notice' });
  }
});

// Realms
app.post('/api/realms', async (req, res) => {
  try {
    await upsertRealm(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('realms').upsert({
        id: req.body.id,
        name: req.body.name,
        code: req.body.code,
        icon: req.body.icon,
        accent_color: req.body.accentColor,
        description: req.body.description,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save realm' });
  }
});

app.delete('/api/realms/:id', async (req, res) => {
  try {
    await deleteRealm(req.params.id);
    if (supabaseAdmin) {
      await supabaseAdmin.from('realms').delete().eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete realm' });
  }
});

// Tomes
app.post('/api/tomes', async (req, res) => {
  try {
    await upsertTome(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('tomes').upsert({
        id: req.body.id,
        realm_id: req.body.realmId,
        title: req.body.title,
        chapter: req.body.chapter,
        read_minutes: req.body.readMinutes,
        summary: req.body.summary,
        content: req.body.content,
        published_date: req.body.publishedDate,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save tome' });
  }
});

app.delete('/api/tomes/:id', async (req, res) => {
  try {
    await deleteTome(req.params.id);
    if (supabaseAdmin) {
      await supabaseAdmin.from('tomes').delete().eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete tome' });
  }
});

// Quests
app.post('/api/quests', async (req, res) => {
  try {
    await upsertQuest(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('quests').upsert({
        id: req.body.id,
        realm_id: req.body.realmId,
        dungeon_id: req.body.dungeonId,
        title: req.body.title,
        instructions: req.body.instructions,
        deadline: req.body.deadline,
        max_exp: req.body.maxExp,
        difficulty: req.body.difficulty,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save quest' });
  }
});

app.delete('/api/quests/:id', async (req, res) => {
  try {
    await deleteQuest(req.params.id);
    if (supabaseAdmin) {
      await supabaseAdmin.from('quests').delete().eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete quest' });
  }
});

// Grades
app.post('/api/grades', async (req, res) => {
  try {
    await upsertGrade(req.body);
    if (supabaseAdmin) {
      await supabaseAdmin.from('grades').upsert({
        id: req.body.id,
        hero_id: req.body.heroId,
        quest_id: req.body.questId,
        realm_id: req.body.realmId,
        score: req.body.score,
        exp_earned: req.body.expEarned,
        feedback: req.body.feedback,
        graded_date: req.body.gradedDate,
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save grade' });
  }
});

// Settings
app.post('/api/settings', async (req, res) => {
  try {
    const { settings: newSettings, gmProfile } = req.body;
    await updateSystemSettings(newSettings || {}, gmProfile || {});
    if (supabaseAdmin) {
      await supabaseAdmin.from('settings').upsert({
        id: 'global',
        theme: newSettings?.theme || 'sunny_quest',
        crt_scanlines: newSettings?.crtScanlines ?? false,
        sound_enabled: newSettings?.soundEnabled ?? true,
        academic_term: newSettings?.academicTerm || 'Semester Ganjil 2026/2027',
        gm_name: gmProfile?.name || 'Pak Budi Santoso',
        gm_title: gmProfile?.title || 'Guild Master of Science',
        gm_specialty: gmProfile?.specialty || 'Guru IPA & Pembina Sains',
        gm_avatar: gmProfile?.avatar || 'guild_master',
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
