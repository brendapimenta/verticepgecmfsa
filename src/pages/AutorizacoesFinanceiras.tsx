import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { AutorizacaoFinanceira } from '@/types';
import { Plus, CheckCircle, Clock, DollarSign, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const AutorizacoesFinanceiras: React.FC = () => {
  const { autorizacoes, addAutorizacao, concluirAutorizacao, updateAutorizacao } = useData();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();

  const canCreate = perfilUI === 'brenda' || perfilUI === 'administrador';
  const canConcluir = perfilUI === 'brenda' || perfilUI === 'presidente' || perfilUI === 'administrador';
  const canEdit = perfilUI === 'brenda' || perfilUI === 'administrador';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [concluirId, setConcluirId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  const pendentes = autorizacoes.filter(a => a.status === 'Pendente');
  const concluidas = autorizacoes.filter(a => a.status === 'Concluída');

  const handleCriar = () => {
    if (!titulo.trim() || !descricao.trim() || !usuario) return;
    addAutorizacao({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      valor: valor ? parseFloat(valor) : undefined,
      status: 'Pendente',
      criado_por_id: usuario.id,
      criado_por_perfil: 'Brenda',
    });
    resetForm();
  };

  const handleEditar = () => {
    if (!editId || !titulo.trim() || !descricao.trim()) return;
    updateAutorizacao(editId, {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      valor: valor ? parseFloat(valor) : undefined,
    });
    resetForm();
  };

  const handleConcluir = () => {
    if (!concluirId || !usuario) return;
    const perfil = perfilUI === 'presidente' ? 'Presidente' : 'Brenda';
    concluirAutorizacao(concluirId, usuario.id, perfil as 'Presidente' | 'Brenda');
    setConcluirId(null);
  };

  const openEdit = (a: AutorizacaoFinanceira) => {
    setEditId(a.id);
    setTitulo(a.titulo);
    setDescricao(a.descricao);
    setValor(a.valor ? String(a.valor) : '');
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTitulo(''); setDescricao(''); setValor(''); setEditId(null); setDialogOpen(false);
  };

  const CardAutorizacao = ({ a }: { a: AutorizacaoFinanceira }) => {
    const isPendente = a.status === 'Pendente';
    return (
      <div className={cn(
        "bg-card rounded-lg border p-4 border-l-4 transition-all",
        isPendente ? "border-l-red-500/70" : "border-l-green-500/70"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground">{a.titulo}</h3>
              <Badge className={cn(
                "text-[10px] font-bold",
                isPendente ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"
              )}>
                {isPendente ? <Clock className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                {a.status}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                Alta
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{a.descricao}</p>
            {a.valor !== undefined && (
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                R$ {a.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <span>Criado em {new Date(a.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              {a.resolvido_em && (
                <span className="text-green-400">
                  Concluído em {new Date(a.resolvido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {a.concluido_por_perfil && ` por ${a.concluido_por_perfil}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && isPendente && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(a)}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {canConcluir && isPendente && (
              <Button
                size="sm" variant="outline"
                className="h-8 text-xs gap-1 border-green-500/30 text-green-400 hover:bg-green-500/15 hover:text-green-300"
                onClick={() => setConcluirId(a.id)}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Concluir
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Autorizações Financeiras</h1>
          <p className="text-sm text-muted-foreground mt-1">{pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={v => { if (!v) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Nova Autorização</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editId ? 'Editar Autorização' : 'Nova Autorização Financeira'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da autorização" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição *</label>
                  <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva a autorização..." rows={3} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor (R$) – opcional</label>
                  <Input type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={editId ? handleEditar : handleCriar} disabled={!titulo.trim() || !descricao.trim()}>
                  {editId ? 'Salvar' : 'Criar Autorização'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pendentes */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-400" /> Pendentes ({pendentes.length})
        </h2>
        {pendentes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground/50 text-sm">Nenhuma autorização pendente</div>
        )}
        {pendentes.map(a => <CardAutorizacao key={a.id} a={a} />)}
      </div>

      {/* Concluídas */}
      {concluidas.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" /> Concluídas ({concluidas.length})
          </h2>
          <div className="opacity-60 space-y-2">
            {concluidas.map(a => <CardAutorizacao key={a.id} a={a} />)}
          </div>
        </div>
      )}

      <AlertDialog open={!!concluirId} onOpenChange={open => !open && setConcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar conclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza de que deseja marcar esta autorização financeira como CONCLUÍDA?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcluir}>Sim, concluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AutorizacoesFinanceiras;
