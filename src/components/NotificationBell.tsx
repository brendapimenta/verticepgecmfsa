import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, FileText, Zap, MessageSquare, AlertCircle, CheckCheck, ClipboardList, DollarSign, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TipoNotificacao, ReferenciaTipo } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const tipoIcon: Record<TipoNotificacao, React.ReactNode> = {
  novo_atendimento: <FileText className="w-3.5 h-3.5 text-blue-400" />,
  prioridade_alterada: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  novo_comando: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
  nova_mensagem_chat: <MessageSquare className="w-3.5 h-3.5 text-green-400" />,
  status_atualizado: <CheckCheck className="w-3.5 h-3.5 text-purple-400" />,
  nova_solicitacao: <ClipboardList className="w-3.5 h-3.5 text-orange-400" />,
  solicitacao_status_atualizada: <ArrowRightLeft className="w-3.5 h-3.5 text-orange-400" />,
  ficha_atualizada: <FileText className="w-3.5 h-3.5 text-amber-400" />,
  nova_demanda: <ClipboardList className="w-3.5 h-3.5 text-teal-400" />,
  nova_demanda_atendimento: <ClipboardList className="w-3.5 h-3.5 text-teal-400" />,
  demanda_status_atualizada: <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />,
  nova_autorizacao: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />,
  autorizacao_concluida: <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />,
  alerta_urgente: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  chamar_brenda: <Bell className="w-3.5 h-3.5 text-blue-400" />,
  solicitar_encerramento: <CheckCheck className="w-3.5 h-3.5 text-red-400" />,
};

import { getRouteForRef } from '@/lib/notificationRoutes';

const tempoRelativo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
};

export const NotificationBell: React.FC = () => {
  const { notificacoes, marcarNotificacaoLida } = useData();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const minhas = notificacoes
    .filter(n => n.perfil_destino === usuario.perfil || n.usuario_destino_id === usuario.id)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const naoLidas = minhas.filter(n => !n.lida);

  const handleClick = (notif: typeof minhas[0]) => {
    marcarNotificacaoLida(notif.id);
    navigate(getRouteForRef(notif.referencia_tipo, notif.referencia_id));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {naoLidas.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {naoLidas.length > 9 ? '9+' : naoLidas.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Notificações</span>
          <button onClick={() => navigate('/notificacoes')} className="text-xs text-accent hover:underline">
            Ver todas
          </button>
        </div>
        <div className="max-h-80 overflow-auto">
          {naoLidas.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma notificação não lida</p>
          ) : (
            naoLidas.slice(0, 10).map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
                  n.tipo_notificacao === 'alerta_urgente' && "bg-red-500/10"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{tipoIcon[n.tipo_notificacao]}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs line-clamp-2", n.tipo_notificacao === 'alerta_urgente' ? "text-red-400 font-semibold" : "text-foreground")}>{n.mensagem_resumo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {tempoRelativo(n.criado_em)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
