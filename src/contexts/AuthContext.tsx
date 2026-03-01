import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Perfil = 'administrador' | 'sala_espera' | 'sala_principal' | 'presidente';

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  username: string;
  perfil: Perfil;
  ativo: boolean;
  instituicao_id: string;
  primeiro_login_pendente?: boolean;
}

interface AuthContextType {
  usuario: UsuarioAuth | null;
  login: (username: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  trocarSenha: (novaSenha: string) => Promise<{ success: boolean; error?: string }>;
  setPrimeiroLoginDone: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user && !usuario) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('id, nome, email, username, perfil, ativo, instituicao_id, primeiro_login_pendente')
          .eq('auth_user_id', session.user.id)
          .single();

        if (profile && profile.ativo) {
          setUsuario(profile as unknown as UsuarioAuth);
        }
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('login-senha', {
        body: { username, senha },
      });

      if (error) return { success: false, error: 'Erro ao conectar. Tente novamente.' };
      if (data?.error) return { success: false, error: data.error };

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        setUsuario(data.usuario);
        return { success: true };
      }

      return { success: false, error: 'Erro inesperado.' };
    } catch {
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  }, []);

  const trocarSenha = useCallback(async (novaSenha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Sessão expirada.' };

      const { data, error } = await supabase.functions.invoke('trocar-senha', {
        body: { nova_senha: novaSenha },
      });

      if (error) return { success: false, error: 'Erro ao trocar senha.' };
      if (data?.error) return { success: false, error: data.error };

      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão.' };
    }
  }, []);

  const setPrimeiroLoginDone = useCallback(() => {
    setUsuario(prev => prev ? { ...prev, primeiro_login_pendente: false } : prev);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAuthenticated: !!usuario, loading, trocarSenha, setPrimeiroLoginDone }}>
      {children}
    </AuthContext.Provider>
  );
};
