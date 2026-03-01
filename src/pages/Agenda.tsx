import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { EventoAgenda, TipoEvento } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MapPin, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast as sonnerToast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const tipoEventoCores: Record<TipoEvento, string> = {
  Atendimento: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Reunião: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Sessão: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Viagem: 'bg-green-500/20 text-green-400 border-green-500/30',
  Outro: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const emptyForm = {
  titulo: '', descricao: '', tipo_evento: 'Reunião' as TipoEvento, local: '',
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

  // ---- Calendar helpers ----
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();

  const diasDoMes = useMemo(() => {
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes + 1, 0);
    const dias: { date: string; day: number; currentMonth: boolean }[] = [];
    // Fill leading days
    for (let i = 0; i < primeiro.getDay(); i++) {
      const d = new Date(ano, mes, -primeiro.getDay() + i + 1);
      dias.push({ date: d.toISOString().split('T')[0], day: d.getDate(), currentMonth: false });
    }
    for (let d = 1; d <= ultimo.getDate(); d++) {
      const dt = new Date(ano, mes, d);
      dias.push({ date: dt.toISOString().split('T')[0], day: d, currentMonth: true });
    }
    // Fill trailing
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

  const eventosNoDia = (date: string) => eventosAgenda.filter(e => e.data_inicio === date).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  const eventosDiaSelecionado = diaSelecionado ? eventosNoDia(diaSelecionado) : [];

  // ---- CRUD ----
  const perfilCriador = perfilUI === 'presidente' || perfilUI === 'administrador' ? 'Presidente' : 'Brenda';

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Agenda
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
      <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'rgba(7,27,52,0.5)' }}>
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
                  {evts.slice(0, 3).map(e => (
                    <div key={e.id} className={cn("text-[10px] px-1 py-0.5 rounded border truncate", tipoEventoCores[e.tipo_evento])}>
                      {e.hora_inicio} {e.titulo}
                    </div>
                  ))}
                  {evts.length > 3 && <span className="text-[10px] text-muted-foreground">+{evts.length - 3} mais</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      {diaSelecionado && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">
              Eventos em {new Date(diaSelecionado + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={() => abrirNovo(diaSelecionado)} className="gap-1">
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
          </div>
          {eventosDiaSelecionado.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento nesta data.</p>
          ) : (
            <div className="space-y-2">
              {eventosDiaSelecionado.map(e => {
                const atend = e.relacionado_a_atendimento_id ? atendimentos.find(a => a.id === e.relacionado_a_atendimento_id) : null;
                return (
                  <div key={e.id} className={cn("p-3 rounded-lg border", tipoEventoCores[e.tipo_evento])}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{e.hora_inicio} – {e.hora_fim}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-background/30">{e.tipo_evento}</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{e.titulo}</p>
                        {e.local && <p className="text-xs mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.local}</p>}
                        {e.descricao && <p className="text-xs mt-1 opacity-80">{e.descricao}</p>}
                        {atend && (
                          <button onClick={() => navigate(`/atendimento/${atend.id}`)} className="text-xs mt-1 underline flex items-center gap-1 hover:opacity-80">
                            <LinkIcon className="w-3 h-3" /> Atendimento: {atend.nome_cidadao}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditar(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => excluir(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título do evento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
                <Select value={form.tipo_evento} onValueChange={v => setForm(f => ({ ...f, tipo_evento: v as TipoEvento }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Atendimento', 'Reunião', 'Sessão', 'Viagem', 'Outro'] as TipoEvento[]).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
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
