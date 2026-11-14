import React, { createContext, useContext, useEffect } from 'react';
import { PixelTheme } from '../types/lms';

interface ThemeContextValue {
  theme: PixelTheme;
  setTheme?: (theme: PixelTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'sunny_quest',
});

export const ThemeProvider: React.FC<{
  theme: PixelTheme;
  onChangeTheme?: (theme: PixelTheme) => void;
  children: React.ReactNode;
}> = ({ theme, onChangeTheme, children }) => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: onChangeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useActiveTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
