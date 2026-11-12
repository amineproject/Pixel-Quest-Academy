export enum UserRole {
  GAME_MASTER = 'admin',
  HERO = 'student',
}

export type GmMenuId =
  | 'hq'
  | 'dungeons'
  | 'heroes'
  | 'quest_board'
  | 'realms'
  | 'scrolls'
  | 'active_quests'
  | 'exp_loot'
  | 'settings';

export type HeroMenuId =
  | 'notice'
  | 'scroll_library'
  | 'my_guild'
  | 'hero_log';

export type PixelTheme =
  | 'sunny_quest'
  | 'daylight_rpg'
  | 'nes_classic'
  | 'gameboy_green'
  | 'cyber_retro';

export interface AuthSession {
  isLoggedIn: boolean;
  role: UserRole;
  heroId?: string;
}

export type AvatarClass =
  | 'knight'
  | 'mage'
  | 'alchemist'
  | 'ranger'
  | 'scholar'
  | 'guild_master';

export type RealmIconType =
  | 'flask'
  | 'compass'
  | 'leaf'
  | 'book'
  | 'bolt';

export type NoticePriority = 'Low' | 'Medium' | 'Critical';

export type QuestDifficulty = 'Normal' | 'Elite' | 'Boss';

export interface GameMasterProfile {
  name: string;
  title: string;
  specialty: string;
  avatar: AvatarClass;
  username?: string;
  password?: string;
  requirePassword?: boolean;
}

export interface Dungeon {
  id: string;
  name: string;
  tier: string; // e.g., "Kelas X", "Kelas XI", "Kelas XII", "Kelas 5 SD"
  guildCode: string;
  capacity: number;
  description: string;
  realmIds?: string[]; // Mata pelajaran yang dibuka di kelas ini
}

export interface HeroStudent {
  id: string;
  name: string;
  username: string;
  studentCode: string;
  dungeonId: string;
  avatar: AvatarClass;
  heroClass: string;
  active: boolean;
  joinedDate: string;
  enrolledRealmIds?: string[]; // Mata pelajaran yang diikuti oleh siswa ini
}

export interface QuestNotice {
  id: string;
  title: string;
  description: string;
  priority: NoticePriority;
  targetDungeonId: string; // 'all' or specific dungeonId
  releaseDate: string; // YYYY-MM-DD
  author: string;
}

export interface Realm {
  id: string;
  name: string;
  code: string;
  icon: RealmIconType;
  accentColor: string;
  description: string;
}

export interface AncientTome {
  id: string;
  realmId: string;
  title: string;
  chapter: number;
  readMinutes: number;
  summary: string;
  content: string;
  publishedDate: string;
}

export interface ActiveQuest {
  id: string;
  realmId: string;
  dungeonId: string; // 'all' or specific dungeonId
  title: string;
  instructions: string;
  deadline: string;
  maxExp: number;
  difficulty: QuestDifficulty;
}

export type GradeStatus = 'tuntas' | 'belum' | 'proses' | 'remidial';

export interface ExpGrade {
  id: string;
  heroId: string;
  questId: string;
  realmId: string;
  score: number; // 0 - 100
  expEarned: number;
  status?: GradeStatus;
  feedback: string;
  gradedDate: string;
}

export interface SystemSettings {
  theme: PixelTheme;
  crtScanlines: boolean;
  soundEnabled: boolean;
  academicTerm: string;
}

export interface AcademyState {
  gmProfile: GameMasterProfile;
  settings: SystemSettings;
  dungeons: Dungeon[];
  heroes: HeroStudent[];
  notices: QuestNotice[];
  realms: Realm[];
  tomes: AncientTome[];
  quests: ActiveQuest[];
  grades: ExpGrade[];
}
