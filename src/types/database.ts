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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          duracion_snapshot: number
          precio_snapshot: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          duracion_snapshot: number
          precio_snapshot: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          duracion_snapshot?: number
          precio_snapshot?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          comentario_cliente: string | null
          created_at: string
          duracion_min: number
          estado: Database["public"]["Enums"]["appointment_status"]
          fecha_hora_fin: string
          fecha_hora_inicio: string
          id: string
          numero: number
          origen: Database["public"]["Enums"]["appointment_origin"]
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          comentario_cliente?: string | null
          created_at?: string
          duracion_min: number
          estado?: Database["public"]["Enums"]["appointment_status"]
          fecha_hora_fin: string
          fecha_hora_inicio: string
          id?: string
          numero?: number
          origen?: Database["public"]["Enums"]["appointment_origin"]
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          comentario_cliente?: string | null
          created_at?: string
          duracion_min?: number
          estado?: Database["public"]["Enums"]["appointment_status"]
          fecha_hora_fin?: string
          fecha_hora_inicio?: string
          id?: string
          numero?: number
          origen?: Database["public"]["Enums"]["appointment_origin"]
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string
          precio_snapshot: number
          service_id: string
        }
        Insert: {
          budget_id: string
          precio_snapshot: number
          service_id: string
        }
        Update: {
          budget_id?: string
          precio_snapshot?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["budget_status"]
          id: string
          notas: string | null
          numero: number
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["budget_status"]
          id?: string
          notas?: string | null
          numero?: number
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["budget_status"]
          id?: string
          notas?: string | null
          numero?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          activo: boolean
          created_at: string
          dia_semana: number
          hora_apertura: string
          hora_cierre: string
          id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_semana: number
          hora_apertura: string
          hora_cierre: string
          id?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_semana?: number
          hora_apertura?: string
          hora_cierre?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          capacidad_simultanea: number
          comision_default_pct: number
          created_at: string
          id: number
          intervalo_turnos_min: number
          nombre_negocio: string
          updated_at: string
        }
        Insert: {
          capacidad_simultanea?: number
          comision_default_pct?: number
          created_at?: string
          id?: number
          intervalo_turnos_min?: number
          nombre_negocio?: string
          updated_at?: string
        }
        Update: {
          capacidad_simultanea?: number
          comision_default_pct?: number
          created_at?: string
          id?: number
          intervalo_turnos_min?: number
          nombre_negocio?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          activo: boolean
          apellido: string
          created_at: string
          dni: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string
          telefono_norm: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido: string
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono: string
          telefono_norm?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string
          telefono_norm?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          activo: boolean
          cantidad_actual: number
          categoria: string | null
          costo: number | null
          created_at: string
          id: string
          nombre: string
          stock_minimo: number
          unidad: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cantidad_actual?: number
          categoria?: string | null
          costo?: number | null
          created_at?: string
          id?: string
          nombre: string
          stock_minimo?: number
          unidad: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cantidad_actual?: number
          categoria?: string | null
          costo?: number | null
          created_at?: string
          id?: string
          nombre?: string
          stock_minimo?: number
          unidad?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activo: boolean
          apellido: string
          comision_pct: number
          created_at: string
          email: string | null
          fecha_alta: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido: string
          comision_pct?: number
          created_at?: string
          email?: string | null
          fecha_alta?: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          comision_pct?: number
          created_at?: string
          email?: string | null
          fecha_alta?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          motivo: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          motivo?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          motivo?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          activo: boolean
          created_at: string
          cupo_maximo: number | null
          descripcion: string | null
          duracion_min: number
          id: string
          nombre: string
          precio: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          cupo_maximo?: number | null
          descripcion?: string | null
          duracion_min: number
          id?: string
          nombre: string
          precio: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          cupo_maximo?: number | null
          descripcion?: string | null
          duracion_min?: number
          id?: string
          nombre?: string
          precio?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bloqueos_dia: {
        Args: { p_fecha: string }
        Returns: {
          fecha_fin: string
          fecha_inicio: string
          profile_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      turnos_ocupados_dia: {
        Args: { p_fecha: string }
        Returns: {
          fecha_hora_fin: string
          fecha_hora_inicio: string
          profile_id: string
          servicio_ids: string[]
        }[]
      }
    }
    Enums: {
      appointment_origin: "PUBLICO" | "INTERNO"
      appointment_status:
        | "CONFIRMADO"
        | "EN_CURSO"
        | "FINALIZADO"
        | "CANCELADO"
        | "AUSENTE"
      budget_status: "PENDIENTE" | "ACEPTADO" | "RECHAZADO"
      cash_movement_type: "INGRESO" | "EGRESO"
      document_send_status: "NO_ENVIADO" | "ENVIANDO" | "ENVIADO" | "ERROR"
      payment_method: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA"
      settlement_status: "PENDIENTE" | "PAGADA"
      stock_movement_type: "ENTRADA" | "CONSUMO" | "AJUSTE" | "DEVOLUCION"
      unit_type: "G" | "ML" | "UNIDAD"
      user_role: "ADMIN" | "EMPLEADO"
      work_status:
        | "DISPONIBLE"
        | "TOMADO"
        | "EN_CURSO"
        | "FINALIZADO"
        | "COBRADO"
        | "CANCELADO"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_origin: ["PUBLICO", "INTERNO"],
      appointment_status: [
        "CONFIRMADO",
        "EN_CURSO",
        "FINALIZADO",
        "CANCELADO",
        "AUSENTE",
      ],
      budget_status: ["PENDIENTE", "ACEPTADO", "RECHAZADO"],
      cash_movement_type: ["INGRESO", "EGRESO"],
      document_send_status: ["NO_ENVIADO", "ENVIANDO", "ENVIADO", "ERROR"],
      payment_method: ["EFECTIVO", "TRANSFERENCIA", "TARJETA"],
      settlement_status: ["PENDIENTE", "PAGADA"],
      stock_movement_type: ["ENTRADA", "CONSUMO", "AJUSTE", "DEVOLUCION"],
      unit_type: ["G", "ML", "UNIDAD"],
      user_role: ["ADMIN", "EMPLEADO"],
      work_status: [
        "DISPONIBLE",
        "TOMADO",
        "EN_CURSO",
        "FINALIZADO",
        "COBRADO",
        "CANCELADO",
      ],
    },
  },
} as const
