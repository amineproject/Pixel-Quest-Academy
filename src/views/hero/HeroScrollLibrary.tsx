import React, { useEffect, useState } from 'react';
import { BookOpen, Sword } from 'lucide-react';
import {
  AcademyState,
  AncientTome,
  HeroStudent,
} from '../../types/lms';
import { PixelRealmGlyph } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelLinkButton,
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import {
  QuestCard,
  ThemedPanelCard,
  ThemedReadingSurface,
} from '../../components/ThemePrimitives';
import {
  formatChapterLabel,
  formatRetroDate,
  formatScheduleDateTime,
  getEffectiveScheduleForClass,
  getHeroEffectiveRealmIds,
  isContentVisibleToHero,
} from '../../utils/exp';

interface HeroScrollLibraryProps {
  state: AcademyState;
  hero: HeroStudent;
}

export const HeroScrollLibrary: React.FC<HeroScrollLibraryProps> = ({
  state,
  hero,
}) => {
  const [selectedRealmId, setSelectedRealmId] = useState<string>('all');
  const [tab, setTab] = useState<'tomes' | 'quests'>('tomes');
  const [readingTome, setReadingTome] = useState<AncientTome | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const allowedRealmIds = getHeroEffectiveRealmIds(hero, state.dungeons);
  const visibleRealms = allowedRealmIds
    ? state.realms.filter((r) => allowedRealmIds.includes(r.id))
    : state.realms;

  const filteredTomes = state.tomes
    .filter((t) => isContentVisibleToHero(t, hero.dungeonId, now))
    .filter((t) => !allowedRealmIds || allowedRealmIds.includes(t.realmId))
    .filter((t) => selectedRealmId === 'all' || t.realmId === selectedRealmId)
    .sort((a, b) =>
      String(a.chapter || '').localeCompare(String(b.chapter || ''), 'id', {
        numeric: true,
        sensitivity: 'base',
      })
    );

  const filteredQuests = state.quests.filter(
    (q) =>
      isContentVisibleToHero(q, hero.dungeonId, now) &&
      (!allowedRealmIds || allowedRealmIds.includes(q.realmId)) &&
      (selectedRealmId === 'all' || q.realmId === selectedRealmId)
  );

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Scroll Library"
        subtitle="Baca modul materi & instruksi quest per Realm (Read-Only)"
      />

      {/* Mode Switcher: Tomes vs Quests Briefing */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab('tomes')}
          className={`pixel-btn min-h-[42px] px-2 sm:px-3 font-pixel-ui text-[9.5px] sm:text-[11px] flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            tab === 'tomes'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <BookOpen size={15} className="shrink-0" />
          <span className="truncate">Ancient Tomes</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('quests')}
          className={`pixel-btn min-h-[42px] px-2 sm:px-3 font-pixel-ui text-[9.5px] sm:text-[11px] flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            tab === 'quests'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <Sword size={15} className="shrink-0" />
          <span className="truncate">Quest Guides</span>
        </button>
      </div>

      {/* Realm Horizontal Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedRealmId('all')}
          className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[9.5px] sm:text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
            selectedRealmId === 'all'
              ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          All Realms
        </button>
        {visibleRealms.map((realm) => (
          <button
            key={realm.id}
            type="button"
            onClick={() => setSelectedRealmId(realm.id)}
            className={`pixel-btn min-h-[38px] px-3 font-pixel-ui text-[9.5px] sm:text-[10px] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              selectedRealmId === realm.id
                ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            <PixelRealmGlyph
              icon={realm.icon}
              color={
                selectedRealmId === realm.id ? '#1A1C2C' : realm.accentColor
              }
              size={16}
            />
            {realm.name}
          </button>
        ))}
      </div>

      {tab === 'tomes' ? (
        filteredTomes.length === 0 ? (
          <PixelEmptyChest
            title="No Scrolls Found in This Chest!"
            description="Game Master belum menerbitkan Ancient Tome pada Realm ini."
            action={
              selectedRealmId !== 'all' ? (
                <PixelButton
                  type="button"
                  variant="neutral"
                  onClick={() => setSelectedRealmId('all')}
                >
                  Show All Realms
                </PixelButton>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredTomes.map((tome) => {
              const realm = state.realms.find((r) => r.id === tome.realmId);
              const effSchedule = getEffectiveScheduleForClass(tome, hero.dungeonId);
              const releasedLabel = effSchedule.releaseTime
                ? formatScheduleDateTime(effSchedule.rawSchedule)
                : formatRetroDate(tome.publishedDate);
              return (
                <ThemedPanelCard key={tome.id} className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    {realm && (
                      <div className="w-10 h-10 shrink-0 pixel-box-inset flex items-center justify-center">
                        <PixelRealmGlyph
                          icon={realm.icon}
                          color={realm.accentColor}
                          size={24}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold text-[var(--accent-warning)] break-words">
                        {formatChapterLabel(tome.chapter)} · {realm?.name}
                      </p>
                      <h3 className="text-[14.5px] font-bold text-[var(--text-primary)] mt-0.5 leading-snug break-words [overflow-wrap:anywhere]">
                        {tome.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {tome.summary}
                  </p>
                  {tome.linkUrl && (
                    <PixelLinkButton
                      url={tome.linkUrl}
                      label="Buka Tautan Materi"
                      compact
                    />
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-pixel)]/40">
                    <span className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                      {releasedLabel}
                    </span>
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="success"
                      onClick={() => setReadingTome(tome)}
                    >
                      Read Tome
                    </PixelButton>
                  </div>
                </ThemedPanelCard>
              );
            })}
          </div>
        )
      ) : filteredQuests.length === 0 ? (
        <PixelEmptyChest
          title="No Scrolls Found in This Chest!"
          description="Belum ada instruksi Active Quest pada Realm yang dipilih."
        />
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest) => {
            const realm = state.realms.find((r) => r.id === quest.realmId);
            return (
              <QuestCard key={quest.id}>
                <p className="text-[11.5px] font-semibold text-[var(--accent-warning)] tabular-nums break-words">
                  {realm?.name} · [{quest.difficulty.toUpperCase()}]
                </p>
                <h3 className="text-[14px] font-bold text-[var(--text-primary)] leading-snug break-words [overflow-wrap:anywhere]">
                  {quest.title}
                </h3>
                <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {quest.instructions}
                </p>
                {quest.linkUrl && (
                  <PixelLinkButton
                    url={quest.linkUrl}
                    label="Buka Tautan Tugas"
                    compact
                  />
                )}
                <p className="text-[12px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-pixel)]/40 tabular-nums">
                  Batas Waktu: {formatRetroDate(quest.deadline)} · Read-Only Briefing
                </p>
              </QuestCard>
            );
          })}
        </div>
      )}

      {/* Full Read-Only Tome Reader Modal */}
      <PixelModal
        open={Boolean(readingTome)}
        title={
          readingTome
            ? `${formatChapterLabel(readingTome.chapter)}: ${readingTome.title}`
            : ''
        }
        onClose={() => setReadingTome(null)}
      >
        {readingTome && (
          <div className="space-y-3 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--accent-warning)] break-words">
              {state.realms.find((r) => r.id === readingTome.realmId)?.name}
            </p>
            <ThemedReadingSurface>
              {readingTome.content}
            </ThemedReadingSurface>
            {readingTome.linkUrl && (
              <PixelLinkButton
                url={readingTome.linkUrl}
                label="Buka Tautan Materi"
              />
            )}
            <PixelButton
              type="button"
              variant="primary"
              fullWidth
              onClick={() => setReadingTome(null)}
            >
              Finish Reading
            </PixelButton>
          </div>
        )}
      </PixelModal>
    </div>
  );
};
