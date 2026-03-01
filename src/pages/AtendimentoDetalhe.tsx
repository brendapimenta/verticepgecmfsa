import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { StatusDemanda } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send, Clock, User, Phone, FileText, StickyNote, ClipboardList, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/PersonAvatar';

const statusDemandaStyle: Record<StatusDemanda, string> = {
  Pendente: 'bg-yellow-500/15 text-yellow-300',
  'Em andamento': 'bg-blue-500/15 text-blue-400',
  Concluída: 'bg-green-500/15 text-green-400',
};

const AtendimentoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const {
    atendimentos, demandasAtendimento,
    salvarAnotacoesPresidente, salvarAnotacoesBrenda,
    addDemandaAtendimento, updateDemandaStatus,
  } = useData();

  const atendimento = atendimentos.find(a => a.id === id);

  const [anotPresidente, setAnotPresidente] = useState(atendimento?.anotacoes_presidente || '');
  const [anotBrenda, setAnotBrenda] = useState(atendimento?.anotacoes_brenda || '');
  const [novaDemanda, setNovaDemanda] = useState('');

  if (!usuario || !atendimento) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Atendimento não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/fila')}>Voltar à fila</Button>
      </div>
    );
  }

  const isPresidente = perfilUI === 'presidente';
  const isBrenda = perfilUI === 'brenda';
  const isSalaEspera = perfilUI === 'sala_espera';
  const isAdmin = perfilUI === 'administrador';

  const demandasDoAtendimento = demandasAtendimento.filter(d => d.atendimento_id === atendimento.id);

  const handleSalvarAnotPresidente = () => {
    salvarAnotacoesPresidente(atendimento.id, anotPresidente, atendimento.nome_cidadao);
    toast({ title: 'Anotações salvas', description: 'Brenda será notificada.' });
  };

  const handleSalvarAnotBrenda = () => {
    salvarAnotacoesBrenda(atendimento.id, anotBrenda, atendimento.nome_cidadao);
    toast({ title: 'Anotações salvas' });
  };

  const handleGerarDemanda = () => {
    if (!novaDemanda.trim()) return;
    addDemandaAtendimento({
      atendimento_id: atendimento.id,
      origem_perfil: 'Brenda',
      destino_perfil: 'Sala de Espera',
      descricao_demanda: novaDemanda,
      status: 'Pendente',
      criado_por_id: usuario.id,
    }, atendimento.nome_cidadao);
    toast({ title: 'Demanda gerada', description: 'Sala de Espera será notificada.' });
    setNovaDemanda('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PersonAvatar nome={atendimento.nome_cidadao} fotoUrl={atendimento.foto_url} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{atendimento.nome_cidadao}</h1>
          <p className="text-sm text-muted-foreground">{atendimento.demanda_principal}</p>
        </div>
      </div>

      {/* Ficha do Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Dados do Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> <strong>Tipo:</strong> {atendimento.tipo}</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> <strong>Chegada:</strong> {atendimento.hora_chegada}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> <strong>Telefone:</strong> {atendimento.telefone_contato}</div>
            <div><strong>Registro:</strong> {atendimento.tipo_registro}</div>
            {atendimento.assunto && <div><strong>Assunto:</strong> {atendimento.assunto}</div>}
            <div><strong>Status:</strong> <Badge variant="outline">{atendimento.status}</Badge></div>
            <div><strong>Prioridade:</strong> <Badge variant="outline">{atendimento.prioridade}</Badge></div>
            {atendimento.indicado_por && <div><strong>Indicado por:</strong> {atendimento.indicado_por}</div>}
            {atendimento.descricao && <div className="col-span-full"><strong>Descrição:</strong> {atendimento.descricao}</div>}
            {atendimento.observacao_recepcao && <div className="col-span-full"><strong>Obs. Recepção:</strong> {atendimento.observacao_recepcao}</div>}
          </div>
        </CardContent>
      </Card>

      {/* Anotações do Presidente */}
      {isPresidente && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <StickyNote className="w-5 h-5 text-amber-600" />
              Anotações do Presidente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={anotPresidente}
              onChange={e => setAnotPresidente(e.target.value)}
              placeholder="Escreva suas anotações sobre este atendimento..."
              rows={4}
            />
            {atendimento.anotacoes_presidente_atualizado_em && (
              <p className="text-xs text-muted-foreground">
                Última atualização: {new Date(atendimento.anotacoes_presidente_atualizado_em).toLocaleString('pt-BR')}
              </p>
            )}
            <Button onClick={handleSalvarAnotPresidente} className="gap-1">
              <Save className="w-4 h-4" /> Salvar anotações
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Brenda: anotações do Presidente (somente leitura) + anotações próprias */}
      {isBrenda && !isPresidente && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <StickyNote className="w-5 h-5 text-amber-600" />
                Anotações do Presidente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atendimento.anotacoes_presidente ? (
                <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">{atendimento.anotacoes_presidente}</div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem anotações do Presidente.</p>
              )}
              {atendimento.anotacoes_presidente_atualizado_em && (
                <p className="text-xs text-muted-foreground mt-2">
                  Atualizado em: {new Date(atendimento.anotacoes_presidente_atualizado_em).toLocaleString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <StickyNote className="w-5 h-5 text-blue-600" />
                Anotações da Brenda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={anotBrenda}
                onChange={e => setAnotBrenda(e.target.value)}
                placeholder="Suas anotações sobre este atendimento..."
                rows={4}
              />
              {atendimento.anotacoes_brenda_atualizado_em && (
                <p className="text-xs text-muted-foreground">
                  Última atualização: {new Date(atendimento.anotacoes_brenda_atualizado_em).toLocaleString('pt-BR')}
                </p>
              )}
              <Button onClick={handleSalvarAnotBrenda} className="gap-1">
                <Save className="w-4 h-4" /> Salvar anotações
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Administrador vê ambas anotações da Brenda também */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <StickyNote className="w-5 h-5 text-blue-600" />
              Anotações da Brenda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={anotBrenda}
              onChange={e => setAnotBrenda(e.target.value)}
              placeholder="Anotações da Brenda..."
              rows={4}
            />
            {atendimento.anotacoes_brenda_atualizado_em && (
              <p className="text-xs text-muted-foreground">
                Última atualização: {new Date(atendimento.anotacoes_brenda_atualizado_em).toLocaleString('pt-BR')}
              </p>
            )}
            <Button onClick={handleSalvarAnotBrenda} className="gap-1">
              <Save className="w-4 h-4" /> Salvar anotações
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Demandas para Sala de Espera – visível para Brenda e Admin */}
      {isBrenda && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              Demandas para a Sala de Espera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {demandasDoAtendimento.length > 0 && (
              <div className="space-y-2">
                {demandasDoAtendimento.map(d => (
                  <div key={d.id} className="bg-muted/30 rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {d.status === 'Pendente' ? <Clock className="w-3.5 h-3.5 text-yellow-600" /> :
                       d.status === 'Em andamento' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> :
                       <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                      <div>
                        <p className="text-sm font-medium">{d.descricao_demanda}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(d.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusDemandaStyle[d.status]}>{d.status}</Badge>
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
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                value={novaDemanda}
                onChange={e => setNovaDemanda(e.target.value)}
                placeholder="Descreva a demanda para a Sala de Espera..."
                rows={2}
              />
              <Button onClick={handleGerarDemanda} disabled={!novaDemanda.trim()} className="gap-1">
                <Send className="w-4 h-4" /> Gerar demanda
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sala de Espera: demandas recebidas para este atendimento */}
      {isSalaEspera && !isBrenda && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              Demandas Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demandasDoAtendimento.length > 0 ? (
              <div className="space-y-2">
                {demandasDoAtendimento.map(d => (
                  <div key={d.id} className="bg-muted/30 rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {d.status === 'Pendente' ? <Clock className="w-3.5 h-3.5 text-yellow-600" /> :
                       d.status === 'Em andamento' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> :
                       <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                      <div>
                        <p className="text-sm font-medium">{d.descricao_demanda}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(d.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusDemandaStyle[d.status]}>{d.status}</Badge>
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhuma demanda para este atendimento.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AtendimentoDetalhe;
