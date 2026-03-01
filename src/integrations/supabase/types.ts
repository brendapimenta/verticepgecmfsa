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
      usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          auth_user_id: string | null
          criado_em: string
          email: string
          google_id: string | null
          id: string
          instituicao_id: string
          login_google_habilitado: boolean
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
          primeiro_login_pendente: boolean
          ultimo_login_em: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          criado_em?: string
          email: string
          google_id?: string | null
          id?: string
          instituicao_id: string
          login_google_habilitado?: boolean
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          primeiro_login_pendente?: boolean
          ultimo_login_em?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          criado_em?: string
          email?: string
          google_id?: string | null
          id?: string
          instituicao_id?: string
          login_google_habilitado?: boolean
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          primeiro_login_pendente?: boolean
          ultimo_login_em?: string | null
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
          login_google_habilitado: boolean | null
          nome: string | null
          perfil: Database["public"]["Enums"]["perfil_usuario"] | null
          primeiro_login_pendente: boolean | null
          ultimo_login_em: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string | null
          instituicao_id?: string | null
          login_google_habilitado?: boolean | null
          nome?: string | null
          perfil?: Database["public"]["Enums"]["perfil_usuario"] | null
          primeiro_login_pendente?: boolean | null
          ultimo_login_em?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email?: string | null
          id?: string | null
          instituicao_id?: string | null
          login_google_habilitado?: boolean | null
          nome?: string | null
          perfil?: Database["public"]["Enums"]["perfil_usuario"] | null
          primeiro_login_pendente?: boolean | null
          ultimo_login_em?: string | null
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
      [_ in never]: never
    }
    Enums: {
      perfil_usuario: "administrador" | "sala_espera" | "brenda" | "presidente"
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
      perfil_usuario: ["administrador", "sala_espera", "brenda", "presidente"],
    },
  },
} as const
