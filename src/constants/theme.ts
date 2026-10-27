/**
 * PhytoLog brand colours, carried over from the original plant log web app.
 * Every screen reads colours from here so light and dark mode stay in step.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    ground: '#F2F4EE',
    surface: '#FFFFFF',
    sunk: '#E6EAE1',
    text: '#1B231D',
    textSecondary: '#4F5C51',
    line: '#D5DBD0',
    leaf: '#2E5B3B',
    leafSoft: '#DCE8DC',
    water: '#2F6F98',
    waterSoft: '#DCEAF3',
    due: '#8A560E',
    dueSoft: '#F6E7CC',
    late: '#AE3F35',
    lateSoft: '#F5DAD6',
    onAccent: '#FFFFFF',
  },
  dark: {
    ground: '#121712',
    surface: '#1B211C',
    sunk: '#242B25',
    text: '#E7ECE5',
    textSecondary: '#9AA69B',
    line: '#2F3830',
    leaf: '#8CC49A',
    leafSoft: '#223428',
    water: '#7DB6DB',
    waterSoft: '#1C2E3A',
    due: '#E3B25F',
    dueSoft: '#3A2E17',
    late: '#EE8E83',
    lateSoft: '#3D2220',
    onAccent: '#121712',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'system-ui, sans-serif',
    serif: "Georgia, 'Times New Roman', serif",
    rounded: 'system-ui, sans-serif',
    mono: 'ui-monospace, Menlo, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
