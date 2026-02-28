import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TipoChamada, StatusComando } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Send, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const chamadas: { tipo: TipoChamada; label: string }[] = [
  { tipo: 'Diretor Geral', label: 'CHAMAR DIRETOR GERAL' },
  { tipo: 'Procurador Geral', label: 'CHAMAR PROCURADOR GERAL' },
  { tipo: 'Controladora', label: 'CHAMAR CONTROLADORA' },
  { tipo: 'Gerência de Recursos Humanos', label: 'CHAMAR GERÊNCIA DE RH' },
  { tipo: 'Gerência Legislativa', label: 'CHAMAR GERÊNCIA LEGISLATIVA' },
  { tipo: 'Gerência Financeira', label: 'CHAMAR GERÊNCIA FINANCEIRA' },
  { tipo: 'Tesoureiro', label: 'CHAMAR TESOUREIRO' },
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

const Comandos: React.FC = () => {
  const { comandos, addComando, updateComandoStatus } = useData();
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [outroTexto, setOutroTexto] = useState('');

  if (!usuario) return null;
  const perfil = usuario.perfil;

  const canSend = perfil === 'presidente' || perfil === 'brenda' || perfil === 'administrador';

  const origemPerfil = perfil === 'presidente' ? 'Presidente' as const : 'Brenda' as const;
  const destinoPerfil = perfil === 'presidente' ? 'Brenda' as const : 'Sala de Espera' as const;

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

  // Comandos recebidos
  const recebidos = comandos.filter(c => {
    if (perfil === 'brenda') return c.destino_perfil === 'Brenda';
    if (perfil === 'sala_espera') return c.destino_perfil === 'Sala de Espera';
    if (perfil === 'administrador') return true;
    return false;
  });

  const enviados = comandos.filter(c => c.criado_por_id === usuario.id);

  const canRespond = perfil === 'brenda' || perfil === 'sala_espera' || perfil === 'administrador';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Comandos Rápidos</h1>
        <p className="text-sm text-muted-foreground mt-1">Envie e gerencie chamadas hierárquicas</p>
      </div>

      {/* Send Commands */}
      {canSend && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Enviar Comando para {destinoPerfil}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {chamadas.map(c => (
              <Button
                key={c.tipo}
                variant="outline"
                className="h-auto py-3 text-xs font-semibold hover:border-accent hover:bg-accent/5 transition-all"
                onClick={() => enviarComando(c.tipo)}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {c.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
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
        </div>
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
