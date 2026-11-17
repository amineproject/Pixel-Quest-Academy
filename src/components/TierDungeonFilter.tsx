import React, { useMemo } from 'react';
import { Dungeon } from '../types/lms';
import { groupDungeonsByTier, sortDungeonsAlphabetically } from '../utils/exp';
import { MultiDungeonFilter } from './MultiDungeonFilter';
import { PixelFieldLabel, PixelSelect } from './PixelUI';

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

  const tierSelector =
    scope.tierGroups.length > 0 ? (
      <div>
        <PixelFieldLabel htmlFor={`${idPrefix}-tier`}>
          {tierLabel}
        </PixelFieldLabel>
        <PixelSelect
          id={`${idPrefix}-tier`}
          value={selectedTier}
          onChange={(e) => {
            onChangeTier(e.target.value);
            onChangeDungeonIds([]);
          }}
          aria-label={tierLabel}
        >
          <option value="all">Semua Tingkat ({effectiveAllCount})</option>
          {scope.tierGroups.map((group) => {
            const count = getTierCount
              ? getTierCount(group.items)
              : group.items.length;
            return (
              <option key={group.tier} value={group.tier}>
                {group.tier} ({count})
              </option>
            );
          })}
        </PixelSelect>
      </div>
    ) : null;

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

  if (extraLeftSlot) {
    return (
      <div
        className={`grid grid-cols-1 gap-2.5 ${
          tierSelector ? 'md:grid-cols-3' : 'sm:grid-cols-2'
        }`}
      >
        <div>{extraLeftSlot}</div>
        {tierSelector}
        {classSelector}
      </div>
    );
  }

  if (extraRightSlot) {
    return (
      <div
        className={`grid grid-cols-1 gap-2.5 ${
          tierSelector ? 'md:grid-cols-3' : 'sm:grid-cols-2'
        }`}
      >
        {tierSelector}
        {classSelector}
        <div>{extraRightSlot}</div>
      </div>
    );
  }

  if (tierSelector) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {tierSelector}
        {classSelector}
      </div>
    );
  }

  return <div className="max-w-md">{classSelector}</div>;
};
