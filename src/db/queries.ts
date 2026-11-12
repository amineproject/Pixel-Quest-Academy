import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  dungeons,
  grades,
  heroes,
  notices,
  quests,
  realms,
  settings,
  tomes,
  users,
} from './schema.ts';
import { INITIAL_ACADEMY_STATE } from '../data/seedData.ts';
import {
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
} from '../types/lms.ts';

export async function seedInitialDataIfEmpty() {
  try {
    const existingDungeons = await db.select().from(dungeons);
    if (existingDungeons.length === 0) {
      console.log('Seeding initial Cloud SQL data for Pixel Quest Academy...');

      // 1. Dungeons
      for (const d of INITIAL_ACADEMY_STATE.dungeons) {
        await db.insert(dungeons).values({
          id: d.id,
          name: d.name,
          tier: d.tier,
          guildCode: d.guildCode,
          capacity: d.capacity,
          description: d.description,
        });
      }

      // 2. Heroes
      for (const h of INITIAL_ACADEMY_STATE.heroes) {
        await db.insert(heroes).values({
          id: h.id,
          name: h.name,
          username: h.username,
          studentCode: h.studentCode,
          dungeonId: h.dungeonId,
          avatar: h.avatar,
          heroClass: h.heroClass,
          active: h.active,
          joinedDate: h.joinedDate,
        });
      }

      // 3. Realms
      for (const r of INITIAL_ACADEMY_STATE.realms) {
        await db.insert(realms).values({
          id: r.id,
          name: r.name,
          code: r.code,
          icon: r.icon,
          accentColor: r.accentColor,
          description: r.description,
        });
      }

      // 4. Tomes
      for (const t of INITIAL_ACADEMY_STATE.tomes) {
        await db.insert(tomes).values({
          id: t.id,
          realmId: t.realmId,
          title: t.title,
          chapter: t.chapter,
          readMinutes: t.readMinutes,
          summary: t.summary,
          content: t.content,
          publishedDate: t.publishedDate,
        });
      }

      // 5. Quests
      for (const q of INITIAL_ACADEMY_STATE.quests) {
        await db.insert(quests).values({
          id: q.id,
          realmId: q.realmId,
          dungeonId: q.dungeonId,
          title: q.title,
          instructions: q.instructions,
          deadline: q.deadline,
          maxExp: q.maxExp,
          difficulty: q.difficulty,
        });
      }

      // 6. Notices
      for (const n of INITIAL_ACADEMY_STATE.notices) {
        await db.insert(notices).values({
          id: n.id,
          title: n.title,
          description: n.description,
          priority: n.priority,
          targetDungeonId: n.targetDungeonId,
          releaseDate: n.releaseDate,
          author: n.author,
        });
      }

      // 7. Grades
      for (const g of INITIAL_ACADEMY_STATE.grades) {
        await db.insert(grades).values({
          id: g.id,
          heroId: g.heroId,
          questId: g.questId,
          realmId: g.realmId,
          score: g.score,
          expEarned: g.expEarned,
          feedback: g.feedback,
          gradedDate: g.gradedDate,
        });
      }

      // 8. Settings
      await db.insert(settings).values({
        id: 'global',
        theme: INITIAL_ACADEMY_STATE.settings.theme,
        crtScanlines: INITIAL_ACADEMY_STATE.settings.crtScanlines,
        soundEnabled: INITIAL_ACADEMY_STATE.settings.soundEnabled,
        academicTerm: INITIAL_ACADEMY_STATE.settings.academicTerm,
        gmName: INITIAL_ACADEMY_STATE.gmProfile.name,
        gmTitle: INITIAL_ACADEMY_STATE.gmProfile.title,
        gmSpecialty: INITIAL_ACADEMY_STATE.gmProfile.specialty,
        gmAvatar: INITIAL_ACADEMY_STATE.gmProfile.avatar,
      });

      console.log('Seeding completed successfully!');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

export async function getAllAcademyData() {
  try {
    const [
      dungeonsList,
      heroesList,
      noticesList,
      realmsList,
      tomesList,
      questsList,
      gradesList,
      settingsRow,
    ] = await Promise.all([
      db.select().from(dungeons),
      db.select().from(heroes),
      db.select().from(notices),
      db.select().from(realms),
      db.select().from(tomes),
      db.select().from(quests),
      db.select().from(grades),
      db.select().from(settings).limit(1),
    ]);

    const s = settingsRow[0] || {
      theme: 'sunny_quest',
      crtScanlines: false,
      soundEnabled: true,
      academicTerm: 'Semester Ganjil 2026/2027',
      gmName: 'Pak Budi Santoso',
      gmTitle: 'Guild Master of Science',
      gmSpecialty: 'Guru IPA & Pembina Sains',
      gmAvatar: 'guild_master',
    };

    return {
      gmProfile: {
        name: s.gmName,
        title: s.gmTitle,
        specialty: s.gmSpecialty,
        avatar: s.gmAvatar as any,
      },
      settings: {
        theme: s.theme as PixelTheme,
        crtScanlines: s.crtScanlines,
        soundEnabled: s.soundEnabled,
        academicTerm: s.academicTerm,
      },
      dungeons: dungeonsList.map((d) => {
        let rIds: string[] = [];
        try {
          if (d.realmIds) rIds = JSON.parse(d.realmIds);
        } catch {}
        return {
          id: d.id,
          name: d.name,
          tier: d.tier,
          guildCode: d.guildCode,
          capacity: d.capacity,
          description: d.description || '',
          realmIds: rIds,
        };
      }),
      heroes: heroesList.map((h) => {
        let erIds: string[] = [];
        try {
          if (h.enrolledRealmIds) erIds = JSON.parse(h.enrolledRealmIds);
        } catch {}
        return {
          id: h.id,
          name: h.name,
          username: h.username,
          studentCode: h.studentCode,
          dungeonId: h.dungeonId || '',
          avatar: h.avatar as any,
          heroClass: h.heroClass,
          active: h.active,
          joinedDate: h.joinedDate,
          enrolledRealmIds: erIds,
        };
      }),
      notices: noticesList.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        priority: n.priority as any,
        targetDungeonId: n.targetDungeonId,
        releaseDate: n.releaseDate,
        author: n.author,
      })),
      realms: realmsList.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        icon: r.icon as any,
        accentColor: r.accentColor,
        description: r.description || '',
      })),
      tomes: tomesList.map((t) => ({
        id: t.id,
        realmId: t.realmId || '',
        title: t.title,
        chapter: t.chapter,
        readMinutes: t.readMinutes,
        summary: t.summary,
        content: t.content,
        publishedDate: t.publishedDate,
      })),
      quests: questsList.map((q) => ({
        id: q.id,
        realmId: q.realmId || '',
        dungeonId: q.dungeonId,
        title: q.title,
        instructions: q.instructions,
        deadline: q.deadline,
        maxExp: q.maxExp,
        difficulty: q.difficulty as any,
      })),
      grades: gradesList.map((g) => ({
        id: g.id,
        heroId: g.heroId || '',
        questId: g.questId || '',
        realmId: g.realmId || '',
        score: g.score,
        expEarned: g.expEarned,
        feedback: g.feedback || '',
        gradedDate: g.gradedDate,
      })),
    };
  } catch (error) {
    console.error('Failed to get all academy data:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

// Dungeons CRUD
export async function upsertDungeon(d: Dungeon) {
  try {
    const realmIdsJson = d.realmIds ? JSON.stringify(d.realmIds) : '[]';
    return await db
      .insert(dungeons)
      .values({
        id: d.id,
        name: d.name,
        tier: d.tier,
        guildCode: d.guildCode,
        capacity: d.capacity,
        description: d.description,
        realmIds: realmIdsJson,
      })
      .onConflictDoUpdate({
        target: dungeons.id,
        set: {
          name: d.name,
          tier: d.tier,
          guildCode: d.guildCode,
          capacity: d.capacity,
          description: d.description,
          realmIds: realmIdsJson,
        },
      });
  } catch (error) {
    console.error('Failed to upsert dungeon:', error);
    throw new Error('Failed to save dungeon.', { cause: error });
  }
}

export async function deleteDungeon(id: string) {
  try {
    await db.update(heroes).set({ dungeonId: null }).where(eq(heroes.dungeonId, id));
    await db.delete(notices).where(eq(notices.targetDungeonId, id));
    return await db.delete(dungeons).where(eq(dungeons.id, id));
  } catch (error) {
    console.error('Failed to delete dungeon:', error);
    throw new Error('Failed to delete dungeon.', { cause: error });
  }
}

// Heroes CRUD
export async function upsertHero(h: HeroStudent) {
  try {
    let validDungeonId: string | null = null;
    const rawDungeonId = h.dungeonId?.trim();
    if (rawDungeonId && rawDungeonId !== '' && rawDungeonId !== 'none') {
      const dExists = await db
        .select({ id: dungeons.id })
        .from(dungeons)
        .where(eq(dungeons.id, rawDungeonId))
        .limit(1);
      if (dExists.length > 0) {
        validDungeonId = rawDungeonId;
      }
    }

    const enrolledJson = h.enrolledRealmIds ? JSON.stringify(h.enrolledRealmIds) : '[]';

    return await db
      .insert(heroes)
      .values({
        id: h.id,
        name: h.name,
        username: h.username,
        studentCode: h.studentCode,
        dungeonId: validDungeonId,
        avatar: h.avatar || 'knight',
        heroClass: h.heroClass || 'Arcane Knight',
        active: h.active ?? true,
        joinedDate: h.joinedDate || new Date().toISOString().slice(0, 10),
        enrolledRealmIds: enrolledJson,
      })
      .onConflictDoUpdate({
        target: heroes.id,
        set: {
          name: h.name,
          username: h.username,
          studentCode: h.studentCode,
          dungeonId: validDungeonId,
          avatar: h.avatar || 'knight',
          heroClass: h.heroClass || 'Arcane Knight',
          active: h.active ?? true,
          enrolledRealmIds: enrolledJson,
        },
      });
  } catch (error) {
    console.error('Failed to upsert hero:', error);
    throw new Error('Failed to save hero.', { cause: error });
  }
}

export async function deleteHero(id: string) {
  try {
    await db.delete(grades).where(eq(grades.heroId, id));
    return await db.delete(heroes).where(eq(heroes.id, id));
  } catch (error) {
    console.error('Failed to delete hero:', error);
    throw new Error('Failed to delete hero.', { cause: error });
  }
}

// Notices CRUD
export async function upsertNotice(n: QuestNotice) {
  try {
    return await db
      .insert(notices)
      .values({
        id: n.id,
        title: n.title,
        description: n.description,
        priority: n.priority,
        targetDungeonId: n.targetDungeonId,
        releaseDate: n.releaseDate,
        author: n.author,
      })
      .onConflictDoUpdate({
        target: notices.id,
        set: {
          title: n.title,
          description: n.description,
          priority: n.priority,
          targetDungeonId: n.targetDungeonId,
          releaseDate: n.releaseDate,
        },
      });
  } catch (error) {
    console.error('Failed to upsert notice:', error);
    throw new Error('Failed to save notice.', { cause: error });
  }
}

export async function deleteNotice(id: string) {
  try {
    return await db.delete(notices).where(eq(notices.id, id));
  } catch (error) {
    console.error('Failed to delete notice:', error);
    throw new Error('Failed to delete notice.', { cause: error });
  }
}

// Realms CRUD
export async function upsertRealm(r: Realm) {
  try {
    return await db
      .insert(realms)
      .values({
        id: r.id,
        name: r.name,
        code: r.code,
        icon: r.icon,
        accentColor: r.accentColor,
        description: r.description,
      })
      .onConflictDoUpdate({
        target: realms.id,
        set: {
          name: r.name,
          code: r.code,
          icon: r.icon,
          accentColor: r.accentColor,
          description: r.description,
        },
      });
  } catch (error) {
    console.error('Failed to upsert realm:', error);
    throw new Error('Failed to save realm.', { cause: error });
  }
}

export async function deleteRealm(id: string) {
  try {
    await db.delete(grades).where(eq(grades.realmId, id));
    await db.delete(tomes).where(eq(tomes.realmId, id));
    await db.delete(quests).where(eq(quests.realmId, id));
    return await db.delete(realms).where(eq(realms.id, id));
  } catch (error) {
    console.error('Failed to delete realm:', error);
    throw new Error('Failed to delete realm.', { cause: error });
  }
}

// Tomes CRUD
export async function upsertTome(t: AncientTome) {
  try {
    return await db
      .insert(tomes)
      .values({
        id: t.id,
        realmId: t.realmId,
        title: t.title,
        chapter: t.chapter,
        readMinutes: t.readMinutes,
        summary: t.summary,
        content: t.content,
        publishedDate: t.publishedDate,
      })
      .onConflictDoUpdate({
        target: tomes.id,
        set: {
          realmId: t.realmId,
          title: t.title,
          chapter: t.chapter,
          readMinutes: t.readMinutes,
          summary: t.summary,
          content: t.content,
        },
      });
  } catch (error) {
    console.error('Failed to upsert tome:', error);
    throw new Error('Failed to save tome.', { cause: error });
  }
}

export async function deleteTome(id: string) {
  try {
    return await db.delete(tomes).where(eq(tomes.id, id));
  } catch (error) {
    console.error('Failed to delete tome:', error);
    throw new Error('Failed to delete tome.', { cause: error });
  }
}

// Quests CRUD
export async function upsertQuest(q: ActiveQuest) {
  try {
    return await db
      .insert(quests)
      .values({
        id: q.id,
        realmId: q.realmId,
        dungeonId: q.dungeonId,
        title: q.title,
        instructions: q.instructions,
        deadline: q.deadline,
        maxExp: q.maxExp,
        difficulty: q.difficulty,
      })
      .onConflictDoUpdate({
        target: quests.id,
        set: {
          realmId: q.realmId,
          dungeonId: q.dungeonId,
          title: q.title,
          instructions: q.instructions,
          deadline: q.deadline,
          maxExp: q.maxExp,
          difficulty: q.difficulty,
        },
      });
  } catch (error) {
    console.error('Failed to upsert quest:', error);
    throw new Error('Failed to save quest.', { cause: error });
  }
}

export async function deleteQuest(id: string) {
  try {
    await db.delete(grades).where(eq(grades.questId, id));
    return await db.delete(quests).where(eq(quests.id, id));
  } catch (error) {
    console.error('Failed to delete quest:', error);
    throw new Error('Failed to delete quest.', { cause: error });
  }
}

// Grades
export async function upsertGrade(g: ExpGrade) {
  try {
    return await db
      .insert(grades)
      .values({
        id: g.id,
        heroId: g.heroId,
        questId: g.questId,
        realmId: g.realmId,
        score: g.score,
        expEarned: g.expEarned,
        feedback: g.feedback,
        gradedDate: g.gradedDate,
      })
      .onConflictDoUpdate({
        target: grades.id,
        set: {
          score: g.score,
          expEarned: g.expEarned,
          feedback: g.feedback,
          gradedDate: g.gradedDate,
        },
      });
  } catch (error) {
    console.error('Failed to upsert grade:', error);
    throw new Error('Failed to save grade.', { cause: error });
  }
}

// Settings
export async function updateSystemSettings(
  set: Partial<SystemSettings>,
  gm?: Partial<GameMasterProfile>
) {
  try {
    const updatePayload: Record<string, any> = {};
    if (set.theme !== undefined) updatePayload.theme = set.theme;
    if (set.crtScanlines !== undefined) updatePayload.crtScanlines = set.crtScanlines;
    if (set.soundEnabled !== undefined) updatePayload.soundEnabled = set.soundEnabled;
    if (set.academicTerm !== undefined) updatePayload.academicTerm = set.academicTerm;
    if (gm?.name !== undefined) updatePayload.gmName = gm.name;
    if (gm?.title !== undefined) updatePayload.gmTitle = gm.title;
    if (gm?.specialty !== undefined) updatePayload.gmSpecialty = gm.specialty;
    if (gm?.avatar !== undefined) updatePayload.gmAvatar = gm.avatar;

    return await db
      .insert(settings)
      .values({
        id: 'global',
        theme: set.theme || 'sunny_quest',
        crtScanlines: set.crtScanlines ?? false,
        soundEnabled: set.soundEnabled ?? true,
        academicTerm: set.academicTerm || 'Semester Ganjil 2026/2027',
        gmName: gm?.name || 'Pak Budi Santoso',
        gmTitle: gm?.title || 'Guild Master of Science',
        gmSpecialty: gm?.specialty || 'Guru IPA & Pembina Sains',
        gmAvatar: gm?.avatar || 'guild_master',
      })
      .onConflictDoUpdate({
        target: settings.id,
        set: updatePayload,
      });
  } catch (error) {
    console.error('Failed to update system settings:', error);
    throw new Error('Failed to update settings.', { cause: error });
  }
}

// User helper
export async function getOrCreateUser(uid: string, email: string, role = 'student') {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        role,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Failed to process user authentication.', { cause: error });
  }
}
