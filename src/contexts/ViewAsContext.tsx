import React, { createContext, useContext, useState } from 'react';
import { Perfil } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ViewAsContextType {
  perfilVisual: Perfil;
  setPerfilVisual: (p: Perfil) => void;
  isViewingAs: boolean;
}

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export const useViewAs = () => {
  const ctx = useContext(ViewAsContext);
  if (!ctx) throw new Error('useViewAs must be used within ViewAsProvider');
  return ctx;
};

/** Returns the effective profile for UI rendering decisions */
export const usePerfilVisual = (): Perfil => {
  const { usuario } = useAuth();
  const { perfilVisual } = useViewAs();
  return usuario?.perfil === 'administrador' ? perfilVisual : (usuario?.perfil ?? 'sala_espera');
};

export const ViewAsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const [perfilVisual, setPerfilVisual] = useState<Perfil>('administrador');

  // Reset when user changes
  React.useEffect(() => {
    if (usuario?.perfil !== 'administrador') {
      setPerfilVisual(usuario?.perfil ?? 'administrador');
    }
  }, [usuario?.perfil]);

  const isViewingAs = usuario?.perfil === 'administrador' && perfilVisual !== 'administrador';

  return (
    <ViewAsContext.Provider value={{ perfilVisual, setPerfilVisual, isViewingAs }}>
      {children}
    </ViewAsContext.Provider>
  );
};
