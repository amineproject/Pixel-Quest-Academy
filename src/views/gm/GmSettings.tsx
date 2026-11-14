import React, { useEffect, useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
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
  PixelSectionTitle,
} from '../../components/PixelUI';
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

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="System Settings"
        subtitle="Pilih gaya visual & font aplikasi, profil Guild Master, PWA, dan Cloud"
      />

      {/* Full Style & Typography Theme Selector */}
      <ThemedPanelCard className="space-y-3">
        <div>
          <h3 className="font-pixel-ui text-[12px] text-[var(--accent-warning)]">
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
              8-Bit Chiptune SFX
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
        <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
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
            <h3 className="font-pixel-ui text-[11px] sm:text-[12px] text-[var(--accent-warning)] leading-snug">
              GAME MASTER PROFILE & SECURITY
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
                <span className="font-pixel-ui text-[9px] text-[var(--text-primary)]">
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
            <PixelFieldLabel htmlFor="gm-term">Periode Akademik</PixelFieldLabel>
            <PixelInput
              id="gm-term"
              placeholder="Contoh: Semester Ganjil 2026/2027"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Security & Credentials */}
        <div className="pt-2 border-t border-[var(--border-pixel)]/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)] uppercase">
              🔐 Akun & Password Guru
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
            <h3 className="font-pixel-ui text-[10.5px] sm:text-[11px] text-[var(--accent-warning)] leading-snug">
              SUPABASE CLOUD SYNC
            </h3>
          </div>
          <span
            className={`font-pixel-ui text-[9px] px-2 py-0.5 rounded border-2 font-bold shrink-0 ${
              isCloudConfigured
                ? 'bg-emerald-100 text-emerald-800 border-emerald-700'
                : 'bg-amber-100 text-amber-800 border-amber-700'
            }`}
          >
            {isCloudConfigured ? '☁️ CLOUD AKTIF' : '⚠️ MODE LOKAL'}
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

      {/* Security & RBAC Guard Testing */}
      <ThemedPanelCard className="space-y-2.5">
        <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
          PENGUJIAN KEAMANAN & RESET
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
