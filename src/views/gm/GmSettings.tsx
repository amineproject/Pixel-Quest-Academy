import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, FileDown, RotateCcw, ShieldAlert, Trash2, Upload } from 'lucide-react';
import {
  AcademyState,
  GameMasterProfile,
  SystemSettings,
} from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelConfirmDialog,
  PixelFieldLabel,
  PixelInput,
  PixelModal,
  PixelSectionTitle,
  PixelSelect,
} from '../../components/PixelUI';
import {
  EraArchiveBundleV1,
  MergeArchiveSummary,
  generateEraArchiveBundle,
  parseAndValidateEraArchive,
  triggerEraArchiveDownload,
} from '../../utils/archiveAndReport';
import { ThemedPanelCard } from '../../components/ThemePrimitives';
import { PWAInstallButton } from '../../components/PWAInstallBanner';
import { THEME_STYLES } from '../../utils/themes';

import {
  checkHardenedSecurityStatus,
  clearSupabaseConfig,
  generateCloudShareLink,
  getStoredSupabaseAnonKey,
  getStoredSupabaseUrl,
  GmAuthCredentials,
  isSupabaseConfigured,
  saveSupabaseConfig,
  testSupabaseConnection,
  uploadAllLocalToSupabase,
  verifyGmLoginCloud,
} from '../../lib/supabase';
import { Check, Cloud, Copy, Download, Eye, EyeOff, Link2, Lock, RefreshCw } from 'lucide-react';

interface GmSettingsProps {
  state: AcademyState;
  gmAuth?: GmAuthCredentials;
  onUpdateGmProfile: (
    profile: GameMasterProfile,
    updatedSettings?: SystemSettings
  ) => void | Promise<boolean | void>;
  onUpdateSettings: (settings: SystemSettings) => void;
  onResetDemoData: () => void;
  onPullCloudData: () => Promise<AcademyState | null>;
  onTestAccessDenied: () => void;
  onRequestGmReauth?: () => void;
  onImportEraArchive?: (bundle: EraArchiveBundleV1) => Promise<MergeArchiveSummary>;
  onPruneEraArchive?: (
    academicYearId: string,
    pruneHeroesInEra: boolean
  ) => Promise<{ ok: boolean; error?: string; summaryText?: string }>;
}

