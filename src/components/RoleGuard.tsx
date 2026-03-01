import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Perfil } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: Perfil[];
  children: React.ReactNode;
}

/**
 * Route-level role guard. Uses the REAL user profile (not ViewAs)
 * to prevent URL-based access bypass.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(usuario.perfil)) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-semibold">ACESSO RESTRITO</p>
        <p className="text-sm mt-1">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return <>{children}</>;
};
