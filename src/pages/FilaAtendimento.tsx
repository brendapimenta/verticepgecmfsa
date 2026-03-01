import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { useAudit } from '@/contexts/AuditContext';
import { Prioridade, StatusAtendimento, StatusDemanda } from '@/types';
import {
  Clock, Phone, User, FileText, AlertCircle, Users, CheckCircle, ClipboardList,
  Loader2, AlertTriangle, Calendar, MapPin, ChevronLeft, ChevronRight, CalendarClock, UserCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast as sonnerToast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/PersonAvatar';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prioridadeOrder: Record<Prioridade, number> = { Alta: 0, Média: 1, Baixa: 2 };

const prioridadeBadge: Record<Prioridade, string> = {
  Alta: 'bg-red-500/15 text-red-400 border-red-500/30',
  Média: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Baixa: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const statusBadge: Record<StatusAtendimento, string> = {
  Aguardando: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  'Em Atendimento': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Concluído: 'bg-green-500/15 text-green-400 border-green-500/30',
  Adiado: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const getTempoEspera = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  const chegada = new Date();
  chegada.setHours(h, m, 0, 0);
  const diff = Math.floor((Date.now() - chegada.getTime()) / 60000);
  return diff > 0 ? diff : 0;
};

const formatarTempo = (minutos: number): string => {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};

const FilaAtendimento: React.FC = () => {
  const navigate = useNavigate();
  const { atendimentos, updateAtendimento, confirmarPresenca, demandasAtendimento, updateDemandaStatus, eventosAgenda } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const isSalaPrincipal = perfilUI === 'sala_principal' || perfilUI === 'administrador';
  const isSalaEspera = perfilUI === 'sala_espera' || perfilUI === 'administrador';
  const { registrarAuditoria } = useAudit();
  const [concluirId, setConcluirId] = useState<string | null>(null);
  const canConcluir = isSalaPrincipal || perfilUI === 'presidente';

  const hoje = new Date().toISOString().split('T')[0];

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const diasComEventos = useMemo(() => {
    const set = new Set<string>();
    eventosAgenda.forEach(e => set.add(e.data_inicio));
    return set;
  }, [eventosAgenda]);

  const eventosDoDia = eventosAgenda
    .filter(e => e.data_inicio === selectedDateStr)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Atendimentos agendados para hoje (eventos tipo Atendimento)
  const agendadosHoje = eventosAgenda
    .filter(e => e.data_inicio === hoje && e.tipo_evento === 'Atendimento')
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Hybrid ordering: scheduled appointments within their time window get top priority
  const isWithinScheduledWindow = (a: typeof atendimentos[0]) => {
    if (a.tipo_registro === 'Sem agendamento' || !a.hora_agendada) return false;
    const [h, m] = a.hora_agendada.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    const now = Date.now();
    const diff = now - scheduled.getTime();
    // 15min before (-15*60000) to 30min after (30*60000)
    return diff >= -15 * 60000 && diff <= 30 * 60000;
  };

  const statusOrder: Record<StatusAtendimento, number> = { Aguardando: 0, 'Em Atendimento': 1, Concluído: 2, Adiado: 3 };

  const filaHoje = atendimentos
    .filter(a => a.data_chegada === hoje && a.status !== 'Concluído')
    .sort((a, b) => {
      const sDiff = statusOrder[a.status] - statusOrder[b.status];
      if (sDiff !== 0) return sDiff;
      // Hybrid: scheduled within window goes first
      const aInWindow = isWithinScheduledWindow(a) ? 0 : 1;
      const bInWindow = isWithinScheduledWindow(b) ? 0 : 1;
      if (aInWindow !== bInWindow) return aInWindow - bInWindow;
      const pDiff = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      if (pDiff !== 0) return pDiff;
      return a.hora_chegada.localeCompare(b.hora_chegada);
    });

  // Identify scheduled attendances
  const agendados = filaHoje.filter(a => a.tipo_registro === 'Atendimento agendado' || a.tipo_registro === 'Reunião agendada');
  const espontaneos = filaHoje.filter(a => a.tipo_registro === 'Sem agendamento');

  const concluidos = atendimentos.filter(a => a.data_chegada === hoje && a.status === 'Concluído');

  const handleConcluir = () => {
    if (!concluirId || !usuario) return;
    const updates: Partial<typeof atendimentos[0]> = {
      status: 'Concluído' as StatusAtendimento,
      data_conclusao: new Date().toISOString(),
    };
    if (usuario.perfil === 'sala_principal') {
      const atendimento = atendimentos.find(a => a.id === concluirId);
      if (atendimento && !atendimento.responsavel) {
        updates.responsavel = usuario.nome;
      }
    }
    updateAtendimento(concluirId, updates);
    setConcluirId(null);
  };

  const renderAtendimentoCard = (a: typeof atendimentos[0], index: number, isAgendado: boolean) => {
    const tempo = getTempoEspera(a.hora_chegada);
    const prioridadeBorda = a.prioridade === 'Alta' ? 'border-l-[#EF4444]' : a.prioridade === 'Média' ? 'border-l-[#EAB308]' : a.prioridade === 'Baixa' ? 'border-l-[#22C55E]' : 'border-l-muted-foreground/30';
    const isFirst = index === 0 && a.status === 'Aguardando';
    const isAlta = a.prioridade === 'Alta';
    const canCheckin = isAgendado && !a.checkin_realizado && (isSalaPrincipal || isSalaEspera);
    
    // Check if scheduled time has passed without check-in
    const aguardandoComparecimento = isAgendado && !a.checkin_realizado && a.hora_agendada && (() => {
      const [h, m] = a.hora_agendada!.split(':').map(Number);
      const agendado = new Date();
      agendado.setHours(h, m, 0, 0);
      return Date.now() > agendado.getTime();
    })();

    return (
      <div
        key={a.id}
        className={cn(
          "bg-card rounded-lg border p-4 border-l-4 transition-all",
          prioridadeBorda,
          isFirst && "ring-1 ring-primary/30",
          isAlta && !isFirst && "ring-1 ring-red-500/20"
        )}
        style={isFirst ? { background: 'hsl(var(--primary) / 0.08)' } : isAlta ? { background: 'hsl(var(--destructive) / 0.04)' } : undefined}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-shrink-0 flex flex-col items-center gap-1 md:w-12">
            <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
            <span className="text-[10px] text-muted-foreground">{a.hora_chegada}</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <PersonAvatar nome={a.nome_cidadao} fotoUrl={a.foto_url} size="sm" />
              <button onClick={() => navigate(`/atendimento/${a.id}`)} className="font-semibold text-foreground hover:text-accent underline-offset-2 hover:underline">{a.nome_cidadao}</button>
              {isFirst && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-foreground border border-primary/30">
                  Próximo
                </span>
              )}
              {isAgendado && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/25 flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" /> Agendado
                </span>
              )}
              {a.checkin_realizado && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-500 border border-green-500/25 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Presente {a.checkin_hora && `às ${a.checkin_hora}`}
                </span>
              )}
              {aguardandoComparecimento && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Aguardando Comparecimento
                </span>
              )}
              <span
                className={cn("px-2 py-0.5 rounded text-xs font-bold border cursor-default", prioridadeBadge[a.prioridade])}
                title={isAlta ? 'Posição na fila ajustada automaticamente por prioridade.' : undefined}
              >
                {isAlta && <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />}
                {a.prioridade}
              </span>
              <Badge variant="outline" className="text-xs">{a.tipo}</Badge>
              {(a.tipo === 'Vereador' || a.tipo === 'Autoridade') && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                  Institucional
                </span>
              )}
              <Badge variant="outline" className="text-xs">{a.tipo_registro}</Badge>
              <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", statusBadge[a.status])}>
                {a.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.hora_chegada}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {a.telefone_contato}</span>
              {a.indicado_por && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.indicado_por}</span>}
            </div>

            <div className="flex items-start gap-1 text-sm">
              <FileText className="w-3 h-3 mt-1 text-muted-foreground flex-shrink-0" />
              <span>{a.demanda_principal}</span>
            </div>

            {tempo > 30 && (
              <div className="flex items-center gap-1 text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>{formatarTempo(tempo)} de espera</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center flex-shrink-0 flex-wrap">
            {canCheckin && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => {
                  confirmarPresenca(a.id, a.nome_cidadao);
                  if (usuario) {
                    registrarAuditoria({
                      usuario_id: usuario.id, nome_usuario: usuario.nome, perfil_usuario: usuario.perfil,
                      tipo_acao: 'checkin', modulo: 'atendimento', referencia_tipo: 'atendimento', referencia_id: a.id,
                      descricao_resumida: `Check-in confirmado: ${a.nome_cidadao}.`,
                    });
                  }
                  sonnerToast.success(`Presença de ${a.nome_cidadao} confirmada.`);
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Confirmar Presença
              </Button>
            )}
            {isSalaPrincipal && (
              <Select
                value={a.prioridade}
                onValueChange={(v) => updateAtendimento(a.id, { prioridade: v as Prioridade })}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            )}
            {isSalaPrincipal && (
              <Select
                value={a.status}
                onValueChange={(v) => updateAtendimento(a.id, { status: v as StatusAtendimento, ...(v === 'Concluído' ? { data_conclusao: new Date().toISOString() } : {}) })}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aguardando">Aguardando</SelectItem>
                  <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Adiado">Adiado</SelectItem>
                </SelectContent>
              </Select>
            )}
            {canConcluir && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-green-500/30 text-green-400 hover:bg-green-500/15 hover:text-green-300"
                onClick={() => setConcluirId(a.id)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Concluir
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground uppercase">FILA DE ATENDIMENTO</h1>
        <p className="text-sm text-muted-foreground mt-1">{filaHoje.length} em espera ou em atendimento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT – Main queue */}
        <div className="lg:col-span-2 space-y-6">

          {/* Atendimentos Agendados para Hoje */}
          {agendadosHoje.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Atendimentos Agendados para Hoje</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">{agendadosHoje.length}</span>
              </div>
              <div className="space-y-2">
                {agendadosHoje.map(e => (
                  <div key={e.id} className="stat-card !py-3 !px-4 flex items-center gap-3 border-l-4 border-l-primary/50">
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
          )}

          {/* Agendados na fila */}
          {agendados.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="w-4 h-4 text-primary" />
                <h2 className="font-display text-base font-semibold text-foreground">Atendimentos Agendados</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">{agendados.length}</span>
              </div>
              <div className="space-y-3">
                {agendados.map((a, i) => renderAtendimentoCard(a, i, true))}
              </div>
            </div>
          )}

          {/* Fila por ordem de chegada */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display text-base font-semibold text-foreground">Fila por Ordem de Chegada</h2>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">{espontaneos.length}</span>
            </div>
            <div className="space-y-3">
              {espontaneos.map((a, i) => renderAtendimentoCard(a, i, false))}
              {espontaneos.length === 0 && agendados.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum atendimento na fila</p>
                </div>
              )}
            </div>
          </div>

          {/* Concluídos */}
          {concluidos.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Concluídos Hoje ({concluidos.length})</h2>
              <div className="space-y-2 opacity-60">
                {concluidos.map(a => (
                  <div key={a.id} className="bg-card rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{a.nome_cidadao}</span>
                      <Badge variant="outline" className="text-xs">{a.tipo}</Badge>
                      <span className="text-xs text-green-600 font-medium">✓ Concluído</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.demanda_principal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demandas Recebidas */}
          {(perfilUI === 'sala_espera' || perfilUI === 'administrador') && demandasAtendimento.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">
                Demandas Recebidas ({demandasAtendimento.filter(d => d.status !== 'Concluída').length} pendentes)
              </h2>
              <div className="space-y-2">
                {demandasAtendimento.filter(d => d.status !== 'Concluída').map(d => {
                  const atend = atendimentos.find(a => a.id === d.atendimento_id);
                  return (
                    <div key={d.id} className="bg-card rounded-lg border p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        {d.status === 'Pendente' ? <Clock className="w-3.5 h-3.5 text-yellow-600" /> :
                         d.status === 'Em andamento' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> :
                         <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                        <div>
                          <p className="text-sm font-medium">{d.descricao_demanda}</p>
                          <p className="text-xs text-muted-foreground">
                            Atendimento: <button onClick={() => navigate(`/atendimento/${d.atendimento_id}`)} className="text-accent hover:underline">{atend?.nome_cidadao || d.atendimento_id}</button>
                            {' • '}{new Date(d.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={d.status === 'Pendente' ? 'bg-yellow-500/15 text-yellow-300' : d.status === 'Em andamento' ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'}>{d.status}</Badge>
                        {d.status !== 'Concluída' && (
                          <Select value={d.status} onValueChange={v => updateDemandaStatus(d.id, v as StatusDemanda)}>
                            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Em andamento">Em andamento</SelectItem>
                              <SelectItem value="Concluída">Concluída</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR – Calendar + Agenda */}
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
              <div className="grid grid-cols-7 mb-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
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

          {/* AGENDA DO DIA SELECIONADO */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-accent/5 dark:bg-accent/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  {isSameDay(selectedDate, new Date()) ? 'Agenda de Hoje' : `Agenda – ${format(selectedDate, 'dd/MM')}`}
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
                {eventosDoDia.map(e => (
                  <div key={e.id} className="px-4 py-3">
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!concluirId} onOpenChange={(open) => !open && setConcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar este atendimento como CONCLUÍDO?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcluir}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FilaAtendimento;
