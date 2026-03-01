import React, { createContext, useContext, useState, useCallback } from 'react';
import { Atendimento, AutorizacaoFinanceira, Comando, Demanda, MensagemChat, Notificacao, Perfil, Solicitacao, DemandaAtendimento, StatusDemanda, StatusAutorizacao } from '@/types';
import { mockAtendimentos, mockComandos, mockMensagens } from '@/data/mockData';

interface DataContextType {
  atendimentos: Atendimento[];
  comandos: Comando[];
  mensagens: MensagemChat[];
  notificacoes: Notificacao[];
  solicitacoes: Solicitacao[];
  demandasAtendimento: DemandaAtendimento[];
  demandas: Demanda[];
  autorizacoes: AutorizacaoFinanceira[];
  addAtendimento: (a: Omit<Atendimento, 'id' | 'atualizado_em'>) => void;
  updateAtendimento: (id: string, updates: Partial<Atendimento>) => void;
  addComando: (c: Omit<Comando, 'id' | 'criado_em'>) => void;
  updateComandoStatus: (id: string, status: Comando['status']) => void;
  addMensagem: (m: Omit<MensagemChat, 'id' | 'criado_em'>, canal?: 'sala_brenda' | 'brenda_presidente') => void;
  marcarNotificacaoLida: (id: string) => void;
  addSolicitacao: (s: Omit<Solicitacao, 'id' | 'criado_em'>) => void;
  updateSolicitacaoStatus: (id: string, status: Solicitacao['status']) => void;
  addDemandaAtendimento: (d: Omit<DemandaAtendimento, 'id' | 'criado_em'>, nomeCidadao: string) => void;
  updateDemandaStatus: (id: string, status: DemandaAtendimento['status']) => void;
  addDemanda: (d: Omit<Demanda, 'id' | 'criado_em'>) => void;
  updateDemandaGlobalStatus: (id: string, status: StatusDemanda) => void;
  salvarAnotacoesPresidente: (atendimentoId: string, texto: string, nomeCidadao: string) => void;
  salvarAnotacoesBrenda: (atendimentoId: string, texto: string) => void;
  addAutorizacao: (a: Omit<AutorizacaoFinanceira, 'id' | 'criado_em'>) => void;
  concluirAutorizacao: (id: string, concluido_por_id: string, concluido_por_perfil: 'Presidente' | 'Brenda') => void;
  updateAutorizacao: (id: string, updates: Partial<AutorizacaoFinanceira>) => void;
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
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [demandasAtendimento, setDemandasAtendimento] = useState<DemandaAtendimento[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [autorizacoes, setAutorizacoes] = useState<AutorizacaoFinanceira[]>([]);

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
    window.dispatchEvent(new CustomEvent('nova-notificacao', { detail: n }));
  }, []);

  const addAtendimento = useCallback((a: Omit<Atendimento, 'id' | 'atualizado_em'>) => {
    const id = String(Date.now());
    setAtendimentos(prev => [...prev, { ...a, id, atualizado_em: new Date().toISOString() }]);
    const msg = `Novo atendimento criado: ${a.nome_cidadao} – ${a.demanda_principal}.`;
    criarNotificacao('brenda', 'novo_atendimento', 'atendimento', id, msg);
    criarNotificacao('presidente', 'novo_atendimento', 'atendimento', id, msg);
  }, [criarNotificacao]);

  const updateAtendimento = useCallback((id: string, updates: Partial<Atendimento>) => {
    setAtendimentos(prev => {
      const old = prev.find(a => a.id === id);
      if (!old) return prev;
      if (updates.prioridade && updates.prioridade === 'Alta' && old.prioridade !== 'Alta') {
        criarNotificacao('presidente', 'prioridade_alterada', 'atendimento', id,
          `Atendimento com prioridade ALTA: ${old.nome_cidadao} – ${old.demanda_principal}.`);
      }
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
    const resumo = `Nova mensagem de ${m.remetente_nome} no chat.`;
    if (canal === 'sala_brenda') {
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

  const addSolicitacao = useCallback((s: Omit<Solicitacao, 'id' | 'criado_em'>) => {
    const id = String(Date.now());
    setSolicitacoes(prev => [...prev, { ...s, id, criado_em: new Date().toISOString() }]);
    const origemLabel = s.origem_perfil;
    const destinoPerfil: Perfil = s.destino_perfil === 'Brenda' ? 'brenda' : 'sala_espera';
    criarNotificacao(destinoPerfil, 'nova_solicitacao', 'solicitacao', id,
      `Nova solicitação ${origemLabel === 'Presidente' ? 'do Presidente' : 'de Brenda'}: ${s.descricao_solicitacao}.`);
  }, [criarNotificacao]);

  const updateSolicitacaoStatus = useCallback((id: string, status: Solicitacao['status']) => {
    setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }, []);

  const addDemandaAtendimento = useCallback((d: Omit<DemandaAtendimento, 'id' | 'criado_em'>, nomeCidadao: string) => {
    const id = String(Date.now());
    setDemandasAtendimento(prev => [...prev, { ...d, id, criado_em: new Date().toISOString() }]);
    criarNotificacao('sala_espera', 'nova_demanda_atendimento', 'demanda_atendimento', id,
      `Nova demanda da Brenda sobre o atendimento de ${nomeCidadao}: ${d.descricao_demanda}.`);
  }, [criarNotificacao]);

  const updateDemandaStatus = useCallback((id: string, status: DemandaAtendimento['status']) => {
    setDemandasAtendimento(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  }, []);

  const addDemanda = useCallback((d: Omit<Demanda, 'id' | 'criado_em'>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
    setDemandas(prev => [...prev, { ...d, id, criado_em: new Date().toISOString() }]);
    const destinoPerfil: Perfil = d.destino_perfil === 'Brenda' ? 'brenda' : 'sala_espera';
    criarNotificacao(destinoPerfil, 'nova_solicitacao', 'solicitacao', id,
      `Nova demanda: ${d.titulo} (prioridade ${d.prioridade}).`);
  }, [criarNotificacao]);

  const updateDemandaGlobalStatus = useCallback((id: string, status: StatusDemanda) => {
    setDemandas(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  }, []);

  const salvarAnotacoesPresidente = useCallback((atendimentoId: string, texto: string, nomeCidadao: string) => {
    setAtendimentos(prev => prev.map(a => a.id === atendimentoId ? {
      ...a,
      anotacoes_presidente: texto,
      anotacoes_presidente_atualizado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    } : a));
    criarNotificacao('brenda', 'ficha_atualizada', 'atendimento', atendimentoId,
      `O Presidente atualizou as anotações do atendimento de ${nomeCidadao}.`);
  }, [criarNotificacao]);

  const salvarAnotacoesBrenda = useCallback((atendimentoId: string, texto: string) => {
    setAtendimentos(prev => prev.map(a => a.id === atendimentoId ? {
      ...a,
      anotacoes_brenda: texto,
      anotacoes_brenda_atualizado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    } : a));
  }, []);

  const addAutorizacao = useCallback((a: Omit<AutorizacaoFinanceira, 'id' | 'criado_em'>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
    setAutorizacoes(prev => [...prev, { ...a, id, criado_em: new Date().toISOString() }]);
    criarNotificacao('presidente', 'nova_autorizacao' as any, 'autorizacao_financeira', id,
      `Nova autorização financeira: ${a.titulo}.`);
  }, [criarNotificacao]);

  const concluirAutorizacao = useCallback((id: string, concluido_por_id: string, concluido_por_perfil: 'Presidente' | 'Brenda') => {
    setAutorizacoes(prev => prev.map(a => a.id === id ? {
      ...a, status: 'Concluída' as StatusAutorizacao,
      resolvido_em: new Date().toISOString(),
      concluido_por_id, concluido_por_perfil,
    } : a));
  }, []);

  const updateAutorizacao = useCallback((id: string, updates: Partial<AutorizacaoFinanceira>) => {
    setAutorizacoes(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  return (
    <DataContext.Provider value={{
      atendimentos, comandos, mensagens, notificacoes, solicitacoes, demandasAtendimento, demandas, autorizacoes,
      addAtendimento, updateAtendimento, addComando, updateComandoStatus, addMensagem,
      marcarNotificacaoLida, addSolicitacao, updateSolicitacaoStatus,
      addDemandaAtendimento, updateDemandaStatus, addDemanda, updateDemandaGlobalStatus,
      salvarAnotacoesPresidente, salvarAnotacoesBrenda, addAutorizacao, concluirAutorizacao, updateAutorizacao,
    }}>
      {children}
    </DataContext.Provider>
  );
};
