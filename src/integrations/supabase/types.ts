export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atendimentos: {
        Row: {
          anotacoes_presidente: string | null
          anotacoes_presidente_atualizado_em: string | null
          anotacoes_sala_principal: string | null
          anotacoes_sala_principal_atualizado_em: string | null
          assunto: string | null
          atualizado_em: string
          checkin_hora: string | null
          checkin_realizado: boolean | null
          criado_em: string
          criado_por: string
          data_agendada: string | null
          data_chegada: string
          data_conclusao: string | null
          demanda_principal: string
          descricao: string | null
          encaminhamento: string | null
          foto_url: string | null
          hora_agendada: string | null
          hora_chegada: string
          id: string
          indicado_por: string | null
          instituicao_id: string
          nome_cidadao: string
          observacao_recepcao: string | null
          prioridade: string
          responsavel: string
          status: string
          telefone_contato: string
          tipo: string
          tipo_registro: string
        }
        Insert: {
          anotacoes_presidente?: string | null
          anotacoes_presidente_atualizado_em?: string | null
          anotacoes_sala_principal?: string | null
          anotacoes_sala_principal_atualizado_em?: string | null
          assunto?: string | null
          atualizado_em?: string
          checkin_hora?: string | null
          checkin_realizado?: boolean | null
          criado_em?: string
          criado_por: string
          data_agendada?: string | null
          data_chegada: string
          data_conclusao?: string | null
          demanda_principal: string
          descricao?: string | null
          encaminhamento?: string | null
          foto_url?: string | null
          hora_agendada?: string | null
          hora_chegada: string
          id?: string
          indicado_por?: string | null
          instituicao_id: string
          nome_cidadao: string
          observacao_recepcao?: string | null
          prioridade?: string
          responsavel?: string
          status?: string
          telefone_contato?: string
          tipo: string
          tipo_registro: string
        }
        Update: {
          anotacoes_presidente?: string | null
          anotacoes_presidente_atualizado_em?: string | null
          anotacoes_sala_principal?: string | null
          anotacoes_sala_principal_atualizado_em?: string | null
          assunto?: string | null
          atualizado_em?: string
          checkin_hora?: string | null
          checkin_realizado?: boolean | null
          criado_em?: string
          criado_por?: string
          data_agendada?: string | null
          data_chegada?: string
          data_conclusao?: string | null
          demanda_principal?: string
          descricao?: string | null
          encaminhamento?: string | null
          foto_url?: string | null
          hora_agendada?: string | null
          hora_chegada?: string
          id?: string
          indicado_por?: string | null
          instituicao_id?: string
          nome_cidadao?: string
          observacao_recepcao?: string | null
          prioridade?: string
          responsavel?: string
          status?: string
          telefone_contato?: string
          tipo?: string
          tipo_registro?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      autorizacoes_financeiras: {
        Row: {
          concluido_por_id: string | null
          concluido_por_perfil: string | null
          criado_em: string
          criado_por_id: string
          criado_por_perfil: string
          descricao: string
          id: string
          instituicao_id: string
          resolvido_em: string | null
          status: string
          titulo: string
          valor: number | null
        }
        Insert: {
          concluido_por_id?: string | null
          concluido_por_perfil?: string | null
          criado_em?: string
          criado_por_id: string
          criado_por_perfil?: string
          descricao?: string
          id?: string
          instituicao_id: string
          resolvido_em?: string | null
          status?: string
          titulo: string
          valor?: number | null
        }
        Update: {
          concluido_por_id?: string | null
          concluido_por_perfil?: string | null
          criado_em?: string
          criado_por_id?: string
          criado_por_perfil?: string
          descricao?: string
          id?: string
          instituicao_id?: string
          resolvido_em?: string | null
          status?: string
          titulo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "autorizacoes_financeiras_concluido_por_id_fkey"
            columns: ["concluido_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacoes_financeiras_concluido_por_id_fkey"
            columns: ["concluido_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacoes_financeiras_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacoes_financeiras_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacoes_financeiras_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      comandos: {
        Row: {
          criado_em: string
          criado_por_id: string
          criado_por_nome: string
          descricao_customizada: string | null
          destino_perfil: string
          id: string
          instituicao_id: string
          origem_perfil: string
          status: string
          tipo_chamada: string
        }
        Insert: {
          criado_em?: string
          criado_por_id: string
          criado_por_nome: string
          descricao_customizada?: string | null
          destino_perfil: string
          id?: string
          instituicao_id: string
          origem_perfil: string
          status?: string
          tipo_chamada: string
        }
        Update: {
          criado_em?: string
          criado_por_id?: string
          criado_por_nome?: string
          descricao_customizada?: string | null
          destino_perfil?: string
          id?: string
          instituicao_id?: string
          origem_perfil?: string
          status?: string
          tipo_chamada?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandos_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandos_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandos_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas: {
        Row: {
          atendimento_id: string | null
          criado_em: string
          criado_por_id: string
          descricao: string
          destino_perfil: string
          id: string
          instituicao_id: string
          origem_perfil: string
          prazo: string | null
          prioridade: string
          status: string
          titulo: string
        }
        Insert: {
          atendimento_id?: string | null
          criado_em?: string
          criado_por_id: string
          descricao?: string
          destino_perfil: string
          id?: string
          instituicao_id: string
          origem_perfil: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo: string
        }
        Update: {
          atendimento_id?: string | null
          criado_em?: string
          criado_por_id?: string
          descricao?: string
          destino_perfil?: string
          id?: string
          instituicao_id?: string
          origem_perfil?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_atendimento: {
        Row: {
          atendimento_id: string
          criado_em: string
          criado_por_id: string
          descricao_demanda: string
          destino_perfil: string
          id: string
          instituicao_id: string
          origem_perfil: string
          status: string
        }
        Insert: {
          atendimento_id: string
          criado_em?: string
          criado_por_id: string
          descricao_demanda: string
          destino_perfil?: string
          id?: string
          instituicao_id: string
          origem_perfil?: string
          status?: string
        }
        Update: {
          atendimento_id?: string
          criado_em?: string
          criado_por_id?: string
          descricao_demanda?: string
          destino_perfil?: string
          id?: string
          instituicao_id?: string
          origem_perfil?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_atendimento_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_atendimento_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_atendimento_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_atendimento_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_agenda: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por_id: string
          criado_por_perfil: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          hora_fim: string
          hora_inicio: string
          id: string
          instituicao_id: string
          local: string | null
          relacionado_a_atendimento_id: string | null
          tipo_evento: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por_id: string
          criado_por_perfil: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          hora_fim: string
          hora_inicio: string
          id?: string
          instituicao_id: string
          local?: string | null
          relacionado_a_atendimento_id?: string | null
          tipo_evento?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por_id?: string
          criado_por_perfil?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          instituicao_id?: string
          local?: string | null
          relacionado_a_atendimento_id?: string | null
          tipo_evento?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_agenda_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_relacionado_a_atendimento_id_fkey"
            columns: ["relacionado_a_atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      instituicoes: {
        Row: {
          ativa: boolean
          atualizado_em: string
          cor_primaria: string | null
          cor_secundaria: string | null
          criado_em: string
          dominio: string | null
          id: string
          logo_url: string | null
          nome_instituicao: string
          observacoes: string | null
          sigla: string
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string
          dominio?: string | null
          id?: string
          logo_url?: string | null
          nome_instituicao: string
          observacoes?: string | null
          sigla: string
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          cor_primaria?: string | null
          cor_secundaria?: string | null
          criado_em?: string
          dominio?: string | null
          id?: string
          logo_url?: string | null
          nome_instituicao?: string
          observacoes?: string | null
          sigla?: string
        }
        Relationships: []
      }
      log_auditoria: {
        Row: {
          criado_em: string
          descricao: string
          id: string
          instituicao_id: string | null
          ip: string | null
          modulo: string | null
          nivel_sensibilidade: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo_acao: string
          user_agent: string | null
          usuario_alvo_id: string | null
          usuario_ator_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          criado_em?: string
          descricao: string
          id?: string
          instituicao_id?: string | null
          ip?: string | null
          modulo?: string | null
          nivel_sensibilidade?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_acao: string
          user_agent?: string | null
          usuario_alvo_id?: string | null
          usuario_ator_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          criado_em?: string
          descricao?: string
          id?: string
          instituicao_id?: string | null
          ip?: string | null
          modulo?: string | null
          nivel_sensibilidade?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_acao?: string
          user_agent?: string | null
          usuario_alvo_id?: string | null
          usuario_ator_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_auditoria_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          atendimento_id: string | null
          criado_em: string
          id: string
          instituicao_id: string
          lido: boolean
          mensagem: string
          remetente_id: string
          remetente_nome: string
        }
        Insert: {
          atendimento_id?: string | null
          criado_em?: string
          id?: string
          instituicao_id: string
          lido?: boolean
          mensagem: string
          remetente_id: string
          remetente_nome: string
        }
        Update: {
          atendimento_id?: string | null
          criado_em?: string
          id?: string
          instituicao_id?: string
          lido?: boolean
          mensagem?: string
          remetente_id?: string
          remetente_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          id: string
          instituicao_id: string
          lida: boolean
          mensagem_resumo: string
          perfil_destino: string
          referencia_id: string
          referencia_tipo: string
          tipo_notificacao: string
          usuario_destino_id: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          instituicao_id: string
          lida?: boolean
          mensagem_resumo: string
          perfil_destino: string
          referencia_id: string
          referencia_tipo: string
          tipo_notificacao: string
          usuario_destino_id?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          instituicao_id?: string
          lida?: boolean
          mensagem_resumo?: string
          perfil_destino?: string
          referencia_id?: string
          referencia_tipo?: string
          tipo_notificacao?: string
          usuario_destino_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_destino_id_fkey"
            columns: ["usuario_destino_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_destino_id_fkey"
            columns: ["usuario_destino_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pautas_despacho: {
        Row: {
          atualizado_em: string
          categoria: string
          comentario_presidente: string | null
          contexto_para_fala: string
          criado_em: string
          criado_por_id: string
          criado_por_perfil: string
          decisao_registrada: string | null
          descricao_resumida: string
          id: string
          instituicao_id: string
          perguntas_para_decisao: string
          prazo: string | null
          prioridade: string
          responsavel: string
          status: string
          tipo_registro: string
          titulo: string
          vinculado_a_id: string | null
          vinculado_a_tipo: string | null
        }
        Insert: {
          atualizado_em?: string
          categoria?: string
          comentario_presidente?: string | null
          contexto_para_fala?: string
          criado_em?: string
          criado_por_id: string
          criado_por_perfil: string
          decisao_registrada?: string | null
          descricao_resumida?: string
          id?: string
          instituicao_id: string
          perguntas_para_decisao?: string
          prazo?: string | null
          prioridade?: string
          responsavel?: string
          status?: string
          tipo_registro?: string
          titulo: string
          vinculado_a_id?: string | null
          vinculado_a_tipo?: string | null
        }
        Update: {
          atualizado_em?: string
          categoria?: string
          comentario_presidente?: string | null
          contexto_para_fala?: string
          criado_em?: string
          criado_por_id?: string
          criado_por_perfil?: string
          decisao_registrada?: string | null
          descricao_resumida?: string
          id?: string
          instituicao_id?: string
          perguntas_para_decisao?: string
          prazo?: string | null
          prioridade?: string
          responsavel?: string
          status?: string
          tipo_registro?: string
          titulo?: string
          vinculado_a_id?: string | null
          vinculado_a_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pautas_despacho_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pautas_despacho_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pautas_despacho_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_usuario: {
        Row: {
          criado_em: string
          encerrado_em: string | null
          id: string
          instituicao_id: string | null
          ip: string | null
          metodo_login: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          encerrado_em?: string | null
          id?: string
          instituicao_id?: string | null
          ip?: string | null
          metodo_login?: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          encerrado_em?: string | null
          id?: string
          instituicao_id?: string | null
          ip?: string | null
          metodo_login?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_usuario_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes: {
        Row: {
          atendimento_id: string | null
          criado_em: string
          criado_por_id: string
          descricao_solicitacao: string
          destino_perfil: string
          id: string
          instituicao_id: string
          origem_perfil: string
          status: string
        }
        Insert: {
          atendimento_id?: string | null
          criado_em?: string
          criado_por_id: string
          descricao_solicitacao: string
          destino_perfil: string
          id?: string
          instituicao_id: string
          origem_perfil: string
          status?: string
        }
        Update: {
          atendimento_id?: string | null
          criado_em?: string
          criado_por_id?: string
          descricao_solicitacao?: string
          destino_perfil?: string
          id?: string
          instituicao_id?: string
          origem_perfil?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          auth_user_id: string | null
          avatar_path: string | null
          bloqueado_ate: string | null
          criado_em: string
          email: string
          id: string
          instituicao_id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
          primeiro_login_pendente: boolean
          tentativas_login_falhas: number
          ultimo_login_em: string | null
          username: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          avatar_path?: string | null
          bloqueado_ate?: string | null
          criado_em?: string
          email: string
          id?: string
          instituicao_id: string
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          primeiro_login_pendente?: boolean
          tentativas_login_falhas?: number
          ultimo_login_em?: string | null
          username: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          avatar_path?: string | null
          bloqueado_ate?: string | null
          criado_em?: string
          email?: string
          id?: string
          instituicao_id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          primeiro_login_pendente?: boolean
          tentativas_login_falhas?: number
          ultimo_login_em?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      usuarios_public: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          auth_user_id: string | null
          criado_em: string | null
          email: string | null
          id: string | null
          instituicao_id: string | null
          nome: string | null
          perfil: Database["public"]["Enums"]["perfil_usuario"] | null
          primeiro_login_pendente: boolean | null
          ultimo_login_em: string | null
          username: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string | null
          instituicao_id?: string | null
          nome?: string | null
          perfil?: Database["public"]["Enums"]["perfil_usuario"] | null
          primeiro_login_pendente?: boolean | null
          ultimo_login_em?: string | null
          username?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string | null
          instituicao_id?: string | null
          nome?: string | null
          perfil?: Database["public"]["Enums"]["perfil_usuario"] | null
          primeiro_login_pendente?: boolean | null
          ultimo_login_em?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_my_instituicao_id: { Args: never; Returns: string }
    }
    Enums: {
      perfil_usuario:
        | "administrador"
        | "sala_espera"
        | "sala_principal"
        | "presidente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      perfil_usuario: [
        "administrador",
        "sala_espera",
        "sala_principal",
        "presidente",
      ],
    },
  },
} as const
