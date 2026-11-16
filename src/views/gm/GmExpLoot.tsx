import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Save,
  Upload,
} from 'lucide-react';
import { AcademyState, Dungeon, ExpGrade, GradeStatus } from '../../types/lms';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import { PixelAvatar } from '../../components/PixelArt';
import {
  DungeonOptGroupOptions,
  PixelButton,
  PixelEmptyChest,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  calculateExpEarned,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
} from '../../utils/exp';
import {
  buildClassRecapData,
  buildGradesFromImportEntries,
  downloadAssessmentExcel,
  downloadRecapHtmlReport,
  formatStatusLabel,
  parseAssessmentExcelFile,
  ParsedAssessmentExcelResult,
} from '../../utils/exportRecap';

interface GmExpLootProps {
  state: AcademyState;
  onSaveGrade: (grade: ExpGrade) => void;
  onSaveGradesBatch?: (grades: ExpGrade[]) => void | Promise<void>;
}

const STATUS_SELECT_OPTIONS: {
  id: GradeStatus;
  label: string;
  selectClass: string;
}[] = [
  {
    id: 'tuntas',
    label: 'Tuntas',
    selectClass: 'bg-emerald-600 text-white border-[var(--border-pixel)]',
  },
  {
    id: 'proses',
    label: 'Proses Dinilai',
    selectClass: 'bg-teal-600 text-white border-[var(--border-pixel)]',
  },
  {
    id: 'remidial',
    label: 'Remidial',
    selectClass: 'bg-amber-400 text-[#18181b] border-[var(--border-pixel)]',
  },
  {
    id: 'belum',
    label: 'Belum',
    selectClass: 'bg-rose-600 text-white border-[var(--border-pixel)]',
  },
];

