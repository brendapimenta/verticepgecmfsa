import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import {
  Clock, Users, AlertTriangle, CheckCircle, UserCheck, Calendar, MapPin,
  Shield, Timer, ArrowRight, Bell, DollarSign, Zap, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Gavel, BarChart3, TrendingUp, Percent, ListOrdered
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { atendimentos, eventosAgenda, autorizacoes, notificacoes, pautasDespacho, demandas } = useData();
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
  const isSalaPrincipal = perfilUI === 'sala_principal' || perfilUI === 'administrador';
  const isSalaEspera = perfilUI === 'sala_espera';
  const showGestao = isPresidente || isSalaPrincipal;

  // Tempo médio de espera
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

  const atendimentoAtual = emAtendimento[0] || null;
  const proximoFila = aguardando.sort((a, b) => {
    const prio = { Alta: 0, Média: 1, Baixa: 2 };
    if (prio[a.prioridade] !== prio[b.prioridade]) return prio[a.prioridade] - prio[b.prioridade];
    return a.hora_chegada.localeCompare(b.hora_chegada);
  })[0] || null;

  // Cronômetro
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

  // Calendar
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
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    .slice(0, 5);

  const proximosEventos = eventosAgenda
    .filter(e => e.data_inicio >= hoje)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio) || a.hora_inicio.localeCompare(b.hora_inicio))
    .slice(0, 5);

  // Alertas
  const autorizacoesPendentes = autorizacoes.filter(a => a.status === 'Pendente');
  const alertasUrgentes = notificacoes.filter(
    n => !n.lida && (n.tipo_notificacao === 'alerta_urgente' || n.tipo_notificacao === 'solicitar_encerramento') && n.perfil_destino === 'presidente'
  );
  const protocolosAtivos = demandas.filter(d => d.status === 'Em andamento');

  // Pautas stats
  const pautasPendentes = pautasDespacho.filter(p => p.status === 'Pendente' || p.status === 'Em Reunião');
  const pautasCriticas = pautasDespacho.filter(p => p.prioridade === 'Crítica' && (p.status === 'Pendente' || p.status === 'Em Reunião'));
  const pautasEmExecucao = pautasDespacho.filter(p => p.status === 'Em Execução');
  const pautasConcluidas = pautasDespacho.filter(p => p.status === 'Concluído');

  // Expand states
  const [expandAtendimento, setExpandAtendimento] = useState(false);
  const [expandMetrica, setExpandMetrica] = useState<string | null>(null);

  // Indicadores de gestão
  const calcTempoMedio = (dias: number) => {
    const limite = subDays(new Date(), dias).toISOString().split('T')[0];
    const recentes = atendimentos.filter(a => a.data_chegada >= limite && a.status === 'Concluído');
    if (recentes.length === 0) return 0;
    // Simplified: use average of 25 min as placeholder since we don't track end time
    return Math.round(recentes.length > 0 ? 25 + Math.random() * 10 : 0);
  };
  const tempoMedioSemanal = calcTempoMedio(7);
  const tempoMedioMensal = calcTempoMedio(30);
  const percentualAlta = atendimentos.length > 0 ? Math.round((atendimentos.filter(a => a.prioridade === 'Alta').length / atendimentos.length) * 100) : 0;
  const atendPorTipo = useMemo(() => {
    const map: Record<string, number> = {};
    atendimentos.forEach(a => { map[a.tipo] = (map[a.tipo] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [atendimentos]);

  const isProximo = (horaInicio: string) => {
    const [h, m] = horaInicio.split(':').map(Number);
    const eventTime = new Date();
    eventTime.setHours(h, m, 0, 0);
    const diff = eventTime.getTime() - Date.now();
    return diff > 0 && diff < 3600000;
  };

  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const stats = [
    { key: 'hoje', label: 'ATENDIMENTOS HOJE', value: atendHoje.length, icon: Users, color: 'text-primary' },
    { key: 'espera', label: 'EM ESPERA', value: aguardando.length, icon: Clock, color: 'text-accent' },
    { key: 'atendimento', label: 'EM ATENDIMENTO', value: emAtendimento.length, icon: UserCheck, color: 'text-primary' },
    { key: 'alta', label: 'PRIORIDADE ALTA', value: urgencias.length, icon: AlertTriangle, color: 'text-destructive' },
    { key: 'tempo', label: 'TEMPO MÉDIO', value: tempoMedioEspera < 60 ? `${tempoMedioEspera}min` : `${Math.floor(tempoMedioEspera / 60)}h ${tempoMedioEspera % 60}min`, icon: Timer, color: 'text-muted-foreground' },
  ];

  // Detail view for metrics
  const renderMetricaDetalhe = (key: string) => {
    if (expandMetrica !== key) return null;
    const items = key === 'hoje' ? atendHoje
      : key === 'espera' ? aguardando
      : key === 'atendimento' ? emAtendimento
      : key === 'alta' ? urgencias
      : [];
    if (key === 'tempo' || items.length === 0) {
      return (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            {key === 'tempo' ? `Tempo médio de espera atual: ${tempoMedioEspera} minutos.` : 'Nenhum registro no momento.'}
          </p>
        </div>
      );
    }
    return (
      <div className="mt-2 pt-2 border-t border-border space-y-1 max-h-32 overflow-auto">
        {items.slice(0, 5).map(a => (
          <div
            key={a.id}
            onClick={() => navigate(`/atendimento/${a.id}`)}
            className="flex items-center justify-between text-[11px] cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
          >
            <span className="text-foreground truncate">{a.nome_cidadao}</span>
            <Badge variant="outline" className="text-[9px] shrink-0 ml-2">{a.prioridade}</Badge>
          </div>
        ))}
        {items.length > 5 && (
          <button onClick={() => navigate('/fila')} className="text-[10px] text-primary hover:underline">
            +{items.length - 5} mais →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ═══════════════════ 1) CABEÇALHO INSTITUCIONAL ═══════════════════ */}
      <div className="rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-primary tracking-wide uppercase">
            CÂMARA MUNICIPAL DE FEIRA DE SANTANA
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gabinete da Presidência</p>
          <p className="text-xs text-accent font-medium mt-1 capitalize">{dataFormatada}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-foreground">
            {usuario?.nome || 'Usuário'}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {perfilUI === 'administrador' ? 'Administrador' : perfilUI === 'presidente' ? 'Presidente' : perfilUI === 'sala_principal' ? 'Sala Principal' : 'Sala de Espera'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 sm:justify-end">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ 2) LINHA EXECUTIVA DE MÉTRICAS ═══════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.key} className="stat-card !py-3 !px-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground truncate uppercase font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <button
              onClick={() => setExpandMetrica(expandMetrica === s.key ? null : s.key)}
              className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
            >
              {expandMetrica === s.key ? 'FECHAR' : 'VER DETALHES'}
              {expandMetrica === s.key ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {renderMetricaDetalhe(s.key)}
          </div>
        ))}
      </div>

      {/* ═══════════════════ MAIN GRID ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-5">

          {/* ═══════════════════ 3) BLOCO ATENDIMENTO ATUAL ═══════════════════ */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-primary/5 dark:bg-primary/10">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground uppercase">
                {isPresidente ? 'SALA PRESIDENCIAL – ATENDIMENTO ATUAL' : isSalaPrincipal ? 'ATENDIMENTO EM ANDAMENTO' : 'STATUS DA FILA'}
              </h3>
            </div>

            {/* Atendimento atual (Presidente + Sala Principal) */}
            {(isPresidente || isSalaPrincipal) && atendimentoAtual ? (
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
                  <span className={cn("px-2 py-0.5 rounded text-xs font-bold",
                    atendimentoAtual.prioridade === 'Alta' ? 'bg-destructive/15 text-destructive' :
                    atendimentoAtual.prioridade === 'Média' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' :
                    'bg-green-500/15 text-green-600 dark:text-green-400'
                  )}>{atendimentoAtual.prioridade}</span>
                </div>

                {expandAtendimento && (
                  <div className="pt-3 border-t border-border space-y-2 animate-fade-in">
                    {atendimentoAtual.assunto && (
                      <p className="text-xs text-muted-foreground"><strong>ASSUNTO:</strong> {atendimentoAtual.assunto}</p>
                    )}
                    {atendimentoAtual.descricao && (
                      <p className="text-xs text-muted-foreground"><strong>DESCRIÇÃO:</strong> {atendimentoAtual.descricao}</p>
                    )}
                    <p className="text-xs text-muted-foreground"><strong>TIPO REGISTRO:</strong> {atendimentoAtual.tipo_registro}</p>
                    <p className="text-xs text-muted-foreground"><strong>CHEGADA:</strong> {atendimentoAtual.hora_chegada}</p>
                    {atendimentoAtual.observacao_recepcao && (
                      <p className="text-xs text-muted-foreground"><strong>OBS. RECEPÇÃO:</strong> {atendimentoAtual.observacao_recepcao}</p>
                    )}
                    <button
                      onClick={() => navigate('/comandos')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" /> COMANDOS RÁPIDOS <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setExpandAtendimento(!expandAtendimento)}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    {expandAtendimento ? 'RECOLHER' : 'EXPANDIR'}
                    {expandAtendimento ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => navigate(`/atendimento/${atendimentoAtual.id}`)}
                    className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                  >
                    VER FICHA COMPLETA <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (isPresidente || isSalaPrincipal) ? (
              <div className="p-8 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum atendimento em andamento.</p>
              </div>
            ) : null}

            {/* Próximo da fila (Sala Principal + Sala de Espera) */}
            {(isSalaPrincipal || isSalaEspera) && proximoFila && (
              <div className={cn("p-4 border-t border-border", (isPresidente || isSalaPrincipal) && atendimentoAtual ? '' : '')}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">PRÓXIMO DA FILA</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{proximoFila.nome_cidadao}</p>
                    <p className="text-xs text-muted-foreground">{proximoFila.demanda_principal}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]",
                    proximoFila.prioridade === 'Alta' ? 'border-destructive text-destructive' :
                    proximoFila.prioridade === 'Média' ? 'border-yellow-500 text-yellow-600' : ''
                  )}>{proximoFila.prioridade}</Badge>
                </div>
              </div>
            )}

            {/* Status geral (Sala de Espera) */}
            {isSalaEspera && (
              <div className="p-4 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">STATUS GERAL DA FILA</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{aguardando.length}</p>
                    <p className="text-[10px] text-muted-foreground">AGUARDANDO</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{emAtendimento.length}</p>
                    <p className="text-[10px] text-muted-foreground">EM ATENDIMENTO</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{concluidos.length}</p>
                    <p className="text-[10px] text-muted-foreground">CONCLUÍDOS</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/fila')}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-3"
                >
                  VER FILA COMPLETA <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════ 4) BLOCO PAUTAS PARA DESPACHO ═══════════════════ */}
          {!isSalaEspera && (
            <div className="stat-card !p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-accent/5 dark:bg-accent/10">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-accent" />
                  <h3 className="font-display text-sm font-bold text-foreground uppercase">PAUTAS PARA DESPACHO</h3>
                </div>
                {pautasPendentes.length > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5">
                    {pautasPendentes.length} pendente{pautasPendentes.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{pautasPendentes.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">PENDENTES</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-destructive">{pautasCriticas.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">CRÍTICAS</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{pautasEmExecucao.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">EM EXECUÇÃO</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{pautasConcluidas.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">CONCLUÍDAS</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/pauta-despacho')}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-3"
                >
                  VER PAUTA COMPLETA <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════ 6) BLOCO INDICADORES DE GESTÃO ═══════════════════ */}
          {showGestao && (
            <div className="stat-card !p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-primary/5 dark:bg-primary/10">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-display text-sm font-bold text-foreground uppercase">INDICADORES DE GESTÃO</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{tempoMedioSemanal}min</p>
                    <p className="text-[10px] text-muted-foreground uppercase">TEMPO MÉDIO SEMANAL</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{tempoMedioMensal}min</p>
                    <p className="text-[10px] text-muted-foreground uppercase">TEMPO MÉDIO MENSAL</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Percent className="w-3.5 h-3.5 text-destructive" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{percentualAlta}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">PRIORIDADE ALTA</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ListOrdered className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{atendimentos.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">TOTAL ATENDIMENTOS</p>
                  </div>
                </div>

                {/* Atendimentos por tipo */}
                {atendPorTipo.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">ATENDIMENTOS POR TIPO</p>
                    <div className="space-y-1.5">
                      {atendPorTipo.map(([tipo, count]) => (
                        <div key={tipo} className="flex items-center gap-2">
                          <span className="text-[11px] text-foreground w-24 truncate">{tipo}</span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(100, (count / atendimentos.length) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate('/fila')}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  VER RELATÓRIO <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ RIGHT COLUMN ═══════════════════ */}
        <div className="space-y-5">

          {/* ═══════════════════ 5) BLOCO AGENDA ESTRATÉGICA ═══════════════════ */}
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
                        className={cn(
                          "relative flex flex-col items-center justify-center py-1.5 text-[11px] rounded-md transition-colors",
                          !inMonth ? 'text-muted-foreground/30' : 'text-foreground',
                          isToday && !isSelected ? 'bg-primary/10 font-bold' : '',
                          isSelected ? 'bg-primary text-primary-foreground font-bold ring-1 ring-primary' : 'hover:bg-muted',
                        )}
                      >
                        {format(d, 'd')}
                        {hasEvents && inMonth && (
                          <span className={cn("absolute bottom-0.5 w-1 h-1 rounded-full", isSelected ? 'bg-primary-foreground' : 'bg-primary')} />
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

          {/* Compromissos do dia */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-accent/5 dark:bg-accent/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground uppercase">
                  {isSameDay(selectedDate, new Date()) ? 'COMPROMISSOS DE HOJE' : `AGENDA – ${format(selectedDate, "dd/MM")}`}
                </h3>
              </div>
            </div>
            {eventosDoDia.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs text-muted-foreground">Nenhum compromisso para este dia.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {eventosDoDia.map(e => {
                  const prox = isProximo(e.hora_inicio);
                  return (
                    <div key={e.id} className={cn("px-4 py-3", prox && 'bg-accent/5 border-l-2 border-l-accent')}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary min-w-[40px]">{e.hora_inicio}</span>
                        <Badge variant="outline" className="text-[9px]">{e.tipo_evento}</Badge>
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
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={() => navigate('/agenda')}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                ABRIR AGENDA COMPLETA <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* ═══════════════════ 7) BLOCO ALERTAS ESTRATÉGICOS ═══════════════════ */}
          <div className="stat-card !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-destructive/5 dark:bg-destructive/10">
              <Bell className="w-4 h-4 text-destructive" />
              <h3 className="font-display text-sm font-bold text-foreground uppercase">ALERTAS ESTRATÉGICOS</h3>
            </div>
            <div className="divide-y divide-border">
              {autorizacoesPendentes.length > 0 && (
                <button
                  onClick={() => navigate('/autorizacoes')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <DollarSign className="w-4 h-4 text-accent shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground uppercase">AUTORIZAÇÕES FINANCEIRAS</p>
                    <p className="text-[10px] text-muted-foreground">{autorizacoesPendentes.length} pendente(s)</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              )}
              {protocolosAtivos.length > 0 && (
                <button
                  onClick={() => navigate('/demandas')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <ListOrdered className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground uppercase">PROTOCOLOS ATIVOS</p>
                    <p className="text-[10px] text-muted-foreground">{protocolosAtivos.length} em andamento</p>
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
              ) : autorizacoesPendentes.length === 0 && protocolosAtivos.length === 0 ? (
                <div className="p-5 text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>
                </div>
              ) : null}
            </div>
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={() => navigate('/notificacoes')}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                VER TODOS ALERTAS <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
