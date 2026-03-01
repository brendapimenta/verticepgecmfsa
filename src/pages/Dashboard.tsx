import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import {
  Clock, Users, AlertTriangle, CheckCircle, UserCheck, Calendar, MapPin,
  Shield, Timer, ArrowRight, Bell, DollarSign, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { atendimentos, eventosAgenda, autorizacoes, notificacoes } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const navigate = useNavigate();
  const hoje = new Date().toISOString().split('T')[0];
  const atendHoje = atendimentos.filter(a => a.data_chegada === hoje);
  const aguardando = atendHoje.filter(a => a.status === 'Aguardando');
  const emAtendimento = atendHoje.filter(a => a.status === 'Em Atendimento');
  const concluidos = atendHoje.filter(a => a.status === 'Concluído');
  const urgencias = atendHoje.filter(a => a.prioridade === 'Alta');

  const isPresidente = perfilUI === 'presidente' || perfilUI === 'administrador';

  // Tempo médio de espera (minutos) dos que ainda aguardam
  const tempoMedioEspera = (() => {
    if (aguardando.length === 0) return 0;
    const now = new Date();
    const total = aguardando.reduce((sum, a) => {
      const [h, m] = a.hora_chegada.split(':').map(Number);
      const chegada = new Date();
      chegada.setHours(h, m, 0, 0);
      return sum + Math.max(0, (now.getTime() - chegada.getTime()) / 60000);
    }, 0);
    return Math.round(total / aguardando.length);
  })();

  // Atendimento atual na sala
  const atendimentoAtual = emAtendimento[0] || null;

  // Cronômetro em tempo real
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!atendimentoAtual) { setElapsed(0); return; }
    const calcElapsed = () => {
      const [h, m] = atendimentoAtual.hora_chegada.split(':').map(Number);
      const inicio = new Date();
      inicio.setHours(h, m, 0, 0);
      return Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 60000));
    };
    setElapsed(calcElapsed());
    const interval = setInterval(() => setElapsed(calcElapsed()), 30000);
    return () => clearInterval(interval);
  }, [atendimentoAtual?.id]);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Dias com eventos (para marcação no calendário)
  const diasComEventos = useMemo(() => {
    const set = new Set<string>();
    eventosAgenda.forEach(e => set.add(e.data_inicio));
    return set;
  }, [eventosAgenda]);

  // Eventos do dia selecionado
  const eventosDoDia = eventosAgenda
    .filter(e => e.data_inicio === selectedDateStr)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    .slice(0, 5);

  // Alertas estratégicos
  const autorizacoesPendentes = autorizacoes.filter(a => a.status === 'Pendente');
  const alertasUrgentes = notificacoes.filter(
    n => !n.lida && (n.tipo_notificacao === 'alerta_urgente' || n.tipo_notificacao === 'solicitar_encerramento') && n.perfil_destino === 'presidente'
  );

  // Check if event is within 1 hour
  const isProximo = (horaInicio: string) => {
    const [h, m] = horaInicio.split(':').map(Number);
    const eventTime = new Date();
    eventTime.setHours(h, m, 0, 0);
    const diff = eventTime.getTime() - Date.now();
    return diff > 0 && diff < 3600000;
  };

  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const stats = [
    { label: 'Atendimentos Hoje', value: atendHoje.length, icon: Users, color: 'text-primary' },
    { label: 'Em Espera', value: aguardando.length, icon: Clock, color: 'text-accent' },
    { label: 'Em Atendimento', value: emAtendimento.length, icon: UserCheck, color: 'text-primary' },
    { label: 'Prioridade Alta', value: urgencias.length, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Tempo Médio', value: `${tempoMedioEspera}min`, icon: Timer, color: 'text-muted-foreground' },
  ];

  // Non-presidente: simple dashboard
  if (!isPresidente) {
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
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1) FAIXA INSTITUCIONAL */}
      <div className="rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-primary tracking-wide uppercase">
            Câmara Municipal de Feira de Santana
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gabinete da Presidência</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">Ver. Marcos Lima</p>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Presidência Online</span>
          </div>
        </div>
      </div>

      {/* 2) CABEÇALHO DO PAINEL */}
      <div>
        <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
          Cockpit Presidencial – <span className="text-primary">VÉRTICE</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestão Estratégica de Atendimentos e Agenda</p>
        <p className="text-xs text-accent font-medium mt-1 capitalize">{dataFormatada}</p>
      </div>

      {/* 3) INDICADORES COMPACTOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="stat-card !py-3 !px-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground truncate">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 4 + 5) MAIN GRID: Sala Presidencial + Coluna Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT – Sala Presidencial + Prioritários */}
        <div className="lg:col-span-2 space-y-5">
          {/* SALA PRESIDENCIAL */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-primary/5 dark:bg-primary/10">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">Sala Presidencial – Atendimento Atual</h3>
            </div>
            {atendimentoAtual ? (
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{atendimentoAtual.nome_cidadao}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{atendimentoAtual.demanda_principal}</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Timer className="w-4 h-4" />
                    <span className="text-lg font-bold tabular-nums">{elapsed} min</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">{atendimentoAtual.tipo}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    atendimentoAtual.prioridade === 'Alta' ? 'bg-destructive/15 text-destructive' :
                    atendimentoAtual.prioridade === 'Média' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' :
                    'bg-green-500/15 text-green-600 dark:text-green-400'
                  }`}>{atendimentoAtual.prioridade}</span>
                  {atendimentoAtual.assunto && (
                    <span className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">{atendimentoAtual.assunto}</span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/comandos')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-1"
                >
                  <Zap className="w-3.5 h-3.5" /> Comandos Rápidos <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum atendimento em andamento na sala presidencial.</p>
              </div>
            )}
          </div>

          {/* 6) ATENDIMENTOS PRIORITÁRIOS */}
          {urgencias.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-semibold text-foreground">Atendimentos Prioritários</h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
                    {urgencias.length}
                  </span>
                </div>
                <button onClick={() => navigate('/fila')} className="text-xs text-accent hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {urgencias.slice(0, 3).map(a => (
                  <div
                    key={a.id}
                    className="stat-card !py-3 !px-4 flex items-center justify-between cursor-pointer"
                    onClick={() => navigate(`/atendimento/${a.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{a.nome_cidadao}</span>
                        <span className="text-xs text-muted-foreground">• {a.tipo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.demanda_principal}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive ml-3 shrink-0">
                      Alta
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-5">
          {/* CALENDÁRIO MENSAL */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-primary/5 dark:bg-primary/10">
              <button onClick={() => setCalendarMonth(prev => subMonths(prev, 1))} className="p-1 rounded hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-xs font-bold text-foreground capitalize">
                {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => setCalendarMonth(prev => addMonths(prev, 1))} className="p-1 rounded hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-3">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {(() => {
                  const monthStart = startOfMonth(calendarMonth);
                  const monthEnd = endOfMonth(calendarMonth);
                  const calStart = startOfWeek(monthStart);
                  const calEnd = endOfWeek(monthEnd);
                  const days: React.ReactNode[] = [];
                  let day = calStart;
                  while (day <= calEnd) {
                    const d = day;
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const inMonth = isSameMonth(d, calendarMonth);
                    const isToday = isSameDay(d, new Date());
                    const isSelected = isSameDay(d, selectedDate);
                    const hasEvents = diasComEventos.has(dateStr);
                    days.push(
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(d)}
                        className={`relative flex flex-col items-center justify-center py-1.5 text-[11px] rounded-md transition-colors
                          ${!inMonth ? 'text-muted-foreground/30' : 'text-foreground'}
                          ${isToday && !isSelected ? 'bg-primary/10 font-bold' : ''}
                          ${isSelected ? 'bg-primary text-primary-foreground font-bold ring-1 ring-primary' : 'hover:bg-muted'}
                        `}
                      >
                        {format(d, 'd')}
                        {hasEvents && inMonth && (
                          <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                        )}
                      </button>
                    );
                    day = addDays(day, 1);
                  }
                  return days;
                })()}
              </div>
            </div>
          </div>

          {/* AGENDA DO DIA (driven by selected date) */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-accent/5 dark:bg-accent/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  {isSameDay(selectedDate, new Date()) ? 'Agenda de Hoje' : `Agenda – ${format(selectedDate, "dd/MM")}`}
                </h3>
              </div>
              <button onClick={() => navigate('/agenda')} className="text-[10px] text-accent hover:underline">Ver agenda</button>
            </div>
            {eventosDoDia.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs text-muted-foreground">Nenhum compromisso para este dia.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {eventosDoDia.map(e => {
                  const proximo = isProximo(e.hora_inicio);
                  return (
                    <div key={e.id} className={`px-4 py-3 ${proximo ? 'bg-accent/5 border-l-2 border-l-accent' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary min-w-[40px]">{e.hora_inicio}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{e.tipo_evento}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-0.5 truncate">{e.titulo}</p>
                      {e.local && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{e.local}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ATENDIMENTOS AGENDADOS – HOJE */}
          {(() => {
            const agendadosHojeDash = eventosAgenda
              .filter(e => e.data_inicio === hoje && e.tipo_evento === 'Atendimento')
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
              .slice(0, 3);
            if (agendadosHojeDash.length === 0) return null;
            return (
              <div className="stat-card !p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-primary/5 dark:bg-primary/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-display text-sm font-bold text-foreground">Atendimentos Agendados – Hoje</h3>
                  </div>
                  <button onClick={() => navigate('/agenda')} className="text-[10px] text-primary hover:underline">Ver agenda</button>
                </div>
                <div className="divide-y divide-border">
                  {agendadosHojeDash.map(e => (
                    <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-sm font-bold text-primary min-w-[45px]">{e.hora_inicio}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{e.titulo}</p>
                        {e.local && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{e.local}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground shrink-0">{e.tipo_evento}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ALERTAS ESTRATÉGICOS */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-destructive/5 dark:bg-destructive/10">
              <Bell className="w-4 h-4 text-destructive" />
              <h3 className="font-display text-sm font-bold text-foreground">Alertas Estratégicos</h3>
            </div>
            <div className="divide-y divide-border">
              {autorizacoesPendentes.length > 0 && (
                <button
                  onClick={() => navigate('/autorizacoes')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <DollarSign className="w-4 h-4 text-accent shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">Autorizações Financeiras</p>
                    <p className="text-[10px] text-muted-foreground">{autorizacoesPendentes.length} pendente(s)</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              )}
              {alertasUrgentes.length > 0 ? (
                alertasUrgentes.slice(0, 3).map(alerta => (
                  <button
                    key={alerta.id}
                    onClick={() => navigate('/notificacoes')}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs text-foreground truncate flex-1">{alerta.mensagem_resumo}</p>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  </button>
                ))
              ) : autorizacoesPendentes.length === 0 ? (
                <div className="p-5 text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
