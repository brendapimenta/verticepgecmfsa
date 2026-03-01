import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Perfil = 'administrador' | 'sala_espera' | 'brenda' | 'presidente';

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  instituicao_id: string;
  login_google_habilitado?: boolean;
}

interface AuthContextType {
  usuario: UsuarioAuth | null;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
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

  // Check session on mount and listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          // For Google OAuth, validate via edge function
          const provider = session.user.app_metadata?.provider;
          if (provider === 'google' && !usuario) {
            try {
              const { data, error } = await supabase.functions.invoke('validate-google-login', {
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              if (error || !data?.authorized) {
                await supabase.auth.signOut();
                setUsuario(null);
                // Store error for login page to display
                sessionStorage.setItem('google_login_error', data?.message || 'Erro na autenticação Google.');
              } else {
                setUsuario(data.usuario);
              }
            } catch {
              await supabase.auth.signOut();
              setUsuario(null);
            }
          } else if (!usuario) {
            // For email/password, fetch profile
            const { data: profile } = await supabase
              .from('usuarios')
              .select('id, nome, email, perfil, ativo, instituicao_id, login_google_habilitado')
              .eq('auth_user_id', session.user.id)
              .single();
            
            if (profile && profile.ativo) {
              setUsuario(profile as UsuarioAuth);
            }
          }
        }
        setLoading(false);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      // onAuthStateChange INITIAL_SESSION will handle the rest
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('login-senha', {
        body: { email, senha },
      });

      if (error) {
        return { success: false, error: 'Erro ao conectar. Tente novamente.' };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

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

  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { lovable } = await import('@/integrations/lovable');
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        return { success: false, error: 'Erro ao iniciar autenticação Google.' };
      }

      // The redirect will happen, and onAuthStateChange will handle validation
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao conectar com Google.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, loginWithGoogle, logout, isAuthenticated: !!usuario, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
