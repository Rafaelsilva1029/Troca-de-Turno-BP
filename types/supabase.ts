export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      pendencias: {
        Row: {
          id: number
          category: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          category: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          category?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pendencias_liberadas: {
        Row: {
          id: number
          category: string
          description: string
          released_at: string
          equipment_id: string
          released_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          category: string
          description: string
          released_at: string
          equipment_id: string
          released_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          category?: string
          description?: string
          released_at?: string
          equipment_id?: string
          released_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      programacao_turno: {
        Row: {
          id: number
          item_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          item_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          item_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      veiculos_logistica: {
        Row: {
          id: number
          frota: string
          categoria: string
          placa: string
          modelo: string
          ano: string
          status: string
          ultimaManutencao?: string
          proximaManutencao?: string
          motorista?: string
          observacoes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          frota: string
          categoria: string
          placa: string
          modelo: string
          ano: string
          status: string
          ultimaManutencao?: string
          proximaManutencao?: string
          motorista?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          frota?: string
          categoria?: string
          placa?: string
          modelo?: string
          ano?: string
          status?: string
          ultimaManutencao?: string
          proximaManutencao?: string
          motorista?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          id: string
          frota: string
          descricao_ponto: string
          tipo_preventiva: string
          data_programada: string
          data_realizada?: string
          situacao: string
          horario_agendado: string
          observacao?: string
          created_at: string
          updated_at: string
          responsavel?: string
          km_atual?: number
          proximo_km?: number
          tempo_execucao?: number
          produtos_utilizados?: string
        }
        Insert: {
          id?: string
          frota: string
          descricao_ponto: string
          tipo_preventiva: string
          data_programada: string
          data_realizada?: string
          situacao: string
          horario_agendado: string
          observacao?: string
          created_at?: string
          updated_at?: string
          responsavel?: string
          km_atual?: number
          proximo_km?: number
          tempo_execucao?: number
          produtos_utilizados?: string
        }
        Update: {
          id?: string
          frota?: string
          descricao_ponto?: string
          tipo_preventiva?: string
          data_programada?: string
          data_realizada?: string
          situacao?: string
          horario_agendado?: string
          observacao?: string
          created_at?: string
          updated_at?: string
          responsavel?: string
          km_atual?: number
          proximo_km?: number
          tempo_execucao?: number
          produtos_utilizados?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          id: string
          title: string
          description: string
          due_date: string
          due_time: string
          priority: string
          status: string
          category: string
          assigned_to?: string
          created_at: string
          updated_at: string
          completed_at?: string
          notified?: boolean
          one_hour_notified?: boolean
          user_id?: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          due_date: string
          due_time: string
          priority: string
          status: string
          category: string
          assigned_to?: string
          created_at?: string
          updated_at?: string
          completed_at?: string
          notified?: boolean
          one_hour_notified?: boolean
          user_id?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          due_date?: string
          due_time?: string
          priority?: string
          status?: string
          category?: string
          assigned_to?: string
          created_at?: string
          updated_at?: string
          completed_at?: string
          notified?: boolean
          one_hour_notified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          id: string
          title: string
          type: string
          filters: Json
          sortOption: string
          createdAt: string
          updatedAt: string
          viewMode?: string
          visibleColumns?: Json
          user_id?: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          filters: Json
          sortOption: string
          createdAt?: string
          updatedAt?: string
          viewMode?: string
          visibleColumns?: Json
          user_id?: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          filters?: Json
          sortOption?: string
          createdAt?: string
          updatedAt?: string
          viewMode?: string
          visibleColumns?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_executions: {
        Row: {
          id: number
          report_id: string
          report_title: string
          report_type: string
          executed_at: string
          row_count: number
          parameters: Json
          user_id?: string
        }
        Insert: {
          id?: number
          report_id: string
          report_title: string
          report_type: string
          executed_at?: string
          row_count: number
          parameters: Json
          user_id?: string
        }
        Update: {
          id?: number
          report_id?: string
          report_title?: string
          report_type?: string
          executed_at?: string
          row_count?: number
          parameters?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_executions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          id: number
          event: string
          details: Json
          created_at: string
          user_id?: string
          ip_address?: string
          user_agent?: string
        }
        Insert: {
          id?: number
          event: string
          details: Json
          created_at?: string
          user_id?: string
          ip_address?: string
          user_agent?: string
        }
        Update: {
          id?: number
          event?: string
          details?: Json
          created_at?: string
          user_id?: string
          ip_address?: string
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          department?: string
          created_at: string
          updated_at: string
          last_login?: string
          avatar_url?: string
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: string
          department?: string
          created_at?: string
          updated_at?: string
          last_login?: string
          avatar_url?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          department?: string
          created_at?: string
          updated_at?: string
          last_login?: string
          avatar_url?: string
          is_active?: boolean
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: number
          user_id: string
          theme: string
          notifications_enabled: boolean
          email_notifications: boolean
          dashboard_layout: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          theme?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          dashboard_layout?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          theme?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          dashboard_layout?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_check: {
        Row: {
          id: number
          status: string
          timestamp: string
        }
        Insert: {
          id?: number
          status: string
          timestamp?: string
        }
        Update: {
          id?: number
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
