import React, { createContext, useContext, useState, useCallback } from 'react';
import { Usuario, Perfil } from '@/types';
import { mockUsuarios } from '@/data/mockData';

interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const login = useCallback((email: string, _senha: string) => {
    const found = mockUsuarios.find(u => u.email === email && u.ativo);
    if (found) {
      setUsuario(found);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUsuario(null), []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAuthenticated: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
};
