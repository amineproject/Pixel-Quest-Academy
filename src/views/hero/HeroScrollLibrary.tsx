import React, { useState } from 'react';
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
  PixelModal,
  PixelSectionTitle,
} from '../../components/PixelUI';
import { formatRetroDate } from '../../utils/exp';

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

  const filteredTomes = state.tomes
    .filter((t) => selectedRealmId === 'all' || t.realmId === selectedRealmId)
    .sort((a, b) => a.chapter - b.chapter);

  const filteredQuests = state.quests.filter(
    (q) =>
      (selectedRealmId === 'all' || q.realmId === selectedRealmId) &&
      (q.dungeonId === 'all' || q.dungeonId === hero.dungeonId)
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
          className={`pixel-btn min-h-[44px] px-3 font-pixel-ui text-[11px] flex items-center justify-center gap-2 cursor-pointer ${
            tab === 'tomes'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <BookOpen size={16} />
          Ancient Tomes
        </button>
        <button
          type="button"
          onClick={() => setTab('quests')}
          className={`pixel-btn min-h-[44px] px-3 font-pixel-ui text-[11px] flex items-center justify-center gap-2 cursor-pointer ${
            tab === 'quests'
              ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <Sword size={16} />
          Quest Guides
        </button>
      </div>

      {/* Realm Horizontal Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedRealmId('all')}
          className={`pixel-btn min-h-[40px] px-3 font-pixel-ui text-[10px] whitespace-nowrap shrink-0 cursor-pointer ${
            selectedRealmId === 'all'
              ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          All Realms
        </button>
        {state.realms.map((realm) => (
          <button
            key={realm.id}
            type="button"
            onClick={() => setSelectedRealmId(realm.id)}
            className={`pixel-btn min-h-[40px] px-3 font-pixel-ui text-[10px] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
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
              return (
                <article key={tome.id} className="pixel-box p-4 space-y-2.5">
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
                      <p className="font-pixel-body text-[15px] text-[var(--accent-warning)]">
                        Bab {tome.chapter} · {realm?.name} · {tome.readMinutes} min read
                      </p>
                      <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] mt-0.5">
                        {tome.title}
                      </h3>
                    </div>
                  </div>
                  <p className="font-pixel-body text-[17px] text-[var(--text-secondary)]">
                    {tome.summary}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-pixel)]/40">
                    <span className="font-pixel-body text-[15px] text-[var(--text-muted)] tabular-nums">
                      {formatRetroDate(tome.publishedDate)}
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
                </article>
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
              <article key={quest.id} className="pixel-box p-4 space-y-2">
                <p className="font-pixel-body text-[15px] text-[var(--accent-warning)] tabular-nums">
                  {realm?.name} · [{quest.difficulty.toUpperCase()}] · +{quest.maxExp} EXP
                </p>
                <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)]">
                  {quest.title}
                </h3>
                <p className="font-pixel-body text-[18px] text-[var(--text-secondary)] leading-snug">
                  {quest.instructions}
                </p>
                <p className="font-pixel-body text-[15px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-pixel)]/40 tabular-nums">
                  Batas Waktu: {formatRetroDate(quest.deadline)} · Read-Only Briefing
                </p>
              </article>
            );
          })}
        </div>
      )}

      {/* Full Read-Only Tome Reader Modal */}
      <PixelModal
        open={Boolean(readingTome)}
        title={readingTome ? `Bab ${readingTome.chapter}: ${readingTome.title}` : ''}
        onClose={() => setReadingTome(null)}
      >
        {readingTome && (
          <div className="space-y-3">
            <p className="font-pixel-body text-[16px] text-[var(--accent-warning)]">
              {state.realms.find((r) => r.id === readingTome.realmId)?.name} ·{' '}
              {readingTome.readMinutes} min read
            </p>
            <div className="pixel-box-inset p-4 font-pixel-body text-[19px] text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
              {readingTome.content}
            </div>
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
