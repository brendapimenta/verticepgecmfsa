import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Atendimento, AutorizacaoFinanceira, Comando, Demanda, MensagemChat, Notificacao, Perfil, Solicitacao, DemandaAtendimento, StatusDemanda, StatusAutorizacao, EventoAgenda, PautaDespacho, StatusPauta } from '@/types';
import { getRouteForRef } from '@/lib/notificationRoutes';

interface DataContextType {
  loading: boolean;
  atendimentos: Atendimento[];
  comandos: Comando[];
  mensagens: MensagemChat[];
  notificacoes: Notificacao[];
  solicitacoes: Solicitacao[];
  demandasAtendimento: DemandaAtendimento[];
  demandas: Demanda[];
  autorizacoes: AutorizacaoFinanceira[];
  eventosAgenda: EventoAgenda[];
  pautasDespacho: PautaDespacho[];
  addAtendimento: (a: Omit<Atendimento, 'id' | 'atualizado_em'>) => void;
  updateAtendimento: (id: string, updates: Partial<Atendimento>) => void;
  confirmarPresenca: (id: string, nomeCidadao: string) => void;
  addComando: (c: Omit<Comando, 'id' | 'criado_em'>) => void;
  updateComandoStatus: (id: string, status: Comando['status']) => void;
  addMensagem: (m: Omit<MensagemChat, 'id' | 'criado_em'>, canal?: 'espera_principal' | 'principal_presidente') => void;
  marcarNotificacaoLida: (id: string) => void;
  addSolicitacao: (s: Omit<Solicitacao, 'id' | 'criado_em'>) => void;
  updateSolicitacaoStatus: (id: string, status: Solicitacao['status']) => void;
  addDemandaAtendimento: (d: Omit<DemandaAtendimento, 'id' | 'criado_em'>, nomeCidadao: string) => void;
  updateDemandaStatus: (id: string, status: DemandaAtendimento['status']) => void;
  addDemanda: (d: Omit<Demanda, 'id' | 'criado_em'>) => void;
  updateDemandaGlobalStatus: (id: string, status: StatusDemanda) => void;
  salvarAnotacoesPresidente: (atendimentoId: string, texto: string, nomeCidadao: string) => void;
  salvarAnotacoesSalaPrincipal: (atendimentoId: string, texto: string, nomeCidadao: string) => void;
  addAutorizacao: (a: Omit<AutorizacaoFinanceira, 'id' | 'criado_em'>) => void;
  concluirAutorizacao: (id: string, concluido_por_id: string, concluido_por_perfil: 'Presidente' | 'Sala Principal') => void;
  updateAutorizacao: (id: string, updates: Partial<AutorizacaoFinanceira>) => void;
  criarAlertaUrgente: (mensagem: string, criado_por_id: string) => void;
  chamarSalaPrincipal: (criado_por_id: string) => void;
  solicitarEncerramento: (atendimentoId: string, nomeCidadao: string, criado_por_id: string) => void;
  addEventoAgenda: (e: Omit<EventoAgenda, 'id' | 'criado_em' | 'atualizado_em'>) => void;
  addEventosAgendaBulk: (eventos: Omit<EventoAgenda, 'id' | 'criado_em' | 'atualizado_em'>[]) => void;
  updateEventoAgenda: (id: string, updates: Partial<EventoAgenda>) => void;
  updateEventosGrupo: (recorrenciaId: string, updates: Partial<EventoAgenda>, apenasFromDate?: string) => void;
  deleteEventoAgenda: (id: string) => void;
  addPautaDespacho: (p: Omit<PautaDespacho, 'id' | 'criado_em' | 'atualizado_em'>) => void;
  updatePautaDespacho: (id: string, updates: Partial<PautaDespacho>) => void;
  decidirPauta: (id: string, decisao: string) => void;
  adiarPauta: (id: string, novoPrazo: string) => void;
  pedirInfoPauta: (id: string, comentario: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [comandos, setComandos] = useState<Comando[]>([]);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [demandasAtendimento, setDemandasAtendimento] = useState<DemandaAtendimento[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [autorizacoes, setAutorizacoes] = useState<AutorizacaoFinanceira[]>([]);
  const [eventosAgenda, setEventosAgenda] = useState<EventoAgenda[]>([]);
  const [pautasDespacho, setPautasDespacho] = useState<PautaDespacho[]>([]);

  // ─── FETCH FROM DATABASE ───
  const fetchAll = useCallback(async () => {
    if (!usuario) return;
    try {
      const [aR, cR, mR, nR, sR, daR, dR, afR, eaR, pdR] = await Promise.all([
        supabase.from('atendimentos').select('*').order('criado_em', { ascending: false }),
        supabase.from('comandos').select('*').order('criado_em', { ascending: false }),
        supabase.from('mensagens_chat').select('*').order('criado_em', { ascending: true }),
        supabase.from('notificacoes').select('*').order('criado_em', { ascending: false }),
        supabase.from('solicitacoes').select('*').order('criado_em', { ascending: false }),
        supabase.from('demandas_atendimento').select('*').order('criado_em', { ascending: false }),
        supabase.from('demandas').select('*').order('criado_em', { ascending: false }),
        supabase.from('autorizacoes_financeiras').select('*').order('criado_em', { ascending: false }),
        supabase.from('eventos_agenda').select('*').order('criado_em', { ascending: false }),
        supabase.from('pautas_despacho').select('*').order('criado_em', { ascending: false }),
      ]);
      if (aR.data) setAtendimentos(aR.data as unknown as Atendimento[]);
      if (cR.data) setComandos(cR.data as unknown as Comando[]);
      if (mR.data) setMensagens(mR.data as unknown as MensagemChat[]);
      if (nR.data) setNotificacoes(nR.data as unknown as Notificacao[]);
      if (sR.data) setSolicitacoes(sR.data as unknown as Solicitacao[]);
      if (daR.data) setDemandasAtendimento(daR.data as unknown as DemandaAtendimento[]);
      if (dR.data) setDemandas(dR.data as unknown as Demanda[]);
      if (afR.data) setAutorizacoes(afR.data as unknown as AutorizacaoFinanceira[]);
      if (eaR.data) setEventosAgenda(eaR.data as unknown as EventoAgenda[]);
      if (pdR.data) setPautasDespacho(pdR.data as unknown as PautaDespacho[]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [usuario?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── REALTIME ───
  useEffect(() => {
    if (!usuario) return;
    const channel = supabase.channel('data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atendimentos' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandos' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens_chat' }, () => fetchAll())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes' }, (payload) => {
        const n = payload.new as unknown as Notificacao;
        setNotificacoes(prev => prev.find(x => x.id === n.id) ? prev : [n, ...prev]);
        window.dispatchEvent(new CustomEvent('nova-notificacao', { detail: n }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitacoes' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'autorizacoes_financeiras' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_agenda' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pautas_despacho' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [usuario?.id, fetchAll]);

  // ─── NOTIFICATION HELPER ───
  const tipoLabels: Record<string, string> = {
    novo_atendimento: 'Novo Atendimento', prioridade_alterada: 'Prioridade Alterada',
    novo_comando: 'Novo Comando', nova_mensagem_chat: 'Nova Mensagem',
    status_atualizado: 'Status Atualizado', nova_solicitacao: 'Nova Solicitação',
    solicitacao_status_atualizada: 'Solicitação Atualizada', ficha_atualizada: 'Ficha Atualizada',
    nova_demanda: 'Nova Demanda', nova_demanda_atendimento: 'Demanda de Atendimento',
    demanda_status_atualizada: 'Demanda Atualizada', nova_autorizacao: 'Nova Autorização',
    autorizacao_concluida: 'Autorização Concluída', alerta_urgente: 'Alerta Urgente',
    chamar_sala_principal: 'Chamar Sala Principal', solicitar_encerramento: 'Solicitar Encerramento',
    novo_evento_agenda: 'Novo Evento', evento_agenda_editado: 'Evento Editado',
    nova_pauta: 'Nova Pauta', pauta_decidida: 'Pauta Decidida',
    pauta_info_solicitada: 'Info Solicitada', pauta_status_atualizada: 'Pauta Atualizada',
    nova_tarefa_operacional: 'Nova Tarefa',
  };

  const URGENT_TYPES = ['alerta_urgente', 'solicitar_encerramento'];

  const dispararPush = useCallback((perfil_destino: string, tipo_notificacao: string, referencia_tipo: string, referencia_id: string, mensagem_resumo: string, usuario_destino_id?: string) => {
    const route = getRouteForRef(referencia_tipo as any, referencia_id);
    const urgente = URGENT_TYPES.includes(tipo_notificacao);
    supabase.functions.invoke('send-push', {
      body: {
        perfil_destino,
        usuario_destino_id: usuario_destino_id || null,
        titulo: tipoLabels[tipo_notificacao] || 'VÉRTICE',
        mensagem: mensagem_resumo,
        url: route,
        tag: `${tipo_notificacao}-${referencia_id}`,
        urgente,
      }
    }).catch(() => {}); // Fire-and-forget
  }, []);

  const criarNotificacao = useCallback(async (perfil_destino: Perfil, tipo_notificacao: Notificacao['tipo_notificacao'], referencia_tipo: Notificacao['referencia_tipo'], referencia_id: string, mensagem_resumo: string, usuario_destino_id?: string) => {
    if (!usuario) return;
    const { data } = await supabase.from('notificacoes').insert({
      instituicao_id: usuario.instituicao_id,
      perfil_destino,
      tipo_notificacao,
      referencia_tipo,
      referencia_id: String(referencia_id),
      mensagem_resumo,
      usuario_destino_id: usuario_destino_id || null,
    }).select().single();
    if (data) {
      const n = data as unknown as Notificacao;
      setNotificacoes(prev => prev.find(x => x.id === n.id) ? prev : [n, ...prev]);
      window.dispatchEvent(new CustomEvent('nova-notificacao', { detail: n }));
      // Dispatch push notification
      dispararPush(perfil_destino, tipo_notificacao, referencia_tipo, referencia_id, mensagem_resumo, usuario_destino_id);
    }
  }, [usuario, dispararPush]);

  // ============ 1) ATENDIMENTOS ============

  const addAtendimento = useCallback(async (a: Omit<Atendimento, 'id' | 'atualizado_em'>) => {
    if (!usuario) return;
    const { data, error } = await supabase.from('atendimentos').insert({
      nome_cidadao: a.nome_cidadao, tipo: a.tipo, tipo_registro: a.tipo_registro,
      data_agendada: a.data_agendada || null, hora_agendada: a.hora_agendada || null,
      telefone_contato: a.telefone_contato, indicado_por: a.indicado_por || null,
      assunto: a.assunto || null, demanda_principal: a.demanda_principal,
      descricao: a.descricao || null, data_chegada: a.data_chegada, hora_chegada: a.hora_chegada,
      prioridade: a.prioridade, status: a.status, responsavel: a.responsavel,
      observacao_recepcao: a.observacao_recepcao || null, foto_url: a.foto_url || null,
      criado_por: a.criado_por || usuario.id, instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (error) { console.error(error); return; }
    if (data) {
      const atend = data as unknown as Atendimento;
      setAtendimentos(prev => [atend, ...prev]);
      const msg = `Novo atendimento criado: ${a.nome_cidadao} – ${a.demanda_principal}.`;
      criarNotificacao('sala_principal', 'novo_atendimento', 'atendimento', atend.id, msg);
      criarNotificacao('presidente', 'novo_atendimento', 'atendimento', atend.id, msg);
    }
  }, [usuario, criarNotificacao]);

  const updateAtendimento = useCallback(async (id: string, updates: Partial<Atendimento>) => {
    if (!usuario) return;
    let oldItem: Atendimento | undefined;
    setAtendimentos(prev => {
      oldItem = prev.find(a => a.id === id);
      if (!oldItem) return prev;
      return prev.map(a => a.id === id ? { ...a, ...updates, atualizado_em: new Date().toISOString() } : a);
    });
    // Notifications
    if (oldItem) {
      if (updates.prioridade && updates.prioridade !== oldItem.prioridade) {
        const isInst = oldItem.tipo === 'Vereador' || oldItem.tipo === 'Autoridade';
        if (isInst && oldItem.prioridade === 'Alta' && updates.prioridade !== 'Alta') {
          criarNotificacao('presidente', 'prioridade_alterada', 'atendimento', id, `Prioridade institucional alterada: ${oldItem.nome_cidadao} (${oldItem.tipo}) – de Alta para ${updates.prioridade}.`);
          criarNotificacao('sala_principal', 'prioridade_alterada', 'atendimento', id, `Prioridade institucional alterada: ${oldItem.nome_cidadao} (${oldItem.tipo}) – de Alta para ${updates.prioridade}.`);
        } else if (updates.prioridade === 'Alta') {
          criarNotificacao('presidente', 'prioridade_alterada', 'atendimento', id, `Atendimento com prioridade ALTA: ${oldItem.nome_cidadao} – ${oldItem.demanda_principal}.`);
        } else {
          criarNotificacao('sala_principal', 'prioridade_alterada', 'atendimento', id, `Prioridade alterada para ${updates.prioridade}: ${oldItem.nome_cidadao} – ${oldItem.demanda_principal}.`);
        }
      }
      if (updates.status && updates.status !== oldItem.status) {
        criarNotificacao('sala_principal', 'status_atualizado', 'atendimento', id, `Status atualizado para ${updates.status}: ${oldItem.nome_cidadao} – ${oldItem.demanda_principal}.`);
        if (updates.status === 'Concluído') {
          criarNotificacao('sala_espera', 'status_atualizado', 'atendimento', id, `Atendimento concluído: ${oldItem.nome_cidadao} – ${oldItem.demanda_principal}.`);
        }
      }
    }
    // Persist
    const { instituicao_id, id: _, ...rest } = updates as any;
    await supabase.from('atendimentos').update(rest).eq('id', id);
  }, [usuario, criarNotificacao]);

  const confirmarPresenca = useCallback(async (id: string, nomeCidadao: string) => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, checkin_realizado: true, checkin_hora: hora, atualizado_em: new Date().toISOString() } : a));
    criarNotificacao('sala_principal', 'status_atualizado', 'atendimento', id, `Check-in confirmado: ${nomeCidadao} está presente.`);
    criarNotificacao('presidente', 'status_atualizado', 'atendimento', id, `Check-in confirmado: ${nomeCidadao} está presente.`);
    await supabase.from('atendimentos').update({ checkin_realizado: true, checkin_hora: hora }).eq('id', id);
  }, [criarNotificacao]);

  // ============ 2) CHATS ============

  const addMensagem = useCallback(async (m: Omit<MensagemChat, 'id' | 'criado_em'>, canal?: 'espera_principal' | 'principal_presidente') => {
    if (!usuario) return;
    const { data } = await supabase.from('mensagens_chat').insert({
      remetente_id: m.remetente_id || usuario.id,
      remetente_nome: m.remetente_nome,
      mensagem: m.mensagem,
      lido: false,
      atendimento_id: m.atendimento_id || null,
      instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (data) {
      setMensagens(prev => [...prev, data as unknown as MensagemChat]);
      const resumo = `Nova mensagem de ${m.remetente_nome} no chat.`;
      if (canal === 'espera_principal') {
        const destino: Perfil = m.remetente_nome === 'Sala Principal' ? 'sala_espera' : 'sala_principal';
        criarNotificacao(destino, 'nova_mensagem_chat', 'chat', data.id, resumo);
      } else if (canal === 'principal_presidente') {
        const destino: Perfil = m.remetente_nome === 'Sala Principal' ? 'presidente' : 'sala_principal';
        criarNotificacao(destino, 'nova_mensagem_chat', 'chat', data.id, resumo);
      }
    }
  }, [usuario, criarNotificacao]);

  // ============ 3) COMANDOS RÁPIDOS ============

  const addComando = useCallback(async (c: Omit<Comando, 'id' | 'criado_em'>) => {
    if (!usuario) return;
    const { data } = await supabase.from('comandos').insert({
      origem_perfil: c.origem_perfil, destino_perfil: c.destino_perfil,
      tipo_chamada: c.tipo_chamada, descricao_customizada: c.descricao_customizada || null,
      status: 'Pendente', criado_por_id: c.criado_por_id, criado_por_nome: c.criado_por_nome,
      instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (data) {
      setComandos(prev => [data as unknown as Comando, ...prev]);
      const desc = c.tipo_chamada === 'Outro' ? c.descricao_customizada : c.tipo_chamada;
      if (c.origem_perfil === 'Presidente') {
        criarNotificacao('sala_principal', 'novo_comando', 'comando', data.id, `Novo comando do Presidente: ${desc}.`);
      } else {
        criarNotificacao('sala_espera', 'novo_comando', 'comando', data.id, `Novo comando da Sala Principal: ${desc}.`);
      }
    }
  }, [usuario, criarNotificacao]);

  const updateComandoStatus = useCallback(async (id: string, status: Comando['status']) => {
    setComandos(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    await supabase.from('comandos').update({ status }).eq('id', id);
  }, []);

  // ============ 4) SOLICITAÇÕES ============

  const addSolicitacao = useCallback(async (s: Omit<Solicitacao, 'id' | 'criado_em'>) => {
    if (!usuario) return;
    const { data } = await supabase.from('solicitacoes').insert({
      origem_perfil: s.origem_perfil, destino_perfil: s.destino_perfil,
      descricao_solicitacao: s.descricao_solicitacao, status: 'Pendente',
      criado_por_id: s.criado_por_id, instituicao_id: usuario.instituicao_id,
      atendimento_id: s.atendimento_id || null,
    }).select().single();
    if (data) {
      setSolicitacoes(prev => [data as unknown as Solicitacao, ...prev]);
      const destinoPerfil: Perfil = s.destino_perfil === 'Sala Principal' ? 'sala_principal' : 'sala_espera';
      criarNotificacao(destinoPerfil, 'nova_solicitacao', 'solicitacao', data.id,
        `Nova solicitação ${s.origem_perfil === 'Presidente' ? 'do Presidente' : 'da Sala Principal'}: ${s.descricao_solicitacao}.`);
    }
  }, [usuario, criarNotificacao]);

  const updateSolicitacaoStatus = useCallback(async (id: string, status: Solicitacao['status']) => {
    let oldItem: Solicitacao | undefined;
    setSolicitacoes(prev => {
      oldItem = prev.find(s => s.id === id);
      return prev.map(s => s.id === id ? { ...s, status } : s);
    });
    if (oldItem && oldItem.status !== status) {
      const origemPerfil: Perfil = oldItem.origem_perfil === 'Presidente' ? 'presidente' : 'sala_principal';
      criarNotificacao(origemPerfil, 'solicitacao_status_atualizada', 'solicitacao', id, `Solicitação atualizada para ${status}: ${oldItem.descricao_solicitacao}.`);
    }
    await supabase.from('solicitacoes').update({ status }).eq('id', id);
  }, [criarNotificacao]);

  // ============ 5) DEMANDAS ============

  const addDemandaAtendimento = useCallback(async (d: Omit<DemandaAtendimento, 'id' | 'criado_em'>, nomeCidadao: string) => {
    if (!usuario) return;
    const { data } = await supabase.from('demandas_atendimento').insert({
      atendimento_id: d.atendimento_id, origem_perfil: d.origem_perfil,
      destino_perfil: d.destino_perfil, descricao_demanda: d.descricao_demanda,
      status: 'Pendente', criado_por_id: d.criado_por_id, instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (data) {
      setDemandasAtendimento(prev => [data as unknown as DemandaAtendimento, ...prev]);
      criarNotificacao('sala_espera', 'nova_demanda_atendimento', 'demanda_atendimento', data.id,
        `Nova demanda da Sala Principal sobre o atendimento de ${nomeCidadao}: ${d.descricao_demanda}.`);
    }
  }, [usuario, criarNotificacao]);

  const updateDemandaStatus = useCallback(async (id: string, status: DemandaAtendimento['status']) => {
    setDemandasAtendimento(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    await supabase.from('demandas_atendimento').update({ status }).eq('id', id);
  }, []);

  const addDemanda = useCallback(async (d: Omit<Demanda, 'id' | 'criado_em'>) => {
    if (!usuario) return;
    const { data } = await supabase.from('demandas').insert({
      titulo: d.titulo, descricao: d.descricao, origem_perfil: d.origem_perfil,
      destino_perfil: d.destino_perfil, atendimento_id: d.atendimento_id || null,
      prioridade: d.prioridade, status: 'Pendente', prazo: d.prazo || null,
      criado_por_id: d.criado_por_id, instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (data) {
      setDemandas(prev => [data as unknown as Demanda, ...prev]);
      const destinoPerfil: Perfil = d.destino_perfil === 'Sala Principal' ? 'sala_principal' : 'sala_espera';
      criarNotificacao(destinoPerfil, 'nova_demanda', 'demanda', data.id, `Nova demanda: ${d.titulo} (prioridade ${d.prioridade}).`);
    }
  }, [usuario, criarNotificacao]);

  const updateDemandaGlobalStatus = useCallback(async (id: string, status: StatusDemanda) => {
    let oldItem: Demanda | undefined;
    setDemandas(prev => {
      oldItem = prev.find(d => d.id === id);
      return prev.map(d => d.id === id ? { ...d, status } : d);
    });
    if (oldItem && oldItem.status !== status) {
      const criadorPerfil: Perfil = oldItem.origem_perfil === 'Presidente' ? 'presidente' : oldItem.origem_perfil === 'Sala Principal' ? 'sala_principal' : 'sala_espera';
      criarNotificacao(criadorPerfil, 'demanda_status_atualizada', 'demanda', id, `Demanda "${oldItem.titulo}" atualizada para ${status}.`);
    }
    await supabase.from('demandas').update({ status }).eq('id', id);
  }, [criarNotificacao]);

  // ============ ANOTAÇÕES ============

  const salvarAnotacoesPresidente = useCallback(async (atendimentoId: string, texto: string, nomeCidadao: string) => {
    const now = new Date().toISOString();
    setAtendimentos(prev => prev.map(a => a.id === atendimentoId ? { ...a, anotacoes_presidente: texto, anotacoes_presidente_atualizado_em: now, atualizado_em: now } : a));
    criarNotificacao('sala_principal', 'ficha_atualizada', 'atendimento', atendimentoId, `O Presidente atualizou as anotações do atendimento de ${nomeCidadao}.`);
    await supabase.from('atendimentos').update({ anotacoes_presidente: texto, anotacoes_presidente_atualizado_em: now }).eq('id', atendimentoId);
  }, [criarNotificacao]);

  const salvarAnotacoesSalaPrincipal = useCallback(async (atendimentoId: string, texto: string, nomeCidadao: string) => {
    const now = new Date().toISOString();
    setAtendimentos(prev => prev.map(a => a.id === atendimentoId ? { ...a, anotacoes_sala_principal: texto, anotacoes_sala_principal_atualizado_em: now, atualizado_em: now } : a));
    criarNotificacao('presidente', 'ficha_atualizada', 'atendimento', atendimentoId, `Sala Principal atualizou as anotações do atendimento de ${nomeCidadao}.`);
    await supabase.from('atendimentos').update({ anotacoes_sala_principal: texto, anotacoes_sala_principal_atualizado_em: now }).eq('id', atendimentoId);
  }, [criarNotificacao]);

  // ============ 6) AUTORIZAÇÕES FINANCEIRAS ============

  const addAutorizacao = useCallback(async (a: Omit<AutorizacaoFinanceira, 'id' | 'criado_em'>) => {
    if (!usuario) return;
    const { data } = await supabase.from('autorizacoes_financeiras').insert({
      titulo: a.titulo, descricao: a.descricao, valor: a.valor ?? null,
      status: 'Pendente', criado_por_id: a.criado_por_id,
      criado_por_perfil: a.criado_por_perfil, instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (data) {
      setAutorizacoes(prev => [data as unknown as AutorizacaoFinanceira, ...prev]);
      criarNotificacao('presidente', 'nova_autorizacao', 'autorizacao_financeira', data.id, `Nova autorização financeira: ${a.titulo}.`);
    }
  }, [usuario, criarNotificacao]);

  const concluirAutorizacao = useCallback(async (id: string, concluido_por_id: string, concluido_por_perfil: 'Presidente' | 'Sala Principal') => {
    let oldItem: AutorizacaoFinanceira | undefined;
    const now = new Date().toISOString();
    setAutorizacoes(prev => {
      oldItem = prev.find(a => a.id === id);
      return prev.map(a => a.id === id ? { ...a, status: 'Concluída' as StatusAutorizacao, resolvido_em: now, concluido_por_id, concluido_por_perfil } : a);
    });
    if (oldItem) {
      const destinoPerfil: Perfil = concluido_por_perfil === 'Presidente' ? 'sala_principal' : 'presidente';
      criarNotificacao(destinoPerfil, 'autorizacao_concluida', 'autorizacao_financeira', id, `Autorização financeira "${oldItem.titulo}" concluída por ${concluido_por_perfil}.`);
    }
    await supabase.from('autorizacoes_financeiras').update({ status: 'Concluída', resolvido_em: now, concluido_por_id, concluido_por_perfil }).eq('id', id);
  }, [criarNotificacao]);

  const updateAutorizacao = useCallback(async (id: string, updates: Partial<AutorizacaoFinanceira>) => {
    setAutorizacoes(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    const { id: _, instituicao_id, ...rest } = updates as any;
    await supabase.from('autorizacoes_financeiras').update(rest).eq('id', id);
  }, []);

  const marcarNotificacaoLida = useCallback(async (id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  }, []);

  const criarAlertaUrgente = useCallback((mensagem: string, criado_por_id: string) => {
    criarNotificacao('presidente', 'alerta_urgente', 'alerta', criado_por_id, `Alerta da Sala Principal: ${mensagem}`);
  }, [criarNotificacao]);

  const chamarSalaPrincipal = useCallback((criado_por_id: string) => {
    criarNotificacao('sala_principal', 'chamar_sala_principal', 'comando', criado_por_id, 'O Presidente solicitou sua presença.');
  }, [criarNotificacao]);

  const solicitarEncerramento = useCallback((atendimentoId: string, nomeCidadao: string, _criado_por_id: string) => {
    criarNotificacao('sala_principal', 'solicitar_encerramento', 'atendimento', atendimentoId, `O Presidente solicitou o encerramento do atendimento de ${nomeCidadao}.`);
  }, [criarNotificacao]);

  // ============ 7) AGENDA ============

  const addEventoAgenda = useCallback(async (e: Omit<EventoAgenda, 'id' | 'criado_em' | 'atualizado_em'>) => {
    if (!usuario) return;
    const insertData: any = {
      titulo: e.titulo, descricao: e.descricao || null, tipo_evento: e.tipo_evento,
      local: e.local || null, data_inicio: e.data_inicio, hora_inicio: e.hora_inicio,
      data_fim: e.data_fim, hora_fim: e.hora_fim,
      relacionado_a_atendimento_id: e.relacionado_a_atendimento_id || null,
      criado_por_id: e.criado_por_id, criado_por_perfil: e.criado_por_perfil,
      instituicao_id: usuario.instituicao_id,
      recorrencia_id: (e as any).recorrencia_id || null,
    };
    const { data } = await supabase.from('eventos_agenda').insert(insertData).select().single();
    if (data) {
      setEventosAgenda(prev => [data as unknown as EventoAgenda, ...prev]);
      const destino: Perfil = e.criado_por_perfil === 'Presidente' ? 'sala_principal' : 'presidente';
      criarNotificacao(destino, 'novo_evento_agenda', 'evento_agenda', data.id, `Novo evento na agenda: ${e.titulo} em ${e.data_inicio}.`);
    }
  }, [usuario, criarNotificacao]);

  const addEventosAgendaBulk = useCallback(async (eventos: Omit<EventoAgenda, 'id' | 'criado_em' | 'atualizado_em'>[]) => {
    if (!usuario || eventos.length === 0) return;
    const rows = eventos.map(e => ({
      titulo: e.titulo, descricao: e.descricao || null, tipo_evento: e.tipo_evento,
      local: e.local || null, data_inicio: e.data_inicio, hora_inicio: e.hora_inicio,
      data_fim: e.data_fim, hora_fim: e.hora_fim,
      relacionado_a_atendimento_id: e.relacionado_a_atendimento_id || null,
      criado_por_id: e.criado_por_id, criado_por_perfil: e.criado_por_perfil,
      instituicao_id: usuario.instituicao_id,
      recorrencia_id: (e as any).recorrencia_id || null,
    }));
    const { data } = await supabase.from('eventos_agenda').insert(rows).select();
    if (data) {
      setEventosAgenda(prev => [...(data as unknown as EventoAgenda[]), ...prev]);
    }
  }, [usuario]);

  const updateEventoAgenda = useCallback(async (id: string, updates: Partial<EventoAgenda>) => {
    let oldItem: EventoAgenda | undefined;
    setEventosAgenda(prev => {
      oldItem = prev.find(e => e.id === id);
      return prev.map(e => e.id === id ? { ...e, ...updates, atualizado_em: new Date().toISOString() } : e);
    });
    if (oldItem) {
      const destino: Perfil = oldItem.criado_por_perfil === 'Presidente' ? 'sala_principal' : 'presidente';
      criarNotificacao(destino, 'evento_agenda_editado', 'evento_agenda', id, `Evento editado: ${updates.titulo || oldItem.titulo}.`);
    }
    const { id: _, instituicao_id, recorrencia_id, ...rest } = updates as any;
    await supabase.from('eventos_agenda').update(rest).eq('id', id);
  }, [criarNotificacao]);

  const updateEventosGrupo = useCallback(async (recorrenciaId: string, updates: Partial<EventoAgenda>, apenasFromDate?: string) => {
    const { id: _, instituicao_id, recorrencia_id, ...rest } = updates as any;
    // Update local state
    setEventosAgenda(prev => prev.map(e => {
      if (e.recorrencia_id !== recorrenciaId) return e;
      if (apenasFromDate && e.data_inicio < apenasFromDate) return e;
      return { ...e, ...updates, atualizado_em: new Date().toISOString() };
    }));
    // Update in DB
    let query = supabase.from('eventos_agenda').update(rest).eq('recorrencia_id', recorrenciaId);
    if (apenasFromDate) {
      query = query.gte('data_inicio', apenasFromDate);
    }
    await query;
  }, []);

  const deleteEventoAgenda = useCallback(async (id: string) => {
    setEventosAgenda(prev => prev.filter(e => e.id !== id));
    await supabase.from('eventos_agenda').delete().eq('id', id);
  }, []);

  // ============ 8) PAUTA DESPACHO ============

  const addPautaDespacho = useCallback(async (p: Omit<PautaDespacho, 'id' | 'criado_em' | 'atualizado_em'>) => {
    if (!usuario) return;
    const { data } = await supabase.from('pautas_despacho').insert({
      titulo: p.titulo, categoria: p.categoria, tipo_registro: p.tipo_registro,
      descricao_resumida: p.descricao_resumida, contexto_para_fala: p.contexto_para_fala,
      perguntas_para_decisao: p.perguntas_para_decisao, status: p.status,
      prioridade: p.prioridade, responsavel: p.responsavel, prazo: p.prazo || null,
      criado_por_id: p.criado_por_id, criado_por_perfil: p.criado_por_perfil,
      vinculado_a_tipo: p.vinculado_a_tipo || null, vinculado_a_id: p.vinculado_a_id || null,
      instituicao_id: usuario.instituicao_id,
    }).select().single();
    if (data) {
      setPautasDespacho(prev => [data as unknown as PautaDespacho, ...prev]);
      const destino: Perfil = p.criado_por_perfil === 'Sala Principal' ? 'presidente' : 'sala_principal';
      criarNotificacao(destino, 'nova_pauta', 'pauta_despacho', data.id, `Nova pauta para despacho: ${p.titulo} (${p.prioridade}).`);
    }
  }, [usuario, criarNotificacao]);

  const updatePautaDespacho = useCallback(async (id: string, updates: Partial<PautaDespacho>) => {
    setPautasDespacho(prev => prev.map(p => p.id === id ? { ...p, ...updates, atualizado_em: new Date().toISOString() } : p));
    const { id: _, instituicao_id, ...rest } = updates as any;
    await supabase.from('pautas_despacho').update(rest).eq('id', id);
  }, []);

  const decidirPauta = useCallback(async (id: string, decisao: string) => {
    const old = pautasDespacho.find(p => p.id === id);
    setPautasDespacho(prev => prev.map(p => p.id === id ? { ...p, decisao_registrada: decisao, status: 'Decidido' as StatusPauta, atualizado_em: new Date().toISOString() } : p));
    if (old) {
      criarNotificacao('sala_principal', 'pauta_decidida', 'pauta_despacho', id, `Pauta decidida: ${old.titulo}.`);
    }
    await supabase.from('pautas_despacho').update({ decisao_registrada: decisao, status: 'Decidido' }).eq('id', id);
  }, [pautasDespacho, criarNotificacao]);

  const adiarPauta = useCallback(async (id: string, novoPrazo: string) => {
    setPautasDespacho(prev => prev.map(p => p.id === id ? { ...p, prazo: novoPrazo, atualizado_em: new Date().toISOString() } : p));
    criarNotificacao('sala_principal', 'pauta_status_atualizada', 'pauta_despacho', id, `Pauta adiada. Novo prazo: ${novoPrazo}.`);
    await supabase.from('pautas_despacho').update({ prazo: novoPrazo }).eq('id', id);
  }, [criarNotificacao]);

  const pedirInfoPauta = useCallback(async (id: string, comentario: string) => {
    setPautasDespacho(prev => prev.map(p => p.id === id ? { ...p, comentario_presidente: comentario, atualizado_em: new Date().toISOString() } : p));
    criarNotificacao('sala_principal', 'pauta_info_solicitada', 'pauta_despacho', id, `Presidente solicitou mais informações sobre a pauta.`);
    await supabase.from('pautas_despacho').update({ comentario_presidente: comentario }).eq('id', id);
  }, [criarNotificacao]);

  return (
    <DataContext.Provider value={{
      loading, atendimentos, comandos, mensagens, notificacoes, solicitacoes,
      demandasAtendimento, demandas, autorizacoes, eventosAgenda, pautasDespacho,
      addAtendimento, updateAtendimento, confirmarPresenca,
      addComando, updateComandoStatus,
      addMensagem, marcarNotificacaoLida,
      addSolicitacao, updateSolicitacaoStatus,
      addDemandaAtendimento, updateDemandaStatus,
      addDemanda, updateDemandaGlobalStatus,
      salvarAnotacoesPresidente, salvarAnotacoesSalaPrincipal,
      addAutorizacao, concluirAutorizacao, updateAutorizacao,
      criarAlertaUrgente, chamarSalaPrincipal, solicitarEncerramento,
      addEventoAgenda, addEventosAgendaBulk, updateEventoAgenda, updateEventosGrupo, deleteEventoAgenda,
      addPautaDespacho, updatePautaDespacho, decidirPauta, adiarPauta, pedirInfoPauta,
    }}>
      {children}
    </DataContext.Provider>
  );
};
