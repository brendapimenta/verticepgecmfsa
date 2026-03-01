export type Perfil = 'administrador' | 'sala_espera' | 'sala_principal' | 'presidente';

export type TipoCidadao = 'Autoridade' | 'Vereador' | 'Administração' | 'Liderança' | 'Assessor' | 'Servidor' | 'Efetivo' | 'Família' | 'Cidadão';

export type TipoRegistro = 'Sem agendamento' | 'Atendimento agendado' | 'Reunião agendada';

export type Prioridade = 'Baixa' | 'Média' | 'Alta';

export type StatusAtendimento = 'Aguardando' | 'Em Atendimento' | 'Concluído' | 'Adiado';

export type StatusComando = 'Pendente' | 'Em andamento' | 'Concluído';

export type TipoChamada =
  | 'Diretor Geral'
  | 'Procurador Geral'
  | 'Controladora'
  | 'Gerência de Recursos Humanos'
  | 'Gerência Legislativa'
  | 'Gerência Financeira'
  | 'Tesoureiro'
  | 'Guarda Municipal'
  | 'ASCOM'
  | 'Outro';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface Atendimento {
  id: string;
  instituicao_id?: string;
  nome_cidadao: string;
  tipo: TipoCidadao;
  tipo_registro: TipoRegistro;
  data_agendada?: string;
  hora_agendada?: string;
  telefone_contato: string;
  indicado_por?: string;
  assunto?: string;
  demanda_principal: string;
  descricao?: string;
  data_chegada: string;
  hora_chegada: string;
  prioridade: Prioridade;
  status: StatusAtendimento;
  responsavel: string;
  observacao_recepcao?: string;
  encaminhamento?: string;
  data_conclusao?: string;
  criado_por: string;
  atualizado_em: string;
  anotacoes_presidente?: string;
  anotacoes_presidente_atualizado_em?: string;
  anotacoes_sala_principal?: string;
  anotacoes_sala_principal_atualizado_em?: string;
  foto_url?: string;
  checkin_realizado?: boolean;
  checkin_hora?: string;
}

export interface MensagemChat {
  id: string;
  instituicao_id?: string;
  atendimento_id?: string;
  remetente_id: string;
  remetente_nome: string;
  mensagem: string;
  criado_em: string;
  lido: boolean;
}

export interface Comando {
  id: string;
  instituicao_id?: string;
  origem_perfil: 'Presidente' | 'Sala Principal';
  destino_perfil: 'Sala Principal' | 'Sala de Espera';
  tipo_chamada: TipoChamada;
  descricao_customizada?: string;
  status: StatusComando;
  criado_em: string;
  criado_por_id: string;
  criado_por_nome: string;
}

export type StatusSolicitacao = 'Pendente' | 'Em andamento' | 'Concluída';

export interface Solicitacao {
  id: string;
  instituicao_id?: string;
  origem_perfil: 'Presidente' | 'Sala Principal';
  destino_perfil: 'Sala Principal' | 'Sala de Espera';
  atendimento_id?: string;
  descricao_solicitacao: string;
  status: StatusSolicitacao;
  criado_em: string;
  criado_por_id: string;
}

export type StatusDemanda = 'Pendente' | 'Em andamento' | 'Concluída';

export interface DemandaAtendimento {
  id: string;
  instituicao_id?: string;
  atendimento_id: string;
  origem_perfil: 'Sala Principal';
  destino_perfil: 'Sala de Espera';
  descricao_demanda: string;
  status: StatusDemanda;
  criado_em: string;
  criado_por_id: string;
}

export interface Demanda {
  id: string;
  instituicao_id?: string;
  titulo: string;
  descricao: string;
  origem_perfil: 'Presidente' | 'Sala Principal' | 'Sala de Espera';
  destino_perfil: 'Sala Principal' | 'Sala de Espera';
  atendimento_id?: string;
  prioridade: Prioridade;
  status: StatusDemanda;
  prazo?: string;
  criado_em: string;
  criado_por_id: string;
}

export type StatusAutorizacao = 'Pendente' | 'Concluída';

export interface AutorizacaoFinanceira {
  id: string;
  instituicao_id?: string;
  titulo: string;
  descricao: string;
  valor?: number;
  status: StatusAutorizacao;
  criado_em: string;
  criado_por_id: string;
  criado_por_perfil: 'Sala Principal';
  resolvido_em?: string;
  concluido_por_id?: string;
  concluido_por_perfil?: 'Presidente' | 'Sala Principal';
}

export type TipoEvento = 'Atendimento' | 'Reunião' | 'Sessão' | 'Viagem' | 'Outro';

// ============ PAUTA DESPACHO ============

export type CategoriaPauta = 'Compras' | 'RH' | 'Contratos' | 'Projetos de Lei' | 'Acordos Políticos' | 'Viagens' | 'Estrutura Interna' | 'Outro';

