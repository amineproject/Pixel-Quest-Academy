import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  ListChecks,
  MessageSquare,
  Save,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  AcademyState,
  ActiveQuest,
  Dungeon,
  ExpGrade,
  GradeStatus,
} from '../../types/lms';
import { QuestCategoryBadge } from '../../components/QuestCategoryBadge';
import {
  TierDungeonFilter,
  resolveTierDungeonScope,
} from '../../components/TierDungeonFilter';
import { PixelAvatar } from '../../components/PixelArt';
import {
  DungeonOptGroupOptions,
  PixelButton,
  PixelEmptyChest,
  PixelExpBar,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import {
  HeroQuestProgressSummary,
  applyCollectiveGradePatch,
  buildAcademicPeriodLabel,
  calculateExpEarned,
  computeHeroesQuestProgress,
  doesTargetMatchDungeon,
  formatChapterLabel,
  formatRetroDate,
  formatTargetDungeonsSummary,
  getDeadlineUrgency,
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
  getSeasonLabel,
  groupQuestsByCategory,
  parseTargetDungeonIds,
  resolveScoreFromDraft,
  sanitizeScoreDraftInput,
  sortQuestsByCategory,
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
  eraAllSeasonsState?: AcademyState;
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
  eraAllSeasonsState,
  onSaveGrade,
  onSaveGradesBatch,
}) => {
  const [viewMode, setViewMode] = useState<'grade' | 'progress'>('grade');
  const [selectedRealmId, setSelectedRealmId] = useState(
    state.realms[0]?.id || ''
  );
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDungeonIds, setSelectedDungeonIds] = useState<string[]>([]);
  const [collapsedClasses, setCollapsedClasses] = useState<Record<string, boolean>>({});
  const [expandedNoteHeroIds, setExpandedNoteHeroIds] = useState<Record<string, boolean>>({});
  const [isCollectiveOpen, setIsCollectiveOpen] = useState<boolean>(true);
  const [gradeSearch, setGradeSearch] = useState<string>('');
  const [gradeStatusFilter, setGradeStatusFilter] = useState<'all' | GradeStatus>('all');

  // Student Quest Progress Tracker state (Tab: Cek Progres Siswa)
  const [progressRealmId, setProgressRealmId] = useState<string>('all');
  const [progressSearch, setProgressSearch] = useState<string>('');
  const [progressStudentFilter, setProgressStudentFilter] = useState<
    'all' | 'has_unfinished' | 'all_done' | 'has_proses_remidial'
  >('all');
  const [progressTaskFilter, setProgressTaskFilter] = useState<
    'all' | 'unfinished' | 'completed'
  >('all');
  const [expandedProgressHeroIds, setExpandedProgressHeroIds] = useState<
    Record<string, boolean>
  >({});
  const [collapsedProgressClasses, setCollapsedProgressClasses] = useState<
    Record<string, boolean>
  >({});

  const scope = useMemo(
    () =>
      resolveTierDungeonScope(state.dungeons, selectedTier, selectedDungeonIds),
    [state.dungeons, selectedTier, selectedDungeonIds]
  );
  const sortedDungeons = scope.sortedDungeons;

  const questsForRealm = useMemo(
    () =>
      sortQuestsByCategory(
        state.quests.filter((q) => {
          if (q.realmId !== selectedRealmId) return false;
          if (!scope.isFiltered) return true;
          const targetIds = parseTargetDungeonIds(q.dungeonId);
          if (targetIds.length > 0) {
            return scope.activeDungeons.some((d) => targetIds.includes(d.id));
          }
          return scope.activeDungeons.some((d) => {
            if (q.scheduledAt === '__per_class__') {
              return Boolean(q.classSchedules?.[d.id]);
            }
            return (
              !d.realmIds ||
              d.realmIds.length === 0 ||
              d.realmIds.includes(q.realmId)
            );
          });
        })
      ),
    [state.quests, selectedRealmId, scope]
  );

  const questGroupsForRealm = useMemo(
    () => groupQuestsByCategory(questsForRealm),
    [questsForRealm]
  );

  const [selectedQuestId, setSelectedQuestId] = useState(
    questsForRealm[0]?.id || ''
  );

  // Class Recap Download Modal State
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [recapDungeonId, setRecapDungeonId] = useState('all');
  const [recapRealmId, setRecapRealmId] = useState('all');
  const [recapSeasonScope, setRecapSeasonScope] = useState<'active' | 'all_era'>('active');
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
    setRecapSeasonScope('active');
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

  const activeEra =
    state.academicYears?.find((y) => y.isActive) || state.academicYears?.[0];
  const activeSeason = state.settings.activeSeason || 'ganjil';
  const recapSourceState =
    recapSeasonScope === 'all_era' && eraAllSeasonsState
      ? eraAllSeasonsState
      : state;
  const recapPeriodLabel = buildAcademicPeriodLabel(
    activeEra?.name,
    recapSeasonScope === 'all_era' ? 'all' : activeSeason
  );

  const recapPreview = recapModalOpen
    ? buildClassRecapData(recapSourceState, recapDungeonId, recapRealmId, {
        periodLabel: recapPeriodLabel,
      })
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
        !doesTargetMatchDungeon(activeQuest.dungeonId, h.dungeonId)
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

  const activeQuestGradeMap = useMemo(() => {
    const map = new Map<string, ExpGrade>();
    if (!activeQuest) return map;
    state.grades.forEach((g) => {
      if (g.questId === activeQuest.id) {
        map.set(g.heroId, g);
      }
    });
    return map;
  }, [state.grades, activeQuest]);

  const activeQuestStatusCounts = useMemo(() => {
    const counts = { tuntas: 0, proses: 0, remidial: 0, belum: 0 };
    eligibleHeroes.forEach((h) => {
      const grade = activeQuestGradeMap.get(h.id);
      const st: GradeStatus = grade ? getEffectiveGradeStatus(grade) : 'belum';
      counts[st]++;
    });
    return counts;
  }, [eligibleHeroes, activeQuestGradeMap]);

  const displayedGradeHeroes = useMemo(() => {
    const q = gradeSearch.trim().toLowerCase();
    return eligibleHeroes.filter((h) => {
      if (q) {
        const matchName = h.name.toLowerCase().includes(q);
        const matchCode = (h.studentCode || '').toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (gradeStatusFilter !== 'all') {
        const grade = activeQuestGradeMap.get(h.id);
        const st: GradeStatus = grade ? getEffectiveGradeStatus(grade) : 'belum';
        if (st !== gradeStatusFilter) return false;
      }
      return true;
    });
  }, [eligibleHeroes, gradeSearch, gradeStatusFilter, activeQuestGradeMap]);

  // Student Quest Progress Tracker computations
  const allProgressRows = useMemo(
    () =>
      computeHeroesQuestProgress({
        heroes: state.heroes,
        quests: state.quests,
        grades: state.grades,
        dungeons: state.dungeons,
        realms: state.realms,
        realmId: progressRealmId,
        scopedDungeonIds: scope.isFiltered ? scope.activeDungeonIdSet : null,
      }),
    [state.heroes, state.quests, state.grades, state.dungeons, state.realms, progressRealmId, scope]
  );

  const filteredProgressRows = useMemo(() => {
    const q = progressSearch.trim().toLowerCase();
    return allProgressRows.filter((row) => {
      if (q) {
        const matchName = row.hero.name.toLowerCase().includes(q);
        const matchCode = (row.hero.studentCode || '').toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (progressStudentFilter === 'has_unfinished' && row.unfinishedCount === 0) {
        return false;
      }
      if (progressStudentFilter === 'all_done' && !row.isAllDone) {
        return false;
      }
      if (
        progressStudentFilter === 'has_proses_remidial' &&
        row.prosesCount === 0 &&
        row.remidialCount === 0
      ) {
        return false;
      }
      return true;
    });
  }, [allProgressRows, progressSearch, progressStudentFilter]);

  const progressKpi = useMemo(() => {
    let allDoneStudents = 0;
    let pendingStudents = 0;
    let totalSlots = 0;
    let totalTuntas = 0;
    let totalUnfinished = 0;
    filteredProgressRows.forEach((row) => {
      if (row.isAllDone) allDoneStudents++;
      if (row.unfinishedCount > 0) pendingStudents++;
      totalSlots += row.totalQuests;
      totalTuntas += row.tuntasCount;
      totalUnfinished += row.unfinishedCount;
    });
    const overallPercent =
      totalSlots > 0 ? Math.min(100, Math.round((totalTuntas / totalSlots) * 100)) : 0;
    return {
      totalStudents: filteredProgressRows.length,
      allDoneStudents,
      pendingStudents,
      totalSlots,
      totalTuntas,
      totalUnfinished,
      overallPercent,
    };
  }, [filteredProgressRows]);

  const progressGroupsByClass = useMemo(() => {
    const groups: {
      key: string;
      dungeon: Dungeon | null;
      rows: HeroQuestProgressSummary[];
    }[] = [];
    const seenIds = new Set<string>();
    sortedDungeons.forEach((dng) => {
      const members = filteredProgressRows.filter((r) => r.hero.dungeonId === dng.id);
      if (members.length > 0) {
        groups.push({ key: dng.id, dungeon: dng, rows: members });
        members.forEach((m) => seenIds.add(m.hero.id));
      }
    });
    const ungrouped = filteredProgressRows.filter((r) => !seenIds.has(r.hero.id));
    if (ungrouped.length > 0) {
      groups.push({ key: '__ungrouped__', dungeon: null, rows: ungrouped });
    }
    return groups;
  }, [filteredProgressRows, sortedDungeons]);

  const handleJumpToGradeQuest = (quest: ActiveQuest) => {
    setSelectedRealmId(quest.realmId);
    setSelectedQuestId(quest.id);
    setGradeSearch('');
    setGradeStatusFilter('all');
    setViewMode('grade');
  };

  // Local draft scores (numeric + raw text input for smooth mobile editing), statuses, and notes
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [draftScoreInputs, setDraftScoreInputs] = useState<Record<string, string>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<string, GradeStatus>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  // Collective / Batch grading controls
  const [selectedHeroIds, setSelectedHeroIds] = useState<Record<string, boolean>>({});
  const [bulkTargetMode, setBulkTargetMode] = useState<'all' | 'selected' | 'ungraded'>('all');
  const [bulkScoreInput, setBulkScoreInput] = useState<string>('');
  const [bulkStatusInput, setBulkStatusInput] = useState<GradeStatus | 'keep'>('keep');
  const [bulkNoteInput, setBulkNoteInput] = useState<string>('');
  const [bulkClearNote, setBulkClearNote] = useState<boolean>(false);
  const [bulkFeedbackBanner, setBulkFeedbackBanner] = useState<string | null>(null);
  const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);

  useEffect(() => {
    const scoresMap: Record<string, number> = {};
    const scoreInputsMap: Record<string, string> = {};
    const statusMap: Record<string, GradeStatus> = {};
    const notesMap: Record<string, string> = {};
    state.heroes.forEach((h) => {
      const existing = state.grades.find(
        (g) => g.heroId === h.id && g.questId === selectedQuestId
      );
      const effectiveStatus = existing
        ? getEffectiveGradeStatus(existing)
        : 'tuntas';
      const initialScore = existing
        ? effectiveStatus === 'belum'
          ? 0
          : existing.score
        : 80;
      scoresMap[h.id] = initialScore;
      scoreInputsMap[h.id] = String(initialScore);
      statusMap[h.id] = effectiveStatus;
      notesMap[h.id] = existing ? existing.feedback : '';
    });
    setDraftScores(scoresMap);
    setDraftScoreInputs(scoreInputsMap);
    setDraftStatuses(statusMap);
    setDraftNotes(notesMap);
  }, [selectedQuestId, state.grades, state.heroes]);

  useEffect(() => {
    setSelectedHeroIds({});
    setBulkTargetMode('all');
    setBulkFeedbackBanner(null);
  }, [selectedQuestId, selectedRealmId]);

  const saveHeroesBatch = async (
    heroesToSave: typeof eligibleHeroes,
    scoresMap: Record<string, number>,
    statusesMap: Record<string, GradeStatus>,
    notesMap: Record<string, string>,
    scoreInputsMap: Record<string, string> = draftScoreInputs
  ) => {
    if (!activeQuest || heroesToSave.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const batch: ExpGrade[] = heroesToSave.map((h) => {
      const status = statusesMap[h.id] || 'tuntas';
      const score =
        status === 'belum'
          ? 0
          : resolveScoreFromDraft(scoreInputsMap[h.id], scoresMap[h.id] ?? 0);
      const existing = state.grades.find(
        (g) => g.heroId === h.id && g.questId === activeQuest.id
      );
      return {
        id: existing?.id || `grd-${h.id}-${activeQuest.id}`,
        heroId: h.id,
        questId: activeQuest.id,
        realmId: activeQuest.realmId,
        score,
        expEarned:
          status === 'belum'
            ? 0
            : calculateExpEarned(score, activeQuest.maxExp),
        status,
        feedback: (notesMap[h.id] || '').trim(),
        gradedDate: today,
      };
    });
    if (onSaveGradesBatch) {
      await onSaveGradesBatch(batch);
    } else {
      batch.forEach((g) => onSaveGrade(g));
    }
  };

  const handleSaveHeroGrade = (heroId: string) => {
    if (!activeQuest) return;
    const status = draftStatuses[heroId] || 'tuntas';
    const score =
      status === 'belum'
        ? 0
        : resolveScoreFromDraft(draftScoreInputs[heroId], draftScores[heroId] ?? 0);
    setDraftScores((prev) => ({ ...prev, [heroId]: score }));
    setDraftScoreInputs((prev) => ({ ...prev, [heroId]: String(score) }));
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
    await saveHeroesBatch(
      heroesInClass,
      draftScores,
      draftStatuses,
      draftNotes,
      draftScoreInputs
    );
  };

  const selectedEligibleHeroes = eligibleHeroes.filter((h) =>
    Boolean(selectedHeroIds[h.id])
  );
  const ungradedEligibleHeroes = eligibleHeroes.filter((h) => {
    if (!activeQuest) return false;
    return !state.grades.some(
      (g) => g.heroId === h.id && g.questId === activeQuest.id
    );
  });

  const bulkTargetHeroes =
    bulkTargetMode === 'selected'
      ? selectedEligibleHeroes
      : bulkTargetMode === 'ungraded'
        ? ungradedEligibleHeroes
        : eligibleHeroes;

  const hasCollectiveChanges =
    bulkScoreInput.trim() !== '' ||
    bulkStatusInput !== 'keep' ||
    bulkNoteInput.trim() !== '' ||
    bulkClearNote;

  const toggleHeroSelection = (heroId: string) => {
    setSelectedHeroIds((prev) => {
      const next = { ...prev, [heroId]: !prev[heroId] };
      const checkedCount = eligibleHeroes.filter((h) => Boolean(next[h.id])).length;
      if (checkedCount > 0 && bulkTargetMode === 'all') {
        setBulkTargetMode('selected');
      } else if (checkedCount === 0 && bulkTargetMode === 'selected') {
        setBulkTargetMode('all');
      }
      return next;
    });
    setBulkFeedbackBanner(null);
  };

  const toggleClassSelection = (heroesInClass: typeof eligibleHeroes) => {
    const allChecked =
      heroesInClass.length > 0 &&
      heroesInClass.every((h) => Boolean(selectedHeroIds[h.id]));
    setSelectedHeroIds((prev) => {
      const next = { ...prev };
      heroesInClass.forEach((h) => {
        next[h.id] = !allChecked;
      });
      const checkedCount = eligibleHeroes.filter((h) => Boolean(next[h.id])).length;
      if (checkedCount > 0 && bulkTargetMode === 'all') {
        setBulkTargetMode('selected');
      } else if (checkedCount === 0 && bulkTargetMode === 'selected') {
        setBulkTargetMode('all');
      }
      return next;
    });
    setBulkFeedbackBanner(null);
  };

  const handleSelectAllEligible = () => {
    const next: Record<string, boolean> = {};
    eligibleHeroes.forEach((h) => {
      next[h.id] = true;
    });
    setSelectedHeroIds(next);
    setBulkTargetMode('selected');
    setBulkFeedbackBanner(null);
  };

  const handleClearSelection = () => {
    setSelectedHeroIds({});
    if (bulkTargetMode === 'selected') {
      setBulkTargetMode('all');
    }
    setBulkFeedbackBanner(null);
  };

  const handleApplyCollective = async (andSave: boolean) => {
    if (!activeQuest || bulkTargetHeroes.length === 0 || !hasCollectiveChanges) {
      return;
    }

    const { nextScores, nextStatuses, nextNotes } = applyCollectiveGradePatch({
      targetHeroIds: bulkTargetHeroes.map((h) => h.id),
      currentScores: draftScores,
      currentStatuses: draftStatuses,
      currentNotes: draftNotes,
      patch: {
        scoreInput: bulkScoreInput,
        statusInput: bulkStatusInput,
        noteInput: bulkNoteInput,
        clearNote: bulkClearNote,
      },
    });

    setDraftScores(nextScores);
    setDraftScoreInputs((prev) => {
      const nextInputs = { ...prev };
      bulkTargetHeroes.forEach((h) => {
        nextInputs[h.id] = String(nextScores[h.id] ?? 0);
      });
      return nextInputs;
    });
    setDraftStatuses(nextStatuses);
    setDraftNotes(nextNotes);

    if (andSave) {
      setIsSavingBulk(true);
      const nextInputsForSave: Record<string, string> = { ...draftScoreInputs };
      bulkTargetHeroes.forEach((h) => {
        nextInputsForSave[h.id] = String(nextScores[h.id] ?? 0);
      });
      await saveHeroesBatch(
        bulkTargetHeroes,
        nextScores,
        nextStatuses,
        nextNotes,
        nextInputsForSave
      );
      setIsSavingBulk(false);
      setBulkFeedbackBanner(
        `Berhasil menerapkan & menyimpan penilaian kolektif untuk ${bulkTargetHeroes.length} siswa!`
      );
    } else {
      setBulkFeedbackBanner(
        `Draft kolektif diterapkan ke ${bulkTargetHeroes.length} siswa. Klik "Simpan Kelas" atau "Simpan Semua" untuk menyimpan permanen.`
      );
    }
  };

  // Group displayed heroes by Kelas (Dungeon)
  const heroGroupsByClass = (() => {
    const groups: { key: string; dungeon: Dungeon | null; heroes: typeof displayedGradeHeroes }[] = [];
    const seenIds = new Set<string>();
    sortedDungeons.forEach((dng) => {
      const members = displayedGradeHeroes.filter((h) => h.dungeonId === dng.id);
      if (members.length > 0) {
        groups.push({ key: dng.id, dungeon: dng, heroes: members });
        members.forEach((m) => seenIds.add(m.id));
      }
    });
    const ungrouped = displayedGradeHeroes.filter((h) => !seenIds.has(h.id));
    if (ungrouped.length > 0) {
      groups.push({ key: '__ungrouped__', dungeon: null, heroes: ungrouped });
    }
    return groups;
  })();

  const handleStatusChange = (heroId: string, nextStatus: GradeStatus) => {
    setDraftStatuses((prev) => ({ ...prev, [heroId]: nextStatus }));
    if (nextStatus === 'belum') {
      setDraftScores((prev) => ({ ...prev, [heroId]: 0 }));
      setDraftScoreInputs((prev) => ({ ...prev, [heroId]: '0' }));
    } else if ((draftScores[heroId] ?? 0) === 0 && nextStatus === 'tuntas') {
      setDraftScores((prev) => ({ ...prev, [heroId]: 80 }));
      setDraftScoreInputs((prev) => ({ ...prev, [heroId]: '80' }));
    }
  };

  const handleScoreChange = (heroId: string, rawValue: string) => {
    const { inputValue, numericScore } = sanitizeScoreDraftInput(rawValue);
    setDraftScoreInputs((prev) => ({ ...prev, [heroId]: inputValue }));
    if (numericScore === null) {
      return;
    }
    setDraftScores((prev) => ({ ...prev, [heroId]: numericScore }));
    setDraftStatuses((prev) => ({
      ...prev,
      [heroId]: numericScore >= 70 ? 'tuntas' : 'remidial',
    }));
  };

  const handleScoreBlur = (heroId: string) => {
    const status = draftStatuses[heroId] ?? 'tuntas';
    const currentInput = draftScoreInputs[heroId];
    if (currentInput === undefined || currentInput.trim() === '') {
      const restored = status === 'belum' ? 0 : (draftScores[heroId] ?? 0);
      setDraftScoreInputs((prev) => ({ ...prev, [heroId]: String(restored) }));
    }
  };

  const renderHeroGradeCard = (hero: (typeof eligibleHeroes)[number]) => {
    if (!activeQuest) return null;
    const status = draftStatuses[hero.id] ?? 'tuntas';
    const score = status === 'belum' ? 0 : (draftScores[hero.id] ?? 80);
    const scoreInputValue =
      status === 'belum'
        ? (draftScoreInputs[hero.id] ?? '0')
        : (draftScoreInputs[hero.id] ?? String(score));
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
    const isNoteExpanded = Boolean(expandedNoteHeroIds[hero.id]);
    const hasNoteText = Boolean((draftNotes[hero.id] || '').trim());
    const isChecked = Boolean(selectedHeroIds[hero.id]);

    const savedStatusText = existingGrade
      ? (() => {
          const st = getEffectiveGradeStatus(existingGrade);
          if (st === 'belum') return 'Tersimpan: Belum';
          if (st === 'proses') return 'Tersimpan: Proses';
          if (st === 'remidial') return `Tersimpan: Remidial (${existingGrade.score})`;
          return `Tersimpan: Tuntas (${existingGrade.score})`;
        })()
      : 'Belum dinilai';

    return (
      <div
        key={hero.id}
        className={`pixel-box-inset border p-2.5 sm:p-3 transition-colors ${
          isChecked
            ? 'bg-[var(--bg-surface-alt)] border-[var(--accent-primary)]'
            : 'bg-[var(--bg-inset)] border-[var(--border-pixel)]/60'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          {/* Student Identity */}
          <div className="flex items-center gap-2.5 min-w-0 lg:flex-1 lg:basis-[220px]">
            <label className="min-w-[32px] min-h-[36px] flex items-center justify-center shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleHeroSelection(hero.id)}
                aria-label={`Pilih ${hero.name} untuk entry kolektif`}
                className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
              />
            </label>
            <PixelAvatar avatar={hero.avatar} size={36} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <h4 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
                  {hero.name}
                </h4>
                <span className="text-[11.5px] font-bold text-[var(--accent-success)] shrink-0 tabular-nums">
                  +{expEarned} EXP
                </span>
              </div>
              <p className="text-[11.5px] text-[var(--text-secondary)] truncate tabular-nums">
                NIS {hero.studentCode} · {savedStatusText}
                {!isNoteExpanded && hasNoteText ? ' · Ada catatan' : ''}
              </p>
            </div>
          </div>

          {/* Unified Controls: works seamlessly in mobile portrait/landscape & desktop without unmounting on keyboard open */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 sm:gap-2 lg:flex-[1.45] min-w-0">
            <select
              aria-label={`Status nilai ${hero.name}`}
              value={status}
              onChange={(e) =>
                handleStatusChange(hero.id, e.target.value as GradeStatus)
              }
              className={`min-w-[116px] flex-1 lg:flex-none lg:w-[144px] min-h-[44px] lg:min-h-[40px] px-2.5 py-1 border-2 rounded-[var(--inset-radius)] text-[14px] sm:text-[13px] font-bold cursor-pointer outline-none ${activeStatusMeta.selectClass}`}
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              aria-label={`Nilai ${hero.name}`}
              value={scoreInputValue}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => handleScoreChange(hero.id, e.target.value)}
              onBlur={() => handleScoreBlur(hero.id)}
              placeholder="0"
              className="!w-[68px] sm:!w-[74px] !min-h-[44px] lg:!min-h-[40px] !px-2 !text-[16px] sm:!text-[14px] shrink-0 text-center font-bold tabular-nums"
            />

            <PixelButton
              type="button"
              size="sm"
              variant={hasNoteText ? 'warning' : 'neutral'}
              onClick={() =>
                setExpandedNoteHeroIds((prev) => ({
                  ...prev,
                  [hero.id]: !prev[hero.id],
                }))
              }
              aria-label={`Catatan guru untuk ${hero.name}`}
              aria-expanded={isNoteExpanded}
              title="Buka / tutup catatan guru"
              className="lg:hidden !min-w-[44px] !min-h-[44px] !px-2.5 shrink-0"
            >
              <MessageSquare size={15} />
            </PixelButton>

            <div
              className={`${
                isNoteExpanded ? 'block' : 'hidden'
              } lg:block w-full lg:w-auto lg:flex-1 order-last lg:order-none min-w-0`}
            >
              <PixelInput
                aria-label={`Catatan guru ${hero.name}`}
                placeholder="Catatan guru (opsional)..."
                value={draftNotes[hero.id] ?? ''}
                onChange={(e) =>
                  setDraftNotes((prev) => ({
                    ...prev,
                    [hero.id]: e.target.value,
                  }))
                }
                className="w-full !min-h-[44px] lg:!min-h-[40px] !text-[16px] sm:!text-[13px]"
              />
            </div>

            <PixelButton
              type="button"
              size="sm"
              variant="success"
              onClick={() => handleSaveHeroGrade(hero.id)}
              className="shrink-0 !min-h-[44px] lg:!min-h-[40px] !px-3"
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
        subtitle="Isi nilai per tugas, pantau tugas selesai/belum tiap siswa, atau unggah & unduh rekap Excel"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PixelButton
              type="button"
              size="sm"
              variant="primary"
              onClick={openUploadModal}
              className="flex-1 min-[420px]:flex-initial !min-h-[44px] sm:!min-h-[40px]"
            >
              <Upload size={14} />
              Upload Nilai Excel
            </PixelButton>
            <PixelButton
              type="button"
              size="sm"
              variant="warning"
              onClick={openRecapModal}
              className="flex-1 min-[420px]:flex-initial !min-h-[44px] sm:!min-h-[40px]"
            >
              <Download size={14} />
              Unduh Excel &amp; Rekap
            </PixelButton>
          </div>
        }
      />

      {/* Mode Switcher: Input Nilai per Tugas vs Cek Progres Tugas Siswa */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setViewMode('grade')}
          className={`pixel-btn min-h-[44px] px-3 py-2 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'grade'
              ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <ClipboardCheck size={16} className="shrink-0" />
          <span>Input Nilai per Tugas</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('progress')}
          className={`pixel-btn min-h-[44px] px-3 py-2 font-pixel-ui text-[11px] sm:text-[11.5px] inline-flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'progress'
              ? 'bg-[var(--accent-warning)] text-[var(--text-on-warning)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
          }`}
        >
          <ListChecks size={16} className="shrink-0" />
          <span>Cek Progres Siswa</span>
        </button>
      </div>

      {viewMode === 'progress' ? (
        <div className="space-y-4">
          {/* Progress Filter Card */}
          <ThemedPanelCard className="p-3.5 space-y-3">
            <TierDungeonFilter
              idPrefix="prg"
              dungeons={state.dungeons}
              selectedTier={selectedTier}
              onChangeTier={setSelectedTier}
              selectedDungeonIds={selectedDungeonIds}
              onChangeDungeonIds={setSelectedDungeonIds}
              dungeonLabel="2. Filter Kelas / Guild"
              allClassesLabel="Semua Kelas Pengampu"
              highlightedRealmId={progressRealmId === 'all' ? undefined : progressRealmId}
              extraLeftSlot={
                <div>
                  <PixelFieldLabel htmlFor="prg-realm">1. Filter Mapel (Realm)</PixelFieldLabel>
                  <PixelSelect
                    id="prg-realm"
                    value={progressRealmId}
                    onChange={(e) => setProgressRealmId(e.target.value)}
                  >
                    <option value="all">
                      Semua Mapel ({state.quests.length} Tugas)
                    </option>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <PixelFieldLabel htmlFor="prg-search">
                  3. Cari Siswa (Nama / NIS)
                </PixelFieldLabel>
                <div className="relative">
                  <PixelInput
                    id="prg-search"
                    placeholder="Ketik nama atau NIS siswa..."
                    value={progressSearch}
                    onChange={(e) => setProgressSearch(e.target.value)}
                    className="!text-[16px] sm:!text-[14px]"
                  />
                </div>
              </div>

              <div>
                <PixelFieldLabel htmlFor="prg-student-filter">
                  4. Filter Ketuntasan Siswa
                </PixelFieldLabel>
                <PixelSelect
                  id="prg-student-filter"
                  value={progressStudentFilter}
                  onChange={(e) =>
                    setProgressStudentFilter(
                      e.target.value as
                        | 'all'
                        | 'has_unfinished'
                        | 'all_done'
                        | 'has_proses_remidial'
                    )
                  }
                  className="!text-[16px] sm:!text-[14px]"
                >
                  <option value="all">Semua Siswa ({allProgressRows.length})</option>
                  <option value="has_unfinished">
                    Belum Tuntas / Ada Tanggungan (
                    {allProgressRows.filter((r) => r.unfinishedCount > 0).length})
                  </option>
                  <option value="all_done">
                    Sudah Tuntas 100% (
                    {allProgressRows.filter((r) => r.isAllDone).length})
                  </option>
                  <option value="has_proses_remidial">
                    Ada Proses Dinilai / Remidial (
                    {
                      allProgressRows.filter(
                        (r) => r.prosesCount > 0 || r.remidialCount > 0
                      ).length
                    }
                    )
                  </option>
                </PixelSelect>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[var(--border-pixel)]/30">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-pixel-ui text-[10px] uppercase text-[var(--text-secondary)] mr-1">
                  Tampilkan Tugas:
                </span>
                {(
                  [
                    { id: 'all', label: 'Semua Tugas' },
                    { id: 'unfinished', label: 'Belum Selesai' },
                    { id: 'completed', label: 'Sudah Selesai' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProgressTaskFilter(tab.id)}
                    className={`pixel-btn min-h-[34px] px-2.5 font-pixel-ui text-[10.5px] cursor-pointer ${
                      progressTaskFilter === tab.id
                        ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredProgressRows.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <PixelButton
                    type="button"
                    size="sm"
                    variant="neutral"
                    onClick={() => {
                      const next: Record<string, boolean> = {};
                      filteredProgressRows.forEach((r) => {
                        next[r.hero.id] = true;
                      });
                      setExpandedProgressHeroIds(next);
                    }}
                    className="!min-h-[34px] !text-[11px]"
                  >
                    Buka Semua ({filteredProgressRows.length})
                  </PixelButton>
                  <PixelButton
                    type="button"
                    size="sm"
                    variant="neutral"
                    onClick={() => setExpandedProgressHeroIds({})}
                    className="!min-h-[34px] !text-[11px]"
                  >
                    Tutup Semua
                  </PixelButton>
                </div>
              )}
            </div>
          </ThemedPanelCard>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <ThemedPanelCard className="p-3 space-y-1">
              <p className="font-pixel-ui text-[10px] uppercase text-[var(--text-secondary)]">
                Siswa Ditampilkan
              </p>
              <p className="font-pixel-display text-[19px] sm:text-[21px] text-[var(--text-primary)] tabular-nums">
                {progressKpi.totalStudents}
              </p>
              <p className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                {progressGroupsByClass.length} Kelas aktif
              </p>
            </ThemedPanelCard>

            <ThemedPanelCard className="p-3 space-y-1">
              <p className="font-pixel-ui text-[10px] uppercase text-emerald-700">
                Tuntas 100%
              </p>
              <p className="font-pixel-display text-[19px] sm:text-[21px] text-emerald-700 tabular-nums">
                {progressKpi.allDoneStudents}
              </p>
              <p className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                Seluruh tugas selesai
              </p>
            </ThemedPanelCard>

            <ThemedPanelCard className="p-3 space-y-1">
              <p className="font-pixel-ui text-[10px] uppercase text-rose-700">
                Masih Ada Tanggungan
              </p>
              <p className="font-pixel-display text-[19px] sm:text-[21px] text-rose-700 tabular-nums">
                {progressKpi.pendingStudents}
              </p>
              <p className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                {progressKpi.totalUnfinished} tugas belum tuntas
              </p>
            </ThemedPanelCard>

            <ThemedPanelCard className="p-3 space-y-1">
              <p className="font-pixel-ui text-[10px] uppercase text-[var(--accent-warning)]">
                Ketuntasan Tugas
              </p>
              <p className="font-pixel-display text-[19px] sm:text-[21px] text-[var(--accent-warning)] tabular-nums">
                {progressKpi.overallPercent}%
              </p>
              <p className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                {progressKpi.totalTuntas}/{progressKpi.totalSlots} tugas selesai
              </p>
            </ThemedPanelCard>
          </div>

          {progressGroupsByClass.length === 0 ? (
            <PixelEmptyChest
              title="Tidak Ada Data Progres Siswa!"
              description="Coba ubah filter Mapel, Kelas, kata kunci pencarian, atau status ketuntasan siswa."
            />
          ) : (
            <div className="space-y-3.5">
              {progressGroupsByClass.map((group) => {
                const isClassCollapsed = Boolean(collapsedProgressClasses[group.key]);
                const classAllDone = group.rows.filter((r) => r.isAllDone).length;
                const classSlots = group.rows.reduce((sum, r) => sum + r.totalQuests, 0);
                const classTuntas = group.rows.reduce((sum, r) => sum + r.tuntasCount, 0);
                const classPercent =
                  classSlots > 0 ? Math.round((classTuntas / classSlots) * 100) : 0;

                return (
                  <ThemedPanelCard key={group.key} className="p-3 sm:p-3.5 space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedProgressClasses((prev) => ({
                          ...prev,
                          [group.key]: !prev[group.key],
                        }))
                      }
                      className="w-full flex items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--border-pixel)]/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-8 h-8 flex items-center justify-center bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 text-[var(--text-primary)] shrink-0">
                          {isClassCollapsed ? (
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
                            <span className="font-pixel-ui text-[10.5px] px-1.5 py-0.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] shrink-0">
                              {group.dungeon?.guildCode || 'LAIN'}
                            </span>
                            <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words">
                              {group.dungeon?.name || 'Kelas Lainnya'}
                            </h3>
                            {group.dungeon?.tier && (
                              <span className="text-[11.5px] text-[var(--text-secondary)] shrink-0">
                                ({group.dungeon.tier})
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                            {classAllDone}/{group.rows.length} siswa tuntas semua · {classTuntas}/{classSlots} tugas selesai ({classPercent}%)
                          </p>
                        </div>
                      </div>
                    </button>

                    {!isClassCollapsed && (
                      <div className="space-y-2.5">
                        {group.rows.map((row) => {
                          const isExpanded = Boolean(expandedProgressHeroIds[row.hero.id]);
                          const visibleItems = row.items.filter((item) => {
                            if (progressTaskFilter === 'unfinished') return !item.isCompleted;
                            if (progressTaskFilter === 'completed') return item.isCompleted;
                            return true;
                          });

                          return (
                            <div
                              key={row.hero.id}
                              className={`pixel-box-inset border p-2.5 sm:p-3 space-y-2.5 ${
                                row.isAllDone
                                  ? 'border-emerald-700/60 bg-[var(--bg-inset)]'
                                  : row.unfinishedCount > 0
                                    ? 'border-[var(--border-pixel)]/70 bg-[var(--bg-inset)]'
                                    : 'border-[var(--border-pixel)]/50 bg-[var(--bg-inset)]'
                              }`}
                            >
                              {/* Student Progress Summary Row */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                                  <PixelAvatar
                                    avatar={row.hero.avatar}
                                    size={38}
                                    className="shrink-0 mt-0.5 sm:mt-0"
                                  />
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                                      <div className="min-w-0">
                                        <h4 className="text-[14px] font-bold text-[var(--text-primary)] break-words leading-snug">
                                          {row.hero.name}
                                        </h4>
                                        <p className="text-[11.5px] text-[var(--text-secondary)] tabular-nums">
                                          NIS {row.hero.studentCode} · Rata-rata: {row.averageScore} · {row.totalExp} EXP
                                        </p>
                                      </div>

                                      <span
                                        className={`font-pixel-ui text-[10px] px-2 py-0.5 border shrink-0 tabular-nums ${
                                          row.totalQuests === 0
                                            ? 'bg-zinc-200 text-zinc-700 border-zinc-400'
                                            : row.isAllDone
                                              ? 'bg-emerald-600 text-white border-emerald-800'
                                              : 'bg-[var(--surface-tint)] text-[var(--text-primary)] border-[var(--border-pixel)]'
                                        }`}
                                      >
                                        {row.tuntasCount}/{row.totalQuests} Tuntas ({row.completionPercent}%)
                                      </span>
                                    </div>

                                    <PixelExpBar
                                      percent={row.completionPercent}
                                      color={
                                        row.isAllDone
                                          ? 'var(--accent-success)'
                                          : row.completionPercent >= 50
                                            ? 'var(--accent-warning)'
                                            : 'var(--accent-danger)'
                                      }
                                    />

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 border bg-emerald-100 text-emerald-900 border-emerald-700 tabular-nums">
                                        <CheckCircle2 size={12} />
                                        {row.tuntasCount} Selesai
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 border tabular-nums ${
                                          row.belumCount > 0
                                            ? 'bg-rose-100 text-rose-900 border-rose-700'
                                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-pixel)]/40'
                                        }`}
                                      >
                                        <XCircle size={12} />
                                        {row.belumCount} Belum
                                      </span>
                                      {row.remidialCount > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 border bg-amber-100 text-amber-900 border-amber-700 tabular-nums">
                                          <AlertTriangle size={12} />
                                          {row.remidialCount} Remidial
                                        </span>
                                      )}
                                      {row.prosesCount > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 border bg-teal-100 text-teal-900 border-teal-700 tabular-nums">
                                          <AlertCircle size={12} />
                                          {row.prosesCount} Proses
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <PixelButton
                                  type="button"
                                  size="sm"
                                  variant={isExpanded ? 'warning' : 'primary'}
                                  onClick={() =>
                                    setExpandedProgressHeroIds((prev) => ({
                                      ...prev,
                                      [row.hero.id]: !prev[row.hero.id],
                                    }))
                                  }
                                  className="w-full md:w-auto shrink-0 !min-h-[40px]"
                                >
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                  <span>
                                    {isExpanded ? 'Tutup Tugas' : `Cek Tugas (${row.totalQuests})`}
                                  </span>
                                </PixelButton>
                              </div>

                              {/* Expanded Task Checklist for this Student */}
                              {isExpanded && (
                                <div className="pt-2.5 border-t border-[var(--border-pixel)]/40 space-y-2">
                                  {row.totalQuests === 0 ? (
                                    <p className="text-[12px] text-[var(--text-muted)] italic py-1">
                                      Belum ada tugas yang ditugaskan ke mapel &amp; kelas siswa ini.
                                    </p>
                                  ) : visibleItems.length === 0 ? (
                                    <p className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-2">
                                      {progressTaskFilter === 'unfinished'
                                        ? 'Semua tugas siswa ini sudah selesai (Tuntas)!'
                                        : 'Belum ada tugas yang berstatus Tuntas pada siswa ini.'}
                                    </p>
                                  ) : (
                                    visibleItems.map((item) => {
                                      const urgency = getDeadlineUrgency(item.quest.deadline);
                                      const statusUi =
                                        item.status === 'tuntas'
                                          ? {
                                              label: 'Tuntas (Selesai)',
                                              badge:
                                                'bg-emerald-100 text-emerald-900 border-emerald-700',
                                              iconBox:
                                                'bg-emerald-600 text-white border-[var(--border-pixel)]',
                                              icon: <CheckCircle2 size={16} strokeWidth={2.5} />,
                                            }
                                          : item.status === 'proses'
                                            ? {
                                                label: 'Proses Dinilai',
                                                badge: 'bg-teal-100 text-teal-900 border-teal-700',
                                                iconBox:
                                                  'bg-teal-600 text-white border-[var(--border-pixel)]',
                                                icon: <AlertCircle size={16} strokeWidth={2.5} />,
                                              }
                                            : item.status === 'remidial'
                                              ? {
                                                  label: 'Remidial',
                                                  badge:
                                                    'bg-amber-100 text-amber-900 border-amber-700',
                                                  iconBox:
                                                    'bg-amber-400 text-[#18181b] border-[var(--border-pixel)]',
                                                  icon: <AlertTriangle size={16} strokeWidth={2.5} />,
                                                }
                                              : {
                                                  label: 'Belum Dikerjakan',
                                                  badge: 'bg-rose-100 text-rose-900 border-rose-700',
                                                  iconBox:
                                                    'bg-rose-600 text-white border-[var(--border-pixel)]',
                                                  icon: <XCircle size={16} strokeWidth={2.5} />,
                                                };

                                      return (
                                        <div
                                          key={item.quest.id}
                                          className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-pixel)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                        >
                                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                            <span
                                              className={`w-8 h-8 rounded shrink-0 border-2 flex items-center justify-center mt-0.5 ${statusUi.iconBox}`}
                                              title={statusUi.label}
                                            >
                                              {statusUi.icon}
                                            </span>
                                            <div className="min-w-0 flex-1 space-y-1">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="text-[13.5px] font-bold text-[var(--text-primary)] leading-snug break-words">
                                                  {item.quest.title}
                                                </p>
                                              </div>
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span
                                                  className={`text-[10.5px] font-bold px-1.5 py-0.5 border ${statusUi.badge}`}
                                                >
                                                  {statusUi.label}
                                                </span>
                                                {item.realm && (
                                                  <span className="font-pixel-ui text-[10px] px-1.5 py-0.5 border border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)]">
                                                    {item.realm.code}
                                                  </span>
                                                )}
                                                <QuestCategoryBadge
                                                  category={item.quest.category}
                                                  compact
                                                />
                                                {item.quest.chapter?.trim() && (
                                                  <span className="text-[10.5px] font-semibold px-1.5 py-0.5 border border-[var(--border-pixel)]/40 bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                                                    {formatChapterLabel(item.quest.chapter)}
                                                  </span>
                                                )}
                                                {item.isScheduledFuture && (
                                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 border border-sky-700 bg-sky-100 text-sky-900">
                                                    <Clock size={11} />
                                                    Terjadwal
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[11.5px] text-[var(--text-secondary)] tabular-nums">
                                                {item.score !== null ? (
                                                  <>
                                                    Nilai: <strong className="text-[var(--text-primary)]">{item.score}</strong> ·{' '}
                                                    <span className="text-[var(--accent-success)] font-semibold">
                                                      +{item.expEarned} EXP
                                                    </span>
                                                    {item.gradedDate
                                                      ? ` · Diperbarui ${formatRetroDate(item.gradedDate)}`
                                                      : ''}
                                                  </>
                                                ) : (
                                                  <>
                                                    Batas: {formatRetroDate(item.quest.deadline)} (
                                                    <span
                                                      className={
                                                        item.status === 'belum' && urgency.isOverdue
                                                          ? 'text-rose-700 font-bold'
                                                          : ''
                                                      }
                                                    >
                                                      {urgency.label}
                                                    </span>
                                                    )
                                                  </>
                                                )}
                                              </p>
                                              {item.feedback && (
                                                <p className="text-[11.5px] text-[var(--text-secondary)] italic break-words">
                                                  Catatan: {item.feedback}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <PixelButton
                                            type="button"
                                            size="sm"
                                            variant={item.isCompleted ? 'neutral' : 'primary'}
                                            onClick={() => handleJumpToGradeQuest(item.quest)}
                                            className="w-full sm:w-auto shrink-0 !min-h-[36px]"
                                          >
                                            Nilai / Edit
                                          </PixelButton>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ThemedPanelCard>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
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
              questGroupsForRealm.map((group) => (
                <optgroup
                  key={group.meta.id}
                  label={`${group.meta.label} (${group.items.length} Tugas)`}
                >
                  {group.items.map((q) => {
                    const scopeLabel = formatTargetDungeonsSummary(
                      q.dungeonId,
                      state.dungeons,
                      'Semua Kelas'
                    );
                    const chapSuffix = q.chapter?.trim()
                      ? ` · ${formatChapterLabel(q.chapter)}`
                      : '';
                    return (
                      <option key={q.id} value={q.id}>
                        [{group.meta.label}] [{scopeLabel}] {q.title}
                        {chapSuffix} (Max {q.maxExp} EXP)
                      </option>
                    );
                  })}
                </optgroup>
              ))
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
          {/* Active Mapel & Quest Summary Banner + Quick Status Filter */}
          <ThemedPanelCard className="p-3.5 space-y-2.5 bg-[var(--bg-surface-alt)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <BookOpen size={17} className="text-[var(--accent-warning)] shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <QuestCategoryBadge category={activeQuest.category} compact />
                    <p className="font-pixel-ui text-[10.5px] sm:text-[11px] text-[var(--accent-warning)] break-words">
                      {activeRealm ? `${activeRealm.code} — ${activeRealm.name}` : 'MAPEL'}
                      {activeQuest.chapter?.trim() ? ` · ${formatChapterLabel(activeQuest.chapter)}` : ''} · +{activeQuest.maxExp} EXP
                    </p>
                  </div>
                  <p className="text-[14px] font-bold text-[var(--text-primary)] break-words mt-0.5">
                    {activeQuest.title}
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-[var(--text-secondary)] tabular-nums shrink-0">
                {eligibleHeroes.length} Siswa · {heroGroupsByClass.length} Kelas
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-2 border-t border-[var(--border-pixel)]/30">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    {
                      id: 'all',
                      label: `Semua (${eligibleHeroes.length})`,
                    },
                    {
                      id: 'belum',
                      label: `Belum (${activeQuestStatusCounts.belum})`,
                    },
                    {
                      id: 'remidial',
                      label: `Remidial (${activeQuestStatusCounts.remidial})`,
                    },
                    {
                      id: 'proses',
                      label: `Proses (${activeQuestStatusCounts.proses})`,
                    },
                    {
                      id: 'tuntas',
                      label: `Tuntas (${activeQuestStatusCounts.tuntas})`,
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGradeStatusFilter(item.id)}
                    className={`pixel-btn min-h-[34px] px-2.5 font-pixel-ui text-[10.5px] cursor-pointer tabular-nums ${
                      gradeStatusFilter === item.id
                        ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-[240px]">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
                <PixelInput
                  aria-label="Cari siswa pada tugas ini"
                  placeholder="Cari nama / NIS siswa..."
                  value={gradeSearch}
                  onChange={(e) => setGradeSearch(e.target.value)}
                  className="!pl-8 !min-h-[38px] !text-[16px] sm:!text-[13px]"
                />
              </div>
            </div>
          </ThemedPanelCard>

          {/* Collective / Bulk Grading Panel (Nilai, Status & Catatan secara kolektif) */}
          <ThemedPanelCard className="p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/30">
              <div className="flex items-start sm:items-center justify-between gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckSquare size={16} className="text-[var(--accent-primary)] shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-pixel-display text-[12.5px] text-[var(--text-primary)]">
                      Entry Penilaian Kolektif
                    </h3>
                    <p className="text-[11.5px] text-[var(--text-secondary)]">
                      Atur nilai, status (Tuntas / Belum / Proses Dinilai / Remidial), dan catatan guru sekaligus untuk banyak siswa.
                    </p>
                  </div>
                </div>
                <PixelButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  onClick={() => setIsCollectiveOpen((prev) => !prev)}
                  aria-expanded={isCollectiveOpen}
                  className="shrink-0 !min-h-[38px] !px-2.5"
                >
                  {isCollectiveOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  <span className="hidden min-[400px]:inline">
                    {isCollectiveOpen ? 'Tutup' : 'Buka'}
                  </span>
                </PixelButton>
              </div>

              {isCollectiveOpen && (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <PixelButton
                    type="button"
                    size="sm"
                    variant="neutral"
                    onClick={handleSelectAllEligible}
                    className="flex-1 sm:flex-initial"
                  >
                    Centang Semua ({eligibleHeroes.length})
                  </PixelButton>
                  {selectedEligibleHeroes.length > 0 && (
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="neutral"
                      onClick={handleClearSelection}
                      className="flex-1 sm:flex-initial"
                    >
                      Batal Centang ({selectedEligibleHeroes.length})
                    </PixelButton>
                  )}
                </div>
              )}
            </div>

            {isCollectiveOpen && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <PixelFieldLabel htmlFor="bulk-target">Sasaran Siswa</PixelFieldLabel>
                    <PixelSelect
                      id="bulk-target"
                      value={bulkTargetMode}
                      onChange={(e) =>
                        setBulkTargetMode(
                          e.target.value as 'all' | 'selected' | 'ungraded'
                        )
                      }
                      className="!text-[16px] sm:!text-[14px]"
                    >
                      <option value="all">
                        Semua Siswa Tampil ({eligibleHeroes.length})
                      </option>
                      <option value="selected">
                        Siswa Tercentang ({selectedEligibleHeroes.length})
                      </option>
                      <option value="ungraded">
                        Belum Dinilai ({ungradedEligibleHeroes.length})
                      </option>
                    </PixelSelect>
                  </div>

                  <div>
                    <PixelFieldLabel htmlFor="bulk-status">Status Kolektif</PixelFieldLabel>
                    <PixelSelect
                      id="bulk-status"
                      value={bulkStatusInput}
                      onChange={(e) =>
                        setBulkStatusInput(e.target.value as GradeStatus | 'keep')
                      }
                      className="!text-[16px] sm:!text-[14px]"
                    >
                      <option value="keep">-- Tidak diubah (tetap) --</option>
                      <option value="tuntas">Tuntas</option>
                      <option value="proses">Proses Dinilai</option>
                      <option value="remidial">Remidial</option>
                      <option value="belum">Belum</option>
                    </PixelSelect>
                  </div>

                  <div>
                    <PixelFieldLabel htmlFor="bulk-score">
                      Nilai Kolektif (0–100)
                    </PixelFieldLabel>
                    <PixelInput
                      id="bulk-score"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      placeholder="Kosong = nilai tetap"
                      value={bulkScoreInput}
                      onChange={(e) =>
                        setBulkScoreInput(sanitizeScoreDraftInput(e.target.value).inputValue)
                      }
                      disabled={bulkStatusInput === 'belum'}
                      className="!text-[16px] sm:!text-[14px] tabular-nums"
                    />
                  </div>

                  <div>
                    <PixelFieldLabel htmlFor="bulk-note">
                      Catatan Kolektif
                    </PixelFieldLabel>
                    <PixelInput
                      id="bulk-note"
                      placeholder="Kosong = catatan tetap..."
                      value={bulkNoteInput}
                      onChange={(e) => {
                        setBulkNoteInput(e.target.value);
                        if (e.target.value.trim() !== '') setBulkClearNote(false);
                      }}
                      disabled={bulkClearNote}
                      className="!text-[16px] sm:!text-[14px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] cursor-pointer select-none min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={bulkClearNote}
                      onChange={(e) => {
                        setBulkClearNote(e.target.checked);
                        if (e.target.checked) setBulkNoteInput('');
                      }}
                      className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer shrink-0"
                    />
                    <span>Kosongkan catatan siswa pada sasaran ini</span>
                  </label>

                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="neutral"
                      disabled={
                        bulkTargetHeroes.length === 0 ||
                        !hasCollectiveChanges ||
                        isSavingBulk
                      }
                      onClick={() => void handleApplyCollective(false)}
                      className="!min-h-[44px] sm:!min-h-[40px]"
                    >
                      Terapkan ke Draft ({bulkTargetHeroes.length})
                    </PixelButton>
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={
                        bulkTargetHeroes.length === 0 ||
                        !hasCollectiveChanges ||
                        isSavingBulk
                      }
                      onClick={() => void handleApplyCollective(true)}
                      className="!min-h-[44px] sm:!min-h-[40px]"
                    >
                      <Save size={14} />
                      {isSavingBulk
                        ? 'Menyimpan...'
                        : `Terapkan & Simpan (${bulkTargetHeroes.length})`}
                    </PixelButton>
                    <PixelButton
                      type="button"
                      size="sm"
                      variant="success"
                      disabled={eligibleHeroes.length === 0 || isSavingBulk}
                      onClick={async () => {
                        setIsSavingBulk(true);
                        await saveHeroesBatch(
                          eligibleHeroes,
                          draftScores,
                          draftStatuses,
                          draftNotes,
                          draftScoreInputs
                        );
                        setIsSavingBulk(false);
                        setBulkFeedbackBanner(
                          `Semua perubahan (${eligibleHeroes.length} siswa) berhasil disimpan!`
                        );
                      }}
                      className="!min-h-[44px] sm:!min-h-[40px]"
                    >
                      <Save size={14} />
                      Simpan Semua ({eligibleHeroes.length})
                    </PixelButton>
                  </div>
                </div>
              </>
            )}

            {bulkFeedbackBanner && (
              <p className="text-[12.5px] font-semibold text-[var(--accent-success)] bg-[var(--bg-inset)] px-3 py-2 border border-[var(--accent-success)]">
                ✓ {bulkFeedbackBanner}
              </p>
            )}
          </ThemedPanelCard>

          {/* Grouped by Kelas */}
          {heroGroupsByClass.length === 0 ? (
            <PixelEmptyChest
              title="Tidak Ada Siswa yang Cocok!"
              description="Tidak ada siswa sesuai filter status atau pencarian nama/NIS pada tugas ini."
              action={
                <PixelButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  onClick={() => {
                    setGradeSearch('');
                    setGradeStatusFilter('all');
                  }}
                >
                  Reset Filter Siswa
                </PixelButton>
              }
            />
          ) : (
            heroGroupsByClass.map((group) => {
              const isCollapsed = Boolean(collapsedClasses[group.key]);
              const gradedCount = group.heroes.filter((h) =>
                state.grades.some(
                  (g) => g.heroId === h.id && g.questId === activeQuest.id
                )
              ).length;
              const checkedInClass = group.heroes.filter((h) =>
                Boolean(selectedHeroIds[h.id])
              ).length;
              const allInClassChecked =
                group.heroes.length > 0 && checkedInClass === group.heroes.length;

              return (
                <ThemedPanelCard key={group.key} className="p-3 sm:p-3.5 space-y-3">
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--border-pixel)]/40">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <label className="min-w-[32px] min-h-[36px] flex items-center justify-center shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allInClassChecked}
                          onChange={() => toggleClassSelection(group.heroes)}
                          aria-label={`Centang seluruh siswa ${group.dungeon?.name || 'kelas ini'}`}
                          title="Centang / batal centang seluruh kelas ini"
                          className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                        />
                      </label>
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
                            <span className="font-pixel-ui text-[10.5px] px-1.5 py-0.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] shrink-0">
                              {group.dungeon?.guildCode || 'LAIN'}
                            </span>
                            <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-primary)] leading-snug break-words">
                              {group.dungeon?.name || 'Kelas Lainnya'}
                            </h3>
                            {group.dungeon?.tier && (
                              <span className="text-[11.5px] text-[var(--text-secondary)] shrink-0">
                                ({group.dungeon.tier})
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 tabular-nums">
                            {gradedCount}/{group.heroes.length} siswa sudah dinilai
                            {checkedInClass > 0 ? ` · ${checkedInClass} tercentang` : ''}
                          </p>
                        </div>
                      </button>
                    </div>

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
            })
          )}
        </div>
      )}
        </>
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

          {eraAllSeasonsState && (
            <div>
              <PixelFieldLabel htmlFor="recap-season-scope">
                Cakupan Season Laporan
              </PixelFieldLabel>
              <PixelSelect
                id="recap-season-scope"
                value={recapSeasonScope}
                onChange={(e) => {
                  setRecapSeasonScope(
                    e.target.value === 'all_era' ? 'all_era' : 'active'
                  );
                  setDownloadNotice(null);
                }}
              >
                <option value="active">
                  Season Aktif ({getSeasonLabel(activeSeason)})
                </option>
                <option value="all_era">
                  Gabungan Semua Season (Era {activeEra?.name || ''} — Ganjil &amp; Genap)
                </option>
              </PixelSelect>
            </div>
          )}

          {recapPreview && (
            <div className="pixel-box-inset p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--accent-warning)] block">
                    {recapPreview.classLabel}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {recapPreview.academicTerm}
                  </span>
                </div>
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
                downloadAssessmentExcel(recapSourceState, recapPreview);
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
                downloadRecapHtmlReport(recapSourceState, recapPreview);
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
            Unggah kembali file <strong>.xlsx</strong> yang sudah diisi nilai angka (<strong>0–100</strong>) atau status (<em>Proses, Belum, Remidial, Tuntas</em>) pada kolom tugas.{' '}
            <strong>Sel yang diisi akan memperbarui/menimpa nilai lama</strong> pada tugas tersebut, sedangkan <strong>sel kosong atau "-" tidak menimpa</strong> nilai yang sudah ada (catatan guru lama tetap dipertahankan).
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
                  <span className="font-pixel-ui text-[10px] text-[var(--accent-success)] block">
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
                  {parsedExcel.entries.map((entry, idx) => {
                    const existing = state.grades.find(
                      (g) => g.heroId === entry.heroId && g.questId === entry.questId
                    );
                    return (
                      <div
                        key={`${entry.heroId}-${entry.questId}-${idx}`}
                        className="p-2 flex items-center justify-between gap-2 text-[12px]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[var(--text-primary)] truncate">
                            {entry.heroName} ({entry.studentCode})
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate">
                            {entry.questTitle} ·{' '}
                            <span
                              className={
                                existing
                                  ? 'font-semibold text-[var(--accent-warning)]'
                                  : 'font-semibold text-[var(--accent-success)]'
                              }
                            >
                              {existing
                                ? `Timpa nilai lama (${existing.score})`
                                : 'Nilai baru'}
                            </span>
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
                    );
                  })}
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
