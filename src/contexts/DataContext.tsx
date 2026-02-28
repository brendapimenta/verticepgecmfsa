import React, { createContext, useContext, useState, useCallback } from 'react';
import { Atendimento, Comando, MensagemChat, Notificacao, Perfil } from '@/types';
import { mockAtendimentos, mockComandos, mockMensagens } from '@/data/mockData';

interface DataContextType {
  atendimentos: Atendimento[];
  comandos: Comando[];
  mensagens: MensagemChat[];
  notificacoes: Notificacao[];
  addAtendimento: (a: Omit<Atendimento, 'id' | 'atualizado_em'>) => void;
  updateAtendimento: (id: string, updates: Partial<Atendimento>) => void;
  addComando: (c: Omit<Comando, 'id' | 'criado_em'>) => void;
  updateComandoStatus: (id: string, status: Comando['status']) => void;
  addMensagem: (m: Omit<MensagemChat, 'id' | 'criado_em'>, canal?: 'sala_brenda' | 'brenda_presidente') => void;
  marcarNotificacaoLida: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(mockAtendimentos);
  const [comandos, setComandos] = useState<Comando[]>(mockComandos);
  const [mensagens, setMensagens] = useState<MensagemChat[]>(mockMensagens);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const criarNotificacao = useCallback((perfil_destino: Perfil, tipo_notificacao: Notificacao['tipo_notificacao'], referencia_tipo: Notificacao['referencia_tipo'], referencia_id: string, mensagem_resumo: string) => {
    const n: Notificacao = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      perfil_destino,
      tipo_notificacao,
      referencia_tipo,
      referencia_id,
      mensagem_resumo,
      lida: false,
      criado_em: new Date().toISOString(),
    };
    setNotificacoes(prev => [n, ...prev]);
  }, []);

  const addAtendimento = useCallback((a: Omit<Atendimento, 'id' | 'atualizado_em'>) => {
    const id = String(Date.now());
    setAtendimentos(prev => [...prev, { ...a, id, atualizado_em: new Date().toISOString() }]);
    // Rule 1: notify Brenda and Presidente
    const msg = `Novo atendimento criado: ${a.nome_cidadao} – ${a.demanda_principal}.`;
    criarNotificacao('brenda', 'novo_atendimento', 'atendimento', id, msg);
    criarNotificacao('presidente', 'novo_atendimento', 'atendimento', id, msg);
  }, [criarNotificacao]);

  const updateAtendimento = useCallback((id: string, updates: Partial<Atendimento>) => {
    setAtendimentos(prev => {
      const old = prev.find(a => a.id === id);
      if (!old) return prev;

      // Rule 2: priority changed to Alta
      if (updates.prioridade && updates.prioridade === 'Alta' && old.prioridade !== 'Alta') {
        criarNotificacao('presidente', 'prioridade_alterada', 'atendimento', id,
          `Atendimento com prioridade ALTA: ${old.nome_cidadao} – ${old.demanda_principal}.`);
      }

      // Rule 5: important status change
      if (updates.status) {
        const from = old.status;
        const to = updates.status;
        if ((from === 'Aguardando' && to === 'Em Atendimento') || (from === 'Em Atendimento' && to === 'Concluído')) {
          criarNotificacao('brenda', 'status_atualizado', 'atendimento', id,
            `Status atualizado para ${to}: ${old.nome_cidadao} – ${old.demanda_principal}.`);
        }
      }

      return prev.map(a => a.id === id ? { ...a, ...updates, atualizado_em: new Date().toISOString() } : a);
    });
  }, [criarNotificacao]);

  const addComando = useCallback((c: Omit<Comando, 'id' | 'criado_em'>) => {
    const id = String(Date.now());
    setComandos(prev => [...prev, { ...c, id, criado_em: new Date().toISOString() }]);
    // Rule 3: notify destination
    const desc = c.tipo_chamada === 'Outro' ? c.descricao_customizada : c.tipo_chamada;
    if (c.origem_perfil === 'Presidente') {
      criarNotificacao('brenda', 'novo_comando', 'comando', id, `Novo comando do Presidente: ${desc}.`);
    } else if (c.origem_perfil === 'Brenda') {
      criarNotificacao('sala_espera', 'novo_comando', 'comando', id, `Novo comando de Brenda: ${desc}.`);
    }
  }, [criarNotificacao]);

  const updateComandoStatus = useCallback((id: string, status: Comando['status']) => {
    setComandos(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }, []);

  const addMensagem = useCallback((m: Omit<MensagemChat, 'id' | 'criado_em'>, canal?: 'sala_brenda' | 'brenda_presidente') => {
    const id = String(Date.now());
    setMensagens(prev => [...prev, { ...m, id, criado_em: new Date().toISOString() }]);
    // Rule 4: chat notification
    const resumo = `Nova mensagem de ${m.remetente_nome} no chat.`;
    if (canal === 'sala_brenda') {
      // If sender is sala_espera -> notify brenda, vice versa
      const destino: Perfil = m.remetente_nome === 'Brenda' ? 'sala_espera' : 'brenda';
      criarNotificacao(destino, 'nova_mensagem_chat', 'chat', id, resumo);
    } else if (canal === 'brenda_presidente') {
      const destino: Perfil = m.remetente_nome === 'Brenda' ? 'presidente' : 'brenda';
      criarNotificacao(destino, 'nova_mensagem_chat', 'chat', id, resumo);
    }
  }, [criarNotificacao]);

  const marcarNotificacaoLida = useCallback((id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }, []);

  return (
    <DataContext.Provider value={{ atendimentos, comandos, mensagens, notificacoes, addAtendimento, updateAtendimento, addComando, updateComandoStatus, addMensagem, marcarNotificacaoLida }}>
      {children}
    </DataContext.Provider>
  );
};
