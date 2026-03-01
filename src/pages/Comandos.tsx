import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { useAudit } from '@/contexts/AuditContext';
import { TipoChamada, StatusComando, StatusSolicitacao } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Send, Clock, CheckCircle, Loader2, ClipboardList, UserCheck, XCircle } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

const chamadas: { tipo: TipoChamada; label: string }[] = [
  { tipo: 'Diretor Geral', label: 'CHAMAR DIRETOR GERAL' },
  { tipo: 'Procurador Geral', label: 'CHAMAR PROCURADOR GERAL' },
  { tipo: 'Guarda Municipal', label: 'CHAMAR GUARDA MUNICIPAL' },
  { tipo: 'ASCOM', label: 'CHAMAR ASCOM' },
];

const statusIcon: Record<StatusComando, React.ReactNode> = {
  Pendente: <Clock className="w-3.5 h-3.5 text-yellow-600" />,
  'Em andamento': <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
  Concluído: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
};

const statusStyle: Record<StatusComando, string> = {
  Pendente: 'bg-yellow-500/15 text-yellow-300',
  'Em andamento': 'bg-blue-500/15 text-blue-400',
  Concluído: 'bg-green-500/15 text-green-400',
};

const solicitacaoStatusStyle: Record<StatusSolicitacao, string> = {
  Pendente: 'bg-yellow-500/15 text-yellow-300',
  'Em andamento': 'bg-blue-500/15 text-blue-400',
  Concluída: 'bg-green-500/15 text-green-400',
};

