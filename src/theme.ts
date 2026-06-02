import type { ThemeMode } from './types';

export type Theme = {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  mutedText: string;
  border: string;
  strongBorder: string;
  inverseText: string;
  checkedBg: string;
  checkedBorder: string;
  emptyBg: string;
  shadow: string;
};

export const themes: Record<ThemeMode, Theme> = {
  light: {
    mode: 'light',
    bg: '#ffffff',
    surface: '#ffffff',
    surfaceRaised: '#f7f7f7',
    text: '#050505',
    mutedText: '#5f5f5f',
    border: '#dedede',
    strongBorder: '#bcbcbc',
    inverseText: '#ffffff',
    checkedBg: '#050505',
    checkedBorder: '#050505',
    emptyBg: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.14)',
  },
  dark: {
    mode: 'dark',
    bg: '#000000',
    surface: '#050505',
    surfaceRaised: '#151515',
    text: '#f7f7f7',
    mutedText: '#a4a4a4',
    border: '#2f2f2f',
    strongBorder: '#5c5c5c',
    inverseText: '#000000',
    checkedBg: '#050505',
    checkedBorder: '#f7f7f7',
    emptyBg: '#050505',
    shadow: 'rgba(255, 255, 255, 0.12)',
  },
};
