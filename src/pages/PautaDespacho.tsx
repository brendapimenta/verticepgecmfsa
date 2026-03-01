import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAudit } from '@/contexts/AuditContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { PautaDespacho as PautaDespachoType, CategoriaPauta, TipoRegistroPauta, StatusPauta, PrioridadePauta, VinculoTipo } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Gavel, Plus, Clock, CheckCheck, AlertTriangle, CalendarDays,
  ArrowUpDown, LayoutGrid, Filter, MessageSquare, Pause, Play
} from 'lucide-react';

const categorias: CategoriaPauta[] = ['Compras', 'RH', 'Contratos', 'Projetos de Lei', 'Acordos Políticos', 'Viagens', 'Estrutura Interna', 'Outro'];
const statusList: StatusPauta[] = ['Pendente', 'Em Reunião', 'Decidido', 'Em Execução', 'Concluído'];
const prioridadeList: PrioridadePauta[] = ['Crítica', 'Alta', 'Média', 'Baixa'];
const vinculoTipos: VinculoTipo[] = ['Contrato', 'Projeto de Lei', 'Atendimento', 'Autorização Financeira', 'Viagem', 'Outro'];

const prioridadeStyle: Record<PrioridadePauta, string> = {
  Crítica: 'bg-red-500/20 text-red-400 border-red-500/40',
  Alta: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Média: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Baixa: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const statusStyle: Record<StatusPauta, string> = {
  Pendente: 'bg-yellow-500/15 text-yellow-400',
  'Em Reunião': 'bg-blue-500/15 text-blue-400',
  Decidido: 'bg-purple-500/15 text-purple-400',
  'Em Execução': 'bg-indigo-500/15 text-indigo-400',
  Concluído: 'bg-green-500/15 text-green-400',
};

type ModoVisualizacao = 'PRIORIDADE' | 'CATEGORIA' | 'DATA / PRAZO' | 'STATUS';

const PautaDespachoPage: React.FC = () => {
  const { pautasDespacho, addPautaDespacho, updatePautaDespacho, decidirPauta, adiarPauta, pedirInfoPauta } = useData();
  const { usuario } = useAuth();
  const { registrarAuditoria } = useAudit();
  const perfilUI = usePerfilVisual();

  const [criarOpen, setCriarOpen] = useState(false);
  const [decidirOpen, setDecidirOpen] = useState<string | null>(null);
  const [adiarOpen, setAdiarOpen] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [tarefaOpen, setTarefaOpen] = useState<string | null>(null);
  const [modo, setModo] = useState<ModoVisualizacao>('PRIORIDADE');

  // Form state
  const [form, setForm] = useState({
    titulo: '', categoria: 'Compras' as CategoriaPauta, tipo_registro: 'Decisão Presidencial' as TipoRegistroPauta,
    descricao_resumida: '', contexto_para_fala: '', perguntas_para_decisao: '',
    prioridade: 'Média' as PrioridadePauta, responsavel: 'Sala Principal' as 'Sala Principal' | 'Presidente',
    prazo: '', vinculado_a_tipo: '' as string, vinculado_a_id: '',
  });
  const [decisaoTexto, setDecisaoTexto] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');
  const [comentarioInfo, setComentarioInfo] = useState('');
  const [formTarefa, setFormTarefa] = useState({
    titulo: '', descricao_resumida: '', prioridade: 'Média' as PrioridadePauta, prazo: '',
  });

  const isPresidente = perfilUI === 'presidente';
  const isBrenda = perfilUI === 'sala_principal';
  const isAdmin = perfilUI === 'administrador';

  // Filter based on profile
  const filteredPautas = useMemo(() => {
    if (isPresidente) {
      return pautasDespacho.filter(p => p.tipo_registro === 'Decisão Presidencial' && ['Pendente', 'Em Reunião'].includes(p.status));
    }
    return pautasDespacho;
  }, [pautasDespacho, isPresidente]);

  // Group/sort based on modo
  const groupedPautas = useMemo(() => {
    const sorted = [...filteredPautas];
    if (modo === 'PRIORIDADE') {
      const order: Record<PrioridadePauta, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };
      sorted.sort((a, b) => order[a.prioridade] - order[b.prioridade]);
      const groups: Record<string, PautaDespachoType[]> = {};
      sorted.forEach(p => { (groups[p.prioridade] ??= []).push(p); });
      return groups;
    }
    if (modo === 'CATEGORIA') {
      const groups: Record<string, PautaDespachoType[]> = {};
      sorted.forEach(p => { (groups[p.categoria] ??= []).push(p); });
      return groups;
    }
    if (modo === 'DATA / PRAZO') {
      sorted.sort((a, b) => {
        if (!a.prazo && !b.prazo) return 0;
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return a.prazo.localeCompare(b.prazo);
      });
      return { 'TODOS OS ITENS': sorted };
    }
    // STATUS
    const groups: Record<string, PautaDespachoType[]> = {};
    statusList.forEach(s => { const items = sorted.filter(p => p.status === s); if (items.length) groups[s] = items; });
    return groups;
  }, [filteredPautas, modo]);

  if (!usuario) return null;

  const registrar = (tipo_acao: any, descricao: string, ref_id?: string, anterior?: string, novo?: string) => {
    registrarAuditoria({
      usuario_id: usuario.id, nome_usuario: usuario.nome, perfil_usuario: usuario.perfil,
      tipo_acao, modulo: 'demandas', descricao_resumida: descricao,
      referencia_tipo: 'pauta_despacho', referencia_id: ref_id,
      valor_anterior: anterior, valor_novo: novo, nivel_sensibilidade: 'estratégico',
    });
  };

  const handleCriar = () => {
    if (!form.titulo.trim()) return;
    const perfilCriador: 'Sala Principal' | 'Presidente' = isPresidente ? 'Presidente' : 'Sala Principal';
    const isTarefa = form.tipo_registro === 'Tarefa Operacional';
    const statusInicial: StatusPauta = isTarefa ? 'Em Execução' : 'Pendente';
    const responsavelFinal = isPresidente
      ? (isTarefa ? 'Sala Principal' : 'Presidente')
      : form.responsavel;
    addPautaDespacho({
      ...form,
      responsavel: responsavelFinal,
      vinculado_a_tipo: form.vinculado_a_tipo as VinculoTipo | undefined || undefined,
      vinculado_a_id: form.vinculado_a_id || undefined,
      criado_por_id: usuario.id,
      criado_por_perfil: perfilCriador,
      status: statusInicial,
    });
    registrar('criar_pauta', `Pauta criada por ${perfilCriador}: ${form.titulo}.`);
    toast.success('Pauta criada com sucesso.');
    setCriarOpen(false);
    setForm({ titulo: '', categoria: 'Compras', tipo_registro: 'Decisão Presidencial', descricao_resumida: '', contexto_para_fala: '', perguntas_para_decisao: '', prioridade: 'Média', responsavel: 'Sala Principal', prazo: '', vinculado_a_tipo: '', vinculado_a_id: '' });
  };

  const handleDecidir = () => {
    if (!decidirOpen || !decisaoTexto.trim()) return;
    const old = pautasDespacho.find(p => p.id === decidirOpen);
    decidirPauta(decidirOpen, decisaoTexto);
    registrar('decidir_pauta', `Decisão registrada: ${old?.titulo}.`, decidirOpen, old?.status, 'Decidido');
    toast.success('Decisão registrada com sucesso.');
    setDecidirOpen(null);
    setDecisaoTexto('');
  };

  const handleAdiar = () => {
    if (!adiarOpen) return;
    const old = pautasDespacho.find(p => p.id === adiarOpen);
    adiarPauta(adiarOpen, novoPrazo);
    registrar('adiar_pauta', `Pauta adiada: ${old?.titulo}. Novo prazo: ${novoPrazo}.`, adiarOpen, old?.prazo, novoPrazo);
    toast.success('Pauta adiada.');
    setAdiarOpen(null);
    setNovoPrazo('');
  };

  const handlePedirInfo = () => {
    if (!infoOpen || !comentarioInfo.trim()) return;
    const old = pautasDespacho.find(p => p.id === infoOpen);
    pedirInfoPauta(infoOpen, comentarioInfo);
    registrar('pedir_info_pauta', `Info solicitada: ${old?.titulo}.`, infoOpen);
    toast.success('Solicitação de informações enviada para Sala Principal.');
    setInfoOpen(null);
    setComentarioInfo('');
  };

  const handleCriarTarefa = () => {
    if (!tarefaOpen || !formTarefa.titulo.trim()) return;
    const pautaOrigem = pautasDespacho.find(p => p.id === tarefaOpen);
    addPautaDespacho({
      titulo: formTarefa.titulo, categoria: pautaOrigem?.categoria || 'Outro',
      tipo_registro: 'Tarefa Operacional', descricao_resumida: formTarefa.descricao_resumida,
      contexto_para_fala: '', perguntas_para_decisao: '',
      status: 'Em Execução', prioridade: formTarefa.prioridade, responsavel: 'Sala Principal',
      prazo: formTarefa.prazo || undefined, criado_por_id: usuario.id, criado_por_perfil: 'Sala Principal',
      vinculado_a_tipo: pautaOrigem?.vinculado_a_tipo, vinculado_a_id: pautaOrigem?.vinculado_a_id,
    });
    registrar('criar_tarefa_operacional', `Tarefa operacional criada: ${formTarefa.titulo} (vinculada a "${pautaOrigem?.titulo}").`, tarefaOpen);
    toast.success('Tarefa operacional criada.');
    setTarefaOpen(null);
    setFormTarefa({ titulo: '', descricao_resumida: '', prioridade: 'Média', prazo: '' });
  };

  const handleStatusChange = (id: string, newStatus: StatusPauta) => {
    const old = pautasDespacho.find(p => p.id === id);
    updatePautaDespacho(id, { status: newStatus });
    registrar('alterar_status_pauta', `Status da pauta "${old?.titulo}" alterado.`, id, old?.status, newStatus);
    toast.success(`Status alterado para ${newStatus}.`);
  };

  // Brenda sections
  const aguardandoDecisao = pautasDespacho.filter(p => p.tipo_registro === 'Decisão Presidencial' && ['Pendente', 'Em Reunião'].includes(p.status));
  const emExecucao = pautasDespacho.filter(p => p.tipo_registro === 'Tarefa Operacional' && p.status === 'Em Execução');
  const concluidos = pautasDespacho.filter(p => p.status === 'Concluído');

  const renderCard = (p: PautaDespachoType) => (
    <div key={p.id} className="bg-card rounded-xl border border-border p-5 space-y-3 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground uppercase text-sm">{p.titulo}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge variant="outline" className="text-[10px]">{p.categoria}</Badge>
            <Badge className={cn('text-[10px] border', prioridadeStyle[p.prioridade])}>{p.prioridade}</Badge>
            <Badge className={cn('text-[10px]', statusStyle[p.status])}>{p.status}</Badge>
            <Badge variant="outline" className="text-[10px]">{p.tipo_registro}</Badge>
          </div>
        </div>
        {p.prazo && (() => {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const prazoDate = new Date(p.prazo + 'T00:00:00');
          const diffDays = Math.ceil((prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          const isVencido = diffDays < 0;
          const isProximo = diffDays >= 0 && diffDays <= 3;
          const badgeClass = isVencido
            ? 'bg-red-500/20 text-red-400 border-red-500/40'
            : isProximo
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
              : 'bg-muted text-muted-foreground';
          return (
            <Badge variant="outline" className={cn('text-[10px] shrink-0 gap-1 border', badgeClass)}>
              <CalendarDays className="w-3 h-3" />
              {isVencido ? 'VENCIDO – ' : isProximo ? 'PRÓXIMO – ' : ''}
              {prazoDate.toLocaleDateString('pt-BR')}
            </Badge>
          );
        })()}
      </div>

      {p.descricao_resumida && (
        <p className="text-xs text-muted-foreground">{p.descricao_resumida}</p>
      )}

      {(isPresidente || isAdmin) && p.tipo_registro === 'Decisão Presidencial' && ['Pendente', 'Em Reunião'].includes(p.status) && (
        <>
          {p.contexto_para_fala && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">CONTEXTO PARA FALA</p>
              <p className="text-xs text-foreground">{p.contexto_para_fala}</p>
            </div>
          )}
          {p.perguntas_para_decisao && (
            <div className="bg-primary/5 rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">PERGUNTAS PARA DECISÃO</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{p.perguntas_para_decisao}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => { setDecidirOpen(p.id); setDecisaoTexto(''); }} className="text-xs gap-1">
              <CheckCheck className="w-3 h-3" /> DECIDIR AGORA
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setAdiarOpen(p.id); setNovoPrazo(''); }} className="text-xs gap-1">
              <Pause className="w-3 h-3" /> ADIAR
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setInfoOpen(p.id); setComentarioInfo(''); }} className="text-xs gap-1">
              <MessageSquare className="w-3 h-3" /> PEDIR MAIS INFORMAÇÕES
            </Button>
          </div>
        </>
      )}

      {p.decisao_registrada && (
        <div className="bg-green-500/10 rounded-lg p-3 space-y-1">
          <p className="text-[10px] font-semibold text-green-400 uppercase">DECISÃO REGISTRADA</p>
          <p className="text-xs text-foreground">{p.decisao_registrada}</p>
        </div>
      )}

      {p.comentario_presidente && (
        <div className="bg-amber-500/10 rounded-lg p-3 space-y-1">
          <p className="text-[10px] font-semibold text-amber-400 uppercase">COMENTÁRIO DO PRESIDENTE</p>
          <p className="text-xs text-foreground">{p.comentario_presidente}</p>
        </div>
      )}

      {/* Brenda actions */}
      {(isBrenda || isAdmin) && p.status === 'Decidido' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => { setTarefaOpen(p.id); setFormTarefa({ titulo: '', descricao_resumida: '', prioridade: 'Média', prazo: '' }); }} className="text-xs gap-1">
            <Plus className="w-3 h-3" /> CRIAR TAREFA OPERACIONAL
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStatusChange(p.id, 'Concluído')} className="text-xs gap-1">
            <CheckCheck className="w-3 h-3" /> CONCLUIR
          </Button>
        </div>
      )}

      {(isBrenda || isAdmin) && p.tipo_registro === 'Tarefa Operacional' && p.status === 'Em Execução' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => handleStatusChange(p.id, 'Concluído')} className="text-xs gap-1">
            <CheckCheck className="w-3 h-3" /> CONCLUIR TAREFA
          </Button>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground uppercase">
        CRIADO POR: {p.criado_por_perfil} — {new Date(p.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2 uppercase">
            <Gavel className="w-6 h-6 text-primary" />
            PAUTA PARA DESPACHO DO PRESIDENTE
          </h1>
          <p className="text-sm text-muted-foreground mt-1 uppercase">DECISÕES E ENCAMINHAMENTOS ESTRATÉGICOS</p>
          <p className="text-xs text-muted-foreground mt-0.5">Organização das pautas que dependem de decisão do Presidente e das tarefas decorrentes.</p>
        </div>
        {(isBrenda || isAdmin || isPresidente) && (
          <Button onClick={() => setCriarOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> NOVA PAUTA
          </Button>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5" /> ORGANIZAR POR:
        </span>
        {(['PRIORIDADE', 'CATEGORIA', 'DATA / PRAZO', 'STATUS'] as ModoVisualizacao[]).map(m => (
          <Button key={m} size="sm" variant={modo === m ? 'default' : 'outline'} onClick={() => setModo(m)} className="text-xs">
            {m}
          </Button>
        ))}
      </div>

      {/* Brenda sectioned view */}
      {(isBrenda || isAdmin) && (
        <div className="space-y-8">
          {/* Seção vermelha */}
          <section>
            <h2 className="text-sm font-bold text-foreground uppercase flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-red-500" /> AGUARDANDO DECISÃO ({aguardandoDecisao.length})
            </h2>
            {aguardandoDecisao.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-5">Nenhuma pauta aguardando decisão.</p>
            ) : (
              <div className="grid gap-3">{aguardandoDecisao.map(renderCard)}</div>
            )}
          </section>

          {/* Seção amarela */}
          <section>
            <h2 className="text-sm font-bold text-foreground uppercase flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-yellow-500" /> EM EXECUÇÃO – TAREFAS ({emExecucao.length})
            </h2>
            {emExecucao.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-5">Nenhuma tarefa em execução.</p>
            ) : (
              <div className="grid gap-3">{emExecucao.map(renderCard)}</div>
            )}
          </section>

          {/* Seção verde */}
          <section>
            <h2 className="text-sm font-bold text-foreground uppercase flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-green-500" /> CONCLUÍDOS ({concluidos.length})
            </h2>
            {concluidos.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-5">Nenhum item concluído.</p>
            ) : (
              <div className="grid gap-3">{concluidos.map(renderCard)}</div>
            )}
          </section>
        </div>
      )}

      {/* Presidente view – grouped */}
      {isPresidente && (
        <div className="space-y-6">
          {Object.entries(groupedPautas).map(([group, items]) => (
            <section key={group}>
              <h2 className="text-sm font-bold text-foreground uppercase mb-3">{group} ({items.length})</h2>
              <div className="grid gap-3">{items.map(renderCard)}</div>
            </section>
          ))}
          {filteredPautas.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma pauta pendente de decisão.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Criar Pauta */}
      <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">NOVA PAUTA PARA DESPACHO</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">TÍTULO</label>
              <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Título da pauta" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">CATEGORIA</label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v as CategoriaPauta })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">TIPO DE REGISTRO</label>
                <Select value={form.tipo_registro} onValueChange={v => setForm({ ...form, tipo_registro: v as TipoRegistroPauta })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Decisão Presidencial">Decisão Presidencial</SelectItem>
                    <SelectItem value="Tarefa Operacional">Tarefa Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">PRIORIDADE</label>
                <Select value={form.prioridade} onValueChange={v => setForm({ ...form, prioridade: v as PrioridadePauta })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{prioridadeList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">PRAZO</label>
                <Input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">DESCRIÇÃO RESUMIDA</label>
              <Textarea value={form.descricao_resumida} onChange={e => setForm({ ...form, descricao_resumida: e.target.value })} rows={2} placeholder="Resumo em 2-3 linhas do tema" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">CONTEXTO PARA FALA</label>
              <Textarea value={form.contexto_para_fala} onChange={e => setForm({ ...form, contexto_para_fala: e.target.value })} rows={2} placeholder="Texto que Sala Principal usa para explicar rapidamente a situação" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">PERGUNTAS PARA DECISÃO</label>
              <Textarea value={form.perguntas_para_decisao} onChange={e => setForm({ ...form, perguntas_para_decisao: e.target.value })} rows={3} placeholder="Perguntas objetivas a serem respondidas pelo Presidente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">VINCULADO A (TIPO)</label>
                <Select value={form.vinculado_a_tipo || '_none'} onValueChange={v => setForm({ ...form, vinculado_a_tipo: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {vinculoTipos.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">ID DO VÍNCULO</label>
                <Input value={form.vinculado_a_id} onChange={e => setForm({ ...form, vinculado_a_id: e.target.value })} placeholder="ID (opcional)" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCriarOpen(false)}>CANCELAR</Button>
            <Button onClick={handleCriar} disabled={!form.titulo.trim()}>CRIAR PAUTA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decidir */}
      <Dialog open={!!decidirOpen} onOpenChange={o => !o && setDecidirOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="uppercase">REGISTRAR DECISÃO</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">DECISÃO REGISTRADA</label>
            <Textarea value={decisaoTexto} onChange={e => setDecisaoTexto(e.target.value)} rows={4} placeholder="Descreva a decisão objetivamente..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecidirOpen(null)}>CANCELAR</Button>
            <Button onClick={handleDecidir} disabled={!decisaoTexto.trim()}>CONFIRMAR DECISÃO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adiar */}
      <Dialog open={!!adiarOpen} onOpenChange={o => !o && setAdiarOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="uppercase">ADIAR PAUTA</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">NOVO PRAZO</label>
            <Input type="date" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdiarOpen(null)}>CANCELAR</Button>
            <Button onClick={handleAdiar} disabled={!novoPrazo}>CONFIRMAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pedir Info */}
      <Dialog open={!!infoOpen} onOpenChange={o => !o && setInfoOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="uppercase">PEDIR MAIS INFORMAÇÕES</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">COMENTÁRIO</label>
            <Textarea value={comentarioInfo} onChange={e => setComentarioInfo(e.target.value)} rows={3} placeholder="O que precisa ser esclarecido?" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(null)}>CANCELAR</Button>
            <Button onClick={handlePedirInfo} disabled={!comentarioInfo.trim()}>ENVIAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Criar Tarefa Operacional */}
      <Dialog open={!!tarefaOpen} onOpenChange={o => !o && setTarefaOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="uppercase">NOVA TAREFA OPERACIONAL</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">TÍTULO DA TAREFA</label>
              <Input value={formTarefa.titulo} onChange={e => setFormTarefa({ ...formTarefa, titulo: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">DESCRIÇÃO</label>
              <Textarea value={formTarefa.descricao_resumida} onChange={e => setFormTarefa({ ...formTarefa, descricao_resumida: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">PRIORIDADE</label>
                <Select value={formTarefa.prioridade} onValueChange={v => setFormTarefa({ ...formTarefa, prioridade: v as PrioridadePauta })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{prioridadeList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">PRAZO</label>
                <Input type="date" value={formTarefa.prazo} onChange={e => setFormTarefa({ ...formTarefa, prazo: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarefaOpen(null)}>CANCELAR</Button>
            <Button onClick={handleCriarTarefa} disabled={!formTarefa.titulo.trim()}>CRIAR TAREFA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PautaDespachoPage;
