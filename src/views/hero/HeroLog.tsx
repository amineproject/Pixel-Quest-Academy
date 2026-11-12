import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
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
          'bg-emerald-600/25 border-emerald-400 text-emerald-300',
        iconBoxClass: 'bg-emerald-500 text-[#0B1F13] border-emerald-200',
        icon: <CheckCircle2 size={20} strokeWidth={2.75} />,
      };
    case 'proses':
      return {
        label: 'Masih Proses Dinilai',
        badgeClass:
          'bg-emerald-700/25 border-lime-400 text-lime-200',
        iconBoxClass: 'bg-emerald-600 text-lime-200 border-lime-300',
        icon: <AlertCircle size={20} strokeWidth={2.75} />,
      };
    case 'remidial':
      return {
        label: 'Remidial',
        badgeClass:
          'bg-gradient-to-r from-amber-500/25 to-rose-600/25 border-amber-400 text-amber-200',
        iconBoxClass:
          'bg-gradient-to-br from-amber-400 to-rose-600 text-[#11131E] border-amber-200',
        icon: <AlertTriangle size={20} strokeWidth={2.75} />,
      };
    case 'belum':
    default:
      return {
        label: 'Belum Dikerjakan',
        badgeClass: 'bg-rose-600/25 border-rose-400 text-rose-300',
        iconBoxClass: 'bg-rose-600 text-white border-rose-200',
        icon: <XCircle size={20} strokeWidth={2.75} />,
      };
  }
}

export const HeroLog: React.FC<HeroLogProps> = ({
  state,
  hero,
  onUpdateAvatar,
}) => {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClass>(hero.avatar);

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
        subtitle="Status penyelesaian tugas per mata pelajaran (simbol)"
        action={
          onUpdateAvatar ? (
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
              Edit Avatar
            </PixelButton>
          ) : undefined
        }
      />

      {/* Status Symbol Legend & Counters (NO numeric points) */}
      <section className="pixel-box p-4 space-y-3">
        <div className="flex items-center gap-3 pb-2 border-b border-[var(--border-pixel)]/40">
          <PixelAvatar avatar={hero.avatar} size={42} />
          <div className="min-w-0">
            <h3 className="font-pixel-display text-[12px] text-[var(--text-primary)] truncate">
              {hero.name}
            </h3>
            <p className="text-[12.5px] text-[var(--text-secondary)]">
              {hero.heroClass} · Total {relevantQuests.length} Tugas Terdaftar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 shrink-0 border-2 border-emerald-200 bg-emerald-500 text-[#0B1F13] flex items-center justify-center">
              <CheckCircle2 size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-emerald-300 leading-tight">
                Tuntas ({counts.tuntas})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Centang Hijau
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 shrink-0 border-2 border-rose-200 bg-rose-600 text-white flex items-center justify-center">
              <XCircle size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-rose-300 leading-tight">
                Belum Dikerjakan ({counts.belum})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Silang Merah
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 shrink-0 border-2 border-lime-300 bg-emerald-600 text-lime-200 flex items-center justify-center">
              <AlertCircle size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-lime-200 leading-tight">
                Proses Dinilai ({counts.proses})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Tanda Seru Hijau
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-2.5 flex items-center gap-2.5">
            <span className="w-8 h-8 shrink-0 border-2 border-amber-200 bg-gradient-to-br from-amber-400 to-rose-600 text-[#11131E] flex items-center justify-center">
              <AlertTriangle size={18} strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-amber-300 leading-tight">
                Remidial ({counts.remidial})
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                Seru Merah-Kuning
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
              <article key={realm.id} className="pixel-box p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelRealmGlyph
                      icon={realm.icon}
                      color={realm.accentColor}
                      size={24}
                    />
                    <div className="min-w-0">
                      <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] truncate">
                        {realm.name}
                      </h3>
                      <p className="font-pixel-body text-[15px] text-[var(--text-muted)]">
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
                        className="pixel-box-inset p-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-pixel-ui text-[11px] text-[var(--text-primary)] leading-snug">
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
                            <p className="font-pixel-body text-[15px] text-[var(--text-secondary)] leading-snug pt-0.5">
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
    </div>
  );
};
