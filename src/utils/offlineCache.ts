import { ActiveQuest, QuestNotice, AncientTome } from '../types/lms';

const OFFLINE_CACHE_KEY = 'pixel_quest_offline_content_v1';

/** Cached subset of learning content persisted locally for PWA offline reading. */
export interface OfflineContentSnapshot {
  cachedAt: string;
  tomes: AncientTome[];
  quests: ActiveQuest[];
  notices: QuestNotice[];
}

/**
 * Saves sanitized Tomes (Materi), Quests (Tugas), and Notices (Pengumuman)
 * to dedicated offline storage so students and teachers can still read materials
 * when disconnected from the internet.
 */
export function saveOfflineContentSnapshot(payload: {
  tomes: AncientTome[];
  quests: ActiveQuest[];
  notices: QuestNotice[];
}): OfflineContentSnapshot | null {
  try {
    const snapshot: OfflineContentSnapshot = {
      cachedAt: new Date().toISOString(),
      tomes: Array.isArray(payload.tomes) ? payload.tomes : [],
      quests: Array.isArray(payload.quests) ? payload.quests : [],
      notices: Array.isArray(payload.notices) ? payload.notices : [],
    };
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Reads the last cached offline Tomes, Quests, and Notices snapshot if available.
 */
export function loadOfflineContentSnapshot(): OfflineContentSnapshot | null {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineContentSnapshot>;
    if (!parsed || typeof parsed.cachedAt !== 'string') return null;
    return {
      cachedAt: parsed.cachedAt,
      tomes: Array.isArray(parsed.tomes) ? parsed.tomes : [],
      quests: Array.isArray(parsed.quests) ? parsed.quests : [],
      notices: Array.isArray(parsed.notices) ? parsed.notices : [],
    };
  } catch {
    return null;
  }
}
