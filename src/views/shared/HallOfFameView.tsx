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
  maskHeroName,
  sortDungeonsAlphabetically,
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
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<string>('all');

  const sortedDungeons = useMemo(
    () => sortDungeonsAlphabetically(state.dungeons),
    [state.dungeons]
  );

  const dungeonMap = useMemo(
    () => new Map(state.dungeons.map((d) => [d.id, d])),
    [state.dungeons]
  );

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
      const validDungeonIds = new Set(sortedDungeons.map((d) => d.id));
      const activeSelectedIds = selectedDungeonIds.filter((id) =>
        validDungeonIds.has(id)
      );
      if (activeSelectedIds.length > 0) {
        const selectedSet = new Set(activeSelectedIds);
        pool = state.heroes.filter((h) => selectedSet.has(h.dungeonId));
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
    sortedDungeons,
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
          className="w-8 h-8 rounded-[var(--btn-radius)] border-2 border-[#09090f] bg-[#ffd000] text-[#09090f] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#09090f]"
        >
          <Crown size={16} />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          aria-label="Juara 2"
          className="w-8 h-8 rounded-[var(--btn-radius)] border-2 border-slate-700 bg-slate-200 text-slate-900 flex items-center justify-center shrink-0"
        >
          <Medal size={16} />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          aria-label="Juara 3"
          className="w-8 h-8 rounded-[var(--btn-radius)] border-2 border-amber-800 bg-amber-200 text-amber-950 flex items-center justify-center shrink-0"
        >
          <Trophy size={15} />
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] text-[var(--text-primary)] font-pixel-display text-[10.5px] flex items-center justify-center shrink-0 tabular-nums">
        #{rank}
      </span>
    );
  };

  const splitIndex = Math.ceil(topTen.length / 2);
  const leftColumn = topTen.slice(0, splitIndex);
  const rightColumn = topTen.slice(splitIndex);

  const renderRankCard = (entry: (typeof topTen)[number]) => {
    const isMe = Boolean(hero && entry.hero.id === hero.id);
    const dng = dungeonMap.get(entry.hero.dungeonId);
    const displayName =
      hideNames && !isMe
        ? maskHeroName(entry.hero.name, entry.rank)
        : entry.hero.name;

    return (
      <ThemedPanelCard
        key={entry.hero.id}
        className={`p-2.5 flex items-center justify-between gap-2 ${
          isMe ? 'ring-2 ring-[var(--accent-warning)] bg-[var(--surface-tint)]' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {renderPixelMedal(entry.rank)}
          <PixelAvatar
            avatar={entry.hero.avatar}
            size={32}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-[13.5px] font-bold text-[var(--text-primary)] leading-tight truncate">
                {displayName}
              </p>
              {isMe && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--comic-gold)] border border-[var(--border-pixel)] font-pixel-ui text-[9px] font-bold text-[#09090f] leading-none">
                  KAMU
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-inset)] border border-[var(--border-pixel)]/40 font-pixel-ui text-[9.5px] font-bold text-[var(--text-primary)] tabular-nums leading-none">
                Lv.{entry.level}
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-tight truncate mt-0.5">
              {dng
                ? `${dng.name}${dng.tier ? ` (${dng.tier})` : ''}`
                : 'Guild'}{' '}
              · {entry.totalExp} EXP
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-inset)] border border-[var(--border-pixel)]/50">
            <PixelCoin size={12} />
            <span className="font-pixel-display text-[11px] text-[var(--accent-warning)] tabular-nums">
              +{entry.weeklyExp} EXP
            </span>
          </div>
          <span className="text-[10.5px] text-[var(--text-muted)] mt-0.5 leading-none">
            Minggu Ini
          </span>
        </div>
      </ThemedPanelCard>
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
        <ThemedPanelCard className="p-3">
          <div className="max-w-md">
            <PixelFieldLabel htmlFor="hof-dungeon">
              Filter Per Kelas (Dungeon)
            </PixelFieldLabel>
            <MultiDungeonFilter
              id="hof-dungeon"
              dungeons={sortedDungeons}
              selectedIds={selectedDungeonIds}
              onChange={setSelectedDungeonIds}
              allLabel="Semua Kelas (Global)"
              ariaLabel="Filter peringkat berdasarkan kelas spesifik"
            />
          </div>
        </ThemedPanelCard>
      ) : (
        studentRealms.length > 0 && (
          <ThemedPanelCard className="p-3">
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
        <ThemedPanelCard className="p-3 bg-[var(--surface-tint)] ring-2 ring-[var(--accent-warning)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--comic-gold)] text-[#09090f] flex items-center justify-center shrink-0">
              <Award size={17} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-display text-[12px] sm:text-[13px] text-[var(--text-primary)]">
                Kamu di Rank #{myEntry.rank}
              </p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {myEntry.rank <= 10
                  ? 'Masuk Top 10 minggu ini — pertahankan!'
                  : 'Terus selesaikan Quest untuk menembus Top 10!'}
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 font-pixel-display text-[12px] text-[var(--accent-warning)] tabular-nums shrink-0">
            +{myEntry.weeklyExp} EXP Minggu Ini
          </div>
        </ThemedPanelCard>
      )}

      {/* Top 10 List — 2 compact side-by-side parts (1-5 & 6-10) */}
      {topTen.length === 0 ? (
        <PixelEmptyState
          title="Papan Peringkat Masih Kosong"
          description="Belum ada Hero aktif yang tercatat untuk ditampilkan di Hall of Fame."
          compact
        />
      ) : rightColumn.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start">
          <div className="space-y-2">
            {leftColumn.map((entry) => renderRankCard(entry))}
          </div>
          <div className="space-y-2">
            {rightColumn.map((entry) => renderRankCard(entry))}
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {leftColumn.map((entry) => renderRankCard(entry))}
        </div>
      )}
    </div>
  );
};
