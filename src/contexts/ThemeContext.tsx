import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();

  const getStoredTheme = (): Theme => {
    if (usuario) {
      const stored = localStorage.getItem(`vertice-theme-${usuario.id}`);
      if (stored === 'dark' || stored === 'light') return stored;
    }
    // Default to light
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  // When user changes, load their preference
  useEffect(() => {
    setTheme(getStoredTheme());
  }, [usuario?.id]);

  // Apply class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (usuario) {
      localStorage.setItem(`vertice-theme-${usuario.id}`, next);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
