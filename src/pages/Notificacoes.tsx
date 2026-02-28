import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TipoNotificacao } from '@/types';
import { Bell, Filter, CheckCheck, FileText, Zap, MessageSquare, AlertCircle, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const tipoLabel: Record<TipoNotificacao, string> = {
  novo_atendimento: 'Novo Atendimento',
  prioridade_alterada: 'Prioridade Alterada',
  novo_comando: 'Novo Comando',
  nova_mensagem_chat: 'Nova Mensagem',
  status_atualizado: 'Status Atualizado',
  nova_solicitacao: 'Nova Solicitação',
  ficha_atualizada: 'Ficha Atualizada',
  nova_demanda_atendimento: 'Nova Demanda',
};

const tipoIcon: Record<TipoNotificacao, React.ReactNode> = {
  novo_atendimento: <FileText className="w-4 h-4 text-blue-600" />,
  prioridade_alterada: <AlertCircle className="w-4 h-4 text-red-600" />,
  novo_comando: <Zap className="w-4 h-4 text-yellow-600" />,
  nova_mensagem_chat: <MessageSquare className="w-4 h-4 text-green-600" />,
  status_atualizado: <CheckCheck className="w-4 h-4 text-purple-600" />,
  nova_solicitacao: <ClipboardList className="w-4 h-4 text-orange-600" />,
  ficha_atualizada: <FileText className="w-4 h-4 text-amber-600" />,
  nova_demanda_atendimento: <ClipboardList className="w-4 h-4 text-teal-600" />,
};

const Notificacoes: React.FC = () => {
  const { notificacoes, marcarNotificacaoLida } = useData();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [filtroLida, setFiltroLida] = useState<'todas' | 'nao_lidas'>('nao_lidas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  if (!usuario) return null;

  const minhas = notificacoes
    .filter(n => n.perfil_destino === usuario.perfil || n.usuario_destino_id === usuario.id)
    .filter(n => filtroLida === 'todas' || !n.lida)
    .filter(n => filtroTipo === 'todos' || n.tipo_notificacao === filtroTipo)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const handleClick = (notif: typeof minhas[0]) => {
    marcarNotificacaoLida(notif.id);
    if (notif.referencia_tipo === 'atendimento') navigate(`/atendimento/${notif.referencia_id}`);
    else if (notif.referencia_tipo === 'comando') navigate('/comandos');
    else if (notif.referencia_tipo === 'chat') navigate('/chat');
    else if (notif.referencia_tipo === 'solicitacao') navigate('/comandos');
    else if (notif.referencia_tipo === 'demanda_atendimento') navigate('/fila');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Notificações</h1>
        <p className="text-sm text-muted-foreground mt-1">Todas as suas notificações</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={filtroLida} onValueChange={v => setFiltroLida(v as 'todas' | 'nao_lidas')}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nao_lidas">Não lidas</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-44 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="novo_atendimento">Novo Atendimento</SelectItem>
            <SelectItem value="prioridade_alterada">Prioridade Alterada</SelectItem>
            <SelectItem value="novo_comando">Novo Comando</SelectItem>
            <SelectItem value="nova_mensagem_chat">Nova Mensagem</SelectItem>
            <SelectItem value="status_atualizado">Status Atualizado</SelectItem>
            <SelectItem value="ficha_atualizada">Ficha Atualizada</SelectItem>
            <SelectItem value="nova_demanda_atendimento">Nova Demanda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {minhas.map(n => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={cn(
              "w-full text-left bg-card rounded-lg border p-4 transition-all hover:shadow-sm",
              !n.lida && "border-l-4 border-l-accent"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{tipoIcon[n.tipo_notificacao]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{tipoLabel[n.tipo_notificacao]}</Badge>
                  {!n.lida && <span className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <p className="text-sm text-foreground">{n.mensagem_resumo}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(n.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </button>
        ))}
        {minhas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificacoes;