const Comandos: React.FC = () => {
  const { comandos, addComando, updateComandoStatus, solicitacoes, addSolicitacao, updateSolicitacaoStatus, atendimentos, chamarSalaPrincipal, solicitarEncerramento } = useData();
  const { usuario } = useAuth();
  const perfil = usePerfilVisual();
  const { registrarAuditoria } = useAudit();
  const [outroTexto, setOutroTexto] = useState('');
  const [solicitacaoTexto, setSolicitacaoTexto] = useState('');

  if (!usuario) return null;

  const canSend = perfil === 'presidente' || perfil === 'sala_principal' || perfil === 'administrador';

  const origemPerfil = perfil === 'presidente' ? 'Presidente' as const : 'Sala Principal' as const;
  const destinoPerfil = perfil === 'presidente' ? 'Sala Principal' as const : 'Sala de Espera' as const;
  const destinoLabel = perfil === 'presidente' ? 'Sala Principal' : 'Sala de Espera';

  const enviarComando = (tipo: TipoChamada, descricao?: string) => {
    addComando({
      origem_perfil: origemPerfil, destino_perfil: destinoPerfil,
      tipo_chamada: tipo, descricao_customizada: descricao,
      status: 'Pendente', criado_por_id: usuario.id, criado_por_nome: usuario.nome,
    });
    registrarAuditoria({
      usuario_id: usuario.id, nome_usuario: usuario.nome, perfil_usuario: usuario.perfil,
      tipo_acao: 'comando_rapido', modulo: 'comandos',
      descricao_resumida: `Comando enviado: ${tipo === 'Outro' ? descricao : tipo} → ${destinoPerfil}.`,
    });
    sonnerToast.success(`${tipo} - enviado para ${destinoPerfil}`);
    if (tipo === 'Outro') setOutroTexto('');
  };

  const enviarSolicitacao = () => {
    if (!solicitacaoTexto.trim()) return;
    addSolicitacao({
      origem_perfil: origemPerfil, destino_perfil: destinoPerfil,
      descricao_solicitacao: solicitacaoTexto, status: 'Pendente', criado_por_id: usuario.id,
    });
    registrarAuditoria({
      usuario_id: usuario.id, nome_usuario: usuario.nome, perfil_usuario: usuario.perfil,
      tipo_acao: 'criar_solicitacao', modulo: 'solicitações',
      descricao_resumida: `Solicitação enviada para ${destinoLabel}: ${solicitacaoTexto}.`,
    });
    sonnerToast.success(`Solicitação enviada para ${destinoLabel}`);
    setSolicitacaoTexto('');
  };

  const recebidos = comandos.filter(c => {
    if (perfil === 'sala_principal') return c.destino_perfil === 'Sala Principal';
    if (perfil === 'sala_espera') return c.destino_perfil === 'Sala de Espera';
    if (perfil === 'administrador') return true;
    return false;
  });

  const solicitacoesRecebidas = solicitacoes.filter(s => {
    if (perfil === 'sala_principal') return s.destino_perfil === 'Sala Principal';
    if (perfil === 'sala_espera') return s.destino_perfil === 'Sala de Espera';
    if (perfil === 'administrador') return true;
    return false;
  });

  const enviados = comandos.filter(c => c.criado_por_id === usuario.id);
  const canRespond = perfil === 'sala_principal' || perfil === 'sala_espera' || perfil === 'administrador';

  const isPresidente = perfil === 'presidente' || perfil === 'administrador';
  const atendimentoEmAndamento = atendimentos.find(a => a.status === 'Em Atendimento');

  const handleChamarSalaPrincipal = () => {
    chamarSalaPrincipal(usuario.id);
    registrarAuditoria({
      usuario_id: usuario.id, nome_usuario: usuario.nome, perfil_usuario: usuario.perfil,
      tipo_acao: 'chamar_sala_principal', modulo: 'comandos',
      descricao_resumida: 'Presidente solicitou presença da Sala Principal.',
    });
    sonnerToast.success('Sala Principal foi chamada.');
  };

  const handleSolicitarEncerramento = () => {
    if (!atendimentoEmAndamento) return;
    solicitarEncerramento(atendimentoEmAndamento.id, atendimentoEmAndamento.nome_cidadao, usuario.id);
    registrarAuditoria({
      usuario_id: usuario.id, nome_usuario: usuario.nome, perfil_usuario: usuario.perfil,
      tipo_acao: 'protocolo_encerramento', modulo: 'atendimento',
      referencia_tipo: 'atendimento', referencia_id: atendimentoEmAndamento.id,
      descricao_resumida: `Protocolo de encerramento: ${atendimentoEmAndamento.nome_cidadao}.`,
      nivel_sensibilidade: 'estratégico',
    });
    sonnerToast.success('Solicitação de encerramento enviada à Sala Principal.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground uppercase">COMANDOS RÁPIDOS</h1>
        <p className="text-sm text-muted-foreground mt-1">Envie e gerencie chamadas e solicitações hierárquicas</p>
      </div>

      {isPresidente && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Zap className="w-5 h-5 text-accent" />Ações Rápidas do Presidente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button className="h-14 text-sm font-semibold bg-accent hover:bg-accent/90 text-accent-foreground transition-all" onClick={handleChamarSalaPrincipal}>
                <UserCheck className="w-4 h-4 mr-2" />CHAMAR SALA PRINCIPAL
              </Button>
              {atendimentoEmAndamento && (
                <Button variant="outline" className="h-14 text-sm font-semibold border-destructive/50 text-destructive hover:bg-destructive/10 transition-all" onClick={handleSolicitarEncerramento}>
                  <XCircle className="w-4 h-4 mr-2" />ENCERRAR ATENDIMENTO ATUAL
                </Button>
              )}
            </div>
            {atendimentoEmAndamento && (
              <p className="text-xs text-muted-foreground">Atendimento atual: <strong>{atendimentoEmAndamento.nome_cidadao}</strong> – {atendimentoEmAndamento.demanda_principal}</p>
            )}
          </CardContent>
        </Card>
      )}

      {canSend && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Zap className="w-5 h-5 text-accent" />Enviar Comando para {destinoLabel}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chamadas.map(c => (
                <Button key={c.tipo} variant="outline" className="h-14 text-sm font-semibold hover:border-accent hover:bg-accent/5 transition-all" onClick={() => enviarComando(c.tipo)}>
                  <Send className="w-4 h-4 mr-2" />{c.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Quem chamar? (Outro)" value={outroTexto} onChange={e => setOutroTexto(e.target.value)} className="flex-1" />
              <Button variant="outline" onClick={() => outroTexto && enviarComando('Outro', outroTexto)} disabled={!outroTexto}><Send className="w-4 h-4 mr-1" />Enviar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canSend && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="w-5 h-5 text-accent" />{perfil === 'presidente' ? 'Solicitar' : 'Solicitar à Sala de Espera'}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="O que deseja solicitar?" value={solicitacaoTexto} onChange={e => setSolicitacaoTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarSolicitacao()} className="flex-1" />
              <Button onClick={enviarSolicitacao} disabled={!solicitacaoTexto.trim()}><Send className="w-4 h-4 mr-1" />Enviar Solicitação</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canRespond && recebidos.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Comandos Recebidos ({recebidos.filter(c => c.status !== 'Concluído').length} pendentes)</h2>
          <div className="space-y-2">
            {recebidos.filter(c => c.status !== 'Concluído').map(c => (
              <div key={c.id} className="bg-card rounded-lg border p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {statusIcon[c.status]}
                  <div>
                    <span className="font-semibold text-sm">{c.tipo_chamada === 'Outro' ? c.descricao_customizada : c.tipo_chamada}</span>
                    <p className="text-xs text-muted-foreground">De: {c.criado_por_nome} • {new Date(c.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusStyle[c.status]}>{c.status}</Badge>
                  {c.status !== 'Concluído' && (
                    <Select value={c.status} onValueChange={v => updateComandoStatus(c.id, v as StatusComando)}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canRespond && solicitacoesRecebidas.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Solicitações Recebidas ({solicitacoesRecebidas.filter(s => s.status !== 'Concluída').length} pendentes)</h2>
          <div className="space-y-2">
            {solicitacoesRecebidas.filter(s => s.status !== 'Concluída').map(s => (
              <div key={s.id} className="bg-card rounded-lg border p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {s.status === 'Pendente' ? <Clock className="w-3.5 h-3.5 text-yellow-600" /> : s.status === 'Em andamento' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                  <div>
                    <span className="font-semibold text-sm">{s.descricao_solicitacao}</span>
                    <p className="text-xs text-muted-foreground">De: {s.origem_perfil} • {new Date(s.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={solicitacaoStatusStyle[s.status]}>{s.status}</Badge>
                  {s.status !== 'Concluída' && (
                    <Select value={s.status} onValueChange={v => updateSolicitacaoStatus(s.id, v as StatusSolicitacao)}>
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
            ))}
          </div>
        </div>
      )}

      {enviados.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Comandos Enviados</h2>
          <div className="space-y-2">
            {enviados.map(c => (
              <div key={c.id} className="bg-card rounded-lg border p-3 flex items-center gap-3 opacity-80">
                {statusIcon[c.status]}
                <span className="text-sm font-medium flex-1">{c.tipo_chamada === 'Outro' ? c.descricao_customizada : c.tipo_chamada}</span>
                <span className="text-xs text-muted-foreground">→ {c.destino_perfil}</span>
                <Badge className={statusStyle[c.status]} variant="outline">{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comandos;
