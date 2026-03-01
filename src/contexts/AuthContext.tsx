import React, { createContext, useContext, useState, useCallback } from 'react';
import { Usuario, Perfil } from '@/types';
import { mockUsuarios } from '@/data/mockData';
import { useAudit } from '@/contexts/AuditContext';

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
  const { registrarAuditoria } = useAudit();

  const login = useCallback((email: string, _senha: string) => {
    const found = mockUsuarios.find(u => u.email === email && u.ativo);
    if (found) {
      setUsuario(found);
      registrarAuditoria({
        usuario_id: found.id,
        nome_usuario: found.nome,
        perfil_usuario: found.perfil,
        tipo_acao: 'login',
        modulo: 'autenticação',
        descricao_resumida: `Login realizado: ${found.nome} (${found.perfil}).`,
      });
      return true;
    }
    return false;
  }, [registrarAuditoria]);

  const logout = useCallback(() => {
    if (usuario) {
      registrarAuditoria({
        usuario_id: usuario.id,
        nome_usuario: usuario.nome,
        perfil_usuario: usuario.perfil,
        tipo_acao: 'logout',
        modulo: 'autenticação',
        descricao_resumida: `Logout realizado: ${usuario.nome}.`,
      });
    }
    setUsuario(null);
  }, [usuario, registrarAuditoria]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAuthenticated: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
};
