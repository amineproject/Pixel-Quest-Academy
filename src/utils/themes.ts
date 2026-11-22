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
    shortLabel: 'Paper Stage',
    label: 'Super Paper Stage (Mario Paper)',
    tagline: 'Panggung teater kertas ala Super Mario Paper, tirai merah, stiker timbul & tab warna-warni',
    fontLabel: 'Fredoka · Nunito',
    previewColors: ['#E52521', '#FFD000', '#2EAD4B', '#FFF8EE'],
  },
  {
    id: 'daylight_rpg',
    shortLabel: 'Café ReMix',
    label: 'Pokémon Café ReMix (Patisserie)',
    tagline: 'Nuansa kafe hangat ala Pokémon Café ReMix, bingkai pirus teal, banner merah & tombol madu oranye',
    fontLabel: 'Fredoka · Nunito',
    previewColors: ['#26B6B0', '#FAD2B4', '#D95B0C', '#4E2A1E'],
  },
  {
    id: 'nes_classic',
    shortLabel: 'Pixel Game',
    label: 'Sprout Pixel Village',
    tagline: 'Dunia game pixel pastel ala Sprout Lands — pulau rumput hijau, air toska riak, & papan kayu kabin',
    fontLabel: 'Pixelify Sans · Chakra Petch · Plus Jakarta',
    previewColors: ['#63A844', '#8AD6CF', '#B87C4B', '#FBF6E3'],
  },
  {
    id: 'cyber_retro',
    shortLabel: 'MLBB',
    label: 'Mobile Legends: Bang Bang',
    tagline: 'Nuansa lobi Land of Dawn — biru safir malam, bingkai emas Mythic, permata cyan & tombol Rank merah',
    fontLabel: 'Bungee · Chakra Petch · Plus Jakarta',
    previewColors: ['#0E1E3F', '#D4A94F', '#26B6FF', '#C83717'],
  },
  {
    id: 'gameboy_green',
    shortLabel: 'Persona',
    label: 'Phantom Persona Pop (Crimson Ink)',
    tagline: 'Gaya RPG Persona kontras tajam merah-hitam-putih, panel miring dinamis, & aksen kuning kilat',
    fontLabel: 'Bungee · Chakra Petch · Plus Jakarta',
    previewColors: ['#E60012', '#09090F', '#FFFFFF', '#FFE600'],
  },
];
