import React from 'react';
import {
  Award,
  CheckCircle2,
  Code2,
  History,
  Info,
  Layers,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { PixelTheme, UserRole } from '../../types/lms';
import { PixelStar } from '../../components/PixelArt';
import { PixelSectionTitle } from '../../components/PixelUI';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import { THEME_STYLES } from '../../utils/themes';

interface AboutViewProps {
  role: UserRole;
  currentTheme: PixelTheme;
}

const APP_VERSION = '3.11';
const APP_DEVELOPER = 'Amin Wayudi, S.Pd.';

interface VersionLog {
  version: string;
  title: string;
  badge: string;
  isCurrent?: boolean;
  changes: string[];
}

const CHANGELOG: VersionLog[] = [
  {
    version: '3.11',
    title: 'Cek Progres & Tugas Selesai / Belum Siswa di Menu Penilaian',
    badge: 'TERBARU · SAAT INI',
    isCurrent: true,
    changes: [
      'Tab Baru "Cek Progres Siswa" di Menu Penilaian (Akun Guru): guru kini dapat memantau progres pengerjaan tiap siswa per kelas dan mata pelajaran secara langsung—lengkap dengan bar persentase ketuntasan, jumlah tugas Tuntas, Belum Dikerjakan, Remidial, dan Proses Dinilai.',
      'Rincian Checklist Tugas & Lompat Cepat ke Penilaian: setiap kartu siswa dapat dibuka untuk mengecek daftar tugas yang sudah diselesaikan maupun yang belum/terlewat tenggat, memfilter siswa yang masih punya tanggungan, serta tombol langsung "Nilai / Edit" menuju pengisian nilai tugas tersebut.',
      'Filter Status & Pencarian Siswa di Tab Input Nilai: memudahkan guru menyaring siswa berdasarkan status pengerjaan (Belum, Remidial, Proses, Tuntas) atau nama/NIS langsung saat mengisi nilai tugas.',
    ],
  },
  {
    version: '3.10',
    title: 'Perapihan Tipografi, Ukuran Font & Tata Letak Lintas 5 Tema',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Standarisasi Skala Font & Pembungkus Teks Lintas Tema: perbaikan menyeluruh pada 5 tema (Super Paper Stage, Pokémon Café ReMix, Sprout Pixel Village, Mobile Legends, dan Phantom Persona Pop) agar kata normal tidak terpotong di tengah huruf, tombol dan judul kartu tidak meluber di layar sempit, serta sudut miring tema Persona lebih proporsional.',
      'Konsistensi Menu Akun Guru & Siswa: menyeragamkan ukuran teks sidebar, drawer menu mobile, bilah navigasi bawah, kartu KPI Dashboard, tab filter, label pengumuman, serta tampilan modal dan tombol aksi di semua halaman Guru maupun Siswa.',
    ],
  },
  {
    version: '3.9',
    title: 'Laporan Cetak Semester Lengkap & Manajemen Arsip Tahun Pelajaran',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Laporan Pembelajaran Semester Siap Cetak (Akun Guru): di menu Guild Chronicles kini tersedia laporan resmi per Tahun Pelajaran dan Semester (Ganjil, Genap, atau 1 Tahun) yang mencakup rekap Materi (Tomes), Tugas (Quests), Ketuntasan & Nilai Siswa, hingga rincian skor tiap tugas. Mendukung Cetak/Simpan PDF rapi tanpa bingkai aplikasi serta ekspor Excel 4-sheet (.xlsx).',
      'Manajemen Arsip Tahun Pelajaran (Generate, Bersihkan, & Unggah): di menu System Settings, guru dapat mengunduh paket arsip lengkap Tahun Pelajaran lama ke file .json, membersihkan tahun pelajaran lama yang tidak aktif agar aplikasi tetap ringan, dan mengunggahnya kembali kapan saja untuk dipulihkan atau dicetak ulang.',
    ],
  },
  {
    version: '3.8',
    title: 'Standarisasi Visual 16-Bit Pixel Art di Seluruh 5 Tema Dunia',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Peningkatan 16-Bit Pixel Art Universal: seluruh 5 tema game (Super Paper Stage, Pokémon Café ReMix, Sprout Pixel Village, Mobile Legends: Bang Bang, dan Phantom Persona Pop) kini menggunakan tipografi piksel 16-bit (Pixelify Sans & Chakra Petch), sudut kotak berundak (4px–6px), efek bevel cahaya-bayangan khas SNES/GBA, serta tekstur papan & bingkai konsol piksel.',
      'Ilustrasi & Sprites 16-Bit Penuh: latar belakang dunia, maskot tiap tema (Topi Mario Paper, Cangkir Pokémon Café, Kucing Sprout, Perisai Mythic MLBB, & Bintang Persona), ikon Empty State, serta seluruh Avatar Hero/GM ditingkatkan menjadi sprite piksel multi-warna 24×24 berketajaman crispEdges.',
    ],
  },
  {
    version: '3.7',
    title: 'Tema Dunia Baru: Mobile Legends: Bang Bang (Land of Dawn)',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Pembaruan Tema MLBB: mengganti tema Comic-Pop Arcade menjadi tema Mobile Legends: Bang Bang dengan latar Land of Dawn biru safir malam, pancaran menara energi cyan, bingkai emas Mythic, perisai lencana Rank (Warrior–Mythical Immortal), peti medali, dan aksen tombol Rank merah.',
      'Penyesuaian menyeluruh pada tampilan Guru & Siswa (sidebar & header lobi safir-emas, kartu pengumuman ala pengumuman arena, papan tugas/materi berbingkai emas, kartu pencapaian Rank, modal, serta halaman login).',
    ],
  },
  {
    version: '3.6',
    title: 'Tema Dunia Baru: Sprout Pixel Village (Pixel Game)',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Pembaruan Tema Pixel Game: mengganti tema 16-Bit Royal menjadi Sprout Pixel Village bergaya RPG pertanian pastel (air toska beriak, pulau rumput hijau, pohon buah apel, peti harta pixel, maskot kucing petani, & papan kayu kabin).',
      'Penyesuaian penuh seluruh komponen UI pada akun Guru & Siswa (sidebar, bingkai konsol, kartu pengumuman, papan tugas/materi, kartu pencapaian, dan halaman login) agar serasi dengan palet kayu hangat dan hijau tunas.',
    ],
  },
  {
    version: '3.5',
    title: 'Analitik Grafik Guru, Penilaian Kolektif Lanjutan & 3 Tema Dunia Baru',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Pembaruan Tema Visual Lintas Akun Guru & Siswa: hadir tema Super Paper Stage (Mario Paper), Pokémon Café ReMix (Patisserie), dan Phantom Persona Pop (Crimson Ink), serta penyesuaian kartu Papan Tugas & Perpustakaan Materi agar selalu serasi mengikuti tema aktif.',
      'Peningkatan Dashboard Guru (HQ): mengganti ringkasan statis dengan 3 grafik analitik interaktif (Donut Status Ketuntasan, Histogram Peringkat Hero, dan Grafik Perbandingan per Kelas, Mapel, & Kategori Quest) lengkap dengan filter Tingkat, Kelas, dan Mapel.',
      'Penilaian Kolektif Lebih Lengkap & Mobile-Friendly: guru dapat mengubah Nilai, Status (Tuntas, Belum, Proses Dinilai, Remidial), dan Catatan secara kolektif; urutan tugas dikelompokkan rapi berdasarkan kategori Quest; serta perbaikan input nilai di layar HP/mobile dan disambiguasi judul Quest kembar saat ekspor/impor Excel.',
      'Isolasi Mapel Siswa & Penyederhanaan Status: tugas & materi pada akun siswa kini terkunci ketat sesuai mapel yang diikuti kelasnya, dengan tampilan Hero Log yang lebih ringkas.',
      'Konsolidasi Menu Pengelolaan Tugas Guru: menyatukan pengelolaan Tugas & Papan Pantau agar lebih ringkas tanpa menu ganda.',
    ],
  },
  {
    version: '3.0',
    title: 'Gamifikasi Lanjutan, Sinkronisasi Nyata, Mode Offline & Polesan UI',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Penambahan 3 menu baru ringan: Quest Board (pantau status & tenggat tugas), Guild Chronicles (statistik kelas & ekspor CSV untuk Guru), dan Hall of Fame (Top 10 EXP mingguan dengan opsi Sembunyikan Nama).',
      'Gamifikasi lanjutan untuk Siswa (Hero): sistem EXP & kenaikan Level otomatis (Lv.[n]), Leaderboard Guild antar Hero aktif, serta 10 Lencana Achievement termasuk First Quest dan Dungeon Master.',
      'Peningkatan Dashboard HQ (Game Master): 4 kartu statistik langsung (Heroes Aktif, Quests Menunggu, Notice Terbaru, Last Sync), level & bar XP Game Master (GM Lv.[n]), serta Empty State bergaya pixel.',
      'Kontrol jendela interaktif (Minimize ke mode cartridge, Maximize layar, dan Close dengan modal konfirmasi keluar), indikator status sinkronisasi nyata (✓ Synced HH:MM), modal Riwayat Sinkronisasi, serta badge notifikasi Notice & Quest baru.',
      'Mode Offline PWA lebih tangguh: materi (Tomes), tugas (Quests), dan pengumuman (Notice) tersimpan lokal agar tetap bisa dibaca saat koneksi terputus, dilengkapi layar muat Health Potion, Skeleton loading, Error Boundary, dan optimasi lazy loading.',
      'Pengalaman visual & audio tematik: animasi latar bergerak, kursor kustom pixel di desktop, efek suara 8-bit per aksi (login, simpan tugas, dan naik level), peningkatan kontras aksesibilitas WCAG AA, serta tata letak mobile yang proporsional.',
      'Mode Pop-Up detail materi & tugas, pengelompokan Tugas dan Penilaian berdasarkan Kelas serta Mapel, penjadwalan tayang otomatis Per-Kelas, impor/ekspor Excel kolektif presisi NIM/NIS, dan opsi Hapus Data Terpilih / Hapus Semua.',
    ],
  },
  {
    version: '2.0',
    title: '5 Identitas Tema Visual, Sidebar Permanen & Cloud Sync',
    badge: 'PEMBARUAN BESAR',
    changes: [
      'Hadir dengan 5 dunia tema visual berbeda: Super Paper Stage, Pokémon Café ReMix, Sprout Pixel Village, Mobile Legends: Bang Bang, dan Phantom Persona Pop.',
      'Navigasi sidebar permanen untuk tampilan tablet & desktop serta sinkronisasi Cloud real-time.',
      'Dukungan Progressive Web App (PWA) agar aplikasi dapat dipasang dan tetap stabil di berbagai perangkat.',
    ],
  },
  {
    version: '1.0',
    title: 'Rilis Awal Pixel Quest Academy LMS',
    badge: 'FONDASI AWAL',
    changes: [
      'Sistem akses terpisah antara akun Guru/Admin (Game Master) dan akun Siswa (Hero Read-Only) dengan Username/NIS/NIM & PIN.',
      'Pengelolaan lengkap Kelas (Dungeons), Siswa (Heroes), Mapel (Realms), Pengumuman, Materi, Tugas, dan Penilaian simbolik + EXP.',
    ],
  },
];

