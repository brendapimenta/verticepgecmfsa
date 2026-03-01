export type Perfil = 'administrador' | 'sala_espera' | 'brenda' | 'presidente';

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
  anotacoes_brenda?: string;
  anotacoes_brenda_atualizado_em?: string;
  foto_url?: string;
}

export interface MensagemChat {
  id: string;
  atendimento_id?: string;
  remetente_id: string;
  remetente_nome: string;
  mensagem: string;
  criado_em: string;
  lido: boolean;
}

export interface Comando {
  id: string;
  origem_perfil: 'Presidente' | 'Brenda';
  destino_perfil: 'Brenda' | 'Sala de Espera';
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
  origem_perfil: 'Presidente' | 'Brenda';
  destino_perfil: 'Brenda' | 'Sala de Espera';
  atendimento_id?: string;
  descricao_solicitacao: string;
  status: StatusSolicitacao;
  criado_em: string;
  criado_por_id: string;
}

export type StatusDemanda = 'Pendente' | 'Em andamento' | 'Concluída';

export interface DemandaAtendimento {
  id: string;
  atendimento_id: string;
  origem_perfil: 'Brenda';
  destino_perfil: 'Sala de Espera';
  descricao_demanda: string;
  status: StatusDemanda;
  criado_em: string;
  criado_por_id: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  origem_perfil: 'Presidente' | 'Brenda' | 'Sala de Espera';
  destino_perfil: 'Brenda' | 'Sala de Espera';
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
  titulo: string;
  descricao: string;
  valor?: number;
  status: StatusAutorizacao;
  criado_em: string;
  criado_por_id: string;
  criado_por_perfil: 'Brenda';
  resolvido_em?: string;
  concluido_por_id?: string;
  concluido_por_perfil?: 'Presidente' | 'Brenda';
}

export type TipoNotificacao = 'novo_atendimento' | 'prioridade_alterada' | 'novo_comando' | 'nova_mensagem_chat' | 'status_atualizado' | 'nova_solicitacao' | 'solicitacao_status_atualizada' | 'ficha_atualizada' | 'nova_demanda' | 'nova_demanda_atendimento' | 'demanda_status_atualizada' | 'nova_autorizacao' | 'autorizacao_concluida' | 'alerta_urgente' | 'chamar_brenda' | 'solicitar_encerramento';

export type ReferenciaTipo = 'atendimento' | 'comando' | 'chat' | 'solicitacao' | 'demanda' | 'demanda_atendimento' | 'autorizacao_financeira' | 'alerta';

export interface Notificacao {
  id: string;
  usuario_destino_id?: string;
  perfil_destino: Perfil;
  tipo_notificacao: TipoNotificacao;
  referencia_tipo: ReferenciaTipo;
  referencia_id: string;
  mensagem_resumo: string;
  lida: boolean;
  criado_em: string;
}
