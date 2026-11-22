import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
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
  ThemedReadingSurface,
} from '../../components/ThemePrimitives';
import { WoodenQuestBoard } from '../../components/WoodenQuestBoard';
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

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Scroll Library"
        subtitle="Baca modul materi Ancient Tomes per Realm (Read-Only)"
      />

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
                selectedRealmId === realm.id ? 'currentColor' : realm.accentColor
              }
              size={16}
            />
            {realm.name}
          </button>
        ))}
      </div>

      {filteredTomes.length === 0 ? (
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
              <WoodenQuestBoard
                key={tome.id}
                bannerTitle={`${formatChapterLabel(tome.chapter)} · ${realm?.code || 'TOME'}`}
                bannerLeft={
                  realm ? (
                    <div className="w-7 h-7 rounded-[var(--btn-radius)] bg-white border border-[var(--border-pixel)] flex items-center justify-center">
                      <PixelRealmGlyph
                        icon={realm.icon}
                        color={realm.accentColor}
                        size={18}
                      />
                    </div>
                  ) : undefined
                }
                stats={[
                  { label: 'MAPEL', value: realm?.name || 'Umum' },
                  { label: 'RILIS', value: releasedLabel },
                ]}
              >
                <button
                  type="button"
                  onClick={() => setReadingTome(tome)}
                  className="text-left text-[16px] sm:text-[17px] font-bold text-[var(--board-ink)] hover:text-[var(--board-accent)] leading-snug break-words [overflow-wrap:anywhere] cursor-pointer block w-full"
                >
                  {tome.title}
                </button>
                {tome.summary && (
                  <p className="text-[14.5px] sm:text-[15px] text-[var(--board-muted)] leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
                    {tome.summary}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--board-divider)]">
                  <PixelButton
                    type="button"
                    size="sm"
                    variant="success"
                    onClick={() => setReadingTome(tome)}
                  >
                    <BookOpen size={15} />
                    Baca Materi
                  </PixelButton>
                </div>
              </WoodenQuestBoard>
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
            {readingTome.summary && (
              <p className="pixel-box-inset p-2.5 text-[12.5px] text-[var(--text-secondary)] italic leading-relaxed break-words [overflow-wrap:anywhere]">
                {readingTome.summary}
              </p>
            )}
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
              Selesai Membaca
            </PixelButton>
          </div>
        )}
      </PixelModal>
    </div>
  );
};
