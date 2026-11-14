import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  KeyRound,
  Lock,
  Pencil,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  AcademyState,
  AvatarClass,
  HeroMenuId,
  HeroStudent,
  NoticePriority,
  QuestNotice,
} from '../../types/lms';
import { PixelAvatar, PixelStar } from '../../components/PixelArt';
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
  QuestCard,
  ThemedNoticeCard,
  ThemedPanelCard,
} from '../../components/ThemePrimitives';
import {
  formatRetroDate,
  getDeadlineUrgency,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
} from '../../utils/exp';

const HERO_AVATAR_OPTIONS: { value: AvatarClass; label: string }[] = [
  { value: 'knight', label: 'Knight' },
  { value: 'alchemist', label: 'Alchemist' },
  { value: 'mage', label: 'Mage' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'scholar', label: 'Scholar' },
];

interface HeroNoticeProps {
  state: AcademyState;
  hero: HeroStudent;
  onNavigate: (menu: HeroMenuId) => void;
  onAttemptRestrictedRoute: (route: string) => void;
  onUpdateAvatar: (avatar: AvatarClass) => void;
  onChangePin?: (
    currentPin: string,
    newPin: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

export const HeroNotice: React.FC<HeroNoticeProps> = ({
  state,
  hero,
  onNavigate,
  onAttemptRestrictedRoute,
  onUpdateAvatar,
  onChangePin,
}) => {
  const [filter, setFilter] = useState<'all' | NoticePriority>('all');
  const [questFilter, setQuestFilter] = useState<'priority' | 'belum' | 'remidial' | 'all'>('priority');
  const [selectedNotice, setSelectedNotice] = useState<QuestNotice | null>(
    null
  );
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClass>(hero.avatar);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);

  const visibleNotices = [...state.notices]
    .filter(
      (n) =>
        n.targetDungeonId === 'all' || n.targetDungeonId === hero.dungeonId
    )
    .filter((n) => filter === 'all' || n.priority === filter)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons);
  const heroGrades = state.grades.filter((g) => g.heroId === hero.id);

  const assignedQuests = state.quests
    .filter(
      (q) =>
        (q.dungeonId === 'all' || q.dungeonId === hero.dungeonId) &&
        (!allowedRealmIds || allowedRealmIds.includes(q.realmId))
    )
    .map((q) => {
      const grade = heroGrades.find((g) => g.questId === q.id);
      const status = getEffectiveGradeStatus(grade);
      const urgency = getDeadlineUrgency(q.deadline);
      return { quest: q, grade, status, urgency };
    })
    .sort((a, b) => (a.quest.deadline || '9999-99-99').localeCompare(b.quest.deadline || '9999-99-99'));

  const urgentPendingQuests = assignedQuests.filter(
    (item) => (item.status === 'belum' || item.status === 'remidial') && item.urgency.isUrgent
  );

  const filteredQuests = assignedQuests.filter((item) => {
    if (questFilter === 'belum') return item.status === 'belum';
    if (questFilter === 'remidial') return item.status === 'remidial';
    if (questFilter === 'priority') return item.status === 'belum' || item.status === 'remidial';
    return true;
  });

  // Symbol status counts across assigned quests (no points/scores shown)
  const statusCounts = { tuntas: 0, proses: 0, remidial: 0, belum: 0 };
  const questIdsSeen = new Set<string>();
  assignedQuests.forEach(({ quest, status }) => {
    questIdsSeen.add(quest.id);
    statusCounts[status] += 1;
  });
  heroGrades.forEach((g) => {
    if (!questIdsSeen.has(g.questId)) {
      const st = getEffectiveGradeStatus(g);
      statusCounts[st] += 1;
    }
  });

