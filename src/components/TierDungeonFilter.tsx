import React, { useMemo } from 'react';
import { Dungeon } from '../types/lms';
import { groupDungeonsByTier, sortDungeonsAlphabetically } from '../utils/exp';
import { MultiDungeonFilter } from './MultiDungeonFilter';
import { PixelFieldLabel } from './PixelUI';

export interface TierDungeonScope {
  sortedDungeons: Dungeon[];
  tierGroups: { tier: string; items: Dungeon[] }[];
  dungeonsInSelectedTier: Dungeon[];
  allowedTierDungeonIds: Set<string>;
  activeSelectedDungeonIds: string[];
  activeDungeons: Dungeon[];
  activeDungeonIdSet: Set<string>;
  isFiltered: boolean;
}

export function resolveTierDungeonScope(
  dungeons: Dungeon[],
  selectedTier: string,
  selectedDungeonIds: string[]
): TierDungeonScope {
  const sortedDungeons = sortDungeonsAlphabetically(dungeons);
  const tierGroups = groupDungeonsByTier(sortedDungeons);

  const tierMatch =
    selectedTier === 'all'
      ? null
      : tierGroups.find((g) => g.tier === selectedTier) || null;
  const dungeonsInSelectedTier = tierMatch ? tierMatch.items : sortedDungeons;

  const allowedTierDungeonIds = new Set(dungeonsInSelectedTier.map((d) => d.id));
  const activeSelectedDungeonIds = selectedDungeonIds.filter((id) =>
    allowedTierDungeonIds.has(id)
  );
  const activeSelectedSet = new Set(activeSelectedDungeonIds);

  const activeDungeons =
    activeSelectedSet.size > 0
      ? dungeonsInSelectedTier.filter((d) => activeSelectedSet.has(d.id))
      : dungeonsInSelectedTier;

  const activeDungeonIdSet = new Set(activeDungeons.map((d) => d.id));
  const isFiltered =
    (selectedTier !== 'all' && Boolean(tierMatch)) ||
    activeSelectedDungeonIds.length > 0;

  return {
    sortedDungeons,
    tierGroups,
    dungeonsInSelectedTier,
    allowedTierDungeonIds,
    activeSelectedDungeonIds,
    activeDungeons,
    activeDungeonIdSet,
    isFiltered,
  };
}

interface TierDungeonFilterProps {
  idPrefix: string;
  dungeons: Dungeon[];
  selectedTier: string;
  onChangeTier: (nextTier: string) => void;
  selectedDungeonIds: string[];
  onChangeDungeonIds: (nextIds: string[]) => void;
  tierLabel?: string;
  dungeonLabel?: string;
  allClassesLabel?: string;
  highlightedRealmId?: string;
  getTierCount?: (tierDungeons: Dungeon[]) => number;
  allTotalCount?: number;
  extraRightSlot?: React.ReactNode;
  extraLeftSlot?: React.ReactNode;
}

export const TierDungeonFilter: React.FC<TierDungeonFilterProps> = ({
  idPrefix,
  dungeons,
  selectedTier,
  onChangeTier,
  selectedDungeonIds,
  onChangeDungeonIds,
  tierLabel = 'Filter Tingkat Kelas',
  dungeonLabel = 'Filter Kelas (Dungeon)',
  allClassesLabel = 'Semua Kelas',
  highlightedRealmId,
  getTierCount,
  allTotalCount,
  extraRightSlot,
  extraLeftSlot,
}) => {
  const scope = useMemo(
    () => resolveTierDungeonScope(dungeons, selectedTier, selectedDungeonIds),
    [dungeons, selectedTier, selectedDungeonIds]
  );

  const effectiveAllCount = allTotalCount ?? scope.sortedDungeons.length;
  const effectiveAllClassesLabel =
    selectedTier === 'all' ? allClassesLabel : `Semua ${selectedTier}`;

  const classSelector = (
    <div>
      <PixelFieldLabel htmlFor={`${idPrefix}-dungeon`}>
        {dungeonLabel}
      </PixelFieldLabel>
      <MultiDungeonFilter
        id={`${idPrefix}-dungeon`}
        dungeons={scope.dungeonsInSelectedTier}
        selectedIds={scope.activeSelectedDungeonIds}
        onChange={onChangeDungeonIds}
        allLabel={effectiveAllClassesLabel}
        highlightedRealmId={highlightedRealmId}
        ariaLabel="Filter berdasarkan Tingkat & Kelas"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      {scope.tierGroups.length > 0 && (
        <div className="space-y-1.5">
          <PixelFieldLabel>{tierLabel}</PixelFieldLabel>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={tierLabel}
          >
            <button
              type="button"
              onClick={() => {
                onChangeTier('all');
                onChangeDungeonIds([]);
              }}
              className={`pixel-btn min-h-[36px] px-3 py-1 text-[12.5px] font-semibold cursor-pointer ${
                selectedTier === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                  : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
              }`}
            >
              Semua Tingkat ({effectiveAllCount})
            </button>
            {scope.tierGroups.map((group) => {
              const active = selectedTier === group.tier;
              const count = getTierCount
                ? getTierCount(group.items)
                : group.items.length;
              return (
                <button
                  key={group.tier}
                  type="button"
                  onClick={() => {
                    onChangeTier(group.tier);
                    onChangeDungeonIds([]);
                  }}
                  className={`pixel-btn min-h-[36px] px-3 py-1 text-[12.5px] font-semibold cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold'
                      : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  }`}
                >
                  {group.tier} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {extraLeftSlot ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>{extraLeftSlot}</div>
          {classSelector}
        </div>
      ) : extraRightSlot ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {classSelector}
          <div>{extraRightSlot}</div>
        </div>
      ) : (
        <div className="max-w-md">{classSelector}</div>
      )}
    </div>
  );
};
