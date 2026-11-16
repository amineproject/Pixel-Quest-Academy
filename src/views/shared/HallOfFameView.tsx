import React, { useMemo, useState } from 'react';
import { Award, Crown, Eye, EyeOff, Medal, Trophy } from 'lucide-react';
import { AcademyState, HeroStudent, UserRole } from '../../types/lms';
import { PixelAvatar, PixelCoin } from '../../components/PixelArt';
import { MultiDungeonFilter } from '../../components/MultiDungeonFilter';
import {
  PixelEmptyState,
  PixelFieldLabel,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  getScopedHeroLeaderboardInputs,
  getWeeklyGuildLeaderboard,
  groupDungeonsByTier,
  maskHeroName,
} from '../../utils/exp';

interface HallOfFameViewProps {
  state: AcademyState;
  role: UserRole;
  hero?: HeroStudent;
}

/**
 * Menu 3: Hall of Fame (Papan Peringkat) shared by Game Master (Admin) and Hero (Student).
 * Shows Top 10 Heroes sorted by weekly EXP with pixel medal icons and a privacy toggle.
 * For Students, strictly limits displayed peers and EXP to their own class (Dungeon)
 * and enrolled Realms (Mapel).
 */
export const HallOfFameView: React.FC<HallOfFameViewProps> = ({
  state,
  role,
  hero,
}) => {
  const isGm = role === UserRole.GAME_MASTER;
  const [hideNames, setHideNames] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<string>('all');

  const dungeonMap = useMemo(
    () => new Map(state.dungeons.map((d) => [d.id, d])),
    [state.dungeons]
  );

  const tierGroups = useMemo(
    () => groupDungeonsByTier(state.dungeons),
    [state.dungeons]
  );

  const dungeonsInSelectedTier = useMemo(() => {
    if (selectedTier === 'all') return state.dungeons;
    const match = tierGroups.find((g) => g.tier === selectedTier);
    return match ? match.items : state.dungeons;
  }, [selectedTier, tierGroups, state.dungeons]);

  const studentRealms = useMemo(() => {
    if (isGm || !hero) return [];
    const { allowedRealmIds } = getScopedHeroLeaderboardInputs(
      hero,
      state.heroes,
      state.dungeons,
      state.grades,
      'all'
    );
    if (!allowedRealmIds || allowedRealmIds.length === 0) {
      return state.realms;
    }
    const allowedSet = new Set(allowedRealmIds);
    return state.realms.filter((r) => allowedSet.has(r.id));
  }, [isGm, hero, state.heroes, state.dungeons, state.grades, state.realms]);

  const { topTen, myEntry } = useMemo(() => {
    let pool = state.heroes;
    let gradesPool = state.grades;

    if (isGm) {
      const allowedDungeonIds = new Set(dungeonsInSelectedTier.map((d) => d.id));
      const activeSelectedIds = selectedDungeonIds.filter((id) =>
        allowedDungeonIds.has(id)
      );
      if (activeSelectedIds.length > 0) {
        const selectedSet = new Set(activeSelectedIds);
        pool = state.heroes.filter((h) => selectedSet.has(h.dungeonId));
      } else if (selectedTier !== 'all') {
        pool = state.heroes.filter((h) => allowedDungeonIds.has(h.dungeonId));
      }
    } else if (hero) {
      const scoped = getScopedHeroLeaderboardInputs(
        hero,
        state.heroes,
        state.dungeons,
        state.grades,
        selectedRealmId
      );
      pool = scoped.scopedHeroes;
      gradesPool = scoped.scopedGrades;
    } else {
      pool = [];
      gradesPool = [];
    }

    const fullRanking = getWeeklyGuildLeaderboard(pool, gradesPool);
    const me = hero
      ? fullRanking.find((entry) => entry.hero.id === hero.id) || null
      : null;

    return {
      topTen: fullRanking.slice(0, 10),
      myEntry: me,
    };
  }, [
    isGm,
    selectedTier,
    dungeonsInSelectedTier,
    selectedDungeonIds,
    selectedRealmId,
    state.heroes,
    state.dungeons,
    state.grades,
    hero,
  ]);

  const renderPixelMedal = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          aria-label="Juara 1"
          className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[#09090f] bg-[#ffd000] text-[#09090f] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#09090f]"
        >
          <Crown size={20} />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          aria-label="Juara 2"
          className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-slate-700 bg-slate-200 text-slate-900 flex items-center justify-center shrink-0"
        >
          <Medal size={20} />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          aria-label="Juara 3"
          className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-amber-800 bg-amber-200 text-amber-950 flex items-center justify-center shrink-0"
        >
          <Trophy size={19} />
        </span>
      );
    }
    return (
      <span className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] text-[var(--text-primary)] font-pixel-display text-[12px] flex items-center justify-center shrink-0 tabular-nums">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Hall of Fame"
        subtitle={
          isGm
            ? 'Top 10 Heroes berdasarkan perolehan EXP minggu ini'
            : 'Top 10 Heroes di kelasmu sesuai mapel yang diikuti (EXP minggu ini)'
        }
        action={
          <button
            type="button"
            onClick={() => setHideNames((prev) => !prev)}
            aria-pressed={hideNames}
            className={`pixel-btn min-h-[44px] px-4 py-2 text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto ${
              hideNames
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
            }`}
          >
            {hideNames ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{hideNames ? 'Tampilkan Nama' : 'Sembunyikan Nama'}</span>
          </button>
        }
      />

      {/* Filter Card: Admin filters by Class, Student filters by their enrolled Mapel */}
      {isGm ? (
        <ThemedPanelCard className="p-3.5 space-y-3">
          {tierGroups.length > 0 && (
            <div className="space-y-1.5">
              <PixelFieldLabel>1. Pilih Tingkat Kelas</PixelFieldLabel>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter tingkat kelas">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier('all');
                    setSelectedDungeonIds([]);
                  }}
                  className={`pixel-btn min-h-[38px] px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${
                    selectedTier === 'all'
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                      : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  }`}
                >
                  Semua Tingkat ({state.dungeons.length})
                </button>
                {tierGroups.map((group) => {
                  const active = selectedTier === group.tier;
                  return (
                    <button
                      key={group.tier}
                      type="button"
                      onClick={() => {
                        setSelectedTier(group.tier);
                        setSelectedDungeonIds([]);
                      }}
                      className={`pixel-btn min-h-[38px] px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${
                        active
                          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                          : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                      }`}
                    >
                      {group.tier} ({group.items.length})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="max-w-md">
            <PixelFieldLabel htmlFor="hof-dungeon">
              {tierGroups.length > 0 ? '2. Filter Per Kelas (Dungeon)' : 'Filter Kelas (Dungeon)'}
            </PixelFieldLabel>
            <MultiDungeonFilter
              id="hof-dungeon"
              dungeons={dungeonsInSelectedTier}
              selectedIds={selectedDungeonIds}
              onChange={setSelectedDungeonIds}
              allLabel={
                selectedTier === 'all'
                  ? 'Semua Kelas (Global)'
                  : `Semua ${selectedTier}`
              }
              ariaLabel="Filter peringkat berdasarkan kelas spesifik"
            />
          </div>
        </ThemedPanelCard>
      ) : (
        studentRealms.length > 0 && (
          <ThemedPanelCard className="p-3.5">
            <div className="max-w-md">
              <PixelFieldLabel htmlFor="hof-realm">
                Filter Mapel yang Diikuti
              </PixelFieldLabel>
              <PixelSelect
                id="hof-realm"
                value={selectedRealmId}
                onChange={(e) => setSelectedRealmId(e.target.value)}
              >
                <option value="all">Semua Mapel Saya ({studentRealms.length} Mapel)</option>
                {studentRealms.map((realm) => (
                  <option key={realm.id} value={realm.id}>
                    {realm.code} — {realm.name}
                  </option>
                ))}
              </PixelSelect>
            </div>
          </ThemedPanelCard>
        )
      )}

      {/* Student Personal Rank Highlight */}
      {!isGm && myEntry && (
        <ThemedPanelCard className="p-4 bg-[var(--surface-tint)] ring-2 ring-[var(--accent-warning)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--comic-gold)] text-[#09090f] flex items-center justify-center shrink-0">
              <Award size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-display text-[13px] sm:text-[14px] text-[var(--text-primary)]">
                Kamu di Rank #{myEntry.rank}
              </p>
              <p className="text-[15px] text-[var(--text-secondary)]">
                {myEntry.rank <= 10
                  ? 'Masuk Top 10 minggu ini — pertahankan!'
                  : 'Terus selesaikan Quest untuk menembus Top 10!'}
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 font-pixel-display text-[13px] text-[var(--accent-warning)] tabular-nums shrink-0">
            +{myEntry.weeklyExp} EXP Minggu Ini
          </div>
        </ThemedPanelCard>
      )}

      {/* Top 10 List */}
      {topTen.length === 0 ? (
        <PixelEmptyState
          title="Papan Peringkat Masih Kosong"
          description="Belum ada Hero aktif yang tercatat untuk ditampilkan di Hall of Fame."
          compact
        />
      ) : (
        <div className="space-y-2.5">
          {topTen.map((entry) => {
            const isMe = Boolean(hero && entry.hero.id === hero.id);
            const dng = dungeonMap.get(entry.hero.dungeonId);
            const displayName =
              hideNames && !isMe
                ? maskHeroName(entry.hero.name, entry.rank)
                : entry.hero.name;

            return (
              <ThemedPanelCard
                key={entry.hero.id}
                className={`p-3.5 flex items-center justify-between gap-3 ${
                  isMe ? 'ring-2 ring-[var(--accent-warning)] bg-[var(--surface-tint)]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {renderPixelMedal(entry.rank)}
                  <PixelAvatar
                    avatar={entry.hero.avatar}
                    size={40}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[16px] font-bold text-[var(--text-primary)] truncate">
                        {displayName}
                      </p>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded bg-[var(--comic-gold)] border border-[var(--border-pixel)] font-pixel-ui text-[10px] font-bold text-[#09090f]">
                          KAMU
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-inset)] border border-[var(--border-pixel)]/40 font-pixel-ui text-[10px] font-bold text-[var(--text-primary)] tabular-nums">
                        Lv.{entry.level}
                      </span>
                    </div>
                    <p className="text-[14px] text-[var(--text-secondary)] truncate">
                      {dng
                        ? `${dng.name}${dng.tier ? ` (${dng.tier})` : ''}`
                        : 'Guild'}{' '}
                      · Total {entry.totalExp} EXP
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-inset)] border border-[var(--border-pixel)]/50">
                    <PixelCoin size={14} />
                    <span className="font-pixel-display text-[12px] sm:text-[13px] text-[var(--accent-warning)] tabular-nums">
                      +{entry.weeklyExp} EXP
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Minggu Ini
                  </span>
                </div>
              </ThemedPanelCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
