import { AvatarClass, Dungeon, HeroStudent } from '../types/lms';
import { sortDungeonsAlphabetically } from './exp';

export interface ParsedStudentImportRow {
  rowNumber: number;
  name: string;
  classInput: string;
  matchedDungeonId: string;
  matchedDungeonLabel: string;
  studentCode: string;
  username: string;
  pin: string;
  avatar: AvatarClass;
  active: boolean;
  error?: string;
}

const AVATAR_CYCLE: AvatarClass[] = [
  'knight',
  'alchemist',
  'mage',
  'ranger',
  'scholar',
];

const HERO_CLASS_LABELS: Record<AvatarClass, string> = {
  knight: 'Arcane Knight',
  alchemist: 'Potion Alchemist',
  mage: 'Rune Mage',
  ranger: 'Forest Ranger',
  scholar: 'Scroll Scholar',
  guild_master: 'Guild Master',
};

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  if (tabs >= semis && tabs >= commas && tabs > 0) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function generateRandomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sanitizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 5);
}

export function generateImportTemplateCsv(dungeons: Dungeon[]): string {
  const sampleDungeon = sortDungeonsAlphabetically(dungeons)[0];
  const sampleClass = sampleDungeon ? sampleDungeon.guildCode : 'X-IPA-1';
  const rows = [
    ['Nama Lengkap', 'Kelas', 'NIS', 'Username', 'PIN'],
    ['Rian Pratama', sampleClass, '261101', 'rian5', '482910'],
    ['Siti Aminah', sampleClass, '261102', 'siti2', ''],
    ['Budi Nugroho', sampleClass, '', '', ''],
  ];
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n')
  );
}

