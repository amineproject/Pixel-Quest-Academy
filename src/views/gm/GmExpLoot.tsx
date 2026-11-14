import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Save,
  Upload,
  XCircle,
} from 'lucide-react';
import { AcademyState, ExpGrade, GradeStatus } from '../../types/lms';
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
  getRankFromScore,
  sortDungeonsAlphabetically,
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

const STATUS_OPTIONS: {
  id: GradeStatus;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'tuntas',
    label: 'Tuntas',
    activeClass: 'bg-emerald-600 text-white border-[var(--border-pixel)] font-bold shadow-[2px_2px_0_var(--shadow-ink)]',
    icon: <CheckCircle2 size={14} />,
  },
  {
    id: 'proses',
    label: 'Proses Dinilai',
    activeClass: 'bg-teal-600 text-white border-[var(--border-pixel)] font-bold shadow-[2px_2px_0_var(--shadow-ink)]',
    icon: <AlertCircle size={14} />,
  },
  {
    id: 'remidial',
    label: 'Remidial',
    activeClass: 'bg-amber-400 text-[#18181b] border-[var(--border-pixel)] font-bold shadow-[2px_2px_0_var(--shadow-ink)]',
    icon: <AlertTriangle size={14} />,
  },
  {
    id: 'belum',
    label: 'Belum Dikerjakan',
    activeClass: 'bg-rose-600 text-white border-[var(--border-pixel)] font-bold shadow-[2px_2px_0_var(--shadow-ink)]',
    icon: <XCircle size={14} />,
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
  const questsForRealm = state.quests.filter(
    (q) => q.realmId === selectedRealmId
  );
  const [selectedQuestId, setSelectedQuestId] = useState(
    questsForRealm[0]?.id || ''
  );
  const [selectedDungeonId, setSelectedDungeonId] = useState('all');

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
    const nextQuests = state.quests.filter(
      (q) => q.realmId === selectedRealmId
    );
    if (!nextQuests.some((q) => q.id === selectedQuestId)) {
      setSelectedQuestId(nextQuests[0]?.id || '');
    }
  }, [selectedRealmId, selectedQuestId, state.quests]);

  const activeQuest = state.quests.find((q) => q.id === selectedQuestId);

  const sortedDungeons = sortDungeonsAlphabetically(state.dungeons);

  const openRecapModal = () => {
    const defaultDungeon =
      selectedDungeonId !== 'all'
        ? selectedDungeonId
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
      if (selectedDungeonId !== 'all' && h.dungeonId !== selectedDungeonId) {
        return false;
      }
      if (
        activeQuest &&
        activeQuest.dungeonId !== 'all' &&
        selectedDungeonId === 'all' &&
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

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="EXP & Loot / Penilaian"
        subtitle="Isi status & skor siswa atau unduh/unggah tabel penilaian Excel"
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
          <PixelFieldLabel htmlFor="grd-dng">3. Filter Kelas / Dungeon</PixelFieldLabel>
          <PixelSelect
            id="grd-dng"
            value={selectedDungeonId}
            onChange={(e) => setSelectedDungeonId(e.target.value)}
          >
            <option value="all">
              Target Quest ({activeQuest?.dungeonId === 'all' ? 'All Guilds' : 'Guild Terkait'})
            </option>
            <DungeonOptGroupOptions dungeons={sortedDungeons} />
          </PixelSelect>
        </div>
      </ThemedPanelCard>

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
            const status = draftStatuses[hero.id] ?? 'tuntas';
            const score = status === 'belum' ? 0 : (draftScores[hero.id] ?? 80);
            const rank = getRankFromScore(score);
            const expEarned =
              status === 'belum'
                ? 0
                : calculateExpEarned(score, activeQuest.maxExp);
            const existingGrade = state.grades.find(
              (g) => g.heroId === hero.id && g.questId === activeQuest.id
            );
            const savedStatus = getEffectiveGradeStatus(existingGrade);

            return (
              <ThemedPanelCard key={hero.id} className="p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <PixelAvatar avatar={hero.avatar} size={40} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold text-[var(--text-primary)] truncate">
                        {hero.name}
                      </h3>
                      <p className="text-[12px] text-[var(--text-secondary)] break-words">
                        {existingGrade
                          ? `Tersimpan: ${existingGrade.score}/100 · Status: ${savedStatus.toUpperCase()}`
                          : 'Belum dinilai (Belum Dikerjakan)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="font-pixel-display text-[12px] text-[var(--accent-warning)]">
                      RANK {rank}
                    </p>
                    <p className="text-[12.5px] font-bold text-[var(--accent-success)]">
                      +{expEarned} EXP
                    </p>
                  </div>
                </div>

                {/* Status Symbol Selector for Student View */}
                <div className="space-y-1.5">
                  <span className="font-pixel-ui text-[9px] text-[var(--text-muted)] block uppercase">
                    Status di Akun Siswa (Simbol):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = status === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setDraftStatuses({ ...draftStatuses, [hero.id]: opt.id });
                            if (opt.id === 'belum') {
                              setDraftScores({ ...draftScores, [hero.id]: 0 });
                            } else if ((draftScores[hero.id] ?? 0) === 0 && opt.id === 'tuntas') {
                              setDraftScores({ ...draftScores, [hero.id]: 80 });
                            }
                          }}
                          className={`min-h-[36px] px-2 py-1 border-2 flex items-center justify-center gap-1.5 text-[11px] cursor-pointer transition-all ${
                            isSelected
                              ? opt.activeClass
                              : 'border-[var(--border-pixel)]/50 bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {opt.icon}
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Score slider & numeric input */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    aria-label={`Skor ${hero.name}`}
                    value={score}
                    onChange={(e) => {
                      const nextScore = Number(e.target.value);
                      setDraftScores({
                        ...draftScores,
                        [hero.id]: nextScore,
                      });
                      setDraftStatuses({
                        ...draftStatuses,
                        [hero.id]: nextScore >= 70 ? 'tuntas' : 'remidial',
                      });
                    }}
                    className="min-w-0 flex-1 accent-[var(--accent-warning)] min-h-[36px] cursor-pointer"
                  />
                  <PixelInput
                    type="number"
                    min={0}
                    max={100}
                    aria-label={`Input nilai angka ${hero.name}`}
                    value={score}
                    onChange={(e) => {
                      const nextScore = Math.max(
                        0,
                        Math.min(100, Number(e.target.value) || 0)
                      );
                      setDraftScores({
                        ...draftScores,
                        [hero.id]: nextScore,
                      });
                      setDraftStatuses({
                        ...draftStatuses,
                        [hero.id]: nextScore >= 70 ? 'tuntas' : 'remidial',
                      });
                    }}
                    className="!w-16 sm:!w-20 shrink-0 text-center tabular-nums"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                    className="shrink-0"
                  >
                    <Save size={14} />
                    Save
                  </PixelButton>
                </div>
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
                  selectedDungeonId !== 'all' ? selectedDungeonId : 'all';
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