export const GmSettings: React.FC<GmSettingsProps> = ({
  state,
  gmAuth,
  onUpdateGmProfile,
  onUpdateSettings,
  onResetDemoData,
  onPullCloudData,
  onTestAccessDenied,
  onRequestGmReauth,
  onImportEraArchive,
  onPruneEraArchive,
}) => {
  const isProtectedPass =
    isSupabaseConfigured() &&
    (!state.gmProfile.password || state.gmProfile.password === '[PROTECTED]');

  const [name, setName] = useState(state.gmProfile.name);
  const [title, setTitle] = useState(state.gmProfile.title);
  const [specialty, setSpecialty] = useState(state.gmProfile.specialty || 'Guru IPA & Pembina Sains');
  const [avatar, setAvatar] = useState(state.gmProfile.avatar || 'guild_master');
  const [username, setUsername] = useState(state.gmProfile.username || gmAuth?.username || 'admin');
  const [password, setPassword] = useState(
    isProtectedPass ? '' : state.gmProfile.password || gmAuth?.password || 'admin'
  );
  const [showGmPassword, setShowGmPassword] = useState(false);
  const [term, setTerm] = useState(state.settings.academicTerm);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase Cloud Sync State
  const [cloudUrl, setCloudUrl] = useState(getStoredSupabaseUrl);
  const [cloudKey, setCloudKey] = useState(getStoredSupabaseAnonKey);
  const [isCloudConfigured, setIsCloudConfigured] = useState(isSupabaseConfigured);
  const [isHardenedSecurity, setIsHardenedSecurity] = useState<boolean | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Academic Year Archive Management State
  const academicYears = useMemo(() => state.academicYears || [], [state.academicYears]);
  const defaultArchiveEraId =
    academicYears.find((y) => !y.isActive)?.id || academicYears[0]?.id || '';
  const [selectedArchiveEraId, setSelectedArchiveEraId] =
    useState<string>(defaultArchiveEraId);
  const [downloadedEraIds, setDownloadedEraIds] = useState<string[]>([]);
  const [archiveStatusMsg, setArchiveStatusMsg] = useState<{
    tone: 'success' | 'warning' | 'danger';
    text: string;
  } | null>(null);
  const [pruneModalOpen, setPruneModalOpen] = useState(false);
  const [pruneHeroesInEra, setPruneHeroesInEra] = useState(false);
  const [isArchiveBusy, setIsArchiveBusy] = useState(false);
  const [pendingImportBundle, setPendingImportBundle] =
    useState<EraArchiveBundleV1 | null>(null);
  const archiveFileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveArchiveEraId = academicYears.some(
    (y) => y.id === selectedArchiveEraId
  )
    ? selectedArchiveEraId
    : defaultArchiveEraId;

  const selectedArchiveEra = academicYears.find(
    (y) => y.id === effectiveArchiveEraId
  );

  const selectedArchiveBundle = useMemo(
    () =>
      effectiveArchiveEraId
        ? generateEraArchiveBundle(state, effectiveArchiveEraId)
        : null,
    [state, effectiveArchiveEraId]
  );

  // Sync local form fields if remote Cloud data updates from another device (HP <-> Laptop)
  useEffect(() => {
    setName(state.gmProfile.name);
    setTitle(state.gmProfile.title);
    setSpecialty(state.gmProfile.specialty || 'Guru IPA & Pembina Sains');
    setAvatar(state.gmProfile.avatar || 'guild_master');
    setUsername(state.gmProfile.username || gmAuth?.username || 'admin');
    if (isSupabaseConfigured() && (!state.gmProfile.password || state.gmProfile.password === '[PROTECTED]')) {
      setPassword('');
    } else if (state.gmProfile.password) {
      setPassword(state.gmProfile.password);
    }
    setTerm(state.settings.academicTerm);
  }, [state.gmProfile, state.settings.academicTerm, gmAuth?.username]);

  useEffect(() => {
    let active = true;
    if (!isCloudConfigured) {
      setIsHardenedSecurity(null);
      return;
    }
    checkHardenedSecurityStatus().then((hardened) => {
      if (active) setIsHardenedSecurity(hardened);
    });
    return () => {
      active = false;
    };
  }, [isCloudConfigured]);

  const shareLink = isCloudConfigured ? generateCloudShareLink() : null;

  const handleSaveCloudConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudUrl.trim() || !cloudKey.trim()) {
      setSyncStatusMsg('Harap isi URL Proyek dan Anon Key Supabase!');
      return;
    }
    saveSupabaseConfig(cloudUrl, cloudKey);
    const configured = isSupabaseConfigured();
    setIsCloudConfigured(configured);
    if (!configured) {
      setSyncStatusMsg('Format URL (harus https://...) atau Anon Key tidak valid.');
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Menguji koneksi ke Supabase Cloud...');
    const testRes = await testSupabaseConnection();
    setIsHardenedSecurity(testRes.hardened);
    let authMismatchMsg = '';
    if (testRes.ok && testRes.hasCloudData) {
      await onPullCloudData();
      if (testRes.hardened) {
        const authCheck = gmAuth?.username && gmAuth?.password
          ? await verifyGmLoginCloud(gmAuth.username, gmAuth.password)
          : { ok: false };
        if (!authCheck.ok) {
          authMismatchMsg =
            ' Catatan: Kredensial GM di sesi ini berbeda dengan database Cloud — silakan verifikasi ulang akun GM Anda agar semua menu dapat tersinkron.';
          onRequestGmReauth?.();
        }
      }
    }
    setIsSyncing(false);
    setSyncStatusMsg(testRes.message + authMismatchMsg);
  };

  const handleSyncAllToCloud = async () => {
    if (!isCloudConfigured) {
      setSyncStatusMsg('Hubungkan ke Supabase Cloud terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Sedang mengunggah seluruh data ke Supabase Cloud...');
    const res = await uploadAllLocalToSupabase(state, gmAuth);
    setIsSyncing(false);
    if (res.ok) {
      setSyncStatusMsg('✓ Seluruh data sukses tersinkronisasi ke Supabase Cloud!');
    } else {
      if (
        res.errorMessage?.includes('Kredensial GM') ||
        res.errorMessage?.includes('Sesi GM') ||
        res.errorMessage?.includes('Akses ditolak')
      ) {
        onRequestGmReauth?.();
      }
      setSyncStatusMsg(`Gagal mengunggah: ${res.errorMessage || 'Pastikan tabel Supabase sudah dibuat.'}`);
    }
  };

  const handlePullFromCloud = async () => {
    if (!isCloudConfigured) {
      setSyncStatusMsg('Hubungkan ke Supabase Cloud terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Mengambil data terbaru dari Supabase Cloud...');
    const fetched = await onPullCloudData();
    const hardened = await checkHardenedSecurityStatus();
    setIsHardenedSecurity(hardened);
    setIsSyncing(false);
    if (fetched) {
      setSyncStatusMsg(
        `✓ Data Cloud dimuat (${fetched.dungeons.length} kelas, ${fetched.heroes.length} siswa)!`
      );
    } else {
      setSyncStatusMsg('Belum ada data di Supabase Cloud atau tabel belum dibuat.');
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      setSyncStatusMsg('Salin manual link di kolom di atas.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedPassword = password.trim() || gmAuth?.password || state.gmProfile.password || '';
    if (!username.trim() || !resolvedPassword) return;
    const nextSettings: SystemSettings = {
      ...state.settings,
      academicTerm: term.trim() || state.settings.academicTerm,
    };
    const res = await onUpdateGmProfile(
      {
        ...state.gmProfile,
        name: name.trim() || state.gmProfile.name,
        title: title.trim() || state.gmProfile.title,
        specialty: specialty.trim() || state.gmProfile.specialty,
        avatar,
        username: username.trim(),
        password: resolvedPassword,
        requirePassword: true,
      },
      nextSettings
    );
    if (res !== false) {
      if (isProtectedPass) setPassword('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2400);
    }
  };

  const handleGenerateArchiveDownload = () => {
    if (!selectedArchiveBundle) {
      setArchiveStatusMsg({
        tone: 'danger',
        text: 'Pilih Tahun Pelajaran terlebih dahulu sebelum mengunduh arsip.',
      });
      return;
    }
    const filename = triggerEraArchiveDownload(selectedArchiveBundle);
    setDownloadedEraIds((prev) =>
      prev.includes(selectedArchiveBundle.academicYear.id)
        ? prev
        : [...prev, selectedArchiveBundle.academicYear.id]
    );
    setArchiveStatusMsg({
      tone: 'success',
      text: `Arsip Tahun Pelajaran ${selectedArchiveBundle.academicYear.name} berhasil dibuat dan diunduh (${filename}). Simpan file .json ini sebagai cadangan.`,
    });
  };

  const handleArchiveFilePicked = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseAndValidateEraArchive(text);
      if (parsed.ok === false) {
        setArchiveStatusMsg({ tone: 'danger', text: parsed.error });
        return;
      }
      setPendingImportBundle(parsed.bundle);
    } catch {
      setArchiveStatusMsg({
        tone: 'danger',
        text: 'Gagal membaca isi file arsip .json yang dipilih.',
      });
    }
  };

  const handleConfirmImportArchive = async () => {
    if (!pendingImportBundle || !onImportEraArchive) {
      setPendingImportBundle(null);
      return;
    }
    const bundle = pendingImportBundle;
    setPendingImportBundle(null);
    setIsArchiveBusy(true);
    try {
      const summary = await onImportEraArchive(bundle);
      setSelectedArchiveEraId(bundle.academicYear.id);
      setArchiveStatusMsg({
        tone: 'success',
        text: `Arsip Tahun Pelajaran ${summary.eraName} berhasil dipulihkan (+${summary.addedDungeons} kelas, +${summary.addedHeroes} siswa, +${summary.addedTomes} materi, +${summary.addedQuests} tugas, +${summary.addedGrades} nilai). Anda sekarang dapat mencetak laporannya di menu Guild Chronicles.`,
      });
    } finally {
      setIsArchiveBusy(false);
    }
  };

  const handleConfirmPruneEra = async () => {
    if (!selectedArchiveEra || !onPruneEraArchive) {
      setPruneModalOpen(false);
      return;
    }
    setPruneModalOpen(false);
    setIsArchiveBusy(true);
    try {
      const res = await onPruneEraArchive(
        selectedArchiveEra.id,
        pruneHeroesInEra
      );
      if (res.ok) {
        setArchiveStatusMsg({
          tone: 'warning',
          text:
            res.summaryText ||
            `Data Tahun Pelajaran ${selectedArchiveEra.name} telah dibersihkan dari memori aktif agar aplikasi tetap ringan.`,
        });
      } else {
        setArchiveStatusMsg({
          tone: 'danger',
          text: res.error || 'Gagal membersihkan Tahun Pelajaran lama.',
        });
      }
    } finally {
      setIsArchiveBusy(false);
      setPruneHeroesInEra(false);
    }
  };

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="System Settings"
        subtitle="Pilih gaya visual & font aplikasi, profil Guild Master, PWA, dan Cloud"
      />

      {/* Full Style & Typography Theme Selector */}
      <ThemedPanelCard className="space-y-3">
        <div>
          <h3 className="font-pixel-ui text-[11px] sm:text-[12px] tracking-[0.02em] leading-snug text-[var(--accent-warning)]">
            GAYA VISUAL &amp; KOMBINASI FONT APLIKASI
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Setiap tema mengubah bentuk kartu, gaya huruf, latar, dan nuansa belajar—bukan hanya warna.
          </p>
        </div>
        <div className="space-y-2">
          {THEME_STYLES.map((themeItem) => {
            const selected = state.settings.theme === themeItem.id;
            return (
              <button
                key={themeItem.id}
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...state.settings, theme: themeItem.id })
                }
                className={`w-full min-h-[56px] px-3 py-2.5 rounded-md flex items-center justify-between gap-2.5 border-2 cursor-pointer transition-all text-left ${
                  selected
                    ? 'border-[var(--border-pixel)] bg-[var(--surface-tint)] text-[var(--text-primary)] shadow-[2px_2px_0_var(--shadow-ink)] font-bold'
                    : 'border-[var(--border-pixel)]/40 bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-pixel-ui text-[11px] sm:text-[12px] truncate">
                    {selected ? '▶ ' : ''}
                    {themeItem.label}
                  </p>
                  <p className="text-[11.5px] font-normal opacity-85 leading-snug mt-0.5">
                    {themeItem.tagline} · <span className="font-semibold">{themeItem.fontLabel}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                  {themeItem.previewColors.map((hex) => (
                    <span
                      key={hex}
                      className="w-4 h-4 rounded-sm border border-black/40"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 space-y-1.5 border-t border-[var(--border-pixel)]/40">
          <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
              CRT Scanline Effect
            </span>
            <input
              type="checkbox"
              checked={state.settings.crtScanlines}
              onChange={(e) =>
                onUpdateSettings({
                  ...state.settings,
                  crtScanlines: e.target.checked,
                })
              }
              className="w-5 h-5 accent-[var(--accent-success)] shrink-0"
            />
          </label>
          <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
              16-Bit Chiptune SFX
            </span>
            <input
              type="checkbox"
              checked={state.settings.soundEnabled}
              onChange={(e) =>
                onUpdateSettings({
                  ...state.settings,
                  soundEnabled: e.target.checked,
                })
              }
              className="w-5 h-5 accent-[var(--accent-success)] shrink-0"
            />
          </label>
        </div>
      </ThemedPanelCard>

      {/* PWA Mobile Installation Card */}
      <ThemedPanelCard className="space-y-2.5">
        <h3 className="font-pixel-ui text-[11px] sm:text-[12px] tracking-[0.02em] leading-snug text-[var(--accent-warning)]">
          INSTALASI APLIKASI HP (PWA)
        </h3>
        <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
          Pasang Pixel Quest Academy langsung ke layar utama HP Android/iPhone agar terbuka layar penuh seperti aplikasi native dan tetap dapat diakses saat offline.
        </p>
        <PWAInstallButton showGuideFallback />
      </ThemedPanelCard>

      {/* GM Profile & Security Editor */}
      <ThemedPanelCard>
      <form onSubmit={handleSaveProfile} className="space-y-3.5">
        <div className="flex items-center gap-3">
          <PixelAvatar avatar={avatar} size={46} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-pixel-ui text-[11px] sm:text-[12px] tracking-[0.02em] text-[var(--accent-warning)] leading-snug">
              GAME MASTER PROFILE &amp; SECURITY
            </h3>
            <p className="text-[12.5px] text-[var(--text-secondary)] leading-snug mt-0.5">
              Kustomisasi identitas guru dan keamanan akun admin
            </p>
          </div>
        </div>

        {/* GM Avatar Selection */}
        <div>
          <PixelFieldLabel>Pilih Avatar Guild Master</PixelFieldLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: 'guild_master' as const, label: 'Master' },
              { id: 'knight' as const, label: 'Knight' },
              { id: 'mage' as const, label: 'Mage' },
              { id: 'alchemist' as const, label: 'Alchemist' },
              { id: 'ranger' as const, label: 'Ranger' },
              { id: 'scholar' as const, label: 'Scholar' },
            ].map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setAvatar(av.id)}
                className={`p-2 flex flex-col items-center justify-center gap-1.5 border-2 cursor-pointer transition-all ${
                  avatar === av.id
                    ? 'border-[var(--accent-warning)] bg-[var(--bg-surface-alt)] shadow-sm'
                    : 'border-[var(--border-pixel)]/60 bg-[var(--bg-inset)] opacity-75 hover:opacity-100'
                }`}
              >
                <PixelAvatar avatar={av.id} size={36} />
                <span className="font-pixel-ui text-[10px] text-[var(--text-primary)] leading-tight">
                  {av.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <PixelFieldLabel htmlFor="gm-name">Nama Game Master (Guru)</PixelFieldLabel>
            <PixelInput
              id="gm-name"
              required
              placeholder="Contoh: Amin Wahyudi, S.Pd."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="gm-title">Gelar / Posisi di Guild</PixelFieldLabel>
              <PixelInput
                id="gm-title"
                required
                placeholder="Contoh: Guild Master of Science"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <PixelFieldLabel htmlFor="gm-spec">Mata Pelajaran / Keahlian</PixelFieldLabel>
              <PixelInput
                id="gm-spec"
                placeholder="Contoh: Guru Bahasa Indonesia"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <PixelFieldLabel htmlFor="gm-term">Periode Akademik (Era &amp; Season)</PixelFieldLabel>
            <PixelInput
              id="gm-term"
              placeholder="Contoh: Era 2026/2027 — Season 1 (Ganjil)"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Security & Credentials */}
        <div className="pt-2 border-t border-[var(--border-pixel)]/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="font-pixel-ui text-[10.5px] text-[var(--accent-warning)] uppercase inline-flex items-center gap-1.5">
              <Lock size={12} className="shrink-0" />
              Akun &amp; Password Guru
            </span>
            <span className="text-[11.5px] font-medium text-[var(--text-muted)]">
              Proteksi Akses Siswa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <PixelFieldLabel htmlFor="gm-user">Username Login GM</PixelFieldLabel>
              <PixelInput
                id="gm-user"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <PixelFieldLabel htmlFor="gm-pass">
                {isProtectedPass ? 'Ganti Password GM (Opsional)' : 'Password Akun GM'}
              </PixelFieldLabel>
              <div className="flex items-center gap-1.5">
                <PixelInput
                  id="gm-pass"
                  type={showGmPassword ? 'text' : 'password'}
                  required={!isProtectedPass && !gmAuth?.password}
                  placeholder={isProtectedPass ? 'Kosongkan jika tetap pakai password saat ini' : 'Password guru'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowGmPassword((v) => !v)}
                  aria-label={showGmPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="pixel-btn min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)] cursor-pointer shrink-0"
                >
                  {showGmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-[var(--text-secondary)] pixel-box-inset p-2.5 bg-[var(--bg-inset)] leading-snug">
            Login Game Master selalu wajib menggunakan Username &amp; Password (Fast Enter dinonaktifkan &amp; password terenkripsi di database).
          </p>
        </div>

        {saveSuccess && (
          <p className="text-[13px] font-semibold text-[var(--accent-success)]">
            ✓ Profil & pengaturan keamanan Game Master berhasil disimpan!
          </p>
        )}

        <PixelButton type="submit" variant="primary" fullWidth size="md">
          Simpan Profil & Pengaturan Keamanan
        </PixelButton>
      </form>
      </ThemedPanelCard>

      {/* Interactive Supabase Cloud Sync Manager */}
      <ThemedPanelCard className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Cloud size={17} className="text-[var(--accent-warning)] shrink-0" />
            <h3 className="font-pixel-ui text-[11px] sm:text-[12px] tracking-[0.02em] text-[var(--accent-warning)] leading-snug">
              SUPABASE CLOUD SYNC
            </h3>
          </div>
          <span
            className={`font-pixel-ui text-[10px] px-2 py-0.5 rounded border-2 font-bold shrink-0 inline-flex items-center gap-1 ${
              isCloudConfigured
                ? 'bg-emerald-100 text-emerald-800 border-emerald-700'
                : 'bg-amber-100 text-amber-800 border-amber-700'
            }`}
          >
            <Cloud size={11} className="shrink-0" />
            {isCloudConfigured ? 'CLOUD AKTIF' : 'MODE LOKAL'}
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          Agar data yang diinput oleh Guru (Game Master) langsung tersimpan dan dapat dibaca oleh siswa di perangkat lain (HP, laptop, tablet), hubungkan ke Supabase Cloud:
        </p>

        {isCloudConfigured && isHardenedSecurity !== null && (
          <div
            className={`pixel-box-inset p-2.5 text-[12px] font-medium flex items-center gap-2 border-2 ${
              isHardenedSecurity
                ? 'border-emerald-700 text-emerald-900 bg-emerald-100'
                : 'border-amber-700 text-amber-900 bg-amber-100'
            }`}
          >
            <Lock size={14} className="shrink-0" />
            <span>
              {isHardenedSecurity
                ? 'Keamanan RLS Ketat & Hash Password Aktif (Nilai & Kredensial GM terlindungi di server Supabase).'
                : 'Database masih memakai mode lama. Jalankan pembaruan supabase-schema.sql di Supabase SQL Editor untuk mengaktifkan enkripsi password, PIN siswa, dan RLS ketat.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSaveCloudConfig} className="space-y-3 pt-1">
          <div>
            <PixelFieldLabel htmlFor="sb-url">Supabase Project URL</PixelFieldLabel>
            <PixelInput
              id="sb-url"
              placeholder="https://your-project-id.supabase.co"
              value={cloudUrl}
              onChange={(e) => setCloudUrl(e.target.value)}
            />
          </div>
          <div>
            <PixelFieldLabel htmlFor="sb-key">Supabase Anon Key (Public API Key)</PixelFieldLabel>
            <PixelInput
              id="sb-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={cloudKey}
              onChange={(e) => setCloudKey(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <PixelButton type="submit" variant="primary" size="sm" disabled={isSyncing} className="flex-1">
              <Check size={14} />
              Simpan & Uji Koneksi
            </PixelButton>

            {isCloudConfigured && (
              <>
                <PixelButton
                  type="button"
                  variant="success"
                  size="sm"
                  disabled={isSyncing}
                  onClick={handleSyncAllToCloud}
                  className="flex-1"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Proses...' : 'Kirim ke Cloud'}
                </PixelButton>
                <PixelButton
                  type="button"
                  variant="warning"
                  size="sm"
                  disabled={isSyncing}
                  onClick={handlePullFromCloud}
                  className="flex-1"
                >
                  <Download size={14} />
                  Ambil dari Cloud
                </PixelButton>
              </>
            )}
          </div>
        </form>

        {syncStatusMsg && (
          <p className="text-[13px] font-semibold text-[var(--accent-warning)] bg-[var(--bg-inset)] p-2.5 border border-[var(--border-pixel)]">
            {syncStatusMsg}
          </p>
        )}

        {/* Cross-Device Shareable Link */}
        {isCloudConfigured && shareLink && (
          <div className="pixel-box-inset p-3 space-y-2 border-2 border-[var(--accent-success)]/60 bg-[var(--bg-inset)]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-pixel-ui text-[10px] text-[var(--accent-success)] flex items-center gap-1.5">
                <Link2 size={13} />
                LINK AKSES LINTAS PERANGKAT (HP / LAPTOP LAIN)
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-snug">
              Bagikan link ini ke HP siswa atau buka di laptop lain agar perangkat tersebut <strong>otomatis terhubung</strong> ke database Cloud yang sama tanpa perlu input ulang API Key:
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <PixelInput
                readOnly
                value={shareLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="text-[12px] flex-1"
              />
              <PixelButton
                type="button"
                size="sm"
                variant="success"
                onClick={handleCopyShareLink}
                className="shrink-0"
              >
                <Copy size={14} />
                {linkCopied ? 'Tersalin!' : 'Salin Link'}
              </PixelButton>
            </div>
          </div>
        )}

        <div className="pixel-box-inset p-2.5 text-[12.5px] text-[var(--text-muted)] leading-normal space-y-1.5">
          <p>
            <strong>1. Setup Database (Sekali Saja):</strong> Jalankan skrip <span className="text-[var(--accent-warning)]">supabase-schema.sql</span> di Supabase <strong>SQL Editor</strong>, lalu masukkan URL & Anon Key di atas dan klik <strong>Kirim ke Cloud</strong>.
          </p>
          <p>
            <strong>2. Buka Akun Admin di HP & Laptop Secara Bersamaan:</strong> Buka <strong>Link Akses Lintas Perangkat</strong> di HP maupun Laptop lalu login dengan akun GM yang sama (<em>atau</em> pasang <code className="text-[var(--accent-warning)]">VITE_SUPABASE_URL</code> & <code className="text-[var(--accent-warning)]">VITE_SUPABASE_ANON_KEY</code> di Vercel lalu Redeploy). Setiap edit di HP otomatis tersinkron ke Laptop dalam beberapa detik atau klik tombol <strong>Sync</strong> di pojok kanan atas.
          </p>
          {isCloudConfigured && (
            <button
              type="button"
              onClick={() => {
                clearSupabaseConfig();
                setCloudUrl('');
                setCloudKey('');
                setIsCloudConfigured(false);
                setSyncStatusMsg('Konfigurasi Supabase lokal dihapus.');
              }}
              className="text-[11px] text-[var(--accent-danger)] hover:underline cursor-pointer pt-1"
            >
              Putuskan Koneksi Cloud dari Perangkat Ini
            </button>
          )}
        </div>
      </ThemedPanelCard>

      {/* Manajemen Arsip Tahun Pelajaran */}
      <ThemedPanelCard className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Archive size={17} className="text-[var(--accent-warning)] shrink-0" />
            <h3 className="font-pixel-ui text-[11px] sm:text-[12px] tracking-[0.02em] text-[var(--accent-warning)] leading-snug">
              MANAJEMEN ARSIP TAHUN PELAJARAN
            </h3>
          </div>
          <span className="font-pixel-ui text-[10px] px-2 py-0.5 border border-[var(--border-pixel)] bg-[var(--bg-inset)] text-[var(--text-primary)] shrink-0">
            {academicYears.length} ERA TERSIMPAN
          </span>
        </div>

        <div className="pixel-box-inset p-3 bg-[var(--bg-inset)] text-[12.5px] text-[var(--text-secondary)] leading-relaxed space-y-1">
          <p className="font-bold text-[var(--text-primary)]">
            Rekomendasi Pengelolaan Data Tahunan (Ringan &amp; Aman):
          </p>
          <p>
            Agar aplikasi tetap ringan di HP maupun laptop tanpa kehilangan riwayat, terapkan alur{' '}
            <strong>1. Generate &amp; Unduh Arsip (.json)</strong> terlebih dahulu, lalu{' '}
            <strong>2. Bersihkan Tahun Lama</strong> yang sudah tidak aktif. Kapan saja laporan atau data tahun lama dibutuhkan lagi, cukup{' '}
            <strong>3. Unggah &amp; Pulihkan File Arsip (.json)</strong> di sini.
          </p>
        </div>

        {academicYears.length > 0 && (
          <div className="space-y-2.5">
            <div>
              <PixelFieldLabel htmlFor="archive-era-select">
                Pilih Tahun Pelajaran (Era)
              </PixelFieldLabel>
              <PixelSelect
                id="archive-era-select"
                value={effectiveArchiveEraId}
                onChange={(e) => setSelectedArchiveEraId(e.target.value)}
              >
                {academicYears.map((era) => (
                  <option key={era.id} value={era.id}>
                    {era.name} {era.isActive ? '(Tahun Aktif Saat Ini)' : '(Non-Aktif / Siap Diarsipkan)'}
                  </option>
                ))}
              </PixelSelect>
            </div>

            {selectedArchiveBundle && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[11.5px]">
                <div className="pixel-box-inset p-2 bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)]">Kelas</p>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedArchiveBundle.counts.dungeons}
                  </p>
                </div>
                <div className="pixel-box-inset p-2 bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)]">Siswa</p>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedArchiveBundle.counts.heroes}
                  </p>
                </div>
                <div className="pixel-box-inset p-2 bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)]">Materi</p>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedArchiveBundle.counts.tomes}
                  </p>
                </div>
                <div className="pixel-box-inset p-2 bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)]">Tugas</p>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedArchiveBundle.counts.quests}
                  </p>
                </div>
                <div className="pixel-box-inset p-2 bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)]">Notice</p>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedArchiveBundle.counts.notices}
                  </p>
                </div>
                <div className="pixel-box-inset p-2 bg-[var(--bg-surface)]">
                  <p className="text-[var(--text-muted)]">Nilai</p>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedArchiveBundle.counts.grades}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              <PixelButton
                type="button"
                variant="primary"
                size="sm"
                disabled={!selectedArchiveBundle || isArchiveBusy}
                onClick={handleGenerateArchiveDownload}
              >
                <FileDown size={14} />
                <span>Generate &amp; Unduh (.json)</span>
              </PixelButton>

              <PixelButton
                type="button"
                variant="danger"
                size="sm"
                disabled={
                  !selectedArchiveEra ||
                  selectedArchiveEra.isActive ||
                  isArchiveBusy ||
                  !onPruneEraArchive
                }
                onClick={() => {
                  setPruneHeroesInEra(false);
                  setPruneModalOpen(true);
                }}
              >
                <Trash2 size={14} />
                <span>Bersihkan Tahun Ini</span>
              </PixelButton>

              <PixelButton
                type="button"
                variant="success"
                size="sm"
                disabled={isArchiveBusy || !onImportEraArchive}
                onClick={() => archiveFileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Unggah Arsip (.json)</span>
              </PixelButton>
            </div>

            <input
              ref={archiveFileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleArchiveFilePicked}
              className="hidden"
              aria-label="Pilih file arsip tahun pelajaran JSON"
            />

            {selectedArchiveEra?.isActive && (
              <p className="text-[12px] text-[var(--text-muted)] leading-snug">
                Catatan: Tahun Pelajaran <strong>{selectedArchiveEra.name}</strong> sedang aktif sehingga tidak dapat dibersihkan. Buat atau alihkan ke Tahun Pelajaran baru pada pemilih Era di bagian atas layar terlebih dahulu jika ingin membersihkan tahun lama.
              </p>
            )}
          </div>
        )}

        {archiveStatusMsg && (
          <div
            className={`pixel-box-inset p-2.5 text-[12.5px] font-semibold border-2 ${
              archiveStatusMsg.tone === 'success'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : archiveStatusMsg.tone === 'warning'
                  ? 'border-amber-700 bg-amber-50 text-amber-900'
                  : 'border-rose-700 bg-rose-50 text-rose-900'
            }`}
          >
            {archiveStatusMsg.text}
          </div>
        )}
      </ThemedPanelCard>

      {/* Security & RBAC Guard Testing */}
      <ThemedPanelCard className="space-y-2.5">
        <h3 className="font-pixel-ui text-[11px] sm:text-[12px] tracking-[0.02em] leading-snug text-[var(--accent-warning)]">
          PENGUJIAN KEAMANAN &amp; RESET
        </h3>
        <PixelButton
          type="button"
          variant="warning"
          fullWidth
          onClick={onTestAccessDenied}
        >
          <ShieldAlert size={15} />
          Test Hero Route Guard (EC-01)
        </PixelButton>
        <PixelButton
          type="button"
          variant="danger"
          fullWidth
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw size={15} />
          Reset Demo Data
        </PixelButton>
      </ThemedPanelCard>

      {/* Confirm Prune Archived Era Modal */}
      <PixelModal
        open={pruneModalOpen && Boolean(selectedArchiveEra)}
        title={`Bersihkan Tahun Pelajaran ${selectedArchiveEra?.name || ''}`}
        onClose={() => setPruneModalOpen(false)}
      >
        <div className="space-y-3 text-[13px] text-[var(--text-secondary)]">
          <p className="leading-relaxed text-[var(--text-primary)]">
            Tindakan ini akan menghapus seluruh Kelas, Tugas, Pengumuman, Nilai, dan Materi khusus Tahun Pelajaran{' '}
            <strong>{selectedArchiveEra?.name}</strong> dari aplikasi aktif (lokal maupun Cloud) agar aplikasi tetap ringan.
          </p>

          {selectedArchiveEra && !downloadedEraIds.includes(selectedArchiveEra.id) && (
            <div className="pixel-box-inset p-2.5 border-2 border-amber-700 bg-amber-50 text-amber-900 font-semibold">
              Anda belum menekan &ldquo;Generate &amp; Unduh (.json)&rdquo; pada sesi ini untuk Tahun Pelajaran {selectedArchiveEra.name}. Disarankan unduh file arsip terlebih dahulu sebelum membersihkan.
            </div>
          )}

          <label className="pixel-box-inset p-2.5 bg-[var(--bg-inset)] flex items-start gap-2.5 cursor-pointer text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={pruneHeroesInEra}
              onChange={(e) => setPruneHeroesInEra(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[var(--accent-danger)] shrink-0"
            />
            <span>
              <strong>Ikut hapus data akun siswa pada tahun ini</strong> (centang jika siswa sudah lulus; biarkan tidak dicentang jika siswa masih naik ke kelas tahun berikutnya).
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <PixelButton
              type="button"
              variant="neutral"
              onClick={() => setPruneModalOpen(false)}
              className="flex-1"
            >
              Batal
            </PixelButton>
            <PixelButton
              type="button"
              variant="danger"
              onClick={handleConfirmPruneEra}
              className="flex-1"
            >
              Ya, Bersihkan Tahun Ini
            </PixelButton>
          </div>
        </div>
      </PixelModal>

      {/* Confirm Import Archive Modal */}
      <PixelConfirmDialog
        open={Boolean(pendingImportBundle)}
        title={`Pulihkan Arsip TP ${pendingImportBundle?.academicYear.name || ''}`}
        message={
          pendingImportBundle
            ? `File arsip valid berisi ${pendingImportBundle.counts.dungeons} Kelas, ${pendingImportBundle.counts.heroes} Siswa, ${pendingImportBundle.counts.tomes} Materi, ${pendingImportBundle.counts.quests} Tugas, ${pendingImportBundle.counts.notices} Pengumuman, dan ${pendingImportBundle.counts.grades} Nilai. Pulihkan data ini ke aplikasi tanpa mengganggu Tahun Pelajaran aktif saat ini?`
            : ''
        }
        confirmLabel="Ya, Pulihkan Arsip"
        onCancel={() => setPendingImportBundle(null)}
        onConfirm={handleConfirmImportArchive}
      />

      <PixelConfirmDialog
        open={confirmReset}
        title="Reset Demo Data"
        message="Kembalikan seluruh data Dungeons, Heroes, Tomes, Quests, dan EXP ke kondisi awal simulasi?"
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          onResetDemoData();
          setConfirmReset(false);
        }}
      />
    </div>
  );
};
