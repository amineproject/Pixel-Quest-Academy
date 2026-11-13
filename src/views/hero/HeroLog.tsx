import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  AtSign,
  CheckCircle2,
  Pencil,
  XCircle,
} from 'lucide-react';
import {
  AcademyState,
  AvatarClass,
  GradeStatus,
  HeroStudent,
} from '../../types/lms';
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
  formatRetroDate,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
} from '../../utils/exp';

interface HeroLogProps {
  state: AcademyState;
  hero: HeroStudent;
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

  const heroGrades = state.grades.filter((g) => g.heroId === hero.id);
  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons);

  // Combine quests assigned to this student's class/realms AND any quest that already has a grade entry
  const relevantQuests = state.quests.filter((q) => {
    const hasGrade = heroGrades.some((g) => g.questId === q.id);
    if (hasGrade) return true;
    const matchDungeon = q.dungeonId === 'all' || q.dungeonId === hero.dungeonId;
    const matchRealm = !allowedRealmIds || allowedRealmIds.includes(q.realmId);
    return matchDungeon && matchRealm;
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
      <section className="pixel-box p-4 space-y-3 overflow-hidden">
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
          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-emerald-800 leading-tight">
                Tuntas ({counts.tuntas})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Centang Hijau
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-rose-600 text-white flex items-center justify-center">
              <XCircle size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-rose-800 leading-tight">
                Belum Dikerjakan ({counts.belum})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Silang Merah
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-teal-600 text-white flex items-center justify-center">
              <AlertCircle size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-teal-800 leading-tight">
                Proses Dinilai ({counts.proses})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Tanda Seru Hijau
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md shrink-0 border-2 border-[var(--border-pixel)] bg-amber-400 text-[#18181b] flex items-center justify-center">
              <AlertTriangle size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-amber-800 leading-tight">
                Remidial ({counts.remidial})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Perlu Perbaikan
              </p>
            </div>
          </div>
        </div>
      </section>

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
              <article key={realm.id} className="pixel-box p-4 space-y-3 overflow-hidden">
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
              </article>
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
