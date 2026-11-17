import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  AcademyState,
  HeroStudent,
  NoticePriority,
  QuestNotice,
} from '../../types/lms';
import { PixelAvatar, PixelStar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import {
  ThemedNoticeCard,
  ThemedPanelCard,
} from '../../components/ThemePrimitives';
import {
  formatRetroDate,
  formatScheduleDateTime,
  getEffectiveScheduleForClass,
  getHeroLevelProgress,
  getHeroTotalExp,
  isContentVisibleToHero,
  parseTargetDungeonIds,
} from '../../utils/exp';

interface HeroNoticeProps {
  state: AcademyState;
  hero: HeroStudent;
  onAttemptRestrictedRoute: (route: string) => void;
  unreadNoticeCount?: number;
  onMarkGuildNotificationsRead?: () => void;
}

export const HeroNotice: React.FC<HeroNoticeProps> = ({
  state,
  hero,
  onAttemptRestrictedRoute,
  unreadNoticeCount = 0,
  onMarkGuildNotificationsRead,
}) => {
  const [filter, setFilter] = useState<'all' | NoticePriority>('all');
  const [selectedNotice, setSelectedNotice] = useState<QuestNotice | null>(
    null
  );

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);

  const visibleNotices = [...state.notices]
    .filter((n) => isContentVisibleToHero(n, hero.dungeonId, now))
    .filter((n) => filter === 'all' || n.priority === filter)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  const heroTotalExp = getHeroTotalExp(hero.id, state.grades);
  const heroLevel = getHeroLevelProgress(heroTotalExp);

  return (
    <div className="space-y-5">
      {/* Unread Guild Notice Banner */}
      {unreadNoticeCount > 0 && (
        <section className="pixel-box p-3 bg-[var(--surface-tint)] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded border-2 border-[var(--border-pixel)] bg-[var(--accent-danger)] text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={15} />
            </span>
            <p className="text-[12.5px] font-bold text-[var(--text-primary)] leading-snug">
              Notifikasi Guild: {unreadNoticeCount} Pengumuman baru tersedia!
            </p>
          </div>
          {onMarkGuildNotificationsRead && (
            <button
              type="button"
              onClick={onMarkGuildNotificationsRead}
              className="pixel-btn min-h-[32px] px-2.5 bg-[var(--bg-surface)] text-[var(--text-primary)] font-pixel-ui text-[10px] font-bold cursor-pointer shrink-0"
            >
              Tandai Dibaca
            </button>
          )}
        </section>
      )}

      {/* Compact Hero Greeting Card (Read-Only Identity & Level Summary) */}
      <ThemedPanelCard className="p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <PixelAvatar avatar={hero.avatar} size={48} className="animate-pixel-bounce shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-success)] truncate">
              <PixelStar size={12} className="shrink-0" />
              <span className="truncate">{hero.heroClass.toUpperCase()}</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--comic-gold)] border border-[var(--border-pixel)] text-[#09090f] font-bold shrink-0">
                Lv.{heroLevel.level}
              </span>
            </div>
            <h2 className="font-pixel-display text-[12px] sm:text-[13px] text-[var(--text-primary)] truncate mt-0.5">
              {hero.name}
            </h2>
            <p className="text-[12.5px] text-[var(--text-secondary)] truncate">
              {hero.username ? `@${hero.username} · ` : ''}
              {dungeon ? `${dungeon.guildCode} · ${dungeon.name}` : 'Belum Ada Kelas'} · NIS {hero.studentCode}
            </p>
          </div>
        </div>

        <PixelExpBar
          percent={heroLevel.percent}
          labelLeft={`Lv.${heroLevel.level} · ${heroLevel.title}`}
          labelRight={`${heroLevel.totalExp} EXP (${heroLevel.expIntoLevel}/${heroLevel.expForNextLevel})`}
          color="var(--accent-warning)"
        />
      </ThemedPanelCard>

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

              const effSchedule = getEffectiveScheduleForClass(notice, hero.dungeonId);
              const metaTimeLabel = effSchedule.releaseTime
                ? formatScheduleDateTime(effSchedule.rawSchedule)
                : formatRetroDate(notice.releaseDate);
              const isClassSpecificNotice =
                parseTargetDungeonIds(notice.targetDungeonId).length > 0;
              const targetTag =
                isClassSpecificNotice && dungeon
                  ? `Khusus ${dungeon.guildCode}`
                  : 'Semua Kelas';

              return (
                <ThemedNoticeCard
                  key={notice.id}
                  speaker={`${priorityLabel} · ${targetTag} · ${notice.author}`}
                  metaRight={metaTimeLabel}
                  footer={
                    notice.linkUrl ? (
                      <div className="pt-1 border-t border-[var(--border-pixel)]/30">
                        <PixelLinkButton
                          url={notice.linkUrl}
                          label="Buka Tautan Pengumuman"
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
    </div>
  );
};
