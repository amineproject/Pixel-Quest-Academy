import React, { useState } from 'react';
import { BookOpen, ShieldAlert } from 'lucide-react';
import {
  AcademyState,
  HeroMenuId,
  HeroStudent,
  NoticePriority,
  QuestNotice,
} from '../../types/lms';
import { PixelAvatar, PixelCoin, PixelStar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import {
  formatRetroDate,
  getHeroEffectiveRealmIds,
  getHeroLevelProgress,
  getHeroTotalExp,
} from '../../utils/exp';

interface HeroNoticeProps {
  state: AcademyState;
  hero: HeroStudent;
  onNavigate: (menu: HeroMenuId) => void;
  onAttemptRestrictedRoute: (route: string) => void;
}

export const HeroNotice: React.FC<HeroNoticeProps> = ({
  state,
  hero,
  onNavigate,
  onAttemptRestrictedRoute,
}) => {
  const [filter, setFilter] = useState<'all' | NoticePriority>('all');
  const [selectedNotice, setSelectedNotice] = useState<QuestNotice | null>(
    null
  );

  const dungeon = state.dungeons.find((d) => d.id === hero.dungeonId);
  const totalExp = getHeroTotalExp(hero.id, state.grades);
  const levelInfo = getHeroLevelProgress(totalExp);

  const visibleNotices = [...state.notices]
    .filter(
      (n) =>
        n.targetDungeonId === 'all' || n.targetDungeonId === hero.dungeonId
    )
    .filter((n) => filter === 'all' || n.priority === filter)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons);
  const upcomingQuests = state.quests
    .filter(
      (q) =>
        (q.dungeonId === 'all' || q.dungeonId === hero.dungeonId) &&
        (!allowedRealmIds || allowedRealmIds.includes(q.realmId))
    )
    .slice(0, 2);

  const priorityColor = (p: NoticePriority) => {
    if (p === 'Critical') return 'text-[var(--accent-danger)]';
    if (p === 'Medium') return 'text-[var(--accent-warning)]';
    return 'text-[var(--accent-success)]';
  };

  return (
    <div className="space-y-5">
      {/* Hero Status Header Card */}
      <section className="pixel-box p-4 space-y-3">
        <div className="flex items-center gap-3">
          <PixelAvatar avatar={hero.avatar} size={52} className="animate-pixel-bounce" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-pixel-ui text-[10px] text-[var(--accent-success)]">
              <PixelStar size={12} />
              LV.{levelInfo.level} · {levelInfo.title.toUpperCase()}
            </div>
            <h2 className="font-pixel-display text-[12px] sm:text-[13px] text-[var(--text-primary)] truncate mt-0.5">
              {hero.name}
            </h2>
            <p className="text-[12.5px] text-[var(--text-secondary)] truncate flex items-center gap-1.5">
              <span>{dungeon ? `${dungeon.guildCode} · ${dungeon.name}` : 'No Guild'}</span>
              <span>·</span>
              <span className="text-[var(--accent-warning)] font-semibold flex items-center gap-1 tabular-nums">
                <PixelCoin size={13} /> {totalExp} EXP
              </span>
            </p>
          </div>
        </div>

        <PixelExpBar
          percent={levelInfo.percent}
          labelLeft={`Total EXP: ${totalExp}`}
          labelRight={`${levelInfo.expIntoLevel}/${levelInfo.expForNextLevel} Next LV`}
          color="var(--accent-warning)"
        />
      </section>

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
              className={`pixel-btn min-h-[40px] px-3 font-pixel-ui text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
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
          <div className="space-y-2.5">
            {visibleNotices.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => setSelectedNotice(notice)}
                className="pixel-box w-full text-left p-4 space-y-1.5 hover:bg-[var(--bg-surface-alt)] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 font-pixel-ui text-[10px]">
                  <span className={priorityColor(notice.priority)}>
                    {notice.priority === 'Critical'
                      ? '[!] CRITICAL'
                      : notice.priority === 'Medium'
                        ? '[•] MEDIUM'
                        : '[-] LOW'}
                  </span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {formatRetroDate(notice.releaseDate)}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-[var(--text-primary)]">
                  {notice.title}
                </h3>
                <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {notice.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Quests Briefing Preview */}
      <section className="space-y-2.5">
        <PixelSectionTitle
          title="Active Quests"
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

        {upcomingQuests.length === 0 ? (
          <PixelEmptyChest
            title="No Active Quests!"
            description="Belum ada tugas baru untuk guild Anda."
          />
        ) : (
          upcomingQuests.map((q) => {
            const realm = state.realms.find((r) => r.id === q.realmId);
            return (
              <div key={q.id} className="pixel-box p-3.5 space-y-1">
                <p className="font-pixel-body text-[15px] text-[var(--accent-warning)] tabular-nums">
                  {realm?.name} · +{q.maxExp} EXP · Due {formatRetroDate(q.deadline)}
                </p>
                <h3 className="font-pixel-ui text-[11px] text-[var(--text-primary)]">
                  {q.title}
                </h3>
                <p className="font-pixel-body text-[17px] text-[var(--text-secondary)]">
                  {q.instructions}
                </p>
              </div>
            );
          })
        )}
      </section>

      {/* Demo RBAC Verification Trigger */}
      <section className="pixel-box-inset p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-pixel-ui text-[10px] text-[var(--text-muted)]">
            RBAC READ-ONLY GUARD
          </p>
          <p className="font-pixel-body text-[16px] text-[var(--text-secondary)]">
            Uji akses halaman edit GM sebagai Hero
          </p>
        </div>
        <PixelButton
          type="button"
          size="sm"
          variant="danger"
          onClick={() => onAttemptRestrictedRoute('#/gm/exp-loot/edit')}
        >
          <ShieldAlert size={14} />
          Test Guard
        </PixelButton>
      </section>

      <PixelModal
        open={Boolean(selectedNotice)}
        title="Guild Notice Detail"
        onClose={() => setSelectedNotice(null)}
      >
        {selectedNotice && (
          <div className="space-y-3">
            <p className="font-pixel-body text-[16px] text-[var(--accent-warning)] tabular-nums">
              {selectedNotice.priority} · {formatRetroDate(selectedNotice.releaseDate)} ·{' '}
              {selectedNotice.author}
            </p>
            <h3 className="font-pixel-display text-[12px] text-[var(--text-primary)]">
              {selectedNotice.title}
            </h3>
            <div className="pixel-box-inset p-3.5 font-pixel-body text-[19px] text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
              {selectedNotice.description}
            </div>
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
