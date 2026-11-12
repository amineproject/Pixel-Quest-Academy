import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { AcademyState, ExpGrade } from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { calculateExpEarned, getRankFromScore } from '../../utils/exp';

interface GmExpLootProps {
  state: AcademyState;
  onSaveGrade: (grade: ExpGrade) => void;
}

export const GmExpLoot: React.FC<GmExpLootProps> = ({ state, onSaveGrade }) => {
  const [selectedRealmId, setSelectedRealmId] = useState(
    state.realms[0]?.id || ''
  );
  const questsForRealm = state.quests.filter(
    (q) => q.realmId === selectedRealmId
  );
  const [selectedQuestId, setSelectedQuestId] = useState(
    questsForRealm[0]?.id || ''
  );
  const [selectedDungeonId, setSelectedDungeonId] = useState('all');

  useEffect(() => {
    const nextQuests = state.quests.filter(
      (q) => q.realmId === selectedRealmId
    );
    if (!nextQuests.some((q) => q.id === selectedQuestId)) {
      setSelectedQuestId(nextQuests[0]?.id || '');
    }
  }, [selectedRealmId, selectedQuestId, state.quests]);

  const activeQuest = state.quests.find((q) => q.id === selectedQuestId);

  const eligibleHeroes = state.heroes.filter((h) => {
    if (!h.active) return false;
    if (selectedDungeonId !== 'all' && h.dungeonId !== selectedDungeonId) {
      return false;
    }
    if (
      activeQuest &&
      activeQuest.dungeonId !== 'all' &&
      selectedDungeonId === 'all'
    ) {
      return h.dungeonId === activeQuest.dungeonId;
    }
    return true;
  });

  // Local draft scores for smooth editing before clicking Save
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const scoresMap: Record<string, number> = {};
    const notesMap: Record<string, string> = {};
    state.heroes.forEach((h) => {
      const existing = state.grades.find(
        (g) => g.heroId === h.id && g.questId === selectedQuestId
      );
      scoresMap[h.id] = existing ? existing.score : 80;
      notesMap[h.id] = existing ? existing.feedback : '';
    });
    setDraftScores(scoresMap);
    setDraftNotes(notesMap);
  }, [selectedQuestId, state.grades, state.heroes]);

  const handleSaveHeroGrade = (heroId: string) => {
    if (!activeQuest) return;
    const score = Math.max(0, Math.min(100, Number(draftScores[heroId]) || 0));
    const existing = state.grades.find(
      (g) => g.heroId === heroId && g.questId === activeQuest.id
    );
    onSaveGrade({
      id: existing?.id || `grd-${heroId}-${activeQuest.id}`,
      heroId,
      questId: activeQuest.id,
      realmId: activeQuest.realmId,
      score,
      expEarned: calculateExpEarned(score, activeQuest.maxExp),
      feedback: (draftNotes[heroId] || '').trim(),
      gradedDate: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="EXP & Loot / Penilaian"
        subtitle="Isi skor siswa per Realm & Quest (otomatis hitung EXP)"
      />

      <div className="pixel-box p-3.5 space-y-3">
        <div>
          <PixelFieldLabel htmlFor="grd-realm">1. Pilih Realm (Mapel)</PixelFieldLabel>
          <PixelSelect
            id="grd-realm"
            value={selectedRealmId}
            onChange={(e) => setSelectedRealmId(e.target.value)}
          >
            {state.realms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name}
              </option>
            ))}
          </PixelSelect>
        </div>

        <div>
          <PixelFieldLabel htmlFor="grd-quest">2. Pilih Active Quest</PixelFieldLabel>
          <PixelSelect
            id="grd-quest"
            value={selectedQuestId}
            onChange={(e) => setSelectedQuestId(e.target.value)}
            disabled={questsForRealm.length === 0}
          >
            {questsForRealm.length === 0 ? (
              <option value="">Belum ada Quest di Realm ini</option>
            ) : (
              questsForRealm.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} (Max {q.maxExp} EXP)
                </option>
              ))
            )}
          </PixelSelect>
        </div>

        <div>
          <PixelFieldLabel htmlFor="grd-dng">3. Filter Dungeon</PixelFieldLabel>
          <PixelSelect
            id="grd-dng"
            value={selectedDungeonId}
            onChange={(e) => setSelectedDungeonId(e.target.value)}
          >
            <option value="all">
              Target Quest ({activeQuest?.dungeonId === 'all' ? 'All Guilds' : 'Guild Terkait'})
            </option>
            {state.dungeons.map((d) => (
              <option key={d.id} value={d.id}>
                {d.guildCode} — {d.name}
              </option>
            ))}
          </PixelSelect>
        </div>
      </div>

      {!activeQuest ? (
        <PixelEmptyChest
          title="No Quests in This Realm!"
          description="Buat Active Quest pada Realm ini terlebih dahulu untuk mengisi nilai."
        />
      ) : eligibleHeroes.length === 0 ? (
        <PixelEmptyChest
          title="No Active Heroes Found!"
          description="Tidak ada Hero aktif di Dungeon yang dipilih."
        />
      ) : (
        <div className="space-y-3">
          {eligibleHeroes.map((hero) => {
            const score = draftScores[hero.id] ?? 80;
            const rank = getRankFromScore(score);
            const expEarned = calculateExpEarned(score, activeQuest.maxExp);
            const existingGrade = state.grades.find(
              (g) => g.heroId === hero.id && g.questId === activeQuest.id
            );

            return (
              <article key={hero.id} className="pixel-box p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelAvatar avatar={hero.avatar} size={40} />
                    <div className="min-w-0">
                      <h3 className="font-pixel-ui text-[12px] text-[var(--text-primary)] truncate">
                        {hero.name}
                      </h3>
                      <p className="font-pixel-body text-[15px] text-[var(--text-secondary)]">
                        {existingGrade
                          ? `Saved: ${existingGrade.score}/100`
                          : 'Belum dinilai'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="font-pixel-display text-[13px] text-[var(--accent-warning)]">
                      RANK {rank}
                    </p>
                    <p className="font-pixel-body text-[16px] text-[var(--accent-success)]">
                      +{expEarned} EXP
                    </p>
                  </div>
                </div>

                {/* Score slider & numeric input */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    aria-label={`Skor ${hero.name}`}
                    value={score}
                    onChange={(e) =>
                      setDraftScores({
                        ...draftScores,
                        [hero.id]: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-[var(--accent-warning)] min-h-[36px] cursor-pointer"
                  />
                  <PixelInput
                    type="number"
                    min={0}
                    max={100}
                    aria-label={`Input nilai angka ${hero.name}`}
                    value={score}
                    onChange={(e) =>
                      setDraftScores({
                        ...draftScores,
                        [hero.id]: Math.max(
                          0,
                          Math.min(100, Number(e.target.value) || 0)
                        ),
                      })
                    }
                    className="!w-20 text-center tabular-nums"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <PixelInput
                    placeholder="Catatan Loot / feedback guru..."
                    value={draftNotes[hero.id] ?? ''}
                    onChange={(e) =>
                      setDraftNotes({
                        ...draftNotes,
                        [hero.id]: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <PixelButton
                    type="button"
                    size="sm"
                    variant="success"
                    onClick={() => handleSaveHeroGrade(hero.id)}
                  >
                    <Save size={14} />
                    Save
                  </PixelButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
