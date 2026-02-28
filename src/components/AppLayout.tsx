import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs, usePerfilVisual } from '@/contexts/ViewAsContext';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, ListOrdered, PlusCircle, MessageSquare,
  Zap, LogOut, Menu, X, Shield, Bell, Eye
} from 'lucide-react';
import logoVertice from '@/assets/logo-vertice.png';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Notificacao, Perfil } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { toast } = useToast();
  const { perfilVisual, setPerfilVisual, isViewingAs } = useViewAs();
  const perfilUI = usePerfilVisual();

  // Sound + toast on new notification for current user
  useEffect(() => {
    const handler = (e: Event) => {
      const notif = (e as CustomEvent<Notificacao>).detail;
      if (!usuario) return;
      if (notif.perfil_destino !== usuario.perfil && notif.usuario_destino_id !== usuario.id) return;

      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
        osc.start();
      } catch {}

      toast({
        title: '🔔 Nova Notificação',
        description: notif.mensagem_resumo,
      });
    };
    window.addEventListener('nova-notificacao', handler);
    return () => window.removeEventListener('nova-notificacao', handler);
  }, [usuario, toast]);

  if (!usuario) return null;

  const isAdmin = usuario.perfil === 'administrador';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'brenda', 'presidente'] },
    { to: '/fila', label: 'Fila de Atendimento', icon: ListOrdered, roles: ['administrador', 'brenda', 'sala_espera', 'presidente'] },
    { to: '/novo-atendimento', label: 'Novo Atendimento', icon: PlusCircle, roles: ['administrador', 'brenda', 'sala_espera'] },
    { to: '/comandos', label: 'Comandos Rápidos', icon: Zap, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/chat', label: 'Chat', icon: MessageSquare, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
  ].filter(item => {
    // When viewing as another profile, show that profile's menu items + admin-only items
    if (isAdmin && isViewingAs) {
      return item.roles.includes(perfilUI) || item.roles.includes('administrador');
    }
    return item.roles.includes(perfilUI);
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoVertice} alt="VÉRTICE" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-display text-base font-bold text-sidebar-foreground">VÉRTICE</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão Estratégica de Atendimentos</p>
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
            <p className="text-xs text-sidebar-foreground/50">{perfilLabels[usuario.perfil]}</p>
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
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card gap-3">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>

          {/* View As Selector – Admin only */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Visualizar como:</span>
              <Select value={perfilVisual} onValueChange={v => setPerfilVisual(v as Perfil)}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="sala_espera">Sala de Espera</SelectItem>
                  <SelectItem value="brenda">Brenda</SelectItem>
                  <SelectItem value="presidente">Presidente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* View As Banner */}
        {isViewingAs && (
          <div className="flex items-center justify-between px-4 md:px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Você está visualizando como: <strong>{perfilLabels[perfilVisual]}</strong>
            </span>
            <button
              onClick={() => setPerfilVisual('administrador')}
              className="text-xs font-medium underline hover:no-underline"
            >
              Voltar para Administrador
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