  return (
    <div className="space-y-5">
      {/* Hero Status Header Card (Theme-Adaptive Container) */}
      <ThemedPanelCard className="p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <PixelAvatar avatar={hero.avatar} size={52} className="animate-pixel-bounce shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-success)] truncate">
                <PixelStar size={12} className="shrink-0" />
                <span className="truncate">{hero.heroClass.toUpperCase()}</span>
              </div>
              <h2 className="font-pixel-display text-[12px] sm:text-[13px] text-[var(--text-primary)] truncate mt-0.5">
                {hero.name}
              </h2>
              <p className="text-[12.5px] text-[var(--text-secondary)] truncate">
                {hero.username ? `@${hero.username} · ` : ''}
                {dungeon ? `${dungeon.guildCode} · ${dungeon.name}` : 'Belum Ada Kelas'} · NIS {hero.studentCode}
              </p>
              <p className="text-[11px] mt-0.5 flex items-center gap-1">
                <Lock size={11} className={hero.hasPin ? 'text-emerald-700' : 'text-amber-800'} />
                <span className={hero.hasPin ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-semibold'}>
                  {hero.hasPin ? 'Akun Dilindungi PIN' : 'Belum Pasang PIN Rahasia'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
                {hero.hasPin ? 'PIN' : 'Buat PIN'}
              </PixelButton>
            )}
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
          </div>
        </div>

        {/* RPG Quest Completion Bar (Progress Tuntas only — no numeric scores) */}
        {assignedQuests.length > 0 && (
          <PixelExpBar
            percent={Math.round((statusCounts.tuntas / assignedQuests.length) * 100)}
            labelLeft="Progres Misi"
            labelRight={`${statusCounts.tuntas} / ${assignedQuests.length} Tuntas`}
            color="var(--accent-success)"
          />
        )}

        {/* Quest Status Symbols Summary (No Points) */}
        <button
          type="button"
          onClick={() => onNavigate('hero_log')}
          className="w-full text-left pixel-box-inset p-2.5 grid grid-cols-4 gap-1.5 hover:border-[var(--accent-warning)] transition-colors cursor-pointer"
          title="Lihat Detail Status Tugas"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-emerald-700 font-bold">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={15} />
              <span className="font-pixel-ui text-[10.5px] tabular-nums">{statusCounts.tuntas}</span>
            </div>
            <span className="text-[9.5px] font-semibold">Tuntas</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-teal-700 font-bold">
            <div className="flex items-center gap-1">
              <AlertCircle size={15} />
              <span className="font-pixel-ui text-[10.5px] tabular-nums">{statusCounts.proses}</span>
            </div>
            <span className="text-[9.5px] font-semibold">Proses</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-amber-800 font-bold">
            <div className="flex items-center gap-1">
              <AlertTriangle size={15} className="text-amber-700" />
              <span className="font-pixel-ui text-[10.5px] tabular-nums">{statusCounts.remidial}</span>
            </div>
            <span className="text-[9.5px] font-semibold">Remidi</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-rose-700 font-bold">
            <div className="flex items-center gap-1">
              <XCircle size={15} />
              <span className="font-pixel-ui text-[10.5px] tabular-nums">{statusCounts.belum}</span>
            </div>
            <span className="text-[9.5px] font-semibold">Belum</span>
          </div>
        </button>
      </ThemedPanelCard>

      {/* Deadline Urgency & Pending Task Reminder Banner */}
      {(urgentPendingQuests.length > 0 || statusCounts.remidial > 0) && (
        <section className="pixel-box p-3.5 bg-[var(--comic-gold)] text-[#09090f] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 overflow-hidden">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-md border-2 border-[#09090f] bg-[#e11d74] text-white flex items-center justify-center shrink-0">
              <Flame size={17} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-ui text-[10.5px] font-bold uppercase tracking-wide">
                Pengingat Tenggat Tugas!
              </p>
              <p className="text-[12.5px] font-semibold leading-snug break-words">
                {urgentPendingQuests.length > 0
                  ? `${urgentPendingQuests.length} tugas belum selesai dengan tenggat mendesak (≤ 2 hari / terlewat).`
                  : `Ada ${statusCounts.remidial} tugas berstatus Remidial yang perlu diperbaiki.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuestFilter(statusCounts.belum > 0 ? 'belum' : 'remidial')}
            className="pixel-btn min-h-[36px] px-3 bg-white text-[#09090f] font-pixel-ui text-[10px] font-bold shrink-0 cursor-pointer"
          >
            Lihat Prioritas
          </button>
        </section>
      )}

      {/* Guild Notice Feed (Read-Only) */}
      <section className="space-y-3">
        <PixelSectionTitle
          title="Guild Notice"
          subtitle="Pengumuman terbaru dari Game Master (Read-Only)"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'Critical', 'Medium', 'Low'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[9.5px] sm:text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
                filter === item
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
              }`}
            >
              {item === 'all' ? 'All Notices' : item}
            </button>
          ))}
        </div>

        {visibleNotices.length === 0 ? (
          <PixelEmptyChest
            title="No Scrolls Found in This Chest!"
            description="Belum ada pengumuman dari Game Master untuk kategori ini."
          />
        ) : (
          <div className="space-y-3">
            {visibleNotices.map((notice) => {
              const priorityLabel =
                notice.priority === 'Critical'
                  ? '[!] PENTING'
                  : notice.priority === 'Medium'
                    ? '[•] INFO'
                    : '[-] CATATAN';

              return (
                <ThemedNoticeCard
                  key={notice.id}
                  speaker={`${priorityLabel} · ${notice.author}`}
                  metaRight={formatRetroDate(notice.releaseDate)}
                  footer={
                    notice.linkUrl ? (
                      <div className="pt-1 border-t border-[var(--border-pixel)]/30">
                        <PixelLinkButton
                          url={notice.linkUrl}
                          label="Buka Tautan"
                          compact
                        />
                      </div>
                    ) : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(notice)}
                    className="w-full text-left space-y-1.5 hover:opacity-90 transition-opacity cursor-pointer block"
                  >
                    <h3 className="font-pixel-display text-[14.5px] sm:text-[15.5px] leading-snug break-words [overflow-wrap:anywhere] text-[var(--text-primary)]">
                      {notice.title}
                    </h3>
                    <p className="text-[13.5px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere]">
                      {notice.description}
                    </p>
                  </button>
                </ThemedNoticeCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Quests With Urgency & Unfinished Task Filters */}
      <section className="space-y-2.5">
        <PixelSectionTitle
          title="Active Quests"
          subtitle="Filter tugas belum dikerjakan, remidial, dan pengingat tenggat"
          action={
            <PixelButton
              type="button"
              size="sm"
              variant="primary"
              onClick={() => onNavigate('scroll_library')}
            >
              <BookOpen size={14} />
              Open Library
            </PixelButton>
          }
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pixel-scroll">
          {[
            { id: 'priority' as const, label: `Perlu Dikerjakan (${statusCounts.belum + statusCounts.remidial})` },
            { id: 'belum' as const, label: `Belum (${statusCounts.belum})` },
            { id: 'remidial' as const, label: `Remidial (${statusCounts.remidial})` },
            { id: 'all' as const, label: `Semua (${assignedQuests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setQuestFilter(tab.id)}
              className={`pixel-btn min-h-[36px] px-2.5 font-pixel-ui text-[9.5px] whitespace-nowrap shrink-0 cursor-pointer ${
                questFilter === tab.id
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredQuests.length === 0 ? (
          <PixelEmptyChest
            title={
              questFilter === 'all'
                ? 'No Active Quests!'
                : 'Semua Tugas Kategori Ini Beres!'
            }
            description={
              questFilter === 'all'
                ? 'Belum ada tugas baru untuk guild Anda.'
                : 'Tidak ada tugas yang tertunda pada filter ini. Cek tab "Semua" untuk melihat riwayat lengkap.'
            }
          />
        ) : (
          filteredQuests.map(({ quest: q, status, urgency }) => {
            const realm = state.realms.find((r) => r.id === q.realmId);
            const showUrgency = (status === 'belum' || status === 'remidial') && urgency.isUrgent;
            const statusLabel =
              status === 'tuntas'
                ? 'Tuntas'
                : status === 'proses'
                  ? 'Proses Dinilai'
                  : status === 'remidial'
                    ? 'Remidial'
                    : 'Belum Dikerjakan';
            const statusClass =
              status === 'tuntas'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                : status === 'proses'
                  ? 'bg-teal-100 text-teal-900 border-teal-700'
                  : status === 'remidial'
                    ? 'bg-amber-100 text-amber-900 border-amber-700'
                    : 'bg-rose-100 text-rose-900 border-rose-700';

            return (
              <QuestCard key={q.id} urgent={showUrgency}>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-[11.5px] font-semibold text-[var(--accent-success)] tabular-nums break-words">
                    {realm?.name} · Due {formatRetroDate(q.deadline)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {showUrgency && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded border border-[#09090f] bg-[var(--comic-gold)] text-[#09090f]">
                        <Clock size={11} />
                        {urgency.label}
                      </span>
                    )}
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <h3 className="text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
                  {q.title}
                </h3>
                <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {q.instructions}
                </p>
                {q.linkUrl && (
                  <div className="pt-1.5 border-t border-[var(--border-pixel)]/30">
                    <PixelLinkButton
                      url={q.linkUrl}
                      label="Buka Tautan Tugas"
                      compact
                    />
                  </div>
                )}
              </QuestCard>
            );
          })
        )}
      </section>

      {/* Demo RBAC Verification Trigger */}
      <section className="pixel-box-inset p-3.5 flex flex-wrap items-center justify-between gap-3 overflow-hidden">
        <div className="min-w-0 flex-1">
          <p className="font-pixel-ui text-[10px] text-[var(--text-muted)]">
            RBAC READ-ONLY GUARD
          </p>
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-snug break-words">
            Uji akses halaman edit GM sebagai Hero
          </p>
        </div>
        <PixelButton
          type="button"
          size="sm"
          variant="danger"
          onClick={() => onAttemptRestrictedRoute('#/gm/exp-loot/edit')}
          className="shrink-0"
        >
          <ShieldAlert size={14} />
          Test Guard
        </PixelButton>
      </section>

      {/* Notice Detail Modal */}
      <PixelModal
        open={Boolean(selectedNotice)}
        title="Guild Notice Detail"
        onClose={() => setSelectedNotice(null)}
      >
        {selectedNotice && (
          <div className="space-y-3 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--accent-warning)] tabular-nums break-words">
              {selectedNotice.priority} · {formatRetroDate(selectedNotice.releaseDate)} ·{' '}
              {selectedNotice.author}
            </p>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
              {selectedNotice.title}
            </h3>
            <div className="pixel-box-inset p-3.5 text-[13.5px] sm:text-[14px] text-[var(--text-primary)] whitespace-pre-line leading-relaxed break-words [overflow-wrap:anywhere]">
              {selectedNotice.description}
            </div>
            {selectedNotice.linkUrl && (
              <PixelLinkButton
                url={selectedNotice.linkUrl}
                label="Buka Tautan Pengumuman"
              />
            )}
            <PixelButton
              type="button"
              variant="neutral"
              fullWidth
              onClick={() => setSelectedNotice(null)}
            >
              Close
            </PixelButton>
          </div>
        )}
      </PixelModal>

      {/* Student Avatar Picker Modal */}
      <PixelModal
        open={avatarModalOpen}
        title="Pilih Avatar Hero"
        onClose={() => setAvatarModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Pilih karakter avatar pixel yang kamu sukai untuk profil petualanganmu:
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
