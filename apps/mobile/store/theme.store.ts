import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'app_theme';

interface ThemeStore {
  isDark: boolean;
  colors: typeof DARK;
  toggle: () => Promise<void>;
  load: () => Promise<void>;
}

export const DARK = {
  bg:        '#0D1117',
  surface:   '#161B22',
  card:      '#1C2230',
  border:    '#2A3346',
  muted:     '#8B96A7',
  text:      '#E6EDF3',
  textSub:   '#8B96A7',
  input:     '#161B22',
  statusBar: 'light' as 'light' | 'dark',
  headerBg:  '#161B22',
};

export const LIGHT = {
  bg:        '#F0F4FF',
  surface:   '#FFFFFF',
  card:      '#FFFFFF',
  border:    '#D0D9EE',
  muted:     '#6B7A99',
  text:      '#0D1B3E',
  textSub:   '#6B7A99',
  input:     '#FFFFFF',
  statusBar: 'dark' as 'light' | 'dark',
  headerBg:  '#FFFFFF',
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,
  colors: DARK,

  load: async () => {
    try {
      const saved = await SecureStore.getItemAsync(KEY);
      const isDark = saved !== 'light';
      set({ isDark, colors: isDark ? DARK : LIGHT });
    } catch {
      // default dark
    }
  },

  toggle: async () => {
    const next = !get().isDark;
    set({ isDark: next, colors: next ? DARK : LIGHT });
    try {
      await SecureStore.setItemAsync(KEY, next ? 'dark' : 'light');
    } catch {}
  },
}));
