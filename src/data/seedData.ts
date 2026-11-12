import { AcademyState } from '../types/lms';

export const STORAGE_KEY = 'pixel_quest_academy_state_v2';

export const INITIAL_ACADEMY_STATE: AcademyState = {
  gmProfile: {
    name: 'Pak Budi Santoso',
    title: 'Guild Master of Science',
    specialty: 'Guru IPA & Pembina Sains',
    avatar: 'guild_master',
    username: 'admin',
    password: 'admin',
    requirePassword: false,
  },
  settings: {
    theme: 'sunny_quest',
    crtScanlines: false,
    soundEnabled: true,
    academicTerm: 'Semester Ganjil 2026/2027',
  },
  dungeons: [
    {
      id: 'dng-x-ipa-1',
      name: 'Crimson Citadel',
      tier: 'Kelas X',
      guildCode: 'X-IPA-1',
      capacity: 32,
      description: 'Rombel sains dasar berfokus pada eksplorasi alchemical chemistry dan biologi terapan.',
      realmIds: ['rlm-chem', 'rlm-math', 'rlm-bio'],
    },
    {
      id: 'dng-x-ipa-2',
      name: 'Emerald Bastion',
      tier: 'Kelas X',
      guildCode: 'X-IPA-2',
      capacity: 30,
      description: 'Skuadron petualang kelas X dengan penekanan logika matematika dan riset lapangan.',
      realmIds: ['rlm-math', 'rlm-bio'],
    },
    {
      id: 'dng-xi-ipa-1',
      name: 'Arcane Spire',
      tier: 'Kelas XI',
      guildCode: 'XI-IPA-1',
      capacity: 28,
      description: 'Menara pembelajaran tingkat lanjut untuk eksperimen reaksi kimia dan genetika.',
      realmIds: ['rlm-chem', 'rlm-math'],
    },
  ],
  heroes: [
    {
      id: 'hr-rian',
      name: 'Rian Pratama',
      username: 'rian_x1',
      studentCode: '261001',
      dungeonId: 'dng-x-ipa-1',
      avatar: 'knight',
      heroClass: 'Arcane Knight',
      active: true,
      joinedDate: '2026-07-14',
      enrolledRealmIds: ['rlm-chem', 'rlm-math', 'rlm-bio'],
    },
    {
      id: 'hr-sari',
      name: 'Sari Wulandari',
      username: 'sari_x1',
      studentCode: '261002',
      dungeonId: 'dng-x-ipa-1',
      avatar: 'alchemist',
      heroClass: 'Potion Alchemist',
      active: true,
      joinedDate: '2026-07-14',
      enrolledRealmIds: ['rlm-chem', 'rlm-bio'],
    },
    {
      id: 'hr-dimas',
      name: 'Dimas Nugroho',
      username: 'dimas_x1',
      studentCode: '261003',
      dungeonId: 'dng-x-ipa-1',
      avatar: 'mage',
      heroClass: 'Rune Mage',
      active: true,
      joinedDate: '2026-07-15',
      enrolledRealmIds: ['rlm-chem', 'rlm-math'],
    },
    {
      id: 'hr-nadia',
      name: 'Nadia Kusuma',
      username: 'nadia_x1',
      studentCode: '261004',
      dungeonId: 'dng-x-ipa-1',
      avatar: 'ranger',
      heroClass: 'Forest Ranger',
      active: true,
      joinedDate: '2026-07-15',
      enrolledRealmIds: ['rlm-bio', 'rlm-math'],
    },
    {
      id: 'hr-bagas',
      name: 'Bagas Aditya',
      username: 'bagas_x2',
      studentCode: '261015',
      dungeonId: 'dng-x-ipa-2',
      avatar: 'scholar',
      heroClass: 'Scroll Scholar',
      active: true,
      joinedDate: '2026-07-16',
      enrolledRealmIds: ['rlm-math', 'rlm-bio'],
    },
    {
      id: 'hr-putri',
      name: 'Putri Maharani',
      username: 'putri_xi1',
      studentCode: '251008',
      dungeonId: 'dng-xi-ipa-1',
      avatar: 'mage',
      heroClass: 'Chrono Mage',
      active: true,
      joinedDate: '2026-07-17',
      enrolledRealmIds: ['rlm-chem', 'rlm-math'],
    },
  ],
  notices: [
    {
      id: 'ntc-1',
      title: 'Ujian Boss Dungeon: Ikatan Kimia & Stoikiometri',
      description:
        'Perhatian seluruh Hero Crimson Citadel! Evaluasi tengah semester akan dilaksanakan hari Jumat pukul 08.00 WIB. Pastikan kalian telah menamatkan Scroll Bab 1 dan Bab 2 di Scroll Library sebelum memasuki ruang ujian.',
      priority: 'Critical',
      targetDungeonId: 'dng-x-ipa-1',
      releaseDate: '2026-11-11',
      author: 'Pak Budi Santoso',
    },
    {
      id: 'ntc-2',
      title: 'Pembukaan Guild Praktikum Lab Ekosistem',
      description:
        'Perlengkapan praktikum mikroskop dan lembar pengamatan daun sudah tersedia di laboratorium biologi lantai 2. Harap membawa buku catatan lapangan masing-masing.',
      priority: 'Medium',
      targetDungeonId: 'all',
      releaseDate: '2026-11-09',
      author: 'Pak Budi Santoso',
    },
    {
      id: 'ntc-3',
      title: 'Bonus EXP +50 untuk Ringkasan Ancient Tome',
      description:
        'Hero yang menyelesaikan catatan mandiri dari gulungan Arcane Mathematics Bab 1 minggu ini berhak mendapat rekomendasi bonus EXP dari Guild Master.',
      priority: 'Low',
      targetDungeonId: 'all',
      releaseDate: '2026-11-05',
      author: 'Pak Budi Santoso',
    },
  ],
  realms: [
    {
      id: 'rlm-chem',
      name: 'Alchemic Chemistry',
      code: 'CHEM-101',
      icon: 'flask',
      accentColor: '#38B764',
      description: 'Struktur atom, ikatan kovalen, reaksi redoks, dan stoikiometri larutan.',
    },
    {
      id: 'rlm-math',
      name: 'Arcane Mathematics',
      code: 'MATH-102',
      icon: 'compass',
      accentColor: '#3B5DC9',
      description: 'Persamaan kuadrat, logaritma, trigonometri dasar, dan matriks vektor.',
    },
    {
      id: 'rlm-bio',
      name: 'Nature Biology',
      code: 'BIO-103',
      icon: 'leaf',
      accentColor: '#FEAE34',
      description: 'Klasifikasi makhluk hidup, sel eukariotik, serta dinamika rantai ekosistem.',
    },
    {
      id: 'rlm-phys',
      name: 'Mystic Physics',
      code: 'PHYS-104',
      icon: 'bolt',
      accentColor: '#EF7D57',
      description: 'Kinematika gerak lurus, hukum Newton, usaha, dan kekekalan energi.',
    },
  ],
  tomes: [
    {
      id: 'tm-1',
      realmId: 'rlm-chem',
      title: 'Struktur Atom & Konfigurasi Elektron',
      chapter: 1,
      readMinutes: 8,
      summary: 'Memahami inti atom, proton, neutron, dan aturan Aufbau pada kulit elektron.',
      publishedDate: '2026-11-02',
      content: `1. PARTIKEL PENYUSUN ATOM
Setiap materi di alam tersusun atas atom yang memiliki tiga partikel dasar:
• Proton (+) berada di inti atom dan menentukan nomor atom (Z).
• Neutron (0) berada di inti atom bersama proton menentukan nomor massa (A).
• Elektron (-) bergerak mengelilingi inti pada lintasan orbital.

2. PRINSIP KONFIGURASI KULIT (BOHR)
Kapasitas maksimum tiap kulit dirumuskan dengan 2n²:
• Kulit K (n=1): maks 2 elektron
• Kulit L (n=2): maks 8 elektron
• Kulit M (n=3): maks 18 elektron

3. ELEKTRON VALENSI
Elektron pada kulit terluar disebut elektron valensi. Nilai ini sangat menentukan apakah suatu unsur bersifat stabil seperti gas mulia atau reaktif membentuk ikatan ion dan kovalen.`,
    },
    {
      id: 'tm-2',
      realmId: 'rlm-chem',
      title: 'Ikatan Ionik vs Ikatan Kovalen',
      chapter: 2,
      readMinutes: 10,
      summary: 'Perbedaan serah-terima elektron pada logam-nonlogam dan pemakaian bersama elektron.',
      publishedDate: '2026-11-08',
      content: `1. ATURAN OKTET
Atom cenderung mencapai kestabilan dengan memiliki 8 elektron valensi (atau 2 untuk duplet seperti Helium).

2. IKATAN IONIK (SERAH TERIMA)
Terjadi antara unsur logam yang mudah melepas elektron (membentuk kation +) dan nonlogam yang menarik elektron (membentuk anion -). Contoh klasik: NaCl (Natrium Klorida).

3. IKATAN KOVALEN (PEMAKAIAN BERSAMA)
Terjadi antar unsur nonlogam yang sama-sama membutuhkan elektron sehingga pasangan elektron dipakai bersama. Contoh: H₂O, CO₂, dan gas CH₄.`,
    },
    {
      id: 'tm-3',
      realmId: 'rlm-math',
      title: 'Sifat Dasar Logaritma & Eksponen',
      chapter: 1,
      readMinutes: 7,
      summary: 'Invers dari fungsi pangkat dan hukum perkalian/pembagian logaritma.',
      publishedDate: '2026-11-04',
      content: `1. DEFINISI LOGARITMA
Jika a^c = b (dengan a > 0, a ≠ 1, dan b > 0), maka ᵃlog b = c.

2. HUKUM OPERASI UTAMA
• ᵃlog(x · y) = ᵃlog x + ᵃlog y
• ᵃlog(x / y) = ᵃlog x - ᵃlog y
• ᵃlog(xⁿ) = n · ᵃlog x
• ᵃlog a = 1 dan ᵃlog 1 = 0

3. TIPS PENYELESAIAN QUEST
Selalu ubah basis bilangan ke faktor prima terkecil sebelum menyederhanakan ekspresi logaritma majemuk.`,
    },
    {
      id: 'tm-4',
      realmId: 'rlm-bio',
      title: 'Organel Sel Tumbuhan & Hewan',
      chapter: 1,
      readMinutes: 9,
      summary: 'Perbandingan fungsi mitokondria, kloroplas, ribosom, dan dinding sel.',
      publishedDate: '2026-11-06',
      content: `1. PUSAT KENDALI & ENERGI
• Nukleus menyimpan materi genetik DNA dan mengatur seluruh aktivitas metabolisme.
• Mitokondria bertindak sebagai pembangkit energi seluler (ATP) melalui respirasi aerob.

2. CIRI KHAS SEL TUMBUHAN
• Dinding sel dari selulosa menjaga bentuk kaku tumbuhan.
• Kloroplas mengandung klorofil untuk fotosintesis.
• Vakuola sentral berukuran besar menyimpan air dan cadangan zat makanan.`,
    },
  ],
  quests: [
    {
      id: 'qst-1',
      realmId: 'rlm-chem',
      dungeonId: 'dng-x-ipa-1',
      title: 'Quest 01: Peta Konfigurasi 10 Unsur',
      instructions:
        'Tuliskan konfigurasi elektron kulit dan subkulit untuk unsur nomor atom 6, 11, 17, dan 20. Tentukan letak golongan serta periodenya secara tepat di buku tugas.',
      deadline: '2026-11-18',
      maxExp: 200,
      difficulty: 'Normal',
    },
    {
      id: 'qst-2',
      realmId: 'rlm-chem',
      dungeonId: 'dng-x-ipa-1',
      title: 'Boss Quest: Struktur Lewis Senyawa Kovalen',
      instructions:
        'Gambarkan struktur dot Lewis untuk molekul NH₃, CO₂, dan H₂SO₄. Identifikasi mana ikatan kovalen tunggal, rangkap dua, dan kovalen koordinasi.',
      deadline: '2026-11-22',
      maxExp: 300,
      difficulty: 'Boss',
    },
    {
      id: 'qst-3',
      realmId: 'rlm-math',
      dungeonId: 'all',
      title: 'Quest 02: Pembuktian Identitas Logaritma',
      instructions:
        'Selesaikan 8 soal penyederhanaan logaritma berbasis 2, 3, dan 5 dengan menuliskan langkah substitusi secara berurutan.',
      deadline: '2026-11-20',
      maxExp: 250,
      difficulty: 'Elite',
    },
    {
      id: 'qst-4',
      realmId: 'rlm-bio',
      dungeonId: 'dng-x-ipa-1',
      title: 'Quest 03: Diagram Komparasi Sel Mikroskop',
      instructions:
        'Buat tabel perbandingan minimal 6 organel antara sel epitel hewan dan sel daun Elodea berdasarkan hasil pengamatan praktikum.',
      deadline: '2026-11-25',
      maxExp: 200,
      difficulty: 'Normal',
    },
  ],
  grades: [
    {
      id: 'grd-1',
      heroId: 'hr-rian',
      questId: 'qst-1',
      realmId: 'rlm-chem',
      score: 94,
      expEarned: 188,
      feedback: 'Konfigurasi Aufbau sangat rapi dan penentuan periode tepat semua.',
      gradedDate: '2026-11-06',
    },
    {
      id: 'grd-2',
      heroId: 'hr-rian',
      questId: 'qst-2',
      realmId: 'rlm-chem',
      score: 86,
      expEarned: 258,
      feedback: 'Struktur H2SO4 sudah tepat, perhatikan pasangan elektron bebas pada oksigen.',
      gradedDate: '2026-11-10',
    },
    {
      id: 'grd-3',
      heroId: 'hr-rian',
      questId: 'qst-3',
      realmId: 'rlm-math',
      score: 88,
      expEarned: 220,
      feedback: 'Langkah penyederhanaan logaritma runtut dan jelas.',
      gradedDate: '2026-11-09',
    },
    {
      id: 'grd-4',
      heroId: 'hr-rian',
      questId: 'qst-4',
      realmId: 'rlm-bio',
      score: 92,
      expEarned: 184,
      feedback: 'Sketsa organel lengkap beserta penjelasan fungsi mitokondria dan kloroplas.',
      gradedDate: '2026-11-11',
    },
    {
      id: 'grd-5',
      heroId: 'hr-sari',
      questId: 'qst-1',
      realmId: 'rlm-chem',
      score: 96,
      expEarned: 192,
      feedback: 'Nilai sempurna pada penyusunan konfigurasi ion bermuatan.',
      gradedDate: '2026-11-06',
    },
    {
      id: 'grd-6',
      heroId: 'hr-sari',
      questId: 'qst-3',
      realmId: 'rlm-math',
      score: 84,
      expEarned: 210,
      feedback: 'Cek ulang soal nomor 7 pada perubahan basis pangkat pecahan.',
      gradedDate: '2026-11-09',
    },
    {
      id: 'grd-7',
      heroId: 'hr-dimas',
      questId: 'qst-1',
      realmId: 'rlm-chem',
      score: 78,
      expEarned: 156,
      feedback: 'Sudah cukup baik, perlu teliti pada pengisian subkulit 3d.',
      gradedDate: '2026-11-06',
    },
    {
      id: 'grd-8',
      heroId: 'hr-nadia',
      questId: 'qst-4',
      realmId: 'rlm-bio',
      score: 90,
      expEarned: 180,
      feedback: 'Tabel komparasi sel sangat informatif.',
      gradedDate: '2026-11-11',
    },
    {
      id: 'grd-9',
      heroId: 'hr-bagas',
      questId: 'qst-3',
      realmId: 'rlm-math',
      score: 85,
      expEarned: 213,
      feedback: 'Konsisten dan teliti dalam pembuktian identitas.',
      gradedDate: '2026-11-09',
    },
  ],
};
