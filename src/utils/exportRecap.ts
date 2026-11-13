import {
  AcademyState,
  ActiveQuest,
  Dungeon,
  GradeStatus,
  HeroStudent,
} from '../types/lms';
import {
  getEffectiveGradeStatus,
  getHeroEffectiveRealmIds,
  getRankFromScore,
  sortDungeonsAlphabetically,
} from './exp';

export interface RecapQuestCell {
  questId: string;
  enrolled: boolean;
  status: GradeStatus | null;
  score: number | null;
  expEarned: number;
  feedback: string;
  displayText: string;
}

export interface RecapRow {
  no: number;
  hero: HeroStudent;
  dungeonName: string;
  dungeonCode: string;
  dungeonTier: string;
  cells: RecapQuestCell[];
  tuntasCount: number;
  prosesCount: number;
  remidialCount: number;
  belumCount: number;
  avgScore: number;
  totalExp: number;
  rank: string;
}

export interface ClassRecapData {
  title: string;
  classLabel: string;
  realmLabel: string;
  academicTerm: string;
  gmName: string;
  generatedAt: string;
  quests: ActiveQuest[];
  rows: RecapRow[];
}

export function formatStatusLabel(status: GradeStatus): string {
  switch (status) {
    case 'tuntas':
      return 'Tuntas';
    case 'proses':
      return 'Proses Dinilai';
    case 'remidial':
      return 'Remidial';
    case 'belum':
    default:
      return 'Belum Dikerjakan';
  }
}

