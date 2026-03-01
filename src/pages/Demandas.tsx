import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { Demanda, Prioridade, StatusDemanda } from '@/types';
import { Plus, Filter, List, Columns3, Clock, AlertTriangle, CheckCircle, Loader2, LinkIcon, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const prioridadeBadge: Record<Prioridade, string> = {
  Alta: 'bg-red-500/15 text-red-400 border-red-500/30',
  Média: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Baixa: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const statusConfig: Record<StatusDemanda, { icon: React.ElementType; color: string; bg: string }> = {
  Pendente: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Em andamento': { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  Concluída: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

const Demandas: React.FC = () => {
  const { demandas, addDemanda, updateDemandaGlobalStatus, atendimentos } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();

  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('todas');
  const [filterVinculo, setFilterVinculo] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [destinoPerfil, setDestinoPerfil] = useState<'Brenda' | 'Sala de Espera'>('Brenda');
  const [prioridade, setPrioridade] = useState<Prioridade>('Média');
  const [prazo, setPrazo] = useState('');
  const [atendimentoId, setAtendimentoId] = useState('');

  const origemLabel = perfilUI === 'presidente' ? 'Presidente' : perfilUI === 'brenda' ? 'Brenda' : 'Sala de Espera';

  // Presidente can't send to himself, only Brenda/Sala de Espera
  const destinoOptions = perfilUI === 'presidente'
    ? [{ value: 'Brenda', label: 'Brenda' }, { value: 'Sala de Espera', label: 'Sala de Espera' }]
    : perfilUI === 'brenda'
    ? [{ value: 'Sala de Espera', label: 'Sala de Espera' }]
    : [{ value: 'Brenda', label: 'Brenda' }];

  const canChangeStatus = perfilUI === 'brenda' || perfilUI === 'sala_espera' || perfilUI === 'administrador';

  const filtered = useMemo(() => {
    return demandas.filter(d => {
      if (filterStatus !== 'todos' && d.status !== filterStatus) return false;
      if (filterPrioridade !== 'todas' && d.prioridade !== filterPrioridade) return false;
      if (filterVinculo === 'vinculada' && !d.atendimento_id) return false;
      if (filterVinculo === 'sem_vinculo' && d.atendimento_id) return false;
      return true;
    });
  }, [demandas, filterStatus, filterPrioridade, filterVinculo]);

  const handleCriar = () => {
    if (!titulo.trim() || !descricao.trim() || !usuario) return;
    addDemanda({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      origem_perfil: origemLabel as Demanda['origem_perfil'],
      destino_perfil: destinoPerfil,
      atendimento_id: atendimentoId || undefined,
      prioridade,
      status: 'Pendente',
      prazo: prazo || undefined,
      criado_por_id: usuario.id,
    });
    setTitulo(''); setDescricao(''); setPrazo(''); setAtendimentoId('');
    setPrioridade('Média'); setDestinoPerfil(destinoOptions[0].value as 'Brenda' | 'Sala de Espera');
    setDialogOpen(false);
  };

  const kanbanColumns: StatusDemanda[] = ['Pendente', 'Em andamento', 'Concluída'];

  const DemandaCard = ({ d }: { d: Demanda }) => {
    const atend = d.atendimento_id ? atendimentos.find(a => a.id === d.atendimento_id) : null;
    const cfg = statusConfig[d.status];
    return (
      <div className="bg-card rounded-lg border p-4 space-y-3 transition-all hover:border-muted-foreground/30">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground leading-tight">{d.titulo}</h3>
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0", prioridadeBadge[d.prioridade])}>
            {d.prioridade === 'Alta' && <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />}
            {d.prioridade}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{d.descricao}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
          <span>De: <strong className="text-foreground/80">{d.origem_perfil}</strong></span>
          <span>→</span>
          <span>Para: <strong className="text-foreground/80">{d.destino_perfil}</strong></span>
        </div>
        {atend && (
          <div className="flex items-center gap-1 text-[11px] text-accent">
            <LinkIcon className="w-3 h-3" />
            <span>{atend.nome_cidadao}</span>
          </div>
        )}
        {d.prazo && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{new Date(d.prazo).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">
            {new Date(d.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
          {canChangeStatus && d.status !== 'Concluída' && (
            <Select value={d.status} onValueChange={v => updateDemandaGlobalStatus(d.id, v as StatusDemanda)}>
              <SelectTrigger className="w-32 h-7 text-[11px]"><SelectValue /></SelectTrigger>
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
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Demandas</h1>
          <p className="text-sm text-muted-foreground mt-1">{demandas.length} demandas cadastradas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <Columns3 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", viewMode === 'lista' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Lista
            </button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Nova Demanda</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Demanda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da demanda" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição *</label>
                  <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva a demanda..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Destino</label>
                    <Select value={destinoPerfil} onValueChange={v => setDestinoPerfil(v as 'Brenda' | 'Sala de Espera')}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {destinoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridade</label>
                    <Select value={prioridade} onValueChange={v => setPrioridade(v as Prioridade)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Prazo (opcional)</label>
                    <Input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Vincular atendimento</label>
                    <Select value={atendimentoId || '_none'} onValueChange={v => setAtendimentoId(v === '_none' ? '' : v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhum</SelectItem>
                        {atendimentos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_cidadao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCriar} disabled={!titulo.trim() || !descricao.trim()}>Criar Demanda</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Em andamento">Em andamento</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Prioridades</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterVinculo} onValueChange={setFilterVinculo}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="vinculada">Com atendimento</SelectItem>
            <SelectItem value="sem_vinculo">Sem atendimento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map(status => {
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            const items = filtered.filter(d => d.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", cfg.bg)}>
                  <Icon className={cn("w-4 h-4", cfg.color, status === 'Em andamento' && 'animate-spin')} />
                  <h3 className={cn("text-sm font-semibold", cfg.color)}>{status}</h3>
                  <Badge variant="outline" className="ml-auto text-[10px]">{items.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {items.map(d => <DemandaCard key={d.id} d={d} />)}
                  {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground/50 text-xs">Nenhuma demanda</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'lista' && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Nenhuma demanda encontrada</div>
          )}
          {filtered.map(d => <DemandaCard key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );
};

export default Demandas;
