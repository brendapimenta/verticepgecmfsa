import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { EventoAgenda, TipoEvento } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MapPin, Link as LinkIcon, Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast as sonnerToast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const TIPOS_EVENTO: { value: TipoEvento; cor: string }[] = [
  { value: 'ATENDIMENTO', cor: '#2E7D32' },
  { value: 'REUNIÃO', cor: '#1565C0' },
  { value: 'ENTREVISTA', cor: '#B3261E' },
  { value: 'EVENTO', cor: '#00838F' },
  { value: 'CONGRESSO', cor: '#5B3F8C' },
  { value: 'SESSÃO ORDINÁRIA', cor: '#111111' },
  { value: 'SESSÃO SOLENE', cor: '#333333' },
  { value: 'SESSÃO ESPECIAL', cor: '#4A4A4A' },
  { value: 'AUDIÊNCIA PÚBLICA', cor: '#6B4F3B' },
  { value: 'AGENDA – PRESIDÊNCIA', cor: '#1E7D5C' },
  { value: 'AGENDA – GABINETE', cor: '#1E4E8C' },
  { value: 'EVENTOS – PREFEITURA', cor: '#1F6F8B' },
  { value: 'AGENDA – PESSOAL', cor: '#C04B73' },
  { value: 'ANIVERSÁRIOS', cor: '#C7A028' },
];

const getTipoInfo = (tipo: string) =>
  TIPOS_EVENTO.find(t => t.value === tipo) || { value: tipo, cor: '#6B7280' };

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'manual';

interface FormState {
  titulo: string;
  descricao: string;
  tipo_evento: TipoEvento;
  local: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  relacionado_a_atendimento_id: string;
}

const emptyForm: FormState = {
  titulo: '', descricao: '', tipo_evento: 'REUNIÃO', local: '',
  data_inicio: '', hora_inicio: '', data_fim: '', hora_fim: '',
  relacionado_a_atendimento_id: '',
};

