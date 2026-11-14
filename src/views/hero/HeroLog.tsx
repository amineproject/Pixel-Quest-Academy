import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  AtSign,
  Award,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
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
  AvatarClass,
  GradeStatus,
  HeroStudent,
  PixelTheme,
} from '../../types/lms';
import { THEME_STYLES } from '../../utils/themes';
import { PixelAvatar, PixelRealmGlyph } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import {
  ThemedAchievementCard,
  ThemedPanelCard,
} from '../../components/ThemePrimitives';
import {
  formatRetroDate,
  getEffectiveGradeStatus,
  getHeroAchievements,
  getHeroEffectiveRealmIds,
  isContentVisibleToHero,
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
}) => {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClass>(hero.avatar);

  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState(
    (hero.username || '').slice(0, 5)
  );
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const heroGrades = state.grades.filter((g) => g.heroId === hero.id);
  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons);

  // Combine quests assigned to this student's class/realms (and currently released) OR any quest that already has a grade entry
  const relevantQuests = state.quests.filter((q) => {
    const hasGrade = heroGrades.some((g) => g.questId === q.id);
    if (hasGrade) return true;
    const matchSchedule = isContentVisibleToHero(q, hero.dungeonId, now);
    const matchRealm = !allowedRealmIds || allowedRealmIds.includes(q.realmId);
    return matchSchedule && matchRealm;
  });

  // Compute summary counts by symbol status (NO numeric points/scores)
  const counts = { tuntas: 0, proses: 0, remidial: 0, belum: 0 };
  relevantQuests.forEach((q) => {
    const grade = heroGrades.find((g) => g.questId === q.id);
    const st = getEffectiveGradeStatus(grade);
    counts[st] += 1;
  });

  const visibleRealms = state.realms.filter((realm) =>
    relevantQuests.some((q) => q.realmId === realm.id)
  );

  const achievementSummary = getHeroAchievements(
    hero,
    relevantQuests,
    heroGrades,
    state.realms
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
        subtitle="Status tugas, avatar, dan username akun siswa"
        action={
          (onUpdateAvatar || onUpdateUsername) ? (
            <div className="flex flex-wrap items-center gap-1.5">
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

      {/* Status Symbol Legend & Counters (NO numeric points) */}
      <ThemedPanelCard className="space-y-3">
        <div className="flex items-center gap-3 pb-2 border-b border-[var(--border-pixel)]/40">
          <PixelAvatar avatar={hero.avatar} size={42} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-pixel-display text-[12px] text-[var(--text-primary)] truncate">
                {hero.name}
              </h3>
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
          </div>
        </div>

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
              <h3 className="font-pixel-ui text-[11.5px] text-[var(--text-primary)] uppercase">
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
              <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] uppercase">
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

      {/* Status Breakdown Grouped By Realm (Symbols Only) */}
      <section className="space-y-3">
        <PixelSectionTitle title="Status per Realm / Mapel" />

        {visibleRealms.length === 0 ? (
          <PixelEmptyChest
            title="Belum Ada Tugas!"
            description="Belum ada tugas atau quest yang ditugaskan untuk kelas dan mapel kamu."
          />
        ) : (
          visibleRealms.map((realm) => {
            const realmQuests = relevantQuests.filter(
              (q) => q.realmId === realm.id
            );

            return (
              <ThemedPanelCard key={realm.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <PixelRealmGlyph
                      icon={realm.icon}
                      color={realm.accentColor}
                      size={24}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
                        {realm.name}
                      </h3>
                      <p className="text-[11.5px] font-semibold text-[var(--text-muted)]">
                        {realm.code} · {realmQuests.length} Tugas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {realmQuests.map((quest) => {
                    const grade = heroGrades.find((g) => g.questId === quest.id);
                    const status = getEffectiveGradeStatus(grade);
                    const ui = renderStatusSymbol(status);

                    return (
                      <div
                        key={quest.id}
                        className="pixel-box-inset p-3 flex items-start justify-between gap-3 overflow-hidden"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[13.5px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
                            {quest.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 border ${ui.badgeClass}`}
                            >
                              {ui.label}
                            </span>
                            <span className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                              {grade?.gradedDate
                                ? `Diperbarui ${formatRetroDate(grade.gradedDate)}`
                                : `Batas: ${formatRetroDate(quest.deadline)}`}
                            </span>
                          </div>
                          {grade?.feedback && (
                            <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed pt-0.5 break-words [overflow-wrap:anywhere]">
                              Catatan Guru: {grade.feedback}
                            </p>
                          )}
                        </div>

                        <div
                          className={`w-10 h-10 shrink-0 border-2 flex items-center justify-center ${ui.iconBoxClass}`}
                          title={ui.label}
                          aria-label={ui.label}
                        >
                          {ui.icon}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ThemedPanelCard>
            );
          })
        )}
      </section>

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
                    <span className="font-pixel-ui text-[9px] text-[var(--text-primary)]">
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
    </div>
  );
};
