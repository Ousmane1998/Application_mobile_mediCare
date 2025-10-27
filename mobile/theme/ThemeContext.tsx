// theme/ThemeContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type AppTheme = {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    card: string;
    border: string;
    muted: string;
    primary: string;
    primaryText: string;
  };
};

const Light: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F3F4F6',
    text: '#111827',
    card: '#FFFFFF',
    border: '#E5E7EB',
    muted: '#6B7280',
    primary: '#2ccdd2',
    primaryText: '#ffffff',
  },
};

const Dark: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0B1020',
    text: '#E5E7EB',
    card: '#111827',
    border: '#1F2937',
    muted: '#9CA3AF',
    primary: '#22b3b8',
    primaryText: '#081016',
  },
};

const STORAGE_KEY = 'app_theme_mode_v1';

export const ThemeContext = createContext<{
  theme: AppTheme;
  setMode: (m: 'light' | 'dark') => void;
  toggle: () => void;
}>({ theme: Light, setMode: () => {}, toggle: () => {} });

export const ThemeProviderApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sys = Appearance.getColorScheme();
  const [mode, setModeState] = useState<'light' | 'dark'>(sys === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      } catch {}
    })();
  }, []);

  const setMode = useCallback((m: 'light' | 'dark') => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => setMode(mode === 'light' ? 'dark' : 'light'), [mode, setMode]);

  const theme = useMemo(() => (mode === 'dark' ? Dark : Light), [mode]);

  const value = useMemo(() => ({ theme, setMode, toggle }), [theme, setMode, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
