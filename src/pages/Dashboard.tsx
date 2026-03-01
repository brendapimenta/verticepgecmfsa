import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { Clock, Users, AlertTriangle, CheckCircle, CalendarClock, UserCheck, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { atendimentos, eventosAgenda } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const navigate = useNavigate();
  const hoje = new Date().toISOString().split('T')[0];
  const atendHoje = atendimentos.filter(a => a.data_chegada === hoje);
  const aguardando = atendHoje.filter(a => a.status === 'Aguardando');
  const emAtendimento = atendHoje.filter(a => a.status === 'Em Atendimento');
  const concluidos = atendHoje.filter(a => a.status === 'Concluído');
  const urgencias = atendHoje.filter(a => a.prioridade === 'Alta');
  const semAgendamento = atendHoje.filter(a => a.tipo_registro === 'Sem agendamento');
  const agendados = atendHoje.filter(a => a.tipo_registro === 'Atendimento agendado');
  const reunioes = atendHoje.filter(a => a.tipo_registro === 'Reunião agendada');

  const stats = [
    { label: 'Total Hoje', value: atendHoje.length, icon: Users, color: 'text-primary' },
    { label: 'Aguardando', value: aguardando.length, icon: Clock, color: 'text-[#136F70]' },
    { label: 'Em Atendimento', value: emAtendimento.length, icon: UserCheck, color: 'text-blue-600' },
    { label: 'Concluídos', value: concluidos.length, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Prioridade Alta', value: urgencias.length, icon: AlertTriangle, color: 'text-red-600' },
  ];

  const registroStats = [
    { label: 'Sem Agendamento', value: semAgendamento.length, icon: Users },
    { label: 'Atend. Agendado', value: agendados.length, icon: CalendarClock },
    { label: 'Reunião Agendada', value: reunioes.length, icon: Calendar },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral dos atendimentos de hoje</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Por Tipo de Registro</h2>
        <div className="grid grid-cols-3 gap-4">
          {registroStats.map(s => (
            <div key={s.label} className="stat-card">
              <s.icon className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Próximos Compromissos - Presidente/Admin */}
      {(perfilUI === 'presidente' || perfilUI === 'administrador' || perfilUI === 'brenda') && (() => {
        const eventosHoje = eventosAgenda
          .filter(e => e.data_inicio === hoje)
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
          .slice(0, 5);
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Próximos Compromissos
              </h2>
              <button onClick={() => navigate('/agenda')} className="text-xs text-accent hover:underline">Ver agenda</button>
            </div>
            {eventosHoje.length === 0 ? (
              <div className="stat-card text-center">
                <p className="text-sm text-muted-foreground">Nenhum compromisso agendado para hoje.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventosHoje.map(e => (
                  <div key={e.id} className="stat-card flex items-center gap-3">
                    <span className="text-sm font-bold text-primary min-w-[45px]">{e.hora_inicio}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{e.tipo_evento}</span>
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{e.titulo}</span>
                    {e.local && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{e.local}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Priority Alerts for Presidente */}
      {(perfilUI === 'presidente' || perfilUI === 'administrador') && urgencias.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Atendimentos Prioritários</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
              {urgencias.length}
            </span>
          </div>
          <div className="space-y-2">
            {urgencias.map(a => (
              <div key={a.id} className="p-4 rounded-lg border priority-high">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">{a.nome_cidadao}</span>
                    <span className="mx-2 text-xs">•</span>
                    <span className="text-xs">{a.tipo}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">
                    {a.prioridade}
                  </span>
                </div>
                <p className="text-sm mt-1">{a.demanda_principal}</p>
                <p className="text-xs mt-1 opacity-70">Chegada: {a.hora_chegada} | {a.tipo_registro}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
