import React, { createContext, useContext, useState, useCallback } from 'react';
import { Atendimento, Comando, MensagemChat } from '@/types';
import { mockAtendimentos, mockComandos, mockMensagens } from '@/data/mockData';

interface DataContextType {
  atendimentos: Atendimento[];
  comandos: Comando[];
  mensagens: MensagemChat[];
  addAtendimento: (a: Omit<Atendimento, 'id' | 'atualizado_em'>) => void;
  updateAtendimento: (id: string, updates: Partial<Atendimento>) => void;
  addComando: (c: Omit<Comando, 'id' | 'criado_em'>) => void;
  updateComandoStatus: (id: string, status: Comando['status']) => void;
  addMensagem: (m: Omit<MensagemChat, 'id' | 'criado_em'>) => void;
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

  const addAtendimento = useCallback((a: Omit<Atendimento, 'id' | 'atualizado_em'>) => {
    setAtendimentos(prev => [...prev, { ...a, id: String(Date.now()), atualizado_em: new Date().toISOString() }]);
  }, []);

  const updateAtendimento = useCallback((id: string, updates: Partial<Atendimento>) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, ...updates, atualizado_em: new Date().toISOString() } : a));
  }, []);

  const addComando = useCallback((c: Omit<Comando, 'id' | 'criado_em'>) => {
    setComandos(prev => [...prev, { ...c, id: String(Date.now()), criado_em: new Date().toISOString() }]);
  }, []);

  const updateComandoStatus = useCallback((id: string, status: Comando['status']) => {
    setComandos(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }, []);

  const addMensagem = useCallback((m: Omit<MensagemChat, 'id' | 'criado_em'>) => {
    setMensagens(prev => [...prev, { ...m, id: String(Date.now()), criado_em: new Date().toISOString() }]);
  }, []);

  return (
    <DataContext.Provider value={{ atendimentos, comandos, mensagens, addAtendimento, updateAtendimento, addComando, updateComandoStatus, addMensagem }}>
      {children}
    </DataContext.Provider>
  );
};