// Helper to generate dates for recurrence
function generateRecurrenceDates(baseDate: string, type: RecurrenceType, endDate: string): string[] {
  if (type === 'none') return [];
  const dates: string[] = [];
  const start = new Date(baseDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  let current = new Date(start);

  while (current <= end) {
    // Skip base date itself
    if (current.toISOString().split('T')[0] !== baseDate) {
      dates.push(current.toISOString().split('T')[0]);
    }
    if (type === 'daily') current.setDate(current.getDate() + 1);
    else if (type === 'weekly') current.setDate(current.getDate() + 7);
    else if (type === 'monthly') current.setMonth(current.getMonth() + 1);
    else break;
    if (dates.length > 365) break; // Safety limit
  }
  return dates;
}

const Agenda: React.FC = () => {
  const { eventosAgenda, addEventoAgenda, addEventosAgendaBulk, updateEventoAgenda, updateEventosGrupo, deleteEventoAgenda, atendimentos } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const navigate = useNavigate();

  const [visao, setVisao] = useState<'mensal' | 'semanal'>('mensal');
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<EventoAgenda | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [manualDates, setManualDates] = useState<string[]>([]);
  const [manualDateInput, setManualDateInput] = useState('');

  // Group edit dialog
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [groupEditChoice, setGroupEditChoice] = useState<'single' | 'all' | 'future'>('single');
  const [pendingEdit, setPendingEdit] = useState<{ evento: EventoAgenda; updates: Partial<EventoAgenda> } | null>(null);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventoAgenda | null>(null);

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();

  const diasDoMes = useMemo(() => {
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes + 1, 0);
    const dias: { date: string; day: number; currentMonth: boolean }[] = [];
    for (let i = 0; i < primeiro.getDay(); i++) {
      const d = new Date(ano, mes, -primeiro.getDay() + i + 1);
      dias.push({ date: d.toISOString().split('T')[0], day: d.getDate(), currentMonth: false });
    }
    for (let d = 1; d <= ultimo.getDate(); d++) {
      const dt = new Date(ano, mes, d);
      dias.push({ date: dt.toISOString().split('T')[0], day: d, currentMonth: true });
    }
    const remaining = 7 - (dias.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(ano, mes + 1, i);
        dias.push({ date: d.toISOString().split('T')[0], day: d.getDate(), currentMonth: false });
      }
    }
    return dias;
  }, [ano, mes]);

  const diasDaSemana = useMemo(() => {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      return { date: d.toISOString().split('T')[0], day: d.getDate(), currentMonth: true };
    });
  }, []);

  const eventosNoDia = (date: string) =>
    eventosAgenda.filter(e => e.data_inicio === date).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  const eventosDiaSelecionado = diaSelecionado ? eventosNoDia(diaSelecionado) : [];

  const perfilCriador = perfilUI === 'presidente' || perfilUI === 'administrador' ? 'Presidente' : 'Sala Principal';

  const abrirNovo = (date?: string) => {
    setEditando(null);
    setForm({ ...emptyForm, data_inicio: date || hojeStr, data_fim: date || hojeStr });
    setRecurrenceType('none');
    setRecurrenceEndDate('');
    setManualDates([]);
    setModalOpen(true);
  };

  const abrirEditar = (e: EventoAgenda) => {
    setEditando(e);
    setForm({
      titulo: e.titulo, descricao: e.descricao || '', tipo_evento: e.tipo_evento as TipoEvento,
      local: e.local || '', data_inicio: e.data_inicio, hora_inicio: e.hora_inicio,
      data_fim: e.data_fim, hora_fim: e.hora_fim,
      relacionado_a_atendimento_id: e.relacionado_a_atendimento_id || '',
    });
    setRecurrenceType('none');
    setModalOpen(true);
  };

  const salvar = () => {
    if (!form.titulo.trim() || !form.data_inicio || !form.hora_inicio || !form.hora_fim || !form.tipo_evento || !usuario) return;
    
    const baseData = {
      ...form,
      descricao: form.descricao || undefined,
      local: form.local || undefined,
      relacionado_a_atendimento_id: form.relacionado_a_atendimento_id || undefined,
    };

    if (editando) {
      // Check if it belongs to a recurrence group
      if (editando.recorrencia_id) {
        setPendingEdit({ evento: editando, updates: baseData });
        setGroupEditChoice('single');
        setGroupEditOpen(true);
        setModalOpen(false);
        return;
      }
      updateEventoAgenda(editando.id, baseData);
      sonnerToast.success('Evento atualizado.');
    } else {
      // Determine extra dates
      let extraDates: string[] = [];
      if (recurrenceType === 'manual') {
        extraDates = manualDates;
      } else if (recurrenceType !== 'none' && recurrenceEndDate) {
        extraDates = generateRecurrenceDates(form.data_inicio, recurrenceType, recurrenceEndDate);
      }

      if (extraDates.length > 0) {
        const recorrenciaId = crypto.randomUUID();
        const allDates = [form.data_inicio, ...extraDates];
        const eventos = allDates.map(date => ({
          ...baseData,
          data_inicio: date,
          data_fim: date,
          criado_por_id: usuario.id,
          criado_por_perfil: perfilCriador as 'Presidente' | 'Sala Principal',
          recorrencia_id: recorrenciaId,
        }));
        addEventosAgendaBulk(eventos as any);
        sonnerToast.success(`${eventos.length} eventos criados com recorrência.`);
      } else {
        addEventoAgenda({
          ...baseData,
          criado_por_id: usuario.id,
          criado_por_perfil: perfilCriador,
        } as any);
        sonnerToast.success('Evento criado.');
      }
    }
    setModalOpen(false);
  };

  const confirmarGroupEdit = () => {
    if (!pendingEdit) return;
    const { evento, updates } = pendingEdit;

    if (groupEditChoice === 'single') {
      updateEventoAgenda(evento.id, updates);
      sonnerToast.success('Evento atualizado.');
    } else if (groupEditChoice === 'all' && evento.recorrencia_id) {
      updateEventosGrupo(evento.recorrencia_id, updates);
      sonnerToast.success('Todos os eventos do grupo atualizados.');
    } else if (groupEditChoice === 'future' && evento.recorrencia_id) {
      updateEventosGrupo(evento.recorrencia_id, updates, evento.data_inicio);
      sonnerToast.success('Eventos futuros do grupo atualizados.');
    }

    setGroupEditOpen(false);
    setPendingEdit(null);
  };

  const pedirExclusao = (e: EventoAgenda) => {
    setDeleteTarget(e);
    setDeleteConfirmOpen(true);
  };

  const confirmarExclusao = () => {
    if (!deleteTarget) return;
    deleteEventoAgenda(deleteTarget.id);
    sonnerToast.success('Evento excluído.');
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const addManualDate = () => {
    if (manualDateInput && !manualDates.includes(manualDateInput)) {
      setManualDates(prev => [...prev, manualDateInput].sort());
      setManualDateInput('');
    }
  };

  const removeManualDate = (d: string) => setManualDates(prev => prev.filter(x => x !== d));

  const navMes = (dir: number) => setMesAtual(new Date(ano, mes + dir, 1));

  const dias = visao === 'mensal' ? diasDoMes : diasDaSemana;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2 uppercase">
            <Calendar className="w-6 h-6" /> AGENDA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus compromissos e eventos</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={visao} onValueChange={v => setVisao(v as 'mensal' | 'semanal')}>
            <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => abrirNovo()} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Novo Evento
          </Button>
        </div>
      </div>

      {/* Month navigation */}
      {visao === 'mensal' && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navMes(-1)}><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="font-display text-lg font-semibold text-foreground">{MESES[mes]} {ano}</h2>
          <Button variant="ghost" size="icon" onClick={() => navMes(1)}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      )}

      {visao === 'semanal' && (
        <h2 className="font-display text-lg font-semibold text-foreground text-center">Semana Atual</h2>
      )}

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden bg-card/50">
        <div className="grid grid-cols-7">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground border-b border-border">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d, i) => {
            const evts = eventosNoDia(d.date);
            const isHoje = d.date === hojeStr;
            const isSel = d.date === diaSelecionado;
            return (
              <button
                key={i}
                onClick={() => setDiaSelecionado(d.date)}
                className={cn(
                  "min-h-[80px] p-1.5 border-b border-r border-border text-left transition-colors hover:bg-muted/30 relative",
                  !d.currentMonth && "opacity-40",
                  isSel && "bg-muted/50 ring-1 ring-accent",
                )}
              >
                <span className={cn(
                  "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium",
                  isHoje && "bg-primary text-primary-foreground font-bold",
                )}>
                  {d.day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {evts.slice(0, 3).map(e => {
                    const tipo = getTipoInfo(e.tipo_evento);
                    return (
                      <div
                        key={e.id}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate bg-card border border-border"
                        style={{ borderLeftWidth: 3, borderLeftColor: tipo.cor }}
                      >
                        <span className="font-medium text-foreground">{e.hora_inicio}</span>{' '}
                        <span className="text-muted-foreground">{e.titulo}</span>
                      </div>
                    );
                  })}
                  {evts.length > 3 && <span className="text-[10px] text-muted-foreground">+{evts.length - 3} mais</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      {diaSelecionado && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">
              Eventos em {new Date(diaSelecionado + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={() => abrirNovo(diaSelecionado)} className="gap-1">
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
          </div>
          {eventosDiaSelecionado.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento nesta data.</p>
          ) : (
            <div className="space-y-3">
              {eventosDiaSelecionado.map(e => {
                const tipo = getTipoInfo(e.tipo_evento);
                const atend = e.relacionado_a_atendimento_id ? atendimentos.find(a => a.id === e.relacionado_a_atendimento_id) : null;
                return (
                  <div
                    key={e.id}
                    className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
                    style={{ borderLeftWidth: 4, borderLeftColor: tipo.cor }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Type badge */}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-wider border-0 px-2 py-0.5"
                            style={{ backgroundColor: `${tipo.cor}18`, color: tipo.cor }}
                          >
                            {e.tipo_evento}
                          </Badge>

                          {/* Recurrence indicator */}
                          {e.recorrencia_id && (
                            <Badge variant="secondary" className="text-[9px] ml-1">
                              <Copy className="w-2.5 h-2.5 mr-0.5" /> Recorrente
                            </Badge>
                          )}

                          {/* Title */}
                          <p className="text-base font-bold leading-tight" style={{ color: '#111111' }}>{e.titulo}</p>

                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#555555' }}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{e.hora_inicio} – {e.hora_fim}</span>
                          </div>

                          {/* Location */}
                          {e.local && (
                            <p className="text-xs flex items-center gap-1.5" style={{ color: '#555555' }}>
                              <MapPin className="w-3.5 h-3.5 shrink-0" />{e.local}
                            </p>
                          )}

                          {/* Description */}
                          {e.descricao && (
                            <p className="text-xs leading-relaxed" style={{ color: '#777777' }}>{e.descricao}</p>
                          )}

                          {/* Linked atendimento */}
                          {atend && (
                            <button
                              onClick={() => navigate(`/atendimento/${atend.id}`)}
                              className="text-xs text-primary underline flex items-center gap-1 hover:opacity-80"
                            >
                              <LinkIcon className="w-3 h-3" /> Atendimento: {atend.nome_cidadao}
                            </button>
                          )}
                        </div>

                        {/* Actions - ALL events are editable */}
                        <div className="flex gap-1 shrink-0 pt-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(e)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => pedirExclusao(e)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal create/edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título do evento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo de Evento *</label>
                <Select value={form.tipo_evento} onValueChange={v => setForm(f => ({ ...f, tipo_evento: v as TipoEvento }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.cor }} />
                          <span className="text-xs">{t.value}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Local</label>
                <Input value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} placeholder="Local" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data início *</label>
                <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hora início *</label>
                <Input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data fim *</label>
                <Input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hora fim *</label>
                <Input type="time" value={form.hora_fim} onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Vincular a atendimento</label>
              <Select value={form.relacionado_a_atendimento_id || '__none__'} onValueChange={v => setForm(f => ({ ...f, relacionado_a_atendimento_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {atendimentos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome_cidadao} – {a.demanda_principal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} placeholder="Detalhes do evento..." />
            </div>

            {/* Recurrence section - only for new events */}
            {!editando && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                  <label className="text-xs font-semibold text-foreground uppercase">Copiar este evento para outras datas</label>
                </div>

                <RadioGroup value={recurrenceType} onValueChange={v => setRecurrenceType(v as RecurrenceType)} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="rec-none" />
                    <Label htmlFor="rec-none" className="text-xs">Sem repetição</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="rec-daily" />
                    <Label htmlFor="rec-daily" className="text-xs">Diária</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="rec-weekly" />
                    <Label htmlFor="rec-weekly" className="text-xs">Semanal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="rec-monthly" />
                    <Label htmlFor="rec-monthly" className="text-xs">Mensal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="rec-manual" />
                    <Label htmlFor="rec-manual" className="text-xs">Selecionar datas manualmente</Label>
                  </div>
                </RadioGroup>

                {(recurrenceType === 'daily' || recurrenceType === 'weekly' || recurrenceType === 'monthly') && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Data final da repetição *</label>
                    <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} min={form.data_inicio} />
                    {recurrenceEndDate && form.data_inicio && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {generateRecurrenceDates(form.data_inicio, recurrenceType, recurrenceEndDate).length + 1} eventos serão criados
                      </p>
                    )}
                  </div>
                )}

                {recurrenceType === 'manual' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input type="date" value={manualDateInput} onChange={e => setManualDateInput(e.target.value)} className="flex-1" />
                      <Button type="button" size="sm" variant="outline" onClick={addManualDate}>Adicionar</Button>
                    </div>
                    {manualDates.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {manualDates.map(d => (
                          <Badge key={d} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeManualDate(d)}>
                            {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">{manualDates.length + 1} eventos serão criados</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.titulo.trim() || !form.data_inicio || !form.hora_inicio || !form.hora_fim || !form.tipo_evento}>
              {editando ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group edit dialog */}
      <Dialog open={groupEditOpen} onOpenChange={setGroupEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar evento recorrente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">Este evento faz parte de um grupo de recorrência. Como deseja aplicar as alterações?</p>
            <RadioGroup value={groupEditChoice} onValueChange={v => setGroupEditChoice(v as 'single' | 'all' | 'future')} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="ge-single" />
                <Label htmlFor="ge-single" className="text-sm">Editar apenas este evento</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="ge-all" />
                <Label htmlFor="ge-all" className="text-sm">Editar todos os eventos do grupo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="ge-future" />
                <Label htmlFor="ge-future" className="text-sm">Editar apenas os eventos futuros do grupo</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupEditOpen(false)}>Cancelar</Button>
            <Button onClick={confirmarGroupEdit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja excluir o evento <strong>{deleteTarget?.titulo}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
