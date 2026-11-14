import { PixelTheme } from '../types/lms';

export interface ThemeStyleOption {
  id: PixelTheme;
  shortLabel: string;
  label: string;
  tagline: string;
  fontLabel: string;
  previewColors: string[];
}

export const THEME_STYLES: ThemeStyleOption[] = [
  {
    id: 'sunny_quest',
    shortLabel: 'Cozy RPG',
    label: 'Cozy Pixel Quest (Parchment RPG)',
    tagline: 'Nuansa petualangan 16-bit hangat, dialog perkamen santai, & fokus baca nyaman',
    fontLabel: 'Pixelify Sans · Patrick Hand · Nunito',
    previewColors: ['#63C5EA', '#FAF1DA', '#4A3525', '#2F855A'],
  },
  {
    id: 'daylight_rpg',
    shortLabel: 'Chibi',
    label: 'Soft Chibi Classroom (Pastel)',
    tagline: 'Sudut membulat lembut, warna pastel cerah, ringan & ramah di layar HP',
    fontLabel: 'Fredoka · Nunito',
    previewColors: ['#A7F3D0', '#F3FBFF', '#0284C7', '#1E4E68'],
  },
  {
    id: 'nes_classic',
    shortLabel: 'Royal',
    label: '16-Bit Royal Chronicle',
    tagline: 'Bingkai RPG fantasi klasik dengan aksen ungu kerajaan & emas',
    fontLabel: 'Pixelify Sans · Chakra Petch · Plus Jakarta',
    previewColors: ['#3B1D72', '#FDF8ED', '#FBBF24', '#5B21B6'],
  },
  {
    id: 'cyber_retro',
    shortLabel: 'Comic',
    label: 'Comic-Pop Arcade',
    tagline: 'Garis tinta tegas, pola halftone dinamis, & kontras neon elektrik',
    fontLabel: 'Bungee · Chakra Petch · Plus Jakarta',
    previewColors: ['#1B0D42', '#00D8FF', '#FFD000', '#E11D74'],
  },
  {
    id: 'gameboy_green',
    shortLabel: 'Paper',
    label: 'Clean Paper Studio (Minimalis)',
    tagline: 'Gaya buku catatan editorial bersih tanpa distraksi untuk membaca lama',
    fontLabel: 'Chakra Petch · Plus Jakarta · Nunito',
    previewColors: ['#FAF8F4', '#EAE4D7', '#27272A', '#15803D'],
  },
];
