import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProviderLocal: React.FC<React.PropsWithChildren> = ({ children }) => {
  const system = useSystemColorScheme() ?? 'light';
  const [theme, setTheme] = useState<ThemeMode>(system as ThemeMode);

  useEffect(() => {
    // Sync with system on first mount if user hasn't chosen
    setTheme((prev) => (prev ? prev : (system as ThemeMode)));
  }, [system]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeLocal = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeLocal must be used within ThemeProviderLocal');
  return ctx;
};


