import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { EventoAgenda, CategoriaEvento } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MapPin, Link as LinkIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast as sonnerToast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CATEGORIAS_EVENTO: { value: CategoriaEvento; label: string; cor: string }[] = [
  { value: 'AGENDA – PRESIDÊNCIA', label: 'AGENDA – PRESIDÊNCIA', cor: '#1E7D5C' },
  { value: 'AGENDA – GABINETE', label: 'AGENDA – GABINETE', cor: '#1E4E8C' },
  { value: 'ENTREVISTAS', label: 'ENTREVISTAS', cor: '#B3261E' },
  { value: 'EVENTOS – PREFEITURA', label: 'EVENTOS – PREFEITURA', cor: '#1F6F8B' },
  { value: 'CONGRESSOS', label: 'CONGRESSOS', cor: '#5B3F8C' },
  { value: 'SESSÕES', label: 'SESSÕES', cor: '#111111' },
  { value: 'PESSOAL', label: 'PESSOAL', cor: '#C04B73' },
  { value: 'ANIVERSÁRIOS', label: 'ANIVERSÁRIOS', cor: '#C7A028' },
  { value: 'AUDIÊNCIAS PÚBLICAS', label: 'AUDIÊNCIAS PÚBLICAS', cor: '#6B4F3B' },
];

const getCategoriaInfo = (cat: string) =>
  CATEGORIAS_EVENTO.find(c => c.value === cat) || { value: cat, label: cat, cor: '#6B7280' };

const emptyForm = {
  titulo: '', descricao: '', tipo_evento: 'AGENDA – PRESIDÊNCIA' as CategoriaEvento, local: '',
  data_inicio: '', hora_inicio: '', data_fim: '', hora_fim: '',
  relacionado_a_atendimento_id: '',
};

const Agenda: React.FC = () => {
  const { eventosAgenda, addEventoAgenda, updateEventoAgenda, deleteEventoAgenda, atendimentos } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const navigate = useNavigate();

  const [visao, setVisao] = useState<'mensal' | 'semanal'>('mensal');
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<EventoAgenda | null>(null);
  const [form, setForm] = useState(emptyForm);

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
    setModalOpen(true);
  };

  const abrirEditar = (e: EventoAgenda) => {
    setEditando(e);
    setForm({
      titulo: e.titulo, descricao: e.descricao || '', tipo_evento: e.tipo_evento,
      local: e.local || '', data_inicio: e.data_inicio, hora_inicio: e.hora_inicio,
      data_fim: e.data_fim, hora_fim: e.hora_fim,
      relacionado_a_atendimento_id: e.relacionado_a_atendimento_id || '',
    });
    setModalOpen(true);
  };

  const salvar = () => {
    if (!form.titulo.trim() || !form.data_inicio || !form.hora_inicio || !form.hora_fim || !usuario) return;
    if (editando) {
      updateEventoAgenda(editando.id, { ...form, descricao: form.descricao || undefined, local: form.local || undefined, relacionado_a_atendimento_id: form.relacionado_a_atendimento_id || undefined });
      sonnerToast.success('Evento atualizado.');
    } else {
      addEventoAgenda({ ...form, descricao: form.descricao || undefined, local: form.local || undefined, relacionado_a_atendimento_id: form.relacionado_a_atendimento_id || undefined, criado_por_id: usuario.id, criado_por_perfil: perfilCriador });
      sonnerToast.success('Evento criado.');
    }
    setModalOpen(false);
  };

  const excluir = (id: string) => {
    deleteEventoAgenda(id);
    sonnerToast.success('Evento excluído.');
  };

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
                    const cat = getCategoriaInfo(e.tipo_evento);
                    return (
                      <div
                        key={e.id}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate bg-card border border-border"
                        style={{ borderLeftWidth: 3, borderLeftColor: cat.cor }}
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
                const cat = getCategoriaInfo(e.tipo_evento);
                const atend = e.relacionado_a_atendimento_id ? atendimentos.find(a => a.id === e.relacionado_a_atendimento_id) : null;
                return (
                  <div
                    key={e.id}
                    className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
                    style={{ borderLeftWidth: 4, borderLeftColor: cat.cor }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Category badge */}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-wider border-0 px-2 py-0.5"
                            style={{ backgroundColor: `${cat.cor}18`, color: cat.cor }}
                          >
                            {cat.label}
                          </Badge>

                          {/* Title */}
                          <p className="text-base font-bold text-foreground leading-tight">{e.titulo}</p>

                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{e.hora_inicio} – {e.hora_fim}</span>
                          </div>

                          {/* Location */}
                          {e.local && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />{e.local}
                            </p>
                          )}

                          {/* Description */}
                          {e.descricao && (
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">{e.descricao}</p>
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

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0 pt-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(e)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => excluir(e.id)}>
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
        <DialogContent className="sm:max-w-lg">
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
                <label className="text-xs font-medium text-muted-foreground">Categoria *</label>
                <Select value={form.tipo_evento} onValueChange={v => setForm(f => ({ ...f, tipo_evento: v as CategoriaEvento }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_EVENTO.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                          <span className="text-xs">{c.label}</span>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.titulo.trim() || !form.data_inicio || !form.hora_inicio || !form.hora_fim}>
              {editando ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
