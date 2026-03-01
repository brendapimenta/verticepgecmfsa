import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  RegistroAuditoria, TipoAcaoAuditoria, ModuloAuditoria,
  NivelSensibilidade, ReferenciaTipo, Perfil
} from '@/types';

interface AuditContextType {
  registros: RegistroAuditoria[];
  registrarAuditoria: (params: {
    usuario_id: string;
    nome_usuario: string;
    perfil_usuario: Perfil;
    tipo_acao: TipoAcaoAuditoria;
    modulo: ModuloAuditoria;
    descricao_resumida: string;
    referencia_tipo?: ReferenciaTipo;
    referencia_id?: string;
    valor_anterior?: string;
    valor_novo?: string;
    nivel_sensibilidade?: NivelSensibilidade;
  }) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export const useAudit = () => {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error('useAudit must be used within AuditProvider');
  return ctx;
};

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);

  const registrarAuditoria = useCallback((params: {
    usuario_id: string;
    nome_usuario: string;
    perfil_usuario: Perfil;
    tipo_acao: TipoAcaoAuditoria;
    modulo: ModuloAuditoria;
    descricao_resumida: string;
    referencia_tipo?: ReferenciaTipo;
    referencia_id?: string;
    valor_anterior?: string;
    valor_novo?: string;
    nivel_sensibilidade?: NivelSensibilidade;
  }) => {
    const registro: RegistroAuditoria = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      data_hora: new Date().toISOString(),
      usuario_id: params.usuario_id,
      nome_usuario: params.nome_usuario,
      perfil_usuario: params.perfil_usuario,
      tipo_acao: params.tipo_acao,
      modulo: params.modulo,
      descricao_resumida: params.descricao_resumida,
      referencia_tipo: params.referencia_tipo,
      referencia_id: params.referencia_id,
      valor_anterior: params.valor_anterior,
      valor_novo: params.valor_novo,
      nivel_sensibilidade: params.nivel_sensibilidade || 'normal',
      dispositivo: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    };
    setRegistros(prev => [registro, ...prev]);
  }, []);

  return (
    <AuditContext.Provider value={{ registros, registrarAuditoria }}>
      {children}
    </AuditContext.Provider>
  );
};
