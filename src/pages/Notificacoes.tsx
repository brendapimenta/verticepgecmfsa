import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TipoNotificacao, ReferenciaTipo } from '@/types';
import { Bell, Filter, CheckCheck, FileText, Zap, MessageSquare, AlertCircle, ClipboardList, DollarSign, ArrowRightLeft, AlertTriangle, Calendar, Gavel } from 'lucide-react';
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
  solicitacao_status_atualizada: 'Solicitação Atualizada',
  ficha_atualizada: 'Ficha Atualizada',
  nova_demanda: 'Nova Demanda',
  nova_demanda_atendimento: 'Demanda de Atendimento',
  demanda_status_atualizada: 'Demanda Atualizada',
  nova_autorizacao: 'Nova Autorização',
  autorizacao_concluida: 'Autorização Concluída',
  alerta_urgente: 'Alerta Urgente',
  chamar_sala_principal: 'Chamar Sala Principal',
  solicitar_encerramento: 'Solicitar Encerramento',
  novo_evento_agenda: 'Novo Evento na Agenda',
  evento_agenda_editado: 'Evento Editado',
  nova_pauta: 'Nova Pauta',
  pauta_decidida: 'Pauta Decidida',
  pauta_info_solicitada: 'Info Solicitada',
  pauta_status_atualizada: 'Pauta Atualizada',
  nova_tarefa_operacional: 'Nova Tarefa Operacional',
};

const tipoIcon: Record<TipoNotificacao, React.ReactNode> = {
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
  chamar_sala_principal: <Bell className="w-4 h-4 text-blue-400" />,
  solicitar_encerramento: <CheckCheck className="w-4 h-4 text-red-400" />,
  novo_evento_agenda: <Calendar className="w-4 h-4 text-cyan-400" />,
  evento_agenda_editado: <Calendar className="w-4 h-4 text-cyan-400" />,
  nova_pauta: <Gavel className="w-4 h-4 text-indigo-400" />,
  pauta_decidida: <Gavel className="w-4 h-4 text-green-400" />,
  pauta_info_solicitada: <Gavel className="w-4 h-4 text-amber-400" />,
  pauta_status_atualizada: <Gavel className="w-4 h-4 text-indigo-400" />,
  nova_tarefa_operacional: <ClipboardList className="w-4 h-4 text-indigo-400" />,
};

const getRouteForRef = (tipo: ReferenciaTipo, id: string): string => {
  switch (tipo) {
    case 'atendimento': return `/atendimento/${id}`;
    case 'comando': return '/comandos';
    case 'chat': return '/chat';
    case 'solicitacao': return '/comandos';
    case 'demanda': return '/demandas';
    case 'demanda_atendimento': return '/fila';
    case 'autorizacao_financeira': return '/autorizacoes';
    case 'evento_agenda': return '/agenda';
    case 'pauta_despacho': return '/pauta-despacho';
    default: return '/notificacoes';
  }
};

const tempoRelativo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
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
    navigate(getRouteForRef(notif.referencia_tipo, notif.referencia_id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground uppercase">NOTIFICAÇÕES</h1>
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
          <SelectTrigger className="w-48 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="novo_atendimento">Novo Atendimento</SelectItem>
            <SelectItem value="prioridade_alterada">Prioridade Alterada</SelectItem>
            <SelectItem value="novo_comando">Novo Comando</SelectItem>
            <SelectItem value="nova_mensagem_chat">Nova Mensagem</SelectItem>
            <SelectItem value="status_atualizado">Status Atualizado</SelectItem>
            <SelectItem value="nova_solicitacao">Nova Solicitação</SelectItem>
            <SelectItem value="solicitacao_status_atualizada">Solicitação Atualizada</SelectItem>
            <SelectItem value="ficha_atualizada">Ficha Atualizada</SelectItem>
            <SelectItem value="nova_demanda">Nova Demanda</SelectItem>
            <SelectItem value="nova_demanda_atendimento">Demanda de Atendimento</SelectItem>
            <SelectItem value="demanda_status_atualizada">Demanda Atualizada</SelectItem>
            <SelectItem value="nova_autorizacao">Nova Autorização</SelectItem>
            <SelectItem value="autorizacao_concluida">Autorização Concluída</SelectItem>
            <SelectItem value="alerta_urgente">Alerta Urgente</SelectItem>
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
                  {tempoRelativo(n.criado_em)}
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
