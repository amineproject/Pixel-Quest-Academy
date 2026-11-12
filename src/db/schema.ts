import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (Firebase Auth linkage)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('student'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Dungeons table (Rombel / Kelas)
export const dungeons = pgTable('dungeons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tier: text('tier').notNull(),
  guildCode: text('guild_code').notNull(),
  capacity: integer('capacity').notNull().default(30),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Heroes table (Siswa / Petualang)
export const heroes = pgTable('heroes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull(),
  studentCode: text('student_code').notNull(),
  dungeonId: text('dungeon_id').references(() => dungeons.id),
  avatar: text('avatar').notNull().default('knight'),
  heroClass: text('hero_class').notNull().default('Arcane Knight'),
  active: boolean('active').notNull().default(true),
  joinedDate: text('joined_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quest Notices (Quest Board Broadcast)
export const notices = pgTable('notices', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('Medium'),
  targetDungeonId: text('target_dungeon_id').notNull().default('all'),
  releaseDate: text('release_date').notNull(),
  author: text('author').notNull().default('Guild Master'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Realms table (Mata Pelajaran)
export const realms = pgTable('realms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  icon: text('icon').notNull().default('flask'),
  accentColor: text('accent_color').notNull().default('#38B764'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Ancient Tomes (Materi Pembelajaran)
export const tomes = pgTable('tomes', {
  id: text('id').primaryKey(),
  realmId: text('realm_id').references(() => realms.id),
  title: text('title').notNull(),
  chapter: integer('chapter').notNull().default(1),
  readMinutes: integer('read_minutes').notNull().default(8),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  publishedDate: text('published_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Active Quests (Tugas / Misi)
export const quests = pgTable('quests', {
  id: text('id').primaryKey(),
  realmId: text('realm_id').references(() => realms.id),
  dungeonId: text('dungeon_id').notNull().default('all'),
  title: text('title').notNull(),
  instructions: text('instructions').notNull(),
  deadline: text('deadline').notNull(),
  maxExp: integer('max_exp').notNull().default(200),
  difficulty: text('difficulty').notNull().default('Normal'),
  createdAt: timestamp('created_at').defaultNow(),
});

// EXP & Loot Grades (Penilaian)
export const grades = pgTable('grades', {
  id: text('id').primaryKey(),
  heroId: text('hero_id').references(() => heroes.id),
  questId: text('quest_id').references(() => quests.id),
  realmId: text('realm_id').references(() => realms.id),
  score: integer('score').notNull().default(80),
  expEarned: integer('exp_earned').notNull().default(160),
  feedback: text('feedback').default(''),
  gradedDate: text('graded_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// System Settings
export const settings = pgTable('settings', {
  id: text('id').primaryKey().default('global'),
  theme: text('theme').notNull().default('sunny_quest'),
  crtScanlines: boolean('crt_scanlines').notNull().default(false),
  soundEnabled: boolean('sound_enabled').notNull().default(true),
  academicTerm: text('academic_term').notNull().default('Semester Ganjil 2026/2027'),
  gmName: text('gm_name').notNull().default('Pak Budi Santoso'),
  gmTitle: text('gm_title').notNull().default('Guild Master of Science'),
  gmSpecialty: text('gm_specialty').notNull().default('Guru IPA & Pembina Sains'),
  gmAvatar: text('gm_avatar').notNull().default('guild_master'),
});

// Relations
export const dungeonsRelations = relations(dungeons, ({ many }) => ({
  heroes: many(heroes),
}));

export const heroesRelations = relations(heroes, ({ one, many }) => ({
  dungeon: one(dungeons, {
    fields: [heroes.dungeonId],
    references: [dungeons.id],
  }),
  grades: many(grades),
}));

export const realmsRelations = relations(realms, ({ many }) => ({
  tomes: many(tomes),
  quests: many(quests),
}));

export const tomesRelations = relations(tomes, ({ one }) => ({
  realm: one(realms, {
    fields: [tomes.realmId],
    references: [realms.id],
  }),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
  realm: one(realms, {
    fields: [quests.realmId],
    references: [realms.id],
  }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  hero: one(heroes, {
    fields: [grades.heroId],
    references: [heroes.id],
  }),
  quest: one(quests, {
    fields: [grades.questId],
    references: [quests.id],
  }),
  realm: one(realms, {
    fields: [grades.realmId],
    references: [realms.id],
  }),
}));
