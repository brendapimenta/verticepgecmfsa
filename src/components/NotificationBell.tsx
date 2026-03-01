import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, FileText, Zap, MessageSquare, AlertCircle, CheckCheck, ClipboardList, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { TipoNotificacao } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const tipoIcon: Record<TipoNotificacao, React.ReactNode> = {
  novo_atendimento: <FileText className="w-3.5 h-3.5 text-blue-600" />,
  prioridade_alterada: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
  novo_comando: <Zap className="w-3.5 h-3.5 text-yellow-600" />,
  nova_mensagem_chat: <MessageSquare className="w-3.5 h-3.5 text-green-600" />,
  status_atualizado: <CheckCheck className="w-3.5 h-3.5 text-purple-600" />,
  nova_solicitacao: <ClipboardList className="w-3.5 h-3.5 text-orange-600" />,
  ficha_atualizada: <FileText className="w-3.5 h-3.5 text-amber-600" />,
  nova_demanda_atendimento: <ClipboardList className="w-3.5 h-3.5 text-teal-600" />,
  nova_autorizacao: <DollarSign className="w-3.5 h-3.5 text-emerald-600" />,
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
    if (notif.referencia_tipo === 'atendimento') navigate(`/atendimento/${notif.referencia_id}`);
    else if (notif.referencia_tipo === 'comando') navigate('/comandos');
    else if (notif.referencia_tipo === 'chat') navigate('/chat');
    else if (notif.referencia_tipo === 'solicitacao') navigate('/comandos');
    else if (notif.referencia_tipo === 'demanda_atendimento') navigate('/fila');
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
                className="w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{tipoIcon[n.tipo_notificacao]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-2">{n.mensagem_resumo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
