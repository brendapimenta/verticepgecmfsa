import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs, usePerfilVisual } from '@/contexts/ViewAsContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ListOrdered, PlusCircle, MessageSquare,
  Zap, LogOut, Menu, X, Shield, Bell, Eye, ClipboardList, DollarSign, AlertTriangle,
  FileText, AlertCircle, CheckCheck, ArrowRightLeft, Calendar, Sun, Moon
} from 'lucide-react';
import logoVertice from '@/assets/logo-vertice.png';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { toast as sonnerToast } from 'sonner';
import { Notificacao, Perfil, TipoNotificacao } from '@/types';
import { getRouteForRef } from '@/lib/notificationRoutes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const perfilLabels: Record<string, string> = {
  administrador: 'Administrador',
  sala_espera: 'Sala de Espera',
  brenda: 'Brenda',
  presidente: 'Presidente',
};

export const AppLayout: React.FC = () => {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { perfilVisual, setPerfilVisual, isViewingAs } = useViewAs();
  const perfilUI = usePerfilVisual();
  const { notificacoes, marcarNotificacaoLida, criarAlertaUrgente } = useData();
  const { theme, toggleTheme } = useTheme();

  // Brenda alert modal state
  const [alertaOpen, setAlertaOpen] = useState(false);
  const [alertaMensagem, setAlertaMensagem] = useState('');

  // Presidente popup state
  const [alertaPopup, setAlertaPopup] = useState<Notificacao | null>(null);

  const isBrenda = perfilUI === 'brenda' || perfilUI === 'administrador';
  const isPresidente = perfilUI === 'presidente' || perfilUI === 'administrador';

  // Toast icon per notification type
  const getToastIcon = (tipo: TipoNotificacao) => {
    const iconMap: Record<TipoNotificacao, React.ReactNode> = {
      novo_atendimento: <FileText className="w-4 h-4 text-blue-400" />,
      prioridade_alterada: <AlertCircle className="w-4 h-4 text-red-400" />,
      novo_comando: <Zap className="w-4 h-4 text-yellow-400" />,
      nova_mensagem_chat: <MessageSquare className="w-4 h-4 text-green-400" />,
      status_atualizado: <CheckCheck className="w-4 h-4 text-purple-400" />,
      nova_solicitacao: <ClipboardList className="w-4 h-4 text-orange-400" />,
      solicitacao_status_atualizada: <ArrowRightLeft className="w-4 h-4 text-orange-400" />,
      ficha_atualizada: <FileText className="w-4 h-4 text-amber-400" />,
      nova_demanda: <ClipboardList className="w-4 h-4 text-teal-400" />,
      nova_demanda_atendimento: <ClipboardList className="w-4 h-4 text-teal-400" />,
      demanda_status_atualizada: <ArrowRightLeft className="w-4 h-4 text-teal-400" />,
      nova_autorizacao: <DollarSign className="w-4 h-4 text-emerald-400" />,
      autorizacao_concluida: <CheckCheck className="w-4 h-4 text-emerald-400" />,
      alerta_urgente: <AlertTriangle className="w-4 h-4 text-red-500" />,
      chamar_brenda: <Bell className="w-4 h-4 text-blue-400" />,
      solicitar_encerramento: <CheckCheck className="w-4 h-4 text-red-400" />,
      novo_evento_agenda: <Calendar className="w-4 h-4 text-cyan-400" />,
      evento_agenda_editado: <Calendar className="w-4 h-4 text-cyan-400" />,
    };
    return iconMap[tipo] || <Bell className="w-4 h-4 text-muted-foreground" />;
  };

  // Ref to hold navigate for use inside event handler
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;

  const marcarLidaRef = React.useRef(marcarNotificacaoLida);
  marcarLidaRef.current = marcarNotificacaoLida;

  // Sound + toast on new notification for current user
  useEffect(() => {
    const handler = (e: Event) => {
      const notif = (e as CustomEvent<Notificacao>).detail;
      if (!usuario) return;
      if (notif.perfil_destino !== usuario.perfil && notif.usuario_destino_id !== usuario.id) return;

      // Play sound
      const isUrgent = notif.tipo_notificacao === 'alerta_urgente';
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = isUrgent ? 660 : 880;
        osc.type = isUrgent ? 'square' : 'sine';
        gain.gain.value = isUrgent ? 0.2 : 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isUrgent ? 0.8 : 0.3));
        osc.stop(ctx.currentTime + (isUrgent ? 0.8 : 0.3));
        osc.start();
      } catch {}

      // Show popup for presidente on alerta_urgente
      if (isUrgent && (usuario.perfil === 'presidente' || usuario.perfil === 'administrador')) {
        setAlertaPopup(notif);
      }

      // ALWAYS show toast for every notification
      const route = getRouteForRef(notif.referencia_tipo, notif.referencia_id);
      sonnerToast.custom((toastId) => (
        <div
          onClick={() => {
            marcarLidaRef.current(notif.id);
            navigateRef.current(route);
            sonnerToast.dismiss(toastId);
          }}
          className="cursor-pointer flex items-start gap-3 w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground"
          style={{
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          <div className="mt-0.5 shrink-0">{getToastIcon(notif.tipo_notificacao)}</div>
          <p className="text-sm leading-snug">{notif.mensagem_resumo}</p>
        </div>
      ), { duration: 5000 });
    };
    window.addEventListener('nova-notificacao', handler);
    return () => window.removeEventListener('nova-notificacao', handler);
  }, [usuario]);

  if (!usuario) return null;

  const isAdmin = usuario.perfil === 'administrador';

  const handleEnviarAlerta = () => {
    if (!alertaMensagem.trim() || !usuario) return;
    criarAlertaUrgente(alertaMensagem.trim(), usuario.id);
    setAlertaMensagem('');
    setAlertaOpen(false);
    sonnerToast.success('Alerta enviado – O Presidente foi notificado.');
  };

  const handleFecharAlertaPopup = () => {
    if (alertaPopup) {
      marcarNotificacaoLida(alertaPopup.id);
    }
    setAlertaPopup(null);
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'brenda', 'presidente'] },
    { to: '/fila', label: 'Fila de Atendimento', icon: ListOrdered, roles: ['administrador', 'brenda', 'sala_espera', 'presidente'] },
    { to: '/novo-atendimento', label: 'Novo Atendimento', icon: PlusCircle, roles: ['administrador', 'brenda', 'sala_espera'] },
    { to: '/agenda', label: 'Agenda', icon: Calendar, roles: ['administrador', 'brenda', 'presidente'] },
    { to: '/comandos', label: 'Comandos Rápidos', icon: Zap, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/demandas', label: 'Demandas', icon: ClipboardList, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/autorizacoes', label: 'Autorizações Financeiras', icon: DollarSign, roles: ['administrador', 'brenda', 'presidente'] },
    { to: '/chat', label: 'Chat', icon: MessageSquare, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, roles: ['administrador', 'brenda', 'presidente', 'sala_espera'] },
    { to: '/auditoria', label: 'Log de Auditoria', icon: Shield, roles: ['administrador'] },
  ].filter(item => {
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
                  ? "bg-sidebar-accent text-sidebar-foreground border-l-[3px] border-l-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
            <Shield className="w-4 h-4 text-sidebar-foreground/60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{usuario.nome}</p>
            <p className="text-xs text-sidebar-foreground/60">{perfilLabels[usuario.perfil]}</p>
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
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border gap-3 bg-card">
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
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
            </button>
            {/* Botão ALERTA - Brenda only */}
            {isBrenda && (
              <button
                onClick={() => setAlertaOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                ALERTA
              </button>
            )}
            <NotificationBell />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* View As Banner */}
        {isViewingAs && (
          <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-border text-sm bg-primary/10">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              Você está visualizando como: <strong className="text-foreground">{perfilLabels[perfilVisual]}</strong>
            </span>
            <button
              onClick={() => setPerfilVisual('administrador')}
              className="text-xs font-medium underline hover:no-underline text-muted-foreground hover:text-foreground"
            >
              Voltar para Administrador
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Modal: Brenda envia alerta */}
      <Dialog open={alertaOpen} onOpenChange={setAlertaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Enviar alerta ao Presidente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">Mensagem de alerta</label>
            <Textarea
              value={alertaMensagem}
              onChange={e => setAlertaMensagem(e.target.value)}
              placeholder="Descreva rapidamente o que precisa de atenção imediata..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAlertaOpen(false); setAlertaMensagem(''); }}>Cancelar</Button>
            <Button
              onClick={handleEnviarAlerta}
              disabled={!alertaMensagem.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Enviar alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup: Presidente recebe alerta urgente */}
      <Dialog open={!!alertaPopup} onOpenChange={open => !open && handleFecharAlertaPopup()}>
        <DialogContent
          className="sm:max-w-md border border-destructive bg-card"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ⚠ ALERTA DE BRENDA
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {alertaPopup?.mensagem_resumo.replace('Alerta de Brenda: ', '')}
            </p>
            {alertaPopup && (
              <p className="text-[11px] text-muted-foreground mt-3">
                {new Date(alertaPopup.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleFecharAlertaPopup} className="w-full font-bold" variant="outline">
              OK, ENTENDI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