export type TipoRegistroPauta = 'Decisão Presidencial' | 'Tarefa Operacional';

export type StatusPauta = 'Pendente' | 'Em Reunião' | 'Decidido' | 'Em Execução' | 'Concluído';

export type PrioridadePauta = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type VinculoTipo = 'Contrato' | 'Projeto de Lei' | 'Atendimento' | 'Autorização Financeira' | 'Viagem' | 'Outro';

export interface PautaDespacho {
  id: string;
  instituicao_id?: string;
  titulo: string;
  categoria: CategoriaPauta;
  tipo_registro: TipoRegistroPauta;
  descricao_resumida: string;
  contexto_para_fala: string;
  perguntas_para_decisao: string;
  decisao_registrada?: string;
  comentario_presidente?: string;
  status: StatusPauta;
  prioridade: PrioridadePauta;
  responsavel: 'Sala Principal' | 'Presidente';
  prazo?: string;
  criado_em: string;
  atualizado_em: string;
  criado_por_id: string;
  criado_por_perfil: 'Sala Principal' | 'Presidente';
  vinculado_a_tipo?: VinculoTipo;
  vinculado_a_id?: string;
}

export interface EventoAgenda {
  id: string;
  instituicao_id?: string;
  titulo: string;
  descricao?: string;
  tipo_evento: TipoEvento;
  local?: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  relacionado_a_atendimento_id?: string;
  criado_por_id: string;
  criado_por_perfil: 'Presidente' | 'Sala Principal';
  criado_em: string;
  atualizado_em: string;
}

export type TipoNotificacao = 'novo_atendimento' | 'prioridade_alterada' | 'novo_comando' | 'nova_mensagem_chat' | 'status_atualizado' | 'nova_solicitacao' | 'solicitacao_status_atualizada' | 'ficha_atualizada' | 'nova_demanda' | 'nova_demanda_atendimento' | 'demanda_status_atualizada' | 'nova_autorizacao' | 'autorizacao_concluida' | 'alerta_urgente' | 'chamar_sala_principal' | 'solicitar_encerramento' | 'novo_evento_agenda' | 'evento_agenda_editado' | 'nova_pauta' | 'pauta_decidida' | 'pauta_info_solicitada' | 'pauta_status_atualizada' | 'nova_tarefa_operacional';

export type ReferenciaTipo = 'atendimento' | 'comando' | 'chat' | 'solicitacao' | 'demanda' | 'demanda_atendimento' | 'autorizacao_financeira' | 'alerta' | 'evento_agenda' | 'pauta_despacho';

export interface Notificacao {
  id: string;
  instituicao_id?: string;
  usuario_destino_id?: string;
  perfil_destino: Perfil;
  tipo_notificacao: TipoNotificacao;
  referencia_tipo: ReferenciaTipo;
  referencia_id: string;
  mensagem_resumo: string;
  lida: boolean;
  criado_em: string;
}

// ============ AUDITORIA ============

export type NivelSensibilidade = 'normal' | 'estratégico' | 'financeiro';

export type TipoAcaoAuditoria =
  | 'login'
  | 'logout'
  | 'criar_atendimento'
  | 'editar_atendimento'
  | 'alterar_prioridade'
  | 'alterar_status'
  | 'checkin'
  | 'protocolo_encerramento'
  | 'enviar_alerta'
  | 'comando_rapido'
  | 'criar_demanda'
  | 'criar_solicitacao'
  | 'criar_autorizacao'
  | 'concluir_autorizacao'
  | 'editar_autorizacao'
  | 'alterar_ficha'
  | 'mudanca_tema'
  | 'criar_evento'
  | 'editar_evento'
  | 'excluir_evento'
  | 'chamar_sala_principal'
  | 'criar_pauta'
  | 'decidir_pauta'
  | 'adiar_pauta'
  | 'pedir_info_pauta'
  | 'criar_tarefa_operacional'
  | 'alterar_status_pauta';

export type ModuloAuditoria =
  | 'autenticação'
  | 'atendimento'
  | 'fila'
  | 'comandos'
  | 'demandas'
  | 'solicitações'
  | 'financeiro'
  | 'agenda'
  | 'chat'
  | 'sistema';

export interface RegistroAuditoria {
  id: string;
  data_hora: string;
  usuario_id: string;
  nome_usuario: string;
  perfil_usuario: Perfil;
  tipo_acao: TipoAcaoAuditoria;
  modulo: ModuloAuditoria;
  referencia_tipo?: ReferenciaTipo;
  referencia_id?: string;
  descricao_resumida: string;
  valor_anterior?: string;
  valor_novo?: string;
  nivel_sensibilidade: NivelSensibilidade;
  ip_acesso?: string;
  dispositivo?: string;
}
