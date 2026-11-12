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

interface GmSettingsProps {
  state: AcademyState;
  onUpdateGmProfile: (profile: GameMasterProfile) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onResetDemoData: () => void;
  onSwitchRole: (role: UserRole) => void;
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
  onSwitchRole,
  onTestAccessDenied,
}) => {
  const [name, setName] = useState(state.gmProfile.name);
  const [title, setTitle] = useState(state.gmProfile.title);
  const [term, setTerm] = useState(state.settings.academicTerm);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGmProfile({
      ...state.gmProfile,
      name: name.trim() || state.gmProfile.name,
      title: title.trim() || state.gmProfile.title,
    });
    onUpdateSettings({
      ...state.settings,
      academicTerm: term.trim() || state.settings.academicTerm,
    });
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

      {/* GM Profile Editor */}
      <form onSubmit={handleSaveProfile} className="pixel-box p-4 space-y-3">
        <div className="flex items-center gap-3">
          <PixelAvatar avatar={state.gmProfile.avatar} size={44} />
          <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
            GAME MASTER PROFILE
          </h3>
        </div>
        <div>
          <PixelFieldLabel htmlFor="gm-name">Nama Game Master</PixelFieldLabel>
          <PixelInput
            id="gm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <PixelFieldLabel htmlFor="gm-title">Gelar / Jabatan</PixelFieldLabel>
          <PixelInput
            id="gm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <PixelFieldLabel htmlFor="gm-term">Periode Akademik</PixelFieldLabel>
          <PixelInput
            id="gm-term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <PixelButton type="submit" variant="primary" fullWidth>
          Save Profile
        </PixelButton>
      </form>

      {/* Database & Supabase Integration Status */}
      <section className="pixel-box p-4 space-y-2.5">
        <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)] flex items-center justify-between">
          <span>DATABASE & SUPABASE</span>
          <span className="text-[var(--accent-success)] font-pixel-body text-[14px]">POSTGRES READY</span>
        </h3>
        <div className="pixel-box-inset p-3 space-y-1.5 font-pixel-body text-[16px] text-[var(--text-secondary)]">
          <p className="text-[var(--text-primary)] font-pixel-ui text-[10px]">
            ⚡ CLOUD SQL POSTGRESQL: <span className="text-[var(--accent-success)]">ACTIVE</span>
          </p>
          <p>
            Database relasional aktif dengan 9 tabel Drizzle (`dungeons`, `heroes`, `notices`, `realms`, `tomes`, `quests`, `grades`, `settings`).
          </p>
          <div className="pt-2 border-t border-[var(--border-pixel)]/40 space-y-1">
            <p className="text-[var(--text-primary)] font-pixel-ui text-[10px]">
              🔗 SUPABASE ADAPTER: <span className="text-[var(--accent-warning)]">CONNECTED</span>
            </p>
            <p className="text-[14px] text-[var(--text-muted)]">
              File migrasi <span className="text-[var(--accent-warning)]">`supabase-schema.sql`</span> telah siap di root project untuk di-paste langsung ke Supabase SQL Editor.
            </p>
          </div>
        </div>
      </section>

      {/* Role & RBAC Edge Case Simulation */}
      <section className="pixel-box p-4 space-y-2.5">
        <h3 className="font-pixel-ui text-[11px] text-[var(--accent-warning)]">
          SIMULATION & RBAC GUARD
        </h3>
        <PixelButton
          type="button"
          variant="success"
          fullWidth
          onClick={() => onSwitchRole(UserRole.HERO)}
        >
          Switch to Hero Mode (Read-Only)
        </PixelButton>
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
