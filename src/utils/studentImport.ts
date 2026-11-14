import * as XLSX from 'xlsx';
import { AvatarClass, Dungeon, HeroStudent, Realm } from '../types/lms';
import { sortDungeonsAlphabetically } from './exp';

export interface ParsedStudentImportRow {
  rowNumber: number;
  name: string;
  username: string;
  studentCode: string;
  classInput: string;
  matchedDungeonId: string;
  matchedDungeonLabel: string;
  mapelInput: string;
  enrolledRealmIds: string[];
  enrolledRealmLabels: string[];
  avatar: AvatarClass;
  heroClass: string;
  pin: string;
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

const VALID_HERO_AVATARS = new Set<AvatarClass>([
  'knight',
  'alchemist',
  'mage',
  'ranger',
  'scholar',
]);

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
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 5);
}

function resolveAvatar(raw: string, fallbackIndex: number): AvatarClass {
  const q = raw.trim().toLowerCase();
  if (VALID_HERO_AVATARS.has(q as AvatarClass)) {
    return q as AvatarClass;
  }
  if (q.includes('knight') || q.includes('ksatria')) return 'knight';
  if (q.includes('alch') || q.includes('alkem')) return 'alchemist';
  if (q.includes('mage') || q.includes('penyihir')) return 'mage';
  if (q.includes('rang') || q.includes('pemanah')) return 'ranger';
  if (q.includes('schol') || q.includes('cendekia')) return 'scholar';
  return AVATAR_CYCLE[fallbackIndex % AVATAR_CYCLE.length];
}

function resolveActiveStatus(raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  if (
    ['nonaktif', 'inactive', 'tidak aktif', 'tidak', 'no', 'false', '0'].includes(q)
  ) {
    return false;
  }
  return true;
}