export const AboutView: React.FC<AboutViewProps> = ({ role, currentTheme }) => {
  const isGm = role === UserRole.GAME_MASTER;
  const activeThemeMeta = THEME_STYLES.find((t) => t.id === currentTheme);

  return (
    <div className="space-y-4">
      <PixelSectionTitle
        title="Tentang Aplikasi"
        subtitle="Informasi versi, perkembangan yang telah dibuat, dan pengembang sistem"
      />

      {/* App Identity & Developer Card */}
      <ThemedPanelCard className="p-4 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[var(--border-pixel)]/40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--comic-gold)] flex items-center justify-center shrink-0 shadow-[2px_2px_0_var(--shadow-ink)]">
              <PixelStar size={24} className="animate-pixel-float" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-pixel-display text-[14px] sm:text-[15.5px] text-[var(--text-primary)] leading-snug">
                  Pixel Quest Academy
                </h2>
                <span className="font-pixel-ui text-[10.5px] px-2 py-0.5 border border-[var(--border-pixel)] bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold">
                  VERSI {APP_VERSION}
                </span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                Learning Management System (LMS) interaktif berbasis gamifikasi RPG pixel dengan pengelompokan kelas &amp; mata pelajaran.
              </p>
            </div>
          </div>
        </div>

        {/* Highlighted Developer & Version Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="pixel-box-inset p-3 bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 flex items-center gap-3">
            <span className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--accent-success)] text-[var(--text-on-success)] flex items-center justify-center shrink-0">
              <UserCheck size={19} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] uppercase">
                Pengembang Aplikasi
              </p>
              <p className="text-[14px] font-bold text-[var(--text-primary)] break-words">
                {APP_DEVELOPER}
              </p>
            </div>
          </div>

          <div className="pixel-box-inset p-3 bg-[var(--bg-inset)] border border-[var(--border-pixel)]/60 flex items-center gap-3">
            <span className="w-10 h-10 rounded-[var(--btn-radius)] border-2 border-[var(--border-pixel)] bg-[var(--accent-warning)] text-[var(--text-on-warning)] flex items-center justify-center shrink-0">
              <Code2 size={19} />
            </span>
            <div className="min-w-0">
              <p className="font-pixel-ui text-[10px] text-[var(--text-muted)] uppercase">
                Versi Rilis Aktif
              </p>
              <p className="text-[14px] font-bold text-[var(--text-primary)]">
                Versi {APP_VERSION} (Stabil)
              </p>
            </div>
          </div>
        </div>

        {/* Context Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-pixel)]/50 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-semibold">
            <Shield size={13} className="text-[var(--accent-primary)]" />
            Mode Akses: {isGm ? 'Akun Guru / Admin (Game Master)' : 'Akun Siswa (Hero · Read-Only)'}
          </span>
          {activeThemeMeta && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-pixel)]/50 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-semibold">
              <Layers size={13} className="text-[var(--accent-warning)]" />
              Tema Aktif: {activeThemeMeta.label}
            </span>
          )}
        </div>
      </ThemedPanelCard>

      {/* Development History / Completed Changelog Only */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <History size={16} className="text-[var(--accent-warning)] shrink-0" />
          <h3 className="font-pixel-ui text-[11.5px] sm:text-[12.5px] text-[var(--text-primary)] uppercase tracking-wide">
            Perkembangan yang Telah Dibuat
          </h3>
        </div>

        {CHANGELOG.map((release) => (
          <ThemedPanelCard
            key={release.version}
            className={`p-3.5 sm:p-4 space-y-2.5 ${
              release.isCurrent ? 'ring-2 ring-[var(--accent-primary)]/70' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-pixel)]/40">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={`font-pixel-ui text-[10.5px] px-2 py-0.5 border border-[var(--border-pixel)] font-bold ${
                    release.isCurrent
                      ? 'bg-[var(--accent-success)] text-[var(--text-on-success)]'
                      : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  }`}
                >
                  v{release.version}
                </span>
                <h4 className="text-[14px] font-bold text-[var(--text-primary)] leading-snug">
                  {release.title}
                </h4>
              </div>
              <span className="font-pixel-ui text-[10px] px-2 py-0.5 bg-[var(--bg-surface-alt)] border border-[var(--border-pixel)]/50 text-[var(--accent-warning)] shrink-0">
                {release.badge}
              </span>
            </div>

            <ul className="space-y-2">
              {release.changes.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)] leading-relaxed"
                >
                  <CheckCircle2
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      release.isCurrent
                        ? 'text-[var(--accent-success)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ThemedPanelCard>
        ))}
      </div>

      {/* Footer Note */}
      <ThemedPanelCard className="p-3.5 flex items-start gap-3 bg-[var(--bg-surface-alt)]">
        <span className="w-8 h-8 rounded-[var(--btn-radius)] border border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
          {isGm ? <Award size={16} /> : <Sparkles size={16} />}
        </span>
        <div className="min-w-0 text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
          <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Info size={14} className="text-[var(--accent-warning)]" />
            Pixel Quest Academy v{APP_VERSION}
          </p>
          <p className="mt-0.5">
            Dikembangkan oleh <strong className="text-[var(--text-primary)]">{APP_DEVELOPER}</strong> untuk mendukung pembelajaran yang lebih terstruktur, menyenangkan, dan mudah diakses di perangkat HP maupun komputer.
          </p>
        </div>
      </ThemedPanelCard>
    </div>
  );
};
