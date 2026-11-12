import React, { useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import {
  AcademyState,
  GameMasterProfile,
  PixelTheme,
  SystemSettings,
  UserRole,
} from '../../types/lms';
import { PixelAvatar } from '../../components/PixelArt';
import {
  PixelButton,
  PixelConfirmDialog,
  PixelFieldLabel,
  PixelInput,
  PixelSectionTitle,
} from '../../components/PixelUI';

import {
  clearSupabaseConfig,
  getStoredSupabaseAnonKey,
  getStoredSupabaseUrl,
  isSupabaseConfigured,
  saveSupabaseConfig,
  uploadAllLocalToSupabase,
} from '../../lib/supabase';
import { Check, Cloud, RefreshCw } from 'lucide-react';

interface GmSettingsProps {
  state: AcademyState;
  onUpdateGmProfile: (profile: GameMasterProfile) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onResetDemoData: () => void;
  onTestAccessDenied: () => void;
}

const THEMES: { id: PixelTheme; label: string; previewColors: string[] }[] = [
  {
    id: 'sunny_quest',
    label: 'Sunny Quest (Cheerful)',
    previewColors: ['#162B50', '#FFD13B', '#10B981', '#F43F5E'],
  },
  {
    id: 'daylight_rpg',
    label: 'Daylight RPG (Sunshine)',
    previewColors: ['#F0F7FF', '#0284C7', '#FFD13B', '#16A34A'],
  },
  {
    id: 'nes_classic',
    label: 'NES Classic',
    previewColors: ['#1A1C2C', '#38B764', '#FEAE34', '#EF7D57'],
  },
  {
    id: 'cyber_retro',
    label: 'Cyber Retro',
    previewColors: ['#120F24', '#2CE8F5', '#FEAE34', '#FF4D6D'],
  },
  {
    id: 'gameboy_green',
    label: 'Game Boy Green',
    previewColors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  },
];

export const GmSettings: React.FC<GmSettingsProps> = ({
  state,
  onUpdateGmProfile,
  onUpdateSettings,
  onResetDemoData,
  onTestAccessDenied,
}) => {
  const [name, setName] = useState(state.gmProfile.name);
  const [title, setTitle] = useState(state.gmProfile.title);
  const [specialty, setSpecialty] = useState(state.gmProfile.specialty || 'Guru IPA & Pembina Sains');
  const [avatar, setAvatar] = useState(state.gmProfile.avatar || 'guild_master');
  const [username, setUsername] = useState(state.gmProfile.username || 'admin');
  const [password, setPassword] = useState(state.gmProfile.password || 'admin');
  const [requirePassword, setRequirePassword] = useState(
    Boolean(state.gmProfile.requirePassword)
  );
  const [term, setTerm] = useState(state.settings.academicTerm);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase Cloud Sync State
  const [cloudUrl, setCloudUrl] = useState(getStoredSupabaseUrl);
  const [cloudKey, setCloudKey] = useState(getStoredSupabaseAnonKey);
  const [isCloudConfigured, setIsCloudConfigured] = useState(isSupabaseConfigured);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudUrl.trim() || !cloudKey.trim()) {
      setSyncStatusMsg('Harap isi URL Proyek dan Anon Key Supabase!');
      return;
    }
    saveSupabaseConfig(cloudUrl, cloudKey);
    const configured = isSupabaseConfigured();
    setIsCloudConfigured(configured);
    if (configured) {
      setSyncStatusMsg('✓ Berhasil terhubung ke Supabase Cloud!');
    } else {
      setSyncStatusMsg('Format URL atau Anon Key tidak valid.');
    }
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleSyncAllToCloud = async () => {
    if (!isCloudConfigured) {
      setSyncStatusMsg('Hubungkan ke Supabase Cloud terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Sedang mengunggah seluruh data ke Supabase Cloud...');
    const ok = await uploadAllLocalToSupabase(state);
    setIsSyncing(false);
    if (ok) {
      setSyncStatusMsg('✓ Seluruh data sukses tersinkronisasi ke Supabase Cloud!');
    } else {
      setSyncStatusMsg('Gagal mengunggah data. Pastikan tabel di Supabase sudah dibuat.');
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGmProfile({
      ...state.gmProfile,
      name: name.trim() || state.gmProfile.name,
      title: title.trim() || state.gmProfile.title,
      specialty: specialty.trim() || state.gmProfile.specialty,
      avatar,
      username: username.trim() || 'admin',
      password: password.trim() || 'admin',
      requirePassword,
    });
    onUpdateSettings({
      ...state.settings,
      academicTerm: term.trim() || state.settings.academicTerm,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2400);
  };

  return (
    <div className="space-y-5">
      <PixelSectionTitle
        title="System Settings"
        subtitle="Tema 8-bit, profil Guild Master, dan kontrol simulasi"
      />

      {/* 8-Bit Theme Selector */}
      <section className="pixel-box p-4 space-y-3">
        <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
          RETRO COLOR PALETTE
        </h3>
        <div className="space-y-2">
          {THEMES.map((themeItem) => {
            const selected = state.settings.theme === themeItem.id;
            return (
              <button
                key={themeItem.id}
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...state.settings, theme: themeItem.id })
                }
                className={`w-full min-h-[48px] px-3 py-2 flex items-center justify-between border-2 cursor-pointer ${
                  selected
                    ? 'border-[var(--accent-warning)] bg-[var(--bg-surface-alt)]'
                    : 'border-[var(--border-pixel)] bg-[var(--bg-inset)]'
                }`}
              >
                <span className="font-pixel-ui text-[11px] text-[var(--text-primary)]">
                  {selected ? '▶ ' : ''}
                  {themeItem.label}
                </span>
                <div className="flex items-center gap-1" aria-hidden="true">
                  {themeItem.previewColors.map((hex) => (
                    <span
                      key={hex}
                      className="w-4 h-4 border border-black/50"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 space-y-2 border-t border-[var(--border-pixel)]/40">
          <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
            <span className="font-pixel-body text-[19px] text-[var(--text-primary)]">
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
              className="w-5 h-5 accent-[var(--accent-success)]"
            />
          </label>
          <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
            <span className="font-pixel-body text-[19px] text-[var(--text-primary)]">
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
              className="w-5 h-5 accent-[var(--accent-success)]"
            />
          </label>
        </div>
      </section>

      {/* GM Profile & Security Editor */}
      <form onSubmit={handleSaveProfile} className="pixel-box p-4 space-y-3.5">
        <div className="flex items-center gap-3">
          <PixelAvatar avatar={avatar} size={48} />
          <div>
            <h3 className="font-pixel-ui text-[12px] text-[var(--accent-warning)]">
              GAME MASTER PROFILE & SECURITY
            </h3>
            <p className="font-pixel-body text-[15px] text-[var(--text-secondary)]">
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
          <div className="flex items-center justify-between">
            <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)] uppercase">
              🔐 Akun & Password Guru
            </span>
            <span className="font-pixel-body text-[14px] text-[var(--text-muted)]">
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
              <PixelFieldLabel htmlFor="gm-pass">Password Akun GM</PixelFieldLabel>
              <PixelInput
                id="gm-pass"
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-2.5 pixel-box-inset cursor-pointer bg-[var(--bg-inset)]">
            <input
              type="checkbox"
              checked={requirePassword}
              onChange={(e) => setRequirePassword(e.target.checked)}
              className="w-5 h-5 accent-[var(--accent-warning)] mt-0.5 shrink-0"
            />
            <div className="space-y-0.5">
              <span className="font-pixel-ui text-[10px] text-[var(--accent-warning)] block">
                KUNCI MODE GAME MASTER (Wajibkan Password)
              </span>
              <p className="font-pixel-body text-[15px] text-[var(--text-secondary)] leading-tight">
                Hilangkan tombol 1-klik "Fast Enter" di layar login agar siswa tidak bisa sembarangan masuk ke mode guru.
              </p>
            </div>
          </label>
        </div>

        {saveSuccess && (
          <p className="font-pixel-body text-[16px] text-[var(--accent-success)]">
            ✓ Profil & pengaturan keamanan Game Master berhasil disimpan!
          </p>
        )}

        <PixelButton type="submit" variant="primary" fullWidth size="md">
          Simpan Profil & Pengaturan Keamanan
        </PixelButton>
      </form>

      {/* Interactive Supabase Cloud Sync Manager */}
      <section className="pixel-box p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-[var(--accent-warning)]" />
            <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
              SUPABASE CLOUD SYNC (SINKRONISASI SEMUA PERANGKAT)
            </h3>
          </div>
          <span
            className={`font-pixel-ui text-[9px] px-2 py-0.5 border ${
              isCloudConfigured
                ? 'bg-emerald-950/40 text-[var(--accent-success)] border-[var(--accent-success)]'
                : 'bg-amber-950/40 text-[var(--accent-warning)] border-[var(--accent-warning)]'
            }`}
          >
            {isCloudConfigured ? '☁️ CLOUD AKTIF' : '⚠️ MODE LOKAL'}
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          Agar data yang diinput oleh Guru (Game Master) langsung tersimpan dan dapat dibaca oleh siswa di perangkat lain (HP, laptop, tablet), hubungkan ke Supabase Cloud:
        </p>

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
            <PixelButton type="submit" variant="primary" size="sm" className="flex-1">
              <Check size={14} />
              Simpan & Hubungkan Cloud
            </PixelButton>

            {isCloudConfigured && (
              <PixelButton
                type="button"
                variant="success"
                size="sm"
                disabled={isSyncing}
                onClick={handleSyncAllToCloud}
                className="flex-1"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Mengunggah...' : 'Sinkronkan Data ke Cloud'}
              </PixelButton>
            )}
          </div>
        </form>

        {syncStatusMsg && (
          <p className="text-[13.5px] font-semibold text-[var(--accent-warning)] bg-[var(--bg-inset)] p-2.5 border border-[var(--border-pixel)]">
            {syncStatusMsg}
          </p>
        )}

        <div className="pixel-box-inset p-2.5 text-[12.5px] text-[var(--text-muted)] leading-normal space-y-1">
          <p>
            💡 <strong>Panduan:</strong> Masukkan URL & Anon Key dari Dashboard Supabase Anda (<strong>Project Settings &gt; API</strong>). Skrip tabel SQL tersimpan di berkas <span className="text-[var(--accent-warning)]">supabase-schema.sql</span>.
          </p>
          <p>
            Setelah terhubung, setiap pembuatan kelas, hero siswa, tugas, dan nilai akan otomatis tersimpan di cloud dan langsung terbaca di HP/laptop siswa!
          </p>
        </div>
      </section>

      {/* Security & RBAC Guard Testing */}
      <section className="pixel-box p-4 space-y-2.5">
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
      </section>

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
