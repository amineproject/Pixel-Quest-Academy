import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  AtSign,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Crown,
  Eye,
  Flame,
  GraduationCap,
  KeyRound,
  Lock,
  Palette,
  Pencil,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  AcademyState,
  ActiveQuest,
  AvatarClass,
  GradeStatus,
  HeroStudent,
  PixelTheme,
} from '../../types/lms';
import { THEME_STYLES } from '../../utils/themes';
import { PixelAvatar, PixelRealmGlyph } from '../../components/PixelArt';
import { QuestCategoryBadge } from '../../components/QuestCategoryBadge';
import {
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelFieldLabel,
  PixelInput,
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import {
  ThemedAchievementCard,
  ThemedPanelCard,
  ThemedReadingSurface,
} from '../../components/ThemePrimitives';
import {
  formatChapterLabel,
  formatRetroDate,
  getDeadlineUrgency,
  getEffectiveGradeStatus,
  getHeroAchievements,
  getHeroEffectiveRealmIds,
  getHeroLevelProgress,
  getHeroTotalExp,
  isQuestAssignedToHero,
  parseTargetDungeonIds,
} from '../../utils/exp';

interface HeroLogProps {
  state: AcademyState;
  hero: HeroStudent;
  currentTheme?: PixelTheme;
  onUpdateTheme?: (theme: PixelTheme) => void;
  onUpdateAvatar?: (avatar: AvatarClass) => void;
  onUpdateUsername?: (
    username: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onChangePin?: (
    currentPin: string,
    newPin: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

const HERO_AVATAR_OPTIONS: { value: AvatarClass; label: string }[] = [
  { value: 'knight', label: 'Knight' },
  { value: 'alchemist', label: 'Alchemist' },
  { value: 'mage', label: 'Mage' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'scholar', label: 'Scholar' },
];

function renderStatusSymbol(status: GradeStatus) {
  switch (status) {
    case 'tuntas':
      return {
        label: 'Tuntas',
        badgeClass:
          'bg-emerald-100 border-emerald-700 text-emerald-900 rounded',
        iconBoxClass: 'bg-emerald-600 text-white border-[var(--border-pixel)] rounded-md',
        icon: <CheckCircle2 size={20} strokeWidth={2.75} />,
      };
    case 'proses':
      return {
        label: 'Masih Proses Dinilai',
        badgeClass:
          'bg-teal-100 border-teal-700 text-teal-900 rounded',
        iconBoxClass: 'bg-teal-600 text-white border-[var(--border-pixel)] rounded-md',
        icon: <AlertCircle size={20} strokeWidth={2.75} />,
      };
    case 'remidial':
      return {
        label: 'Remidial',
        badgeClass:
          'bg-amber-100 border-amber-700 text-amber-900 rounded',
        iconBoxClass:
          'bg-amber-400 text-[#18181b] border-[var(--border-pixel)] rounded-md',
        icon: <AlertTriangle size={20} strokeWidth={2.75} />,
      };
    case 'belum':
    default:
      return {
        label: 'Belum Dikerjakan',
        badgeClass: 'bg-rose-100 border-rose-700 text-rose-900 rounded',
        iconBoxClass: 'bg-rose-600 text-white border-[var(--border-pixel)] rounded-md',
        icon: <XCircle size={20} strokeWidth={2.75} />,
      };
  }
}

export const HeroLog: React.FC<HeroLogProps> = ({
  state,
  hero,
  currentTheme,
  onUpdateTheme,
  onUpdateAvatar,
  onUpdateUsername,
  onChangePin,
}) => {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClass>(hero.avatar);

  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState(
    (hero.username || '').slice(0, 5)
  );
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [statusRealmFilter, setStatusRealmFilter] = useState<string>('all');
  const [collapsedStatusGroups, setCollapsedStatusGroups] = useState<Record<string, boolean>>({});
  const [detailQuest, setDetailQuest] = useState<ActiveQuest | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons);
  const allowedRealmSet = allowedRealmIds ? new Set(allowedRealmIds) : null;
  const rawHeroGrades = state.grades.filter((g) => g.heroId === hero.id);

  // Strictly scope quests to this student's enrolled Realms (Mapel) and Class (Dungeon).
  // Existing grades only unlock early-scheduled visibility within enrolled subjects/classes, never unrelated subjects.
  const relevantQuests = state.quests.filter((q) => {
    const hasGrade = rawHeroGrades.some((g) => g.questId === q.id);
    return isQuestAssignedToHero(q, hero, state.dungeons, { now, hasGrade });
  });
  const relevantQuestIdSet = new Set(relevantQuests.map((q) => q.id));

  const heroGrades = rawHeroGrades.filter(
    (g) =>
      relevantQuestIdSet.has(g.questId) &&
      (!allowedRealmSet || allowedRealmSet.has(g.realmId))
  );

  // Compute summary counts by symbol status (NO numeric points/scores)
  const counts = { tuntas: 0, proses: 0, remidial: 0, belum: 0 };
  relevantQuests.forEach((q) => {
    const grade = heroGrades.find((g) => g.questId === q.id);
    const st = getEffectiveGradeStatus(grade);
    counts[st] += 1;
  });

  const enrolledRealms = allowedRealmSet
    ? state.realms.filter((realm) => allowedRealmSet.has(realm.id))
    : state.realms;

  const visibleRealms = enrolledRealms.filter((realm) =>
    relevantQuests.some((q) => q.realmId === realm.id)
  );

  const activeStatusRealmFilter =
    statusRealmFilter === 'all' ||
    visibleRealms.some((r) => r.id === statusRealmFilter)
      ? statusRealmFilter
      : 'all';

  const achievementSummary = getHeroAchievements(
    hero,
    relevantQuests,
    heroGrades,
    enrolledRealms
  );

  const renderBadgeIcon = (badgeId: string) => {
    switch (badgeId) {
      case 'first_quest':
        return <Sparkles size={18} />;
      case 'ontime_streak':
        return <Flame size={18} />;
      case 'streak_master':
        return <Zap size={18} />;
      case 'no_remidial':
        return <ShieldCheck size={18} />;
      case 'realm_explorer':
        return <Compass size={18} />;
      case 'all_rounder':
        return <Star size={18} />;
      case 'elite_slayer':
        return <Swords size={18} />;
      case 'mission_master':
        return <Trophy size={18} />;
      case 'academy_legend':
        return <Crown size={18} />;
      case 'pin_guardian':
        return <KeyRound size={18} />;
      default:
        return <Award size={18} />;
    }
  };

  const badgeToneStyles = (
    tone: 'gold' | 'cyan' | 'emerald' | 'magenta',
    unlocked: boolean
  ) => {
    if (!unlocked) {
      return {
        card: 'bg-[var(--bg-inset)] border-[var(--border-pixel)]/40 opacity-75',
        iconBox: 'bg-zinc-300 text-zinc-700 border-[var(--border-pixel)]/60',
        pill: 'bg-zinc-200 text-zinc-700 border-zinc-400',
      };
    }
    switch (tone) {
      case 'gold':
        return {
          card: 'bg-[#fff9db] border-[#09090f]',
          iconBox: 'bg-[#ffd000] text-[#09090f] border-[#09090f]',
          pill: 'bg-[#ffd000] text-[#09090f] border-[#09090f]',
        };
      case 'cyan':
        return {
          card: 'bg-[#e6fbff] border-[#09090f]',
          iconBox: 'bg-[#00d8ff] text-[#09090f] border-[#09090f]',
          pill: 'bg-[#00d8ff] text-[#09090f] border-[#09090f]',
        };
      case 'emerald':
        return {
          card: 'bg-emerald-50 border-[#09090f]',
          iconBox: 'bg-emerald-500 text-white border-[#09090f]',
          pill: 'bg-emerald-200 text-emerald-950 border-emerald-800',
        };
      case 'magenta':
        return {
          card: 'bg-pink-50 border-[#09090f]',
          iconBox: 'bg-[#e11d74] text-white border-[#09090f]',
          pill: 'bg-pink-200 text-pink-950 border-pink-800',
        };
    }
  };

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="Hero Log / Status Tugas"
        subtitle="Status tugas, lencana, PIN keamanan, avatar, dan username akun"
        action={
          (onChangePin || onUpdateAvatar || onUpdateUsername) ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {onChangePin && (
                <PixelButton
                  type="button"
                  size="sm"
                  variant={hero.hasPin ? 'neutral' : 'success'}
                  onClick={() => {
                    setCurrentPinInput('');
                    setNewPinInput('');
                    setConfirmPinInput('');
                    setPinError(null);
                    setPinModalOpen(true);
                  }}
                >
                  <KeyRound size={13} />
                  {hero.hasPin ? 'Ubah PIN' : 'Buat PIN'}
                </PixelButton>
              )}
              {onUpdateUsername && (
                <PixelButton
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setUsernameInput((hero.username || '').slice(0, 5));
                    setUsernameError(null);
                    setUsernameModalOpen(true);
                  }}
                >
                  <AtSign size={13} />
                  Username
                </PixelButton>
              )}
              {onUpdateAvatar && (
                <PixelButton
                  type="button"
                  size="sm"
                  variant="warning"
                  onClick={() => {
                    setSelectedAvatar(hero.avatar);
                    setAvatarModalOpen(true);
                  }}
                >
                  <Pencil size={13} />
                  Avatar
                </PixelButton>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Status Symbol Legend & Counters + Hero RPG Level & EXP */}
      <ThemedPanelCard className="space-y-3">
        <div className="flex items-center gap-3 pb-2 border-b border-[var(--border-pixel)]/40">
          <PixelAvatar avatar={hero.avatar} size={42} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-pixel-display text-[12px] text-[var(--text-primary)] truncate">
                {hero.name}
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-[var(--comic-gold)] border border-[var(--border-pixel)] font-pixel-ui text-[10px] font-bold text-[#09090f] shrink-0">
                Lv.{getHeroLevelProgress(getHeroTotalExp(hero.id, heroGrades)).level}
              </span>
              {hero.username ? (
                <span className="text-[11px] font-bold px-1.5 py-0.5 border border-[var(--accent-warning)]/60 bg-[var(--bg-inset)] text-[var(--accent-warning)] shrink-0">
                  @{hero.username}
                </span>
              ) : (
                <span className="text-[10.5px] px-1.5 py-0.5 border border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] text-[var(--text-muted)] shrink-0">
                  Belum ada username
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[var(--text-secondary)] truncate mt-0.5">
              {hero.heroClass} · NIS {hero.studentCode} · {relevantQuests.length} Tugas Terdaftar
            </p>
            <p className="text-[11.5px] text-[var(--text-secondary)] truncate mt-0.5">
              Mapel Diikuti:{' '}
              <strong className="text-[var(--text-primary)]">
                {allowedRealmIds
                  ? enrolledRealms.length > 0
                    ? enrolledRealms.map((r) => r.name).join(', ')
                    : 'Belum ada mapel'
                  : 'Semua Mapel'}
              </strong>
            </p>
            <p className="text-[11px] mt-0.5 flex items-center gap-1">
              <Lock size={11} className={hero.hasPin ? 'text-emerald-700' : 'text-amber-800'} />
              <span className={hero.hasPin ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-semibold'}>
                {hero.hasPin ? 'Akun Dilindungi PIN' : 'Belum Pasang PIN Rahasia'}
              </span>
            </p>
          </div>
        </div>

        {(() => {
          const lvl = getHeroLevelProgress(getHeroTotalExp(hero.id, heroGrades));
          return (
            <PixelExpBar
              percent={lvl.percent}
              labelLeft={`Lv.${lvl.level} · ${lvl.title}`}
              labelRight={`${lvl.totalExp} EXP (${lvl.expIntoLevel}/${lvl.expForNextLevel})`}
              color="var(--accent-warning)"
            />
          );
        })()}

        <div className="grid grid-cols-2 gap-2">
          <div className="pixel-box-inset p-2.5 flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 size={17} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] sm:text-[12px] font-bold text-emerald-800 leading-tight break-words">
                Tuntas ({counts.tuntas})
              </p>
              <p className="text-[10.5px] text-[var(--text-muted)] leading-tight">
                Centang Hijau
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-rose-600 text-white flex items-center justify-center">
              <XCircle size={17} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] sm:text-[12px] font-bold text-rose-800 leading-tight break-words">
                Belum ({counts.belum})
              </p>
              <p className="text-[10.5px] text-[var(--text-muted)] leading-tight">
                Silang Merah
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-teal-600 text-white flex items-center justify-center">
              <AlertCircle size={17} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] sm:text-[12px] font-bold text-teal-800 leading-tight break-words">
                Proses ({counts.proses})
              </p>
              <p className="text-[10.5px] text-[var(--text-muted)] leading-tight">
                Tanda Seru
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-amber-400 text-[#18181b] flex items-center justify-center">
              <AlertTriangle size={17} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] sm:text-[12px] font-bold text-amber-800 leading-tight break-words">
                Remidial ({counts.remidial})
              </p>
              <p className="text-[10.5px] text-[var(--text-muted)] leading-tight">
                Perlu Perbaikan
              </p>
            </div>
          </div>
        </div>
      </ThemedPanelCard>

      {/* Streak & Achievement Badges (Private Progress — No Numeric Grades) */}
      <ThemedPanelCard className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--comic-gold)] text-[#09090f] flex items-center justify-center shrink-0">
              <Flame size={17} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h3 className="font-pixel-ui text-[11.5px] sm:text-[12px] tracking-[0.02em] text-[var(--text-primary)] uppercase">
                Streak &amp; Lencana Prestasi
              </h3>
              <p className="text-[11.5px] text-[var(--text-secondary)]">
                Streak tepat waktu: <strong>{achievementSummary.streakCount}x</strong> · Tepat waktu: <strong>{achievementSummary.onTimeCount}</strong>
              </p>
            </div>
          </div>
          <span className="font-pixel-ui text-[11px] font-bold text-[var(--accent-warning)] shrink-0 tabular-nums">
            {achievementSummary.unlockedCount}/{achievementSummary.badges.length} Lencana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {achievementSummary.badges.map((badge) => {
            const tone = badgeToneStyles(badge.tone, badge.unlocked);
            return (
              <ThemedAchievementCard
                key={badge.id}
                unlocked={badge.unlocked}
                title={badge.title}
                description={badge.description}
                statusLabel={badge.unlocked ? 'Terbuka' : badge.progressLabel}
                icon={badge.unlocked ? renderBadgeIcon(badge.id) : <Lock size={16} />}
                fallbackToneClass={tone.card}
                fallbackIconClass={tone.iconBox}
              />
            );
          })}
        </div>
      </ThemedPanelCard>

      {/* Personal Theme Style & Font Switcher (Client Preference Only) */}
      {onUpdateTheme && (
        <ThemedPanelCard className="space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border-pixel)]/40">
            <span className="w-8 h-8 rounded-md border-2 border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
              <Palette size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="font-pixel-ui text-[11.5px] sm:text-[12px] tracking-[0.02em] text-[var(--text-primary)] uppercase">
                Gaya Tampilan &amp; Font Belajar
              </h3>
              <p className="text-[12px] text-[var(--text-secondary)] leading-snug">
                Pilih gaya visual, bentuk bingkai, dan jenis huruf yang paling nyaman di matamu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {THEME_STYLES.map((style) => {
              const active = (currentTheme ?? state.settings.theme) === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdateTheme(style.id)}
                  className={`p-3 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 border-2 rounded-[var(--inset-radius)] ${
                    active
                      ? 'bg-[var(--surface-tint)] border-[var(--border-pixel)] shadow-[2px_2px_0_0_var(--shadow-ink)]'
                      : 'bg-[var(--bg-inset)] border-[var(--border-pixel)]/45 hover:border-[var(--border-pixel)]'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-pixel-display text-[12px] text-[var(--text-primary)] truncate">
                        {style.label}
                      </span>
                      {active && (
                        <span className="font-pixel-ui text-[9.5px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)] text-[var(--text-on-accent)] shrink-0">
                          AKTIF
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--accent-warning)] truncate">
                      {style.fontLabel}
                    </p>
                    <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug">
                      {style.tagline}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {style.previewColors.map((hex) => (
                      <span
                        key={hex}
                        className="w-3.5 h-3.5 rounded-sm border border-[var(--border-pixel)]"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </ThemedPanelCard>
      )}

      {/* Status & Penilaian Grouped By Mapel & Kelas (Symbols Only) */}
      <section className="space-y-3">
        <PixelSectionTitle
          title="Penilaian per Mapel & Kelas"
          subtitle="Rekap status tugas dikelompokkan berdasarkan kelas dan mata pelajaran"
        />

        {visibleRealms.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pixel-scroll">
              <button
                type="button"
                onClick={() => setStatusRealmFilter('all')}
                className={`pixel-btn min-h-[34px] px-2.5 font-pixel-ui text-[9.5px] whitespace-nowrap shrink-0 cursor-pointer ${
                  activeStatusRealmFilter === 'all'
                    ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                }`}
              >
                Semua Mapel ({relevantQuests.length})
              </button>
              {visibleRealms.map((r) => {
                const count = relevantQuests.filter((q) => q.realmId === r.id).length;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setStatusRealmFilter(r.id)}
                    className={`pixel-btn min-h-[34px] px-2.5 font-pixel-ui text-[9.5px] whitespace-nowrap shrink-0 cursor-pointer ${
                      activeStatusRealmFilter === r.id
                        ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {r.code} ({count})
                  </button>
                );
              })}
          </div>
        )}

        {(() => {
          const filteredQuestsForStatus = relevantQuests.filter(
            (q) =>
              activeStatusRealmFilter === 'all' ||
              q.realmId === activeStatusRealmFilter
          );

          if (filteredQuestsForStatus.length === 0) {
            return (
              <PixelEmptyChest
                title="Belum Ada Tugas!"
                description="Belum ada tugas atau quest yang ditugaskan untuk kelas dan mapel kamu."
              />
            );
          }

          const heroDungeon = state.dungeons.find((d) => d.id === hero.dungeonId);

          const resolveQuestClassInfo = (q: ActiveQuest) => {
            const targetIds = parseTargetDungeonIds(q.dungeonId);
            if (targetIds.length > 0) {
              const preferredId =
                hero.dungeonId && targetIds.includes(hero.dungeonId)
                  ? hero.dungeonId
                  : targetIds[0];
              const specific = state.dungeons.find((d) => d.id === preferredId);
              if (specific) {
                return {
                  key: specific.id,
                  code: specific.guildCode,
                  label: `${specific.guildCode} — ${specific.name}`,
                  tier: specific.tier,
                  scope:
                    targetIds.length > 1
                      ? `Khusus ${targetIds.length} Kelas`
                      : 'Khusus Kelas',
                };
              }
            }
            if (heroDungeon) {
              return {
                key: heroDungeon.id,
                code: heroDungeon.guildCode,
                label: `${heroDungeon.guildCode} — ${heroDungeon.name}`,
                tier: heroDungeon.tier,
                scope: targetIds.length === 0 ? 'Lintas Kelas' : 'Kelas Aktif',
              };
            }
            return {
              key: '__all__',
              code: 'UMUM',
              label: 'Semua Kelas',
              tier: '',
              scope: 'Umum',
            };
          };

          const renderStatusRow = (quest: ActiveQuest, scopeBadge?: string) => {
            const grade = heroGrades.find((g) => g.questId === quest.id);
            const status = getEffectiveGradeStatus(grade);
            const ui = renderStatusSymbol(status);

            return (
              <div
                key={quest.id}
                className="pixel-box-inset p-3 flex items-start justify-between gap-3 overflow-hidden"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailQuest(quest)}
                      className="text-left text-[13.5px] font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] leading-snug break-words cursor-pointer"
                    >
                      {quest.title}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 border ${ui.badgeClass}`}
                    >
                      {ui.label}
                    </span>
                    <QuestCategoryBadge category={quest.category} compact />
                    {quest.chapter?.trim() && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.5 border border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)]">
                        {formatChapterLabel(quest.chapter)}
                      </span>
                    )}
                    {scopeBadge && (
                      <span className="text-[10.5px] font-semibold px-1.5 py-0.5 border border-[var(--border-pixel)]/40 bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                        {scopeBadge}
                      </span>
                    )}
                    <span className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                      {grade?.gradedDate
                        ? `Diperbarui ${formatRetroDate(grade.gradedDate)}`
                        : `Batas: ${formatRetroDate(quest.deadline)}`}
                    </span>
                  </div>
                  {grade?.feedback && (
                    <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed pt-0.5 break-words">
                      Catatan Guru: {grade.feedback}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDetailQuest(quest)}
                    aria-label={`Lihat instruksi ${quest.title}`}
                    title="Lihat instruksi tugas"
                    className="pixel-btn min-w-[36px] min-h-[36px] flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer"
                  >
                    <Eye size={15} />
                  </button>
                  <div
                    className={`w-10 h-10 shrink-0 border-2 flex items-center justify-center ${ui.iconBoxClass}`}
                    title={ui.label}
                    aria-label={ui.label}
                  >
                    {ui.icon}
                  </div>
                </div>
              </div>
            );
          };

          // Group by Kelas -> Mapel
          const classBuckets = new Map<
            string,
            {
              key: string;
              code: string;
              label: string;
              tier: string;
              quests: ActiveQuest[];
            }
          >();
          filteredQuestsForStatus.forEach((q) => {
            const info = resolveQuestClassInfo(q);
            const existing = classBuckets.get(info.key);
            if (existing) {
              existing.quests.push(q);
            } else {
              classBuckets.set(info.key, {
                key: info.key,
                code: info.code,
                label: info.label,
                tier: info.tier,
                quests: [q],
              });
            }
          });

          return Array.from(classBuckets.values()).map((cls) => {
            const classTuntas = cls.quests.filter(
              (q) =>
                getEffectiveGradeStatus(
                  heroGrades.find((g) => g.questId === q.id)
                ) === 'tuntas'
            ).length;
            const realmsInClass = state.realms.filter((r) =>
              cls.quests.some((q) => q.realmId === r.id)
            );

            return (
              <ThemedPanelCard key={cls.key} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GraduationCap
                      size={17}
                      className="text-[var(--accent-primary)] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-pixel-ui text-[10px] px-1.5 py-0.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)]">
                          {cls.code}
                        </span>
                        <h3 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
                          {cls.label}
                        </h3>
                        {cls.tier && (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            ({cls.tier})
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                        {realmsInClass.length} Mapel · {classTuntas}/{cls.quests.length} Tugas Tuntas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {realmsInClass.map((realm) => {
                    const realmQuests = cls.quests.filter(
                      (q) => q.realmId === realm.id
                    );
                    const groupKey = `${cls.key}::${realm.id}`;
                    const isCollapsed = Boolean(collapsedStatusGroups[groupKey]);
                    const tuntasInRealm = realmQuests.filter(
                      (q) =>
                        getEffectiveGradeStatus(
                          heroGrades.find((g) => g.questId === q.id)
                        ) === 'tuntas'
                    ).length;

                    return (
                      <div
                        key={groupKey}
                        className="pixel-box-inset p-2.5 sm:p-3 space-y-2.5 border border-[var(--border-pixel)]/50 bg-[var(--bg-inset)]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedStatusGroups((prev) => ({
                              ...prev,
                              [groupKey]: !prev[groupKey],
                            }))
                          }
                          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <PixelRealmGlyph
                              icon={realm.icon}
                              color={realm.accentColor}
                              size={22}
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">
                                {realm.code} — {realm.name}
                              </h4>
                              <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                                {tuntasInRealm}/{realmQuests.length} Tuntas
                              </p>
                            </div>
                          </div>
                          <span className="text-[var(--text-secondary)] shrink-0">
                            {isCollapsed ? (
                              <ChevronRight size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-2">
                            {realmQuests.map((quest) => {
                              const info = resolveQuestClassInfo(quest);
                              return renderStatusRow(quest, info.scope);
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ThemedPanelCard>
            );
          });
        })()}
      </section>

      {/* Quest Instruction Detail Pop-Up Modal */}
      <PixelModal
        open={Boolean(detailQuest)}
        title={detailQuest ? detailQuest.title : ''}
        onClose={() => setDetailQuest(null)}
      >
        {detailQuest && (() => {
          const realm = state.realms.find((r) => r.id === detailQuest.realmId);
          const grade = heroGrades.find((g) => g.questId === detailQuest.id);
          const status = getEffectiveGradeStatus(grade);
          const ui = renderStatusSymbol(status);
          const urgency = getDeadlineUrgency(detailQuest.deadline);
          return (
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-[var(--accent-warning)] break-words">
                  {realm?.code} — {realm?.name} · [{detailQuest.difficulty.toUpperCase()}]
                </p>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 border ${ui.badgeClass}`}
                >
                  {ui.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <QuestCategoryBadge category={detailQuest.category} showDescription />
                {detailQuest.chapter?.trim() && (
                  <span className="px-2 py-0.5 text-[11px] font-bold border border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)]">
                    Bab / Teks: {formatChapterLabel(detailQuest.chapter)}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[var(--text-muted)] tabular-nums">
                Tenggat: {formatRetroDate(detailQuest.deadline)} ({urgency.label})
              </p>
              {detailQuest.description?.trim() && (
                <div className="pixel-box-inset p-2.5 space-y-1 bg-[var(--bg-inset)]">
                  <p className="font-pixel-ui text-[9.5px] uppercase text-[var(--accent-primary)]">
                    Deskripsi Misi
                  </p>
                  <p className="text-[13.5px] text-[var(--text-primary)] leading-relaxed whitespace-pre-line break-words">
                    {detailQuest.description}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="font-pixel-ui text-[9.5px] uppercase text-[var(--accent-warning)]">
                  Objek Misi / Instruksi Tugas
                </p>
                <ThemedReadingSurface>
                  {detailQuest.instructions}
                </ThemedReadingSurface>
              </div>
              {grade?.feedback && (
                <div className="pixel-box-inset p-2.5 text-[12.5px] text-[var(--text-primary)]">
                  <strong>Catatan Guru:</strong> {grade.feedback}
                </div>
              )}
              {detailQuest.linkUrl && (
                <PixelLinkButton
                  url={detailQuest.linkUrl}
                  label="Buka Tautan Tugas"
                />
              )}
              <PixelButton
                type="button"
                variant="primary"
                fullWidth
                onClick={() => setDetailQuest(null)}
              >
                Tutup
              </PixelButton>
            </div>
          );
        })()}
      </PixelModal>

      {/* Student Avatar Picker Modal */}
      {onUpdateAvatar && (
        <PixelModal
          open={avatarModalOpen}
          title="Pilih Avatar Hero"
          onClose={() => setAvatarModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Pilih karakter avatar pixel yang kamu sukai:
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {HERO_AVATAR_OPTIONS.map((item) => {
                const active = selectedAvatar === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedAvatar(item.value)}
                    className={`p-2.5 flex flex-col items-center justify-center gap-1.5 border-2 cursor-pointer transition-all ${
                      active
                        ? 'border-[var(--accent-warning)] bg-[var(--bg-surface-alt)] shadow-sm scale-105'
                        : 'border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <PixelAvatar avatar={item.value} size={42} />
                    <span className="font-pixel-ui text-[10px] text-[var(--text-primary)] leading-tight text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <PixelButton
                type="button"
                variant="neutral"
                onClick={() => setAvatarModalOpen(false)}
              >
                Batal
              </PixelButton>
              <PixelButton
                type="button"
                variant="success"
                onClick={() => {
                  onUpdateAvatar(selectedAvatar);
                  setAvatarModalOpen(false);
                }}
              >
                Simpan Avatar
              </PixelButton>
            </div>
          </div>
        </PixelModal>
      )}
      {/* Student Username Picker Modal (Max 5 Characters) */}
      {onUpdateUsername && (
        <PixelModal
          open={usernameModalOpen}
          title="Edit Username Hero"
          onClose={() => setUsernameModalOpen(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setUsernameError(null);
              const clean = usernameInput.trim().replace(/\s+/g, '').toLowerCase();
              if (clean.length < 1) {
                setUsernameError('Masukkan username (1–5 karakter).');
                return;
              }
              if (clean.length > 5) {
                setUsernameError('Username maksimal hanya 5 karakter!');
                return;
              }
              setIsSavingUsername(true);
              const res = await onUpdateUsername(clean);
              setIsSavingUsername(false);
              if (!res.ok) {
                setUsernameError(res.error || 'Gagal menyimpan username.');
                return;
              }
              setUsernameModalOpen(false);
            }}
            autoComplete="off"
            className="space-y-3"
          >
            <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
              Buat <strong>username singkat maksimal 5 karakter</strong> (tanpa spasi). Gunakan kata yang sopan karena Admin berhak menghapus username yang tidak pantas.
            </p>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <PixelFieldLabel htmlFor="hero-edit-username">
                  Username Baru (Maks. 5 Karakter)
                </PixelFieldLabel>
                <span
                  className={`font-pixel-ui text-[10px] tabular-nums ${
                    usernameInput.length >= 5
                      ? 'text-[var(--accent-warning)] font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {usernameInput.length}/5
                </span>
              </div>
              <PixelInput
                id="hero-edit-username"
                maxLength={5}
                autoComplete="off"
                required
                placeholder="Contoh: rian5"
                value={usernameInput}
                onChange={(e) => {
                  const sanitized = e.target.value
                    .replace(/\s+/g, '')
                    .toLowerCase()
                    .slice(0, 5);
                  setUsernameInput(sanitized);
                  if (usernameError) setUsernameError(null);
                }}
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Login tetap bisa menggunakan NIS (<strong>{hero.studentCode}</strong>) atau username baru ini.
              </p>
            </div>

            {usernameError && (
              <p className="text-[12.5px] font-semibold text-[var(--accent-danger)]">
                [!] {usernameError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <PixelButton
                type="button"
                variant="neutral"
                onClick={() => setUsernameModalOpen(false)}
              >
                Batal
              </PixelButton>
              <PixelButton type="submit" variant="success" disabled={isSavingUsername}>
                {isSavingUsername ? 'Menyimpan...' : 'Simpan Username'}
              </PixelButton>
            </div>
          </form>
        </PixelModal>
      )}

      {/* Student Self-Service Secret PIN Modal */}
      {onChangePin && (
        <PixelModal
          open={pinModalOpen}
          title={hero.hasPin ? 'Ubah PIN Rahasia' : 'Buat PIN Rahasia Siswa'}
          onClose={() => setPinModalOpen(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPinError(null);
              const trimmedNew = newPinInput.trim();
              if (trimmedNew.length < 4) {
                setPinError('PIN baru minimal 4 karakter/angka.');
                return;
              }
              if (trimmedNew !== confirmPinInput.trim()) {
                setPinError('Konfirmasi PIN baru tidak cocok!');
                return;
              }
              setIsSavingPin(true);
              const res = await onChangePin(currentPinInput.trim(), trimmedNew);
              setIsSavingPin(false);
              if (!res.ok) {
                setPinError(res.error || 'Gagal menyimpan PIN.');
                return;
              }
              setPinModalOpen(false);
            }}
            autoComplete="off"
            className="space-y-3"
          >
            <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
              Dengan memasang <strong>PIN Rahasia</strong>, teman sekelas yang mengetahui NIS atau Username kamu tidak dapat membuka akunmu dari perangkat lain.
            </p>

            {hero.hasPin && (
              <div>
                <PixelFieldLabel htmlFor="hero-cur-pin">PIN Saat Ini</PixelFieldLabel>
                <PixelInput
                  id="hero-cur-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  required
                  placeholder="Masukkan PIN saat ini..."
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                />
              </div>
            )}

            <div>
              <PixelFieldLabel htmlFor="hero-new-pin">PIN Baru (4–12 Angka/Karakter)</PixelFieldLabel>
              <PixelInput
                id="hero-new-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={12}
                required
                placeholder="Contoh: 123456"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
              />
            </div>

            <div>
              <PixelFieldLabel htmlFor="hero-conf-pin">Ulangi PIN Baru</PixelFieldLabel>
              <PixelInput
                id="hero-conf-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={12}
                required
                placeholder="Ketik ulang PIN baru..."
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
              />
            </div>

            {pinError && (
              <p className="text-[12.5px] font-semibold text-[var(--accent-danger)]">
                [!] {pinError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <PixelButton
                type="button"
                variant="neutral"
                onClick={() => setPinModalOpen(false)}
              >
                Batal
              </PixelButton>
              <PixelButton type="submit" variant="success" disabled={isSavingPin}>
                {isSavingPin ? 'Menyimpan...' : 'Simpan PIN'}
              </PixelButton>
            </div>
          </form>
        </PixelModal>
      )}
    </div>
  );
};
