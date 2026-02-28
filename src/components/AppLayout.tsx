import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, ListOrdered, PlusCircle, MessageSquare,
  Zap, LogOut, Menu, X, Shield, Building2, Bell
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';

const perfilLabels: Record<string, string> = {
  administrador: 'Administrador',
  sala_espera: 'Sala de Espera',
  brenda: 'Brenda',
  presidente: 'Presidente',
};

export const AppLayout: React.FC = () => {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!usuario) return null;

  const perfil = usuario.perfil;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'brenda', 'presidente'] },
    { to: '/fila', label: 'Fila de Atendimento', icon: ListOrdered, roles: ['administrador', 'brenda', 'sala_espera', 'presidente'] },
    { to: '/novo-atendimento', label: 'Novo Atendimento', icon: PlusCircle, roles: ['administrador', 'brenda', 'sala_espera'] },
    { to: '/comandos', label: 'Comandos Rápidos', icon: Zap, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/chat', label: 'Chat', icon: MessageSquare, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/usuarios', label: 'Usuários', icon: Users, roles: ['administrador'] },
  ].filter(item => item.roles.includes(perfil));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-sidebar-foreground">CMFS</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão de Atendimentos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{usuario.nome}</p>
            <p className="text-xs text-sidebar-foreground/50">{perfilLabels[perfil]}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col sidebar-gradient border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full sidebar-gradient animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 md:flex-none" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