export const GmExpLoot: React.FC<GmExpLootProps> = ({
  state,
  onSaveGrade,
  onSaveGradesBatch,
}) => {
  const [selectedRealmId, setSelectedRealmId] = useState(
    state.realms[0]?.id || ''
  );
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [collapsedClasses, setCollapsedClasses] = useState<Record<string, boolean>>({});
  const [expandedPortraitHeroId, setExpandedPortraitHeroId] = useState<string | null>(null);

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(state.dungeons, selectedTier, selectedDungeonIds),
    [state.dungeons, selectedTier, selectedDungeonIds]
  );
  const sortedDungeons = scope.sortedDungeons;

  const questsForRealm = useMemo(
    () =>
      state.quests.filter((q) => {
        if (q.realmId !== selectedRealmId) return false;
        if (!scope.isFiltered) return true;
        return scope.activeDungeons.some((d) => {
          if (q.dungeonId === d.id) return true;
          if (q.dungeonId === 'all') {
            if (q.scheduledAt === '__per_class__') {
              return Boolean(q.classSchedules?.[d.id]);
            }
            return (
              !d.realmIds ||
              d.realmIds.length === 0 ||
              d.realmIds.includes(q.realmId)
            );
          }
          return false;
        });
      }),
    [state.quests, selectedRealmId, scope]
  );

  const [selectedQuestId, setSelectedQuestId] = useState(
    questsForRealm[0]?.id || ''
  );

  // Class Recap Download Modal State
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [recapDungeonId, setRecapDungeonId] = useState('all');
  const [recapRealmId, setRecapRealmId] = useState('all');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Upload Assessment Excel Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [parsedExcel, setParsedExcel] = useState<ParsedAssessmentExcelResult | null>(null);
  const [isApplyingExcel, setIsApplyingExcel] = useState(false);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!questsForRealm.some((q) => q.id === selectedQuestId)) {
      setSelectedQuestId(questsForRealm[0]?.id || '');
    }
  }, [questsForRealm, selectedQuestId]);

  const activeQuest = state.quests.find((q) => q.id === selectedQuestId);
  const activeRealm = state.realms.find((r) => r.id === selectedRealmId);

  const openRecapModal = () => {
    const defaultDungeon =
      scope.isFiltered && scope.activeDungeons.length === 1
        ? scope.activeDungeons[0].id
        : scope.isFiltered && scope.activeDungeons.length > 0
          ? scope.activeDungeons[0].id
          : sortedDungeons[0]?.id || 'all';
    setRecapDungeonId(defaultDungeon);
    setRecapRealmId('all');
    setDownloadNotice(null);
    setRecapModalOpen(true);
  };

  const openUploadModal = () => {
    setUploadFileName('');
    setParsedExcel(null);
    setUploadModalOpen(true);
  };

  const handleAssessmentFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const result = await parseAssessmentExcelFile(file, state);
    setParsedExcel(result);
    e.target.value = '';
  };

  const handleConfirmApplyExcelGrades = async () => {
    if (!parsedExcel || parsedExcel.entries.length === 0) return;
    setIsApplyingExcel(true);
    const gradesToSave = buildGradesFromImportEntries(
      parsedExcel.entries,
      state.grades
    );
    if (onSaveGradesBatch) {
      await onSaveGradesBatch(gradesToSave);
    } else {
      gradesToSave.forEach((g) => onSaveGrade(g));
    }
    setIsApplyingExcel(false);
    setUploadModalOpen(false);
  };

  const recapPreview = recapModalOpen
    ? buildClassRecapData(state, recapDungeonId, recapRealmId)
    : null;

  const dungeonOrder = new Map(sortedDungeons.map((d, idx) => [d.id, idx]));

  const eligibleHeroes = state.heroes
    .filter((h) => {
      if (!h.active) return false;
      if (
        scope.isFiltered &&
        !scope.activeDungeonIdSet.has(h.dungeonId)
      ) {
        return false;
      }
      if (
        activeQuest &&
        activeQuest.dungeonId !== 'all' &&
        h.dungeonId !== activeQuest.dungeonId
      ) {
        return false;
      }
      if (activeQuest?.realmId) {
        const allowedRealms = getHeroEffectiveRealmIds(h, state.dungeons);
        if (allowedRealms && !allowedRealms.includes(activeQuest.realmId)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const idxA = dungeonOrder.get(a.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      const idxB = dungeonOrder.get(b.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
    });

  // Local draft scores, statuses, and feedback notes for smooth editing before clicking Save
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<string, GradeStatus>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const scoresMap: Record<string, number> = {};
    const statusMap: Record<string, GradeStatus> = {};
    const notesMap: Record<string, string> = {};
    state.heroes.forEach((h) => {
      const existing = state.grades.find(
        (g) => g.heroId === h.id && g.questId === selectedQuestId
      );
      scoresMap[h.id] = existing ? existing.score : 80;
      statusMap[h.id] = existing ? getEffectiveGradeStatus(existing) : 'tuntas';
      notesMap[h.id] = existing ? existing.feedback : '';
    });
    setDraftScores(scoresMap);
    setDraftStatuses(statusMap);
    setDraftNotes(notesMap);
  }, [selectedQuestId, state.grades, state.heroes]);

  const handleSaveHeroGrade = (heroId: string) => {
    if (!activeQuest) return;
    const status = draftStatuses[heroId] || 'tuntas';
    const score =
      status === 'belum'
        ? 0
        : Math.max(0, Math.min(100, Number(draftScores[heroId]) || 0));
    const existing = state.grades.find(
      (g) => g.heroId === heroId && g.questId === activeQuest.id
    );
    onSaveGrade({
      id: existing?.id || `grd-${heroId}-${activeQuest.id}`,
      heroId,
      questId: activeQuest.id,
      realmId: activeQuest.realmId,
      score,
      expEarned: status === 'belum' ? 0 : calculateExpEarned(score, activeQuest.maxExp),
      status,
      feedback: (draftNotes[heroId] || '').trim(),
      gradedDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleSaveClassGrades = async (heroesInClass: typeof eligibleHeroes) => {
    if (!activeQuest || heroesInClass.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const batch: ExpGrade[] = heroesInClass.map((h) => {
      const status = draftStatuses[h.id] || 'tuntas';
      const score =
        status === 'belum'
          ? 0
          : Math.max(0, Math.min(100, Number(draftScores[h.id]) || 0));
      const existing = state.grades.find(
        (g) => g.heroId === h.id && g.questId === activeQuest.id
      );
      return {
        id: existing?.id || `grd-${h.id}-${activeQuest.id}`,
        heroId: h.id,
        questId: activeQuest.id,
        realmId: activeQuest.realmId,
        score,
        expEarned: status === 'belum' ? 0 : calculateExpEarned(score, activeQuest.maxExp),
        status,
        feedback: (draftNotes[h.id] || '').trim(),
        gradedDate: today,
      };
    });
    if (onSaveGradesBatch) {
      await onSaveGradesBatch(batch);
    } else {
      batch.forEach((g) => onSaveGrade(g));
    }
  };

  // Group eligible heroes by Kelas (Dungeon)
  const heroGroupsByClass = (() => {
    const groups: { key: string; dungeon: Dungeon | null; heroes: typeof eligibleHeroes }[] = [];
    const seenIds = new Set<string>();
    sortedDungeons.forEach((dng) => {
      const members = eligibleHeroes.filter((h) => h.dungeonId === dng.id);
      if (members.length > 0) {
        groups.push({ key: dng.id, dungeon: dng, heroes: members });
        members.forEach((m) => seenIds.add(m.id));
      }
    });
    const ungrouped = eligibleHeroes.filter((h) => !seenIds.has(h.id));
    if (ungrouped.length > 0) {
      groups.push({ key: '__ungrouped__', dungeon: null, heroes: ungrouped });
    }
    return groups;
  })();

  const handleStatusChange = (heroId: string, nextStatus: GradeStatus) => {
    setDraftStatuses((prev) => ({ ...prev, [heroId]: nextStatus }));
    if (nextStatus === 'belum') {
      setDraftScores((prev) => ({ ...prev, [heroId]: 0 }));
    } else if ((draftScores[heroId] ?? 0) === 0 && nextStatus === 'tuntas') {
      setDraftScores((prev) => ({ ...prev, [heroId]: 80 }));
    }
  };

  const handleScoreChange = (heroId: string, rawValue: string) => {
    const nextScore = Math.max(0, Math.min(100, Number(rawValue) || 0));
    setDraftScores((prev) => ({ ...prev, [heroId]: nextScore }));
    setDraftStatuses((prev) => ({
      ...prev,
      [heroId]: nextScore >= 70 ? 'tuntas' : 'remidial',
    }));
  };

  const renderHeroGradeCard = (hero: (typeof eligibleHeroes)[number]) => {
    if (!activeQuest) return null;
    const status = draftStatuses[hero.id] ?? 'tuntas';
    const score = status === 'belum' ? 0 : (draftScores[hero.id] ?? 80);
    const expEarned =
      status === 'belum'
        ? 0
        : calculateExpEarned(score, activeQuest.maxExp);
    const existingGrade = state.grades.find(
      (g) => g.heroId === hero.id && g.questId === activeQuest.id
    );
    const activeStatusMeta =
      STATUS_SELECT_OPTIONS.find((opt) => opt.id === status) ||
      STATUS_SELECT_OPTIONS[0];
    const isPortraitExpanded = expandedPortraitHeroId === hero.id;

    return (
      <div
        key={hero.id}
        className="pixel-box-inset bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60"
      >
        {/* PORTRAIT MODE: strictly Avatar, Status Nilai, and Nilai (compact single row) */}
        <div className="hidden portrait:block px-2.5 py-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() =>
                setExpandedPortraitHeroId(isPortraitExpanded ? null : hero.id)
              }
              title={`${hero.name} (NIS ${hero.studentCode})`}
              aria-label={hero.name}
              aria-expanded={isPortraitExpanded}
              className="shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-[var(--comic-gold)]"
            >
              <PixelAvatar avatar={hero.avatar} size={36} />
            </button>

            <select
              aria-label={`Status nilai ${hero.name}`}
              value={status}
              onChange={(e) =>
                handleStatusChange(hero.id, e.target.value as GradeStatus)
              }
              className={`min-w-0 flex-1 min-h-[42px] px-2.5 py-1.5 border-2 rounded-[var(--inset-radius)] text-[13px] font-bold cursor-pointer outline-none ${activeStatusMeta.selectClass}`}
            >
              {STATUS_SELECT_OPTIONS.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {opt.label}
                </option>
              ))}
            </select>

            <PixelInput
              type="number"
              min={0}
              max={100}
              aria-label={`Nilai ${hero.name}`}
              value={score}
              onChange={(e) => handleScoreChange(hero.id, e.target.value)}
              className="!w-[70px] !min-h-[42px] shrink-0 text-center font-bold tabular-nums"
            />
          </div>

          {isPortraitExpanded && (
            <div className="mt-2 pt-2 border-t border-[var(--border-pixel)]/30 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="font-bold text-[var(--text-primary)] truncate">
                  {hero.name} (NIS {hero.studentCode})
                </span>
                <span className="font-bold text-[var(--accent-success)] shrink-0 tabular-nums">
                  +{expEarned} EXP
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PixelInput
                  placeholder="Catatan guru (opsional)..."
                  value={draftNotes[hero.id] ?? ''}
                  onChange={(e) =>
                    setDraftNotes((prev) => ({
                      ...prev,
                      [hero.id]: e.target.value,
                    }))
                  }
                  className="flex-1 !min-h-[38px] text-[13px]"
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
            </div>
          )}
        </div>

        {/* LANDSCAPE / DESKTOP MODE: clean single compact horizontal row */}
        <div className="portrait:hidden p-2.5 flex flex-wrap lg:flex-nowrap items-center gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-[210px]">
            <PixelAvatar avatar={hero.avatar} size={34} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">
                  {hero.name}
                </h4>
                <span className="text-[11px] font-bold text-[var(--accent-success)] shrink-0 tabular-nums">
                  +{expEarned} EXP
                </span>
              </div>
              <p className="text-[11.5px] text-[var(--text-secondary)] truncate tabular-nums">
                NIS {hero.studentCode} ·{' '}
                {existingGrade ? `Tersimpan ${existingGrade.score}` : 'Belum dinilai'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label={`Status nilai ${hero.name}`}
              value={status}
              onChange={(e) =>
                handleStatusChange(hero.id, e.target.value as GradeStatus)
              }
              className={`min-h-[40px] w-[142px] px-2.5 py-1 border-2 rounded-[var(--inset-radius)] text-[12.5px] font-bold cursor-pointer outline-none ${activeStatusMeta.selectClass}`}
            >
              {STATUS_SELECT_OPTIONS.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {opt.label}
                </option>
              ))}
            </select>

            <PixelInput
              type="number"
              min={0}
              max={100}
              aria-label={`Input nilai angka ${hero.name}`}
              value={score}
              onChange={(e) => handleScoreChange(hero.id, e.target.value)}
              className="!w-[68px] !min-h-[40px] shrink-0 text-center font-bold tabular-nums"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <PixelInput
              placeholder="Catatan guru..."
              value={draftNotes[hero.id] ?? ''}
              onChange={(e) =>
                setDraftNotes((prev) => ({
                  ...prev,
                  [hero.id]: e.target.value,
                }))
              }
              className="flex-1 !min-h-[40px] text-[13px]"
            />
            <PixelButton
              type="button"
              size="sm"
              variant="success"
              onClick={() => handleSaveHeroGrade(hero.id)}
              className="shrink-0 !min-h-[40px]"
            >
              <Save size={14} />
              Save
            </PixelButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="EXP & Loot / Penilaian"
        subtitle="Kelompokkan penilaian berdasarkan Mapel & Kelas atau unggah/unduh rekap Excel"
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <PixelButton
              type="button"
              size="sm"
              variant="primary"
              onClick={openUploadModal}
            >
              <Upload size={14} />
              Upload Nilai Excel
            </PixelButton>
            <PixelButton
              type="button"
              size="sm"
              variant="warning"
              onClick={openRecapModal}
            >
              <Download size={14} />
              Unduh Excel &amp; Rekap
            </PixelButton>
          </div>
        }
      />

      <ThemedPanelCard className="p-3.5 space-y-3">
        <TierDungeonFilter
          idPrefix="grd"
          dungeons={state.dungeons}
          selectedTier={selectedTier}
          onChangeTier={setSelectedTier}
          selectedDungeonIds={selectedDungeonIds}
          onChangeDungeonIds={setSelectedDungeonIds}
          dungeonLabel="2. Filter Kelas / Guild"
          allClassesLabel="Semua Kelas Pengampu"
          highlightedRealmId={selectedRealmId}
          extraLeftSlot={
            <div>
              <PixelFieldLabel htmlFor="grd-realm">1. Pilih Mapel (Realm)</PixelFieldLabel>
              <PixelSelect
                id="grd-realm"
                value={selectedRealmId}
                onChange={(e) => setSelectedRealmId(e.target.value)}
              >
                {state.realms.map((r) => {
                  const qCount = state.quests.filter((q) => q.realmId === r.id).length;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name} ({qCount} Tugas)
                    </option>
                  );
                })}
              </PixelSelect>
            </div>
          }
        />

        <div>
          <PixelFieldLabel htmlFor="grd-quest">
            3. Pilih Active Quest / Tugas ({questsForRealm.length} tersedia)
          </PixelFieldLabel>
          <PixelSelect
            id="grd-quest"
            value={selectedQuestId}
            onChange={(e) => setSelectedQuestId(e.target.value)}
            disabled={questsForRealm.length === 0}
          >
            {questsForRealm.length === 0 ? (
              <option value="">Belum ada Quest di Mapel &amp; Kelas ini</option>
            ) : (
              questsForRealm.map((q) => {
                const targetDng = state.dungeons.find((d) => d.id === q.dungeonId);
                const scope = targetDng ? targetDng.guildCode : 'Semua Kelas';
                return (
                  <option key={q.id} value={q.id}>
                    [{scope}] {q.title} (Max {q.maxExp} EXP)
                  </option>
                );
              })
            )}
          </PixelSelect>
        </div>
      </ThemedPanelCard>

      {!activeQuest ? (
        <PixelEmptyChest
          title="No Quests in This Realm!"
          description="Buat Active Quest pada Mapel & Kelas ini terlebih dahulu untuk mengisi nilai."
        />
      ) : eligibleHeroes.length === 0 ? (
        <PixelEmptyChest
          title="No Active Heroes Found!"
          description="Tidak ada Hero aktif di Kelas & Mapel yang dipilih."
        />
      ) : (
        <div className="space-y-3.5">
          {/* Active Mapel & Quest Summary Banner */}
          <ThemedPanelCard className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[var(--bg-surface-alt)]">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <BookOpen size={17} className="text-[var(--accent-warning)] shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <p className="font-pixel-ui text-[10.5px] sm:text-[11px] text-[var(--accent-warning)] break-words">
                  {activeRealm ? `${activeRealm.code} — ${activeRealm.name}` : 'MAPEL'} · +{activeQuest.maxExp} EXP
                </p>
                <p className="text-[14px] font-bold text-[var(--text-primary)] break-words mt-0.5">
                  {activeQuest.title}
                </p>
              </div>
            </div>
            <span className="text-[12px] font-semibold text-[var(--text-secondary)] tabular-nums shrink-0">
              {eligibleHeroes.length} Siswa · {heroGroupsByClass.length} Kelas
            </span>
          </ThemedPanelCard>

          {/* Grouped by Kelas */}
          {heroGroupsByClass.map((group) => {
            const isCollapsed = Boolean(collapsedClasses[group.key]);
            const gradedCount = group.heroes.filter((h) =>
              state.grades.some(
                (g) => g.heroId === h.id && g.questId === activeQuest.id
              )
            ).length;

            return (
              <ThemedPanelCard key={group.key} className="p-3.5 space-y-3">
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--border-pixel)]/40">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedClasses((prev) => ({
                        ...prev,
                        [group.key]: !prev[group.key],
                      }))
                    }
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 text-[var(--text-primary)] shrink-0">
                      {isCollapsed ? (
                        <ChevronRight size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <GraduationCap
                          size={15}
                          className="text-[var(--accent-primary)] shrink-0"
                        />
                        <span className="font-pixel-ui text-[10.5px] px-1.5 py-0.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)]">
                          {group.dungeon?.guildCode || 'LAIN'}
                        </span>
                        <h3 className="text-[14.5px] font-bold text-[var(--text-primary)] truncate">
                          {group.dungeon?.name || 'Kelas Lainnya'}
                        </h3>
                        {group.dungeon?.tier && (
                          <span className="text-[12px] text-[var(--text-secondary)]">
                            ({group.dungeon.tier})
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                        {gradedCount}/{group.heroes.length} siswa sudah dinilai
                      </p>
                    </div>
                  </button>

                  <PixelButton
                    type="button"
                    size="sm"
                    variant="success"
                    onClick={() => handleSaveClassGrades(group.heroes)}
                    className="w-full min-[420px]:w-auto"
                  >
                    <Save size={14} />
                    Simpan Kelas
                  </PixelButton>
                </div>

                {!isCollapsed && (
                  <div className="space-y-2.5">
                    {group.heroes.map((hero) => renderHeroGradeCard(hero))}
                  </div>
                )}
              </ThemedPanelCard>
            );
          })}
        </div>
      )}

      {/* Download Class Recap & Excel Assessment Format Modal */}
      <PixelModal
        open={recapModalOpen}
        title="Unduh Format & Rekap Penilaian Excel"
        onClose={() => setRecapModalOpen(false)}
      >
        <div className="space-y-3.5">
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            Pilih kelas dan mata pelajaran untuk mengunduh tabel penilaian berbentuk <strong>Excel (.xlsx)</strong> berkolom sesuai judul tugas guru (<em>Active Quests</em>), atau Laporan Cetak HTML/PDF.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <PixelFieldLabel htmlFor="recap-dng">Pilih Kelas</PixelFieldLabel>
              <PixelSelect
                id="recap-dng"
                value={recapDungeonId}
                onChange={(e) => {
                  setRecapDungeonId(e.target.value);
                  setDownloadNotice(null);
                }}
              >
                <option value="all">Semua Kelas ({sortedDungeons.length})</option>
                <DungeonOptGroupOptions dungeons={sortedDungeons} />
              </PixelSelect>
            </div>

            <div>
              <PixelFieldLabel htmlFor="recap-realm">Pilih Mata Pelajaran</PixelFieldLabel>
              <PixelSelect
                id="recap-realm"
                value={recapRealmId}
                onChange={(e) => {
                  setRecapRealmId(e.target.value);
                  setDownloadNotice(null);
                }}
              >
                <option value="all">Semua Mata Pelajaran</option>
                {state.realms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </PixelSelect>
            </div>
          </div>

          {recapPreview && (
            <div className="pixel-box-inset p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <span className="font-semibold text-[var(--accent-warning)]">
                  {recapPreview.classLabel}
                </span>
                <span className="text-[var(--text-muted)] tabular-nums">
                  {recapPreview.rows.length} Siswa · {recapPreview.quests.length} Tugas
                </span>
              </div>

              {recapPreview.rows.length === 0 ? (
                <p className="text-[12.5px] text-[var(--text-muted)] py-2 text-center">
                  Belum ada siswa terdaftar di kelas ini.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto pixel-scroll space-y-1.5 pr-1">
                  {recapPreview.rows.map((row) => (
                    <div
                      key={row.hero.id}
                      className="p-2 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/50 flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text-primary)] truncate">
                          {row.no}. {row.hero.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {row.dungeonName} · NIS {row.hero.studentCode} ·{' '}
                          <span className="text-emerald-700 font-bold">✓{row.tuntasCount}</span>{' '}
                          <span className="text-teal-700 font-bold">!{row.prosesCount}</span>{' '}
                          <span className="text-amber-700 font-bold">▲{row.remidialCount}</span>{' '}
                          <span className="text-rose-700 font-bold">✗{row.belumCount}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <p className="font-bold text-[var(--accent-warning)]">
                          Rata: {row.avgScore} ({row.rank})
                        </p>
                        <p className="text-[11px] text-[var(--accent-success)]">
                          {row.totalExp} EXP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {downloadNotice && (
            <p className="text-[12.5px] font-semibold text-[var(--accent-success)] bg-[var(--bg-inset)] p-2 border border-[var(--accent-success)]">
              ✓ {downloadNotice}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <PixelButton
              type="button"
              variant="success"
              disabled={!recapPreview || recapPreview.rows.length === 0}
              onClick={() => {
                if (!recapPreview) return;
                downloadAssessmentExcel(state, recapPreview);
                setDownloadNotice(
                  `File Excel penilaian "${recapPreview.classLabel}" berhasil diunduh!`
                );
              }}
            >
              <FileSpreadsheet size={15} />
              Unduh Tabel Excel (.xlsx)
            </PixelButton>

            <PixelButton
              type="button"
              variant="primary"
              disabled={!recapPreview || recapPreview.rows.length === 0}
              onClick={() => {
                if (!recapPreview) return;
                downloadRecapHtmlReport(state, recapPreview);
                setDownloadNotice(
                  `Laporan cetak "${recapPreview.classLabel}" berhasil diunduh!`
                );
              }}
            >
              <FileText size={15} />
              Unduh Laporan Cetak (.html)
            </PixelButton>
          </div>

          <PixelButton
            type="button"
            variant="neutral"
            fullWidth
            onClick={() => setRecapModalOpen(false)}
          >
            Tutup
          </PixelButton>
        </div>
      </PixelModal>

      {/* Upload Excel Penilaian Modal */}
      <PixelModal
        open={uploadModalOpen}
        title="Unggah Tabel Penilaian (Excel .xlsx)"
        onClose={() => setUploadModalOpen(false)}
      >
        <div className="space-y-3.5">
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            Unggah kembali file <strong>.xlsx</strong> yang sudah diisi nilai angka (<strong>0–100</strong>) atau status (<em>Proses, Belum, Remidial, Tuntas</em>) pada kolom tugas. Nama kolom otomatis dicocokkan dengan tugas buatan guru.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <PixelButton
              type="button"
              size="sm"
              variant="neutral"
              onClick={() => {
                const targetDng =
                  selectedDungeonIds.length === 1 ? selectedDungeonIds[0] : 'all';
                const targetRlm = selectedRealmId || 'all';
                const recap = buildClassRecapData(state, targetDng, targetRlm);
                downloadAssessmentExcel(state, recap);
              }}
            >
              <Download size={14} />
              Unduh Format Tabel (.xlsx)
            </PixelButton>

            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleAssessmentFileChange}
              className="hidden"
            />
            <PixelButton
              type="button"
              size="sm"
              variant="primary"
              onClick={() => excelInputRef.current?.click()}
            >
              <Upload size={14} />
              Pilih File Excel (.xlsx)
            </PixelButton>
          </div>

          {uploadFileName && (
            <p className="text-[12px] font-semibold text-[var(--accent-warning)]">
              File terbaca: {uploadFileName}
            </p>
          )}

          {parsedExcel && (
            <div className="space-y-2.5">
              {parsedExcel.matchedQuestColumns.length > 0 && (
                <div className="pixel-box-inset p-2.5 space-y-1">
                  <span className="font-pixel-ui text-[9.5px] text-[var(--accent-success)] block">
                    KOLOM TUGAS TERDETEKSI ({parsedExcel.matchedQuestColumns.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedExcel.matchedQuestColumns.map((col) => (
                      <span
                        key={col}
                        className="text-[11px] font-semibold px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/60"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parsedExcel.warnings.length > 0 && (
                <div className="pixel-box-inset p-2.5 border border-amber-700 bg-amber-50 space-y-1 max-h-28 overflow-y-auto pixel-scroll">
                  {parsedExcel.warnings.map((w, idx) => (
                    <p key={idx} className="text-[11.5px] font-semibold text-amber-900">
                      ⚠ {w}
                    </p>
                  ))}
                </div>
              )}

              {parsedExcel.entries.length > 0 ? (
                <div className="pixel-box-inset max-h-52 overflow-y-auto pixel-scroll divide-y divide-[var(--border-pixel)]/30">
                  {parsedExcel.entries.map((entry, idx) => (
                    <div
                      key={`${entry.heroId}-${entry.questId}-${idx}`}
                      className="p-2 flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[var(--text-primary)] truncate">
                          {entry.heroName} ({entry.studentCode})
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {entry.questTitle}
                        </p>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <p className="font-bold text-[var(--accent-warning)]">
                          {entry.status === 'belum' || entry.status === 'proses'
                            ? formatStatusLabel(entry.status)
                            : `${entry.score} (${formatStatusLabel(entry.status)})`}
                        </p>
                        <p className="text-[10.5px] text-[var(--accent-success)]">
                          +{entry.expEarned} EXP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text-muted)] text-center py-2">
                  Belum ada sel nilai yang terisi untuk diimpor.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <PixelButton
              type="button"
              variant="neutral"
              onClick={() => setUploadModalOpen(false)}
            >
              Batal
            </PixelButton>
            <PixelButton
              type="button"
              variant="success"
              disabled={
                !parsedExcel ||
                parsedExcel.entries.length === 0 ||
                isApplyingExcel
              }
              onClick={handleConfirmApplyExcelGrades}
            >
              {isApplyingExcel
                ? 'Menyimpan...'
                : `Simpan ${parsedExcel?.entries.length || 0} Nilai`}
            </PixelButton>
          </div>
        </div>
      </PixelModal>
    </div>
  );
};
