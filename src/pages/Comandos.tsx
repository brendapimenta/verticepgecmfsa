import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { TipoChamada, StatusComando, StatusSolicitacao } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Send, Clock, CheckCircle, Loader2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const chamadas: { tipo: TipoChamada; label: string }[] = [
  { tipo: 'Diretor Geral', label: 'CHAMAR DIRETOR GERAL' },
  { tipo: 'Procurador Geral', label: 'CHAMAR PROCURADOR GERAL' },
  { tipo: 'Guarda Municipal', label: 'CHAMAR GUARDA MUNICIPAL' },
];

const statusIcon: Record<StatusComando, React.ReactNode> = {
  Pendente: <Clock className="w-3.5 h-3.5 text-yellow-600" />,
  'Em andamento': <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
  Concluído: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
};

const statusStyle: Record<StatusComando, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  'Em andamento': 'bg-blue-100 text-blue-800',
  Concluído: 'bg-green-100 text-green-800',
};

const solicitacaoStatusStyle: Record<StatusSolicitacao, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  'Em andamento': 'bg-blue-100 text-blue-800',
  Concluída: 'bg-green-100 text-green-800',
};

const Comandos: React.FC = () => {
  const { comandos, addComando, updateComandoStatus, solicitacoes, addSolicitacao, updateSolicitacaoStatus } = useData();
  const { usuario } = useAuth();
  const perfil = usePerfilVisual();
  const { toast } = useToast();
  const [outroTexto, setOutroTexto] = useState('');
  const [solicitacaoTexto, setSolicitacaoTexto] = useState('');

  if (!usuario) return null;

  const canSend = perfil === 'presidente' || perfil === 'brenda' || perfil === 'administrador';

  const origemPerfil = perfil === 'presidente' ? 'Presidente' as const : 'Brenda' as const;
  const destinoPerfil = perfil === 'presidente' ? 'Brenda' as const : 'Sala de Espera' as const;
  const destinoLabel = perfil === 'presidente' ? 'Brenda' : 'Sala de Espera';

  const enviarComando = (tipo: TipoChamada, descricao?: string) => {
    addComando({
      origem_perfil: origemPerfil,
      destino_perfil: destinoPerfil,
      tipo_chamada: tipo,
      descricao_customizada: descricao,
      status: 'Pendente',
      criado_por_id: usuario.id,
      criado_por_nome: usuario.nome,
    });
    toast({ title: 'Comando enviado!', description: `${tipo} - enviado para ${destinoPerfil}` });
    if (tipo === 'Outro') setOutroTexto('');
  };

  const enviarSolicitacao = () => {
    if (!solicitacaoTexto.trim()) return;
    addSolicitacao({
      origem_perfil: origemPerfil,
      destino_perfil: destinoPerfil,
      descricao_solicitacao: solicitacaoTexto,
      status: 'Pendente',
      criado_por_id: usuario.id,
    });
    toast({ title: 'Solicitação enviada!', description: `Enviada para ${destinoLabel}` });
    setSolicitacaoTexto('');
  };

  const recebidos = comandos.filter(c => {
    if (perfil === 'brenda') return c.destino_perfil === 'Brenda';
    if (perfil === 'sala_espera') return c.destino_perfil === 'Sala de Espera';
    if (perfil === 'administrador') return true;
    return false;
  });

  const solicitacoesRecebidas = solicitacoes.filter(s => {
    if (perfil === 'brenda') return s.destino_perfil === 'Brenda';
    if (perfil === 'sala_espera') return s.destino_perfil === 'Sala de Espera';
    if (perfil === 'administrador') return true;
    return false;
  });

  const enviados = comandos.filter(c => c.criado_por_id === usuario.id);
  const canRespond = perfil === 'brenda' || perfil === 'sala_espera' || perfil === 'administrador';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Comandos Rápidos</h1>
        <p className="text-sm text-muted-foreground mt-1">Envie e gerencie chamadas e solicitações hierárquicas</p>
      </div>

      {/* Send Commands Card */}
      {canSend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-accent" />
              Enviar Comando para {destinoLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chamadas.map(c => (
                <Button
                  key={c.tipo}
                  variant="outline"
                  className="h-14 text-sm font-semibold hover:border-accent hover:bg-accent/5 transition-all"
                  onClick={() => enviarComando(c.tipo)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {c.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Quem chamar? (Outro)"
                value={outroTexto}
                onChange={e => setOutroTexto(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => outroTexto && enviarComando('Outro', outroTexto)}
                disabled={!outroTexto}
              >
                <Send className="w-4 h-4 mr-1" />
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solicitação Card */}
      {canSend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-accent" />
              {perfil === 'presidente' ? 'Solicitar' : 'Solicitar à Sala de Espera'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="O que deseja solicitar?"
                value={solicitacaoTexto}
                onChange={e => setSolicitacaoTexto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarSolicitacao()}
                className="flex-1"
              />
              <Button onClick={enviarSolicitacao} disabled={!solicitacaoTexto.trim()}>
                <Send className="w-4 h-4 mr-1" />
                Enviar Solicitação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Received Commands */}
      {canRespond && recebidos.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Comandos Recebidos ({recebidos.filter(c => c.status !== 'Concluído').length} pendentes)
          </h2>
          <div className="space-y-2">
            {recebidos.filter(c => c.status !== 'Concluído').map(c => (
              <div key={c.id} className="bg-card rounded-lg border p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {statusIcon[c.status]}
                  <div>
                    <span className="font-semibold text-sm">
                      {c.tipo_chamada === 'Outro' ? c.descricao_customizada : c.tipo_chamada}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      De: {c.criado_por_nome} • {new Date(c.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusStyle[c.status]}>{c.status}</Badge>
                  {c.status !== 'Concluído' && (
                    <Select
                      value={c.status}
                      onValueChange={v => updateComandoStatus(c.id, v as StatusComando)}
                    >
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

      {/* Received Solicitações */}
      {canRespond && solicitacoesRecebidas.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Solicitações Recebidas ({solicitacoesRecebidas.filter(s => s.status !== 'Concluída').length} pendentes)
          </h2>
          <div className="space-y-2">
            {solicitacoesRecebidas.filter(s => s.status !== 'Concluída').map(s => (
              <div key={s.id} className="bg-card rounded-lg border p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {s.status === 'Pendente' ? <Clock className="w-3.5 h-3.5 text-yellow-600" /> :
                   s.status === 'Em andamento' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> :
                   <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                  <div>
                    <span className="font-semibold text-sm">{s.descricao_solicitacao}</span>
                    <p className="text-xs text-muted-foreground">
                      De: {s.origem_perfil} • {new Date(s.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={solicitacaoStatusStyle[s.status]}>{s.status}</Badge>
                  {s.status !== 'Concluída' && (
                    <Select
                      value={s.status}
                      onValueChange={v => updateSolicitacaoStatus(s.id, v as StatusSolicitacao)}
                    >
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

      {/* Sent Commands */}
      {enviados.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Comandos Enviados</h2>
          <div className="space-y-2">
            {enviados.map(c => (
              <div key={c.id} className="bg-card rounded-lg border p-3 flex items-center gap-3 opacity-80">
                {statusIcon[c.status]}
                <span className="text-sm font-medium flex-1">
                  {c.tipo_chamada === 'Outro' ? c.descricao_customizada : c.tipo_chamada}
                </span>
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