export function downloadStudentImportTemplate(dungeons: Dungeon[]) {
  const csv = generateImportTemplateCsv(dungeons);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_import_siswa.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadImportedCredentialsCsv(
  rows: ParsedStudentImportRow[]
) {
  const header = ['No', 'Nama Lengkap', 'Kelas', 'NIS', 'Username', 'PIN Awal'];
  const body = rows.map((r, i) => [
    String(i + 1),
    r.name,
    r.matchedDungeonLabel,
    r.studentCode,
    r.username || '-',
    r.pin || '(Tanpa PIN)',
  ]);
  const csv =
    '\uFEFF' +
    [header, ...body]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daftar_akun_siswa_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseStudentImportText(
  rawText: string,
  options: {
    dungeons: Dungeon[];
    existingHeroes: HeroStudent[];
    defaultDungeonId: string;
    autoGeneratePin: boolean;
  }
): ParsedStudentImportRow[] {
  const cleaned = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];

  const delimiter = detectDelimiter(cleaned);
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const firstCells = splitDelimitedLine(lines[0], delimiter).map((c) =>
    c.toLowerCase().trim()
  );

  const looksLikeHeader = firstCells.some((c) =>
    [
      'nama',
      'nama lengkap',
      'nama siswa',
      'name',
      'nis',
      'kode',
      'kelas',
      'guild',
      'username',
      'pin',
    ].includes(c)
  );

  let colMap = {
    name: 0,
    kelas: 1,
    nis: 2,
    username: 3,
    pin: 4,
  };

  let dataStartIndex = 0;
  if (looksLikeHeader) {
    dataStartIndex = 1;
    const findIdx = (patterns: string[]) =>
      firstCells.findIndex((c) => patterns.some((p) => c === p || c.includes(p)));

    const nameIdx = findIdx(['nama lengkap', 'nama siswa', 'nama', 'name']);
    const kelasIdx = findIdx(['kelas', 'guild', 'rombel', 'dungeon', 'class']);
    const nisIdx = findIdx(['nis', 'student_code', 'kode siswa', 'no induk']);
    const userIdx = findIdx(['username', 'user']);
    const pinIdx = findIdx(['pin', 'sandi', 'password']);

    colMap = {
      name: nameIdx >= 0 ? nameIdx : 0,
      kelas: kelasIdx,
      nis: nisIdx,
      username: userIdx,
      pin: pinIdx,
    };
  }

  const usedStudentCodes = new Set(
    options.existingHeroes.map((h) => h.studentCode.toLowerCase())
  );
  const usedUsernames = new Set(
    options.existingHeroes
      .map((h) => h.username.trim().toLowerCase())
      .filter(Boolean)
  );

  let nextNisCounter = 261001 + options.existingHeroes.length;
  const allocateNis = (preferred: string): string => {
    const cleanPref = preferred.trim();
    if (cleanPref && !usedStudentCodes.has(cleanPref.toLowerCase())) {
      usedStudentCodes.add(cleanPref.toLowerCase());
      return cleanPref;
    }
    while (usedStudentCodes.has(String(nextNisCounter).toLowerCase())) {
      nextNisCounter++;
    }
    const assigned = String(nextNisCounter);
    usedStudentCodes.add(assigned.toLowerCase());
    nextNisCounter++;
    return assigned;
  };

  const matchDungeon = (rawClass: string): Dungeon | undefined => {
    const q = rawClass.trim().toLowerCase();
    if (q) {
      const exact = options.dungeons.find(
        (d) =>
          d.guildCode.toLowerCase() === q ||
          d.name.toLowerCase() === q ||
          `${d.guildCode} ${d.name}`.toLowerCase() === q
      );
      if (exact) return exact;
      const partial = options.dungeons.find(
        (d) =>
          d.guildCode.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q)
      );
      if (partial) return partial;
    }
    return options.dungeons.find((d) => d.id === options.defaultDungeonId) || options.dungeons[0];
  };

  const results: ParsedStudentImportRow[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const cells = splitDelimitedLine(lines[i], delimiter);
    const rawName = (cells[colMap.name] || '').trim();
    if (!rawName) continue;

    const rawClass = colMap.kelas >= 0 ? (cells[colMap.kelas] || '').trim() : '';
    const rawNis = colMap.nis >= 0 ? (cells[colMap.nis] || '').trim() : '';
    const rawUsername =
      colMap.username >= 0 ? (cells[colMap.username] || '').trim() : '';
    const rawPin = colMap.pin >= 0 ? (cells[colMap.pin] || '').trim() : '';

    const matchedDng = matchDungeon(rawClass);
    const studentCode = allocateNis(rawNis);

    let username = sanitizeUsername(rawUsername);
    if (username && usedUsernames.has(username)) {
      username = '';
    }
    if (username) {
      usedUsernames.add(username);
    }

    const pin = rawPin
      ? rawPin.slice(0, 12)
      : options.autoGeneratePin
        ? generateRandomPin()
        : '';

    const avatar = AVATAR_CYCLE[results.length % AVATAR_CYCLE.length];

    results.push({
      rowNumber: i + 1,
      name: rawName,
      classInput: rawClass,
      matchedDungeonId: matchedDng?.id || '',
      matchedDungeonLabel: matchedDng
        ? `${matchedDng.guildCode} — ${matchedDng.name}`
        : 'Belum ada kelas',
      studentCode,
      username,
      pin,
      avatar,
      active: true,
      error: !matchedDng ? 'Kelas belum dipilih / tidak ditemukan' : undefined,
    });
  }

  return results;
}

export function buildHeroesFromImportRows(
  rows: ParsedStudentImportRow[],
  dungeons: Dungeon[]
): HeroStudent[] {
  const today = new Date().toISOString().slice(0, 10);
  const stamp = Date.now();
  return rows
    .filter((r) => r.name.trim() && r.matchedDungeonId)
    .map((r, index) => {
      const dungeon = dungeons.find((d) => d.id === r.matchedDungeonId);
      return {
        id: `hr-${stamp}-${index}`,
        name: r.name.trim(),
        username: r.username,
        studentCode: r.studentCode,
        dungeonId: r.matchedDungeonId,
        avatar: r.avatar,
        heroClass: HERO_CLASS_LABELS[r.avatar],
        active: r.active,
        joinedDate: today,
        enrolledRealmIds: dungeon?.realmIds ? [...dungeon.realmIds] : [],
        ...(r.pin ? { pin: r.pin, hasPin: true } : { hasPin: false }),
      };
    });
}
