import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAudit } from '@/contexts/AuditContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const { registrarAuditoria } = useAudit();

  const getStoredTheme = (): Theme => {
    if (usuario) {
      const stored = localStorage.getItem(`vertice-theme-${usuario.id}`);
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, [usuario?.id]);

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
      registrarAuditoria({
        usuario_id: usuario.id,
        nome_usuario: usuario.nome,
        perfil_usuario: usuario.perfil,
        tipo_acao: 'mudanca_tema',
        modulo: 'sistema',
        descricao_resumida: `Tema alterado para ${next === 'dark' ? 'Escuro' : 'Claro'}.`,
        valor_anterior: theme,
        valor_novo: next,
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
