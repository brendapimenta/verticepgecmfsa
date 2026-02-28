import { Atendimento, Comando, MensagemChat, Usuario } from '@/types';

export const mockUsuarios: Usuario[] = [
  { id: '1', nome: 'Admin', email: 'admin@cmfs.gov.br', perfil: 'administrador', ativo: true },
  { id: '2', nome: 'Recepção', email: 'recepcao@cmfs.gov.br', perfil: 'sala_espera', ativo: true },
  { id: '3', nome: 'Brenda', email: 'brenda@cmfs.gov.br', perfil: 'brenda', ativo: true },
  { id: '4', nome: 'Presidente', email: 'presidente@cmfs.gov.br', perfil: 'presidente', ativo: true },
];

const hoje = new Date().toISOString().split('T')[0];

export const mockAtendimentos: Atendimento[] = [
  {
    id: '1', nome_cidadao: 'José da Silva', tipo: 'Cidadão', tipo_registro: 'Sem agendamento',
    telefone_contato: '(63) 99999-0001', indicado_por: 'Vereador Marcos', assunto: 'Infraestrutura',
    demanda_principal: 'Pavimentação da Rua 10', data_chegada: hoje, hora_chegada: '08:15',
    prioridade: 'Crítica', status: 'Aguardando', responsavel: 'Brenda', criado_por: '2', atualizado_em: new Date().toISOString(),
  },
  {
    id: '2', nome_cidadao: 'Maria Oliveira', tipo: 'Autoridade', tipo_registro: 'Atendimento agendado',
    data_agendada: hoje, hora_agendada: '10:00', telefone_contato: '(63) 99999-0002',
    assunto: 'Convênio Educação', demanda_principal: 'Parceria para creches', data_chegada: hoje,
    hora_chegada: '09:45', prioridade: 'Alta', status: 'Aguardando', responsavel: 'Brenda',
    criado_por: '2', atualizado_em: new Date().toISOString(),
  },
  {
    id: '3', nome_cidadao: 'Carlos Mendes', tipo: 'Vereador', tipo_registro: 'Reunião agendada',
    data_agendada: hoje, hora_agendada: '14:00', telefone_contato: '(63) 99999-0003',
    assunto: 'Projeto de Lei', demanda_principal: 'Discussão PL 45/2026', data_chegada: hoje,
    hora_chegada: '07:30', prioridade: 'Média', status: 'Em Atendimento', responsavel: 'Brenda',
    criado_por: '3', atualizado_em: new Date().toISOString(),
  },
  {
    id: '4', nome_cidadao: 'Ana Paula Souza', tipo: 'Servidor', tipo_registro: 'Sem agendamento',
    telefone_contato: '(63) 99999-0004', assunto: 'Recursos Humanos',
    demanda_principal: 'Progressão funcional', data_chegada: hoje, hora_chegada: '10:30',
    prioridade: 'Baixa', status: 'Aguardando', responsavel: 'Brenda', criado_por: '2',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: '5', nome_cidadao: 'Roberto Lima', tipo: 'Liderança', tipo_registro: 'Sem agendamento',
    telefone_contato: '(63) 99999-0005', indicado_por: 'Secretário Municipal',
    assunto: 'Segurança Pública', demanda_principal: 'Reforço policiamento bairro Sul',
    data_chegada: hoje, hora_chegada: '06:50', prioridade: 'Alta', status: 'Aguardando',
    responsavel: 'Brenda', criado_por: '2', atualizado_em: new Date().toISOString(),
  },
  {
    id: '6', nome_cidadao: 'Fernanda Costa', tipo: 'Família', tipo_registro: 'Sem agendamento',
    telefone_contato: '(63) 99999-0006', assunto: 'Pessoal',
    demanda_principal: 'Assunto familiar', data_chegada: hoje, hora_chegada: '11:00',
    prioridade: 'Média', status: 'Concluído', responsavel: 'Brenda', criado_por: '2',
    atualizado_em: new Date().toISOString(), data_conclusao: new Date().toISOString(),
  },
];

export const mockComandos: Comando[] = [
  {
    id: '1', origem_perfil: 'Presidente', destino_perfil: 'Brenda', tipo_chamada: 'Diretor Geral',
    status: 'Pendente', criado_em: new Date().toISOString(), criado_por_id: '4', criado_por_nome: 'Presidente',
  },
  {
    id: '2', origem_perfil: 'Brenda', destino_perfil: 'Sala de Espera', tipo_chamada: 'Procurador Geral',
    status: 'Em andamento', criado_em: new Date().toISOString(), criado_por_id: '3', criado_por_nome: 'Brenda',
  },
];

export const mockMensagens: MensagemChat[] = [
  { id: '1', atendimento_id: '1', remetente_id: '2', remetente_nome: 'Recepção', mensagem: 'Cidadão José chegou com urgência, solicita pavimentação.', criado_em: new Date().toISOString(), lido: true },
  { id: '2', atendimento_id: '1', remetente_id: '3', remetente_nome: 'Brenda', mensagem: 'Entendido. Vou priorizar como Crítica.', criado_em: new Date().toISOString(), lido: true },
  { id: '3', remetente_id: '3', remetente_nome: 'Brenda', mensagem: 'Presidente, temos atendimento crítico aguardando.', criado_em: new Date().toISOString(), lido: false },
];
