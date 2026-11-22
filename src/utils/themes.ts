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
    label: 'Super Paper Stage (16-Bit Mario Paper)',
    tagline: 'Panggung teater kertas 16-bit ala Super Mario Paper, tirai piksel merah, stiker timbul & tab warna',
    fontLabel: 'Pixelify Sans · Chakra Petch · Nunito',
    previewColors: ['#E52521', '#FFD000', '#2EAD4B', '#FFF8EE'],
  },
  {
    id: 'daylight_rpg',
    shortLabel: 'Café ReMix',
    label: 'Pokémon Café ReMix (16-Bit Patisserie)',
    tagline: 'Nuansa kafe piksel 16-bit ala Pokémon Café ReMix, bingkai pirus teal, banner merah & tombol madu',
    fontLabel: 'Pixelify Sans · Chakra Petch · Nunito',
    previewColors: ['#26B6B0', '#FAD2B4', '#D95B0C', '#4E2A1E'],
  },
  {
    id: 'nes_classic',
    shortLabel: 'Pixel Game',
    label: 'Sprout Pixel Village (16-Bit Farming)',
    tagline: 'Dunia game piksel 16-bit ala Sprout Lands — pulau rumput hijau, air toska riak, & papan kayu kabin',
    fontLabel: 'Pixelify Sans · Chakra Petch · Plus Jakarta',
    previewColors: ['#63A844', '#8AD6CF', '#B87C4B', '#FBF6E3'],
  },
  {
    id: 'cyber_retro',
    shortLabel: 'MLBB',
    label: 'Mobile Legends: Bang Bang (16-Bit Dawn)',
    tagline: 'Lobi Land of Dawn 16-bit — biru safir malam, bingkai armor emas Mythic, permata cyan & tombol Rank',
    fontLabel: 'Pixelify Sans · Chakra Petch · Plus Jakarta',
    previewColors: ['#0E1E3F', '#D4A94F', '#26B6FF', '#C83717'],
  },
  {
    id: 'gameboy_green',
    shortLabel: 'Persona',
    label: 'Phantom Persona Pop (16-Bit Crimson)',
    tagline: 'Gaya RPG Persona 16-bit kontras tajam merah-hitam-putih, panel miring piksel & aksen kuning kilat',
    fontLabel: 'Pixelify Sans · Chakra Petch · Plus Jakarta',
    previewColors: ['#E60012', '#09090F', '#FFFFFF', '#FFE600'],
  },
];
