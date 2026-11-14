import React from 'react';
import { CheckSquare, Square, Trash2, X } from 'lucide-react';
import { PixelButton } from './PixelUI';

interface BulkDeleteBarProps {
  totalCount: number;
  visibleIds: string[];
  selectedIds: string[];
  itemLabel: string;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onRequestDeleteSelected: () => void;
  onRequestDeleteAll: () => void;
}

export const BulkDeleteBar: React.FC<BulkDeleteBarProps> = ({
  totalCount,
  visibleIds,
  selectedIds,
  itemLabel,
  onToggleSelectAllVisible,
  onClearSelection,
  onRequestDeleteSelected,
  onRequestDeleteAll,
}) => {
  if (totalCount === 0) return null;

  const selectedSet = new Set(selectedIds);
  const visibleSelectedCount = visibleIds.filter((id) => selectedSet.has(id)).length;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;

  return (
    <div className="pixel-box-inset p-2.5 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-inset)]">
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        {visibleIds.length > 0 && (
          <button
            type="button"
            onClick={onToggleSelectAllVisible}
            className="pixel-btn min-h-[34px] px-2.5 py-1 bg-[var(--bg-surface)] text-[var(--text-primary)] font-pixel-ui text-[9.5px] flex items-center gap-1.5 cursor-pointer"
          >
            {allVisibleSelected ? (
              <CheckSquare size={14} className="text-[var(--accent-primary)] shrink-0" />
            ) : (
              <Square size={14} className="text-[var(--text-muted)] shrink-0" />
            )}
            <span>
              {allVisibleSelected
                ? `Batal Pilih (${visibleIds.length})`
                : `Pilih Semua (${visibleIds.length})`}
            </span>
          </button>
        )}

        {selectedIds.length > 0 && (
          <>
            <span className="font-pixel-ui text-[9.5px] font-bold text-[var(--accent-danger)] px-1.5">
              {selectedIds.length} {itemLabel} dipilih
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Bersihkan pilihan"
              className="pixel-btn min-h-[30px] px-2 py-0.5 bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              Reset
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {selectedIds.length > 0 && (
          <PixelButton
            type="button"
            size="sm"
            variant="danger"
            onClick={onRequestDeleteSelected}
          >
            <Trash2 size={13} />
            Hapus Terpilih ({selectedIds.length})
          </PixelButton>
        )}
        <PixelButton
          type="button"
          size="sm"
          variant="danger"
          onClick={onRequestDeleteAll}
          title={`Hapus semua ${totalCount} data ${itemLabel}`}
        >
          <Trash2 size={13} />
          Hapus Semua ({totalCount})
        </PixelButton>
      </div>
    </div>
  );
};