function resolveEnrolledRealms(
  rawMapel: string,
  matchedDungeon: Dungeon | undefined,
  realms: Realm[]
): string[] {
  const trimmed = rawMapel.trim();
  if (!trimmed) {
    if (matchedDungeon?.realmIds && matchedDungeon.realmIds.length > 0) {
      return [...matchedDungeon.realmIds];
    }
    return realms.map((r) => r.id);
  }
  if (trimmed.toLowerCase() === 'semua' || trimmed.toLowerCase() === 'all') {
    return realms.map((r) => r.id);
  }
  const tokens = trimmed
    .split(/[,;|]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const foundIds = new Set<string>();
  tokens.forEach((tok) => {
    const match = realms.find(
      (r) =>
        r.code.toLowerCase() === tok ||
        r.name.toLowerCase() === tok ||
        r.id.toLowerCase() === tok ||
        r.code.toLowerCase().includes(tok) ||
        r.name.toLowerCase().includes(tok)
    );
    if (match) foundIds.add(match.id);
  });
  if (foundIds.size > 0) return Array.from(foundIds);
  if (matchedDungeon?.realmIds && matchedDungeon.realmIds.length > 0) {
    return [...matchedDungeon.realmIds];
  }
  return realms.map((r) => r.id);
}

export function downloadStudentImportTemplate(
  dungeons: Dungeon[],
  realms: Realm[] = []
) {
  const sorted = sortDungeonsAlphabetically(dungeons);
  const sampleDungeon = sorted[0];
  const sampleClass = sampleDungeon ? sampleDungeon.guildCode : 'X-IPA-1';
  const sampleRealms =
    realms
      .filter((r) => !sampleDungeon?.realmIds?.length || sampleDungeon.realmIds.includes(r.id))
      .map((r) => r.code)
      .join(', ') || 'CHEM-101, MATH-102';

  const header = [
    'Nama Lengkap',
    'Username',
    'NIS',
    'Kelas',
    'Mapel',
    'Avatar',
    'Julukan Karakter',
    'PIN',
    'Status Aktif',
  ];

  const sheetData = [
    header,
    [
      'Rian Pratama',
      'rian5',
      '261101',
      sampleClass,
      sampleRealms,
      'knight',
      'Arcane Knight',
      '482910',
      'Aktif',
    ],
    [
      'Siti Aminah',
      'siti2',
      '261102',
      sampleClass,
      '',
      'alchemist',
      'Potion Alchemist',
      '',
      'Aktif',
    ],
    [
      'Budi Nugroho',
      '',
      '',
      sampleClass,
      '',
      'mage',
      '',
      '',
      'Aktif',
    ],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');

  // Reference sheet for teacher convenience
  const refRows: any[][] = [
    ['REFERENSI PENGISIAN KOLOM'],
    [],
    ['Kode Kelas Tersedia', 'Nama Kelas', 'Tingkat', 'Mapel Kelas'],
    ...sorted.map((d) => [
      d.guildCode,
      d.name,
      d.tier,
      (d.realmIds || [])
        .map((id) => realms.find((r) => r.id === id)?.code || id)
        .join(', '),
    ]),
    [],
    ['Kode Mapel Tersedia', 'Nama Mapel'],
    ...realms.map((r) => [r.code, r.name]),
    [],
    ['Pilihan Avatar Valid', 'Keterangan Julukan Default'],
    ...AVATAR_CYCLE.map((av) => [av, HERO_CLASS_LABELS[av]]),
    [],
    ['Catatan Penting:'],
    ['1. Username maksimal 5 karakter tanpa spasi (jika kosong bisa diisi siswa nanti).'],
    ['2. Jika NIS atau PIN dikosongkan, sistem dapat membuatkannya otomatis saat impor.'],
    ['3. Jika kolom Mapel dikosongkan, otomatis mengikuti daftar Mapel milik Kelas tersebut.'],
    ['4. Status Aktif: isi "Aktif" atau "Nonaktif".'],
  ];
  const refWs = XLSX.utils.aoa_to_sheet(refRows);
  refWs['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, refWs, 'Referensi_Kelas_Mapel');

  XLSX.writeFile(wb, 'template_import_siswa_pixel_quest.xlsx');
}

export function downloadStudentsExcel(
  heroes: HeroStudent[],
  dungeons: Dungeon[],
  realms: Realm[],
  filenamePrefix = 'daftar_siswa_pixel_quest'
) {
  const header = [
    'Nama Lengkap',
    'Username',
    'NIS',
    'Kelas',
    'Mapel',
    'Avatar',
    'Julukan Karakter',
    'PIN',
    'Status Aktif',
  ];

  const rows = heroes.map((h) => {
    const dng = dungeons.find((d) => d.id === h.dungeonId);
    const mapelCodes = (h.enrolledRealmIds || dng?.realmIds || [])
      .map((rid) => realms.find((r) => r.id === rid)?.code || '')
      .filter(Boolean)
      .join(', ');
    return [
      h.name,
      h.username || '',
      h.studentCode || '',
      dng ? dng.guildCode : '',
      mapelCodes,
      h.avatar || 'knight',
      h.heroClass || HERO_CLASS_LABELS[h.avatar] || 'Arcane Knight',
      h.pin || (h.hasPin ? '(Sudah Terpasang)' : ''),
      h.active ? 'Aktif' : 'Nonaktif',
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar_Siswa');
  XLSX.writeFile(wb, `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadImportedCredentialsExcel(
  rows: ParsedStudentImportRow[],
  realms: Realm[] = []
) {
  const header = [
    'No',
    'Nama Lengkap',
    'Username',
    'NIS',
    'Kelas',
    'Mapel',
    'Avatar',
    'Julukan Karakter',
    'PIN Awal',
    'Status Aktif',
  ];
  const body = rows.map((r, i) => [
    i + 1,
    r.name,
    r.username || '-',
    r.studentCode,
    r.matchedDungeonLabel,
    r.enrolledRealmIds
      .map((id) => realms.find((rl) => rl.id === id)?.code || id)
      .join(', '),
    r.avatar,
    r.heroClass,
    r.pin || '(Tanpa PIN)',
    r.active ? 'Aktif' : 'Nonaktif',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Akun_Siswa_Baru');
  XLSX.writeFile(wb, `daftar_akun_siswa_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function parseStudentRowsMatrix(
  matrix: string[][],
  options: {
    dungeons: Dungeon[];
    realms?: Realm[];
    existingHeroes: HeroStudent[];
    defaultDungeonId: string;
    autoGeneratePin: boolean;
  }
): ParsedStudentImportRow[] {
  const nonEmptyRows = matrix
    .map((row) => row.map((c) => String(c ?? '').trim()))
    .filter((row) => row.some((c) => c.length > 0));
  if (nonEmptyRows.length === 0) return [];

  const firstCells = nonEmptyRows[0].map((c) => c.toLowerCase().trim());

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
      'mapel',
      'avatar',
      'julukan',
      'status',
    ].some((kw) => c === kw || c.includes(kw))
  );

  let colMap = {
    name: 0,
    username: 1,
    nis: 2,
    kelas: 3,
    mapel: 4,
    avatar: 5,
    heroClass: 6,
    pin: 7,
    active: 8,
  };

  let dataStartIndex = 0;
  if (looksLikeHeader) {
    dataStartIndex = 1;
    const findIdx = (patterns: string[]) =>
      firstCells.findIndex((c) => patterns.some((p) => c === p || c.includes(p)));

    const nameIdx = findIdx(['nama lengkap', 'nama siswa', 'nama', 'name']);
    const userIdx = findIdx(['username', 'user']);
    const nisIdx = findIdx(['nis', 'student_code', 'kode siswa', 'no induk']);
    const kelasIdx = findIdx(['kelas', 'guild', 'rombel', 'dungeon', 'class']);
    const mapelIdx = findIdx(['mapel', 'mata pelajaran', 'realm', 'pelajaran']);
    const avatarIdx = findIdx(['avatar', 'sprite', 'karakter sprite']);
    const heroClassIdx = findIdx(['julukan', 'hero_class', 'gelar']);
    const pinIdx = findIdx(['pin', 'sandi', 'password']);
    const statusIdx = findIdx(['status aktif', 'status', 'aktif', 'active']);

    colMap = {
      name: nameIdx >= 0 ? nameIdx : 0,
      username: userIdx,
      nis: nisIdx,
      kelas: kelasIdx,
      mapel: mapelIdx,
      avatar: avatarIdx,
      heroClass: heroClassIdx,
      pin: pinIdx,
      active: statusIdx,
    };
  }

  const realms = options.realms || [];
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
          `${d.guildCode} ${d.name}`.toLowerCase() === q ||
          `${d.guildCode} — ${d.name}`.toLowerCase() === q
      );
      if (exact) return exact;
      const partial = options.dungeons.find(
        (d) =>
          d.guildCode.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q)
      );
      if (partial) return partial;
    }
    return (
      options.dungeons.find((d) => d.id === options.defaultDungeonId) ||
      options.dungeons[0]
    );
  };

  const results: ParsedStudentImportRow[] = [];

  for (let i = dataStartIndex; i < nonEmptyRows.length; i++) {
    const cells = nonEmptyRows[i];
    const rawName = (cells[colMap.name] || '').trim();
    if (!rawName) continue;

    const rawUsername =
      colMap.username >= 0 ? (cells[colMap.username] || '').trim() : '';
    const rawNis = colMap.nis >= 0 ? (cells[colMap.nis] || '').trim() : '';
    const rawClass = colMap.kelas >= 0 ? (cells[colMap.kelas] || '').trim() : '';
    const rawMapel = colMap.mapel >= 0 ? (cells[colMap.mapel] || '').trim() : '';
    const rawAvatar =
      colMap.avatar >= 0 ? (cells[colMap.avatar] || '').trim() : '';
    const rawHeroClass =
      colMap.heroClass >= 0 ? (cells[colMap.heroClass] || '').trim() : '';
    const rawPin = colMap.pin >= 0 ? (cells[colMap.pin] || '').trim() : '';
    const rawActive =
      colMap.active >= 0 ? (cells[colMap.active] || '').trim() : '';

    const matchedDng = matchDungeon(rawClass);
    const studentCode = allocateNis(rawNis);

    let username = sanitizeUsername(rawUsername);
    if (username && usedUsernames.has(username)) {
      username = '';
    }
    if (username) {
      usedUsernames.add(username);
    }

    const avatar = resolveAvatar(rawAvatar, results.length);
    const heroClass = rawHeroClass || HERO_CLASS_LABELS[avatar];
    const enrolledRealmIds = resolveEnrolledRealms(rawMapel, matchedDng, realms);
    const enrolledRealmLabels = enrolledRealmIds.map(
      (id) => realms.find((r) => r.id === id)?.code || id
    );

    const pin = rawPin
      ? rawPin.slice(0, 12)
      : options.autoGeneratePin
        ? generateRandomPin()
        : '';

    const active = resolveActiveStatus(rawActive);

    results.push({
      rowNumber: i + 1,
      name: rawName,
      username,
      studentCode,
      classInput: rawClass,
      matchedDungeonId: matchedDng?.id || '',
      matchedDungeonLabel: matchedDng
        ? `${matchedDng.guildCode} — ${matchedDng.name}`
        : 'Belum ada kelas',
      mapelInput: rawMapel,
      enrolledRealmIds,
      enrolledRealmLabels,
      avatar,
      heroClass,
      pin,
      active,
      error: !matchedDng ? 'Kelas belum dipilih / tidak ditemukan' : undefined,
    });
  }

  return results;
}

export function parseStudentImportText(
  rawText: string,
  options: {
    dungeons: Dungeon[];
    realms?: Realm[];
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

  const matrix = lines.map((l) => splitDelimitedLine(l, delimiter));
  return parseStudentRowsMatrix(matrix, options);
}

export async function parseStudentImportFile(
  file: File,
  options: {
    dungeons: Dungeon[];
    realms?: Realm[];
    existingHeroes: HeroStudent[];
    defaultDungeonId: string;
    autoGeneratePin: boolean;
  }
): Promise<ParsedStudentImportRow[]> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (ext === 'csv' || ext === 'txt' || ext === 'tsv') {
    const text = await file.text();
    return parseStudentImportText(text, options);
  }
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const ws = wb.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];
  return parseStudentRowsMatrix(matrix, options);
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
      const enrolled =
        r.enrolledRealmIds.length > 0
          ? r.enrolledRealmIds
          : dungeon?.realmIds
            ? [...dungeon.realmIds]
            : [];
      return {
        id: `hr-${stamp}-${index}`,
        name: r.name.trim(),
        username: r.username,
        studentCode: r.studentCode,
        dungeonId: r.matchedDungeonId,
        avatar: r.avatar,
        heroClass: r.heroClass || HERO_CLASS_LABELS[r.avatar],
        active: r.active,
        joinedDate: today,
        enrolledRealmIds: enrolled,
        ...(r.pin ? { pin: r.pin, hasPin: true } : { hasPin: false }),
      };
    });
}
