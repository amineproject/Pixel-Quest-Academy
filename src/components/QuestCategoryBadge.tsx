import React from 'react';
import { Compass, Sparkles, Swords, Users } from 'lucide-react';
import { QuestCategory } from '../types/lms';
import { getQuestCategoryMeta } from '../utils/exp';

export function getQuestCategoryIcon(category?: QuestCategory | string, size = 13) {
  switch (category) {
    case 'Party':
      return <Users size={size} className="shrink-0" />;
    case 'Special':
      return <Sparkles size={size} className="shrink-0" />;
    case 'Knowledge':
      return <Compass size={size} className="shrink-0" />;
    case 'Main':
    default:
      return <Swords size={size} className="shrink-0" />;
  }
}

interface QuestCategoryBadgeProps {
  category?: QuestCategory | string;
  compact?: boolean;
  showDescription?: boolean;
}

export const QuestCategoryBadge: React.FC<QuestCategoryBadgeProps> = ({
  category,
  compact = false,
  showDescription = false,
}) => {
  const meta = getQuestCategoryMeta(category);
  return (
    <span
      title={meta.description}
      className={`inline-flex items-center gap-1 border font-bold ${
        compact ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-0.5 text-[11px]'
      } ${meta.badgeClass}`}
    >
      {getQuestCategoryIcon(meta.id, compact ? 11 : 12)}
      <span>{meta.label}</span>
      {showDescription && (
        <span className="font-medium opacity-85 hidden sm:inline">
          — {meta.description}
        </span>
      )}
    </span>
  );
};
