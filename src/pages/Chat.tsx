import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { Send, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Chat: React.FC = () => {
  const { mensagens, addMensagem } = useData();
  const { usuario } = useAuth();
  const perfil = usePerfilVisual();
  const [texto, setTexto] = useState('');
  const [canal, setCanal] = useState<'sala_brenda' | 'brenda_presidente'>('sala_brenda');

  if (!usuario) return null;

  const canais = [
    ...(perfil === 'sala_espera' || perfil === 'brenda' || perfil === 'administrador' ? [{ key: 'sala_brenda' as const, label: 'Sala ↔ Brenda' }] : []),
    ...(perfil === 'brenda' || perfil === 'presidente' || perfil === 'administrador' ? [{ key: 'brenda_presidente' as const, label: 'Brenda ↔ Presidente' }] : []),
  ];

  const enviar = () => {
    if (!texto.trim()) return;
    addMensagem({
      remetente_id: usuario.id,
      remetente_nome: usuario.nome,
      mensagem: texto,
      lido: false,
    }, canal);
    setTexto('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Chat Interno</h1>
        <div className="flex gap-2 mt-3">
          {canais.map(c => (
            <button
              key={c.key}
              onClick={() => setCanal(c.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                canal === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card rounded-t-xl border border-b-0 p-4 space-y-3">
        {mensagens.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma mensagem ainda</p>
          </div>
        )}
        {mensagens.map(m => {
          const isMine = m.remetente_id === usuario.id;
          return (
            <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-xl px-4 py-2.5",
                isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {!isMine && <p className="text-xs font-semibold mb-1 opacity-70">{m.remetente_nome}</p>}
                <p className="text-sm">{m.mensagem}</p>
                <p className="text-[10px] mt-1 opacity-50">{new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 bg-card rounded-b-xl border border-t-0 p-3">
        <Input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Digite sua mensagem..."
          className="flex-1"
        />
        <Button onClick={enviar} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