export function buildClassRecapData(
  state: AcademyState,
  dungeonId: string,
  realmId: string
): ClassRecapData {
  const sortedDungeons = sortDungeonsAlphabetically(state.dungeons);
  const selectedDungeon: Dungeon | undefined =
    dungeonId === 'all' ? undefined : sortedDungeons.find((d) => d.id === dungeonId);
  const selectedRealm =
    realmId === 'all' ? undefined : state.realms.find((r) => r.id === realmId);

  // Filter heroes by selected class (sorted by class tier & guildCode -> student name)
  const dungeonOrder = new Map(sortedDungeons.map((d, idx) => [d.id, idx]));
  const heroesInScope = state.heroes
    .filter((h) => (dungeonId === 'all' ? true : h.dungeonId === dungeonId))
    .sort((a, b) => {
      const idxA = dungeonOrder.get(a.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      const idxB = dungeonOrder.get(b.dungeonId) ?? Number.MAX_SAFE_INTEGER;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
    });

  // Determine relevant quests for selected class & realm filter
  const questsInScope = state.quests
    .filter((q) => {
      const matchRealm = realmId === 'all' || q.realmId === realmId;
      if (!matchRealm) return false;
      if (dungeonId === 'all') return true;
      const matchDungeon = q.dungeonId === 'all' || q.dungeonId === dungeonId;
      const dungeonAllowsRealm =
        !selectedDungeon?.realmIds ||
        selectedDungeon.realmIds.length === 0 ||
        selectedDungeon.realmIds.includes(q.realmId);
      const hasAnyGradeInClass = state.grades.some(
        (g) => g.questId === q.id && heroesInScope.some((h) => h.id === g.heroId)
      );
      return (matchDungeon && dungeonAllowsRealm) || hasAnyGradeInClass;
    })
    .sort((a, b) => {
      const rA = state.realms.find((r) => r.id === a.realmId)?.name || '';
      const rB = state.realms.find((r) => r.id === b.realmId)?.name || '';
      const rCmp = rA.localeCompare(rB, 'id', { sensitivity: 'base' });
      if (rCmp !== 0) return rCmp;
      return a.title.localeCompare(b.title, 'id', { numeric: true, sensitivity: 'base' });
    });

  const rows: RecapRow[] = heroesInScope.map((hero, idx) => {
    const dng = sortedDungeons.find((d) => d.id === hero.dungeonId);
    const allowedRealms = getHeroEffectiveRealmIds(hero, state.dungeons);
    const heroGrades = state.grades.filter((g) => g.heroId === hero.id);

    let tuntasCount = 0;
    let prosesCount = 0;
    let remidialCount = 0;
    let belumCount = 0;
    let scoredSum = 0;
    let scoredCount = 0;
    let totalExp = 0;

    const cells: RecapQuestCell[] = questsInScope.map((quest) => {
      const grade = heroGrades.find((g) => g.questId === quest.id);
      const isRealmAllowed =
        !allowedRealms || allowedRealms.includes(quest.realmId) || Boolean(grade);
      const isQuestForHeroDungeon =
        quest.dungeonId === 'all' ||
        quest.dungeonId === hero.dungeonId ||
        Boolean(grade);
      const enrolled = isRealmAllowed && isQuestForHeroDungeon;

      if (!enrolled) {
        return {
          questId: quest.id,
          enrolled: false,
          status: null,
          score: null,
          expEarned: 0,
          feedback: '',
          displayText: '-',
        };
      }

      const status = getEffectiveGradeStatus(grade);
      if (status === 'tuntas') tuntasCount += 1;
      else if (status === 'proses') prosesCount += 1;
      else if (status === 'remidial') remidialCount += 1;
      else belumCount += 1;

      const score = grade ? (status === 'belum' ? 0 : grade.score) : 0;
      const expEarned = grade ? (status === 'belum' ? 0 : grade.expEarned) : 0;

      if (grade && status !== 'belum') {
        scoredSum += grade.score;
        scoredCount += 1;
        totalExp += grade.expEarned;
      }

      const statusText = formatStatusLabel(status);
      const displayText =
        grade && status !== 'belum' ? `${score} (${statusText})` : statusText;

      return {
        questId: quest.id,
        enrolled: true,
        status,
        score: grade ? score : null,
        expEarned,
        feedback: grade?.feedback || '',
        displayText,
      };
    });

    const avgScore = scoredCount > 0 ? Math.round(scoredSum / scoredCount) : 0;
    const rank = scoredCount > 0 ? getRankFromScore(avgScore) : '-';

    return {
      no: idx + 1,
      hero,
      dungeonName: dng ? dng.name : 'Belum Ada Kelas',
      dungeonCode: dng ? dng.guildCode : '-',
      dungeonTier: dng ? dng.tier : '-',
      cells,
      tuntasCount,
      prosesCount,
      remidialCount,
      belumCount,
      avgScore,
      totalExp,
      rank,
    };
  });

  return {
    title: 'Rekap Penilaian Kelas',
    classLabel: selectedDungeon
      ? `${selectedDungeon.name} (${selectedDungeon.guildCode}) - ${selectedDungeon.tier}`
      : 'Semua Kelas',
    realmLabel: selectedRealm
      ? `${selectedRealm.code} - ${selectedRealm.name}`
      : 'Semua Mata Pelajaran',
    academicTerm: state.settings.academicTerm,
    gmName: state.gmProfile.name,
    generatedAt: new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    quests: questsInScope,
    rows,
  };
}

function escapeCsvField(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(value: string | number): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadRecapCsv(state: AcademyState, recap: ClassRecapData) {
  const questHeaders = recap.quests.map((q) => {
    const realm = state.realms.find((r) => r.id === q.realmId);
    return `${realm ? `[${realm.code}] ` : ''}${q.title}`;
  });

  const metaRows = [
    ['REKAP PENILAIAN SISWA — PIXEL QUEST ACADEMY'],
    ['Kelas', recap.classLabel],
    ['Mata Pelajaran', recap.realmLabel],
    ['Periode Akademik', recap.academicTerm],
    ['Guru / Game Master', recap.gmName],
    ['Tanggal Unduh', recap.generatedAt],
    [],
  ];

  const headerRow = [
    'No',
    'NIS',
    'Nama Siswa',
    'Username',
    'Kelas',
    'Kode Kelas',
    'Tingkat',
    'Status Akun',
    ...questHeaders,
    'Tuntas',
    'Proses Dinilai',
    'Remidial',
    'Belum Dikerjakan',
    'Rata-rata Nilai',
    'Rank',
    'Total EXP',
  ];

  const bodyRows = recap.rows.map((row) => [
    row.no,
    row.hero.studentCode,
    row.hero.name,
    row.hero.username,
    row.dungeonName,
    row.dungeonCode,
    row.dungeonTier,
    row.hero.active ? 'Aktif' : 'Nonaktif',
    ...row.cells.map((c) => c.displayText),
    row.tuntasCount,
    row.prosesCount,
    row.remidialCount,
    row.belumCount,
    row.avgScore,
    row.rank,
    row.totalExp,
  ]);

  const csvLines = [...metaRows, headerRow, ...bodyRows]
    .map((line) => line.map(escapeCsvField).join(','))
    .join('\r\n');

  // Prefix with UTF-8 BOM so Microsoft Excel reads Indonesian text cleanly
  const blob = new Blob(['\uFEFF' + csvLines], {
    type: 'text/csv;charset=utf-8;',
  });
  const slug = sanitizeFileName(recap.classLabel || 'semua-kelas');
  const datePart = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `rekap-penilaian-${slug}-${datePart}.csv`);
}

export function downloadRecapHtmlReport(state: AcademyState, recap: ClassRecapData) {
  const statusColor = (st: GradeStatus | null) => {
    switch (st) {
      case 'tuntas':
        return 'background:#dcfce7;color:#166534;font-weight:700;';
      case 'proses':
        return 'background:#ecfccb;color:#3f6212;font-weight:700;';
      case 'remidial':
        return 'background:#fef3c7;color:#b45309;font-weight:700;';
      case 'belum':
        return 'background:#fee2e2;color:#991b1b;font-weight:700;';
      default:
        return 'color:#64748b;';
    }
  };

  const questHeadersHtml = recap.quests
    .map((q) => {
      const realm = state.realms.find((r) => r.id === q.realmId);
      return `<th>${escapeHtml(realm ? `[${realm.code}] ` : '')}${escapeHtml(q.title)}</th>`;
    })
    .join('');

  const rowsHtml = recap.rows
    .map((row) => {
      const cellsHtml = row.cells
        .map(
          (c) =>
            `<td style="text-align:center;${statusColor(c.status)}">${escapeHtml(c.displayText)}</td>`
        )
        .join('');

      return `<tr>
        <td style="text-align:center;">${row.no}</td>
        <td>${escapeHtml(row.hero.studentCode)}</td>
        <td><strong>${escapeHtml(row.hero.name)}</strong></td>
        <td>${escapeHtml(row.dungeonName)} (${escapeHtml(row.dungeonCode)})</td>
        ${cellsHtml}
        <td style="text-align:center;color:#166534;font-weight:700;">${row.tuntasCount}</td>
        <td style="text-align:center;color:#3f6212;font-weight:700;">${row.prosesCount}</td>
        <td style="text-align:center;color:#b45309;font-weight:700;">${row.remidialCount}</td>
        <td style="text-align:center;color:#991b1b;font-weight:700;">${row.belumCount}</td>
        <td style="text-align:center;font-weight:700;">${row.avgScore}</td>
        <td style="text-align:center;font-weight:700;">${escapeHtml(row.rank)}</td>
        <td style="text-align:center;">${row.totalExp}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Rekap Penilaian - ${escapeHtml(recap.classLabel)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 6px; }
    .meta { font-size: 13px; margin-bottom: 16px; color: #334155; line-height: 1.6; }
    .meta strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 8px; vertical-align: middle; }
    th { background: #1e293b; color: #f8fafc; text-align: center; }
    tr:nth-child(even) td { background-color: #f8fafc; }
    .print-bar { margin-bottom: 16px; }
    @media print { .print-bar { display: none; } body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button onclick="window.print()" style="padding:8px 14px;background:#16a34a;color:#fff;border:none;font-weight:bold;cursor:pointer;border-radius:4px;">
      Cetak / Simpan sebagai PDF
    </button>
  </div>
  <h1>REKAP PENILAIAN KELAS — PIXEL QUEST ACADEMY</h1>
  <div class="meta">
    <div><strong>Kelas:</strong> ${escapeHtml(recap.classLabel)}</div>
    <div><strong>Mata Pelajaran:</strong> ${escapeHtml(recap.realmLabel)}</div>
    <div><strong>Periode Akademik:</strong> ${escapeHtml(recap.academicTerm)}</div>
    <div><strong>Guru / Game Master:</strong> ${escapeHtml(recap.gmName)}</div>
    <div><strong>Tanggal Cetak:</strong> ${escapeHtml(recap.generatedAt)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>NIS</th>
        <th>Nama Siswa</th>
        <th>Kelas</th>
        ${questHeadersHtml}
        <th>Tuntas</th>
        <th>Proses</th>
        <th>Remidial</th>
        <th>Belum</th>
        <th>Rata-rata</th>
        <th>Rank</th>
        <th>Total EXP</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="12" style="text-align:center;">Belum ada data siswa pada kelas ini.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const slug = sanitizeFileName(recap.classLabel || 'semua-kelas');
  const datePart = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `laporan-penilaian-${slug}-${datePart}.html`);
}
