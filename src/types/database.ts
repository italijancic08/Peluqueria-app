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
          budget_id: string | null
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
          budget_id?: string | null
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
          budget_id?: string | null
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
            foreignKeyName: "appointments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
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
      cash_movements: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          id: string
          metodo: Database["public"]["Enums"]["payment_method"]
          monto: number
          payment_id: string | null
          tipo: Database["public"]["Enums"]["cash_movement_type"]
          work_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["payment_method"]
          monto: number
          payment_id?: string | null
          tipo: Database["public"]["Enums"]["cash_movement_type"]
          work_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          monto?: number
          payment_id?: string | null
          tipo?: Database["public"]["Enums"]["cash_movement_type"]
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
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
      employee_commissions: {
        Row: {
          base_monto: number
          created_at: string
          id: string
          monto: number
          porcentaje_snapshot: number
          profile_id: string
          settlement_id: string | null
          work_id: string
        }
        Insert: {
          base_monto: number
          created_at?: string
          id?: string
          monto: number
          porcentaje_snapshot: number
          profile_id: string
          settlement_id?: string | null
          work_id: string
        }
        Update: {
          base_monto?: number
          created_at?: string
          id?: string
          monto?: number
          porcentaje_snapshot?: number
          profile_id?: string
          settlement_id?: string | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_commissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_commissions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "employee_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_commissions_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_settlements: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["settlement_status"]
          fecha_pago: string | null
          id: string
          paid_by: string | null
          profile_id: string
          semana_fin: string
          semana_inicio: string
          total: number
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["settlement_status"]
          fecha_pago?: string | null
          id?: string
          paid_by?: string | null
          profile_id: string
          semana_fin: string
          semana_inicio: string
          total: number
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["settlement_status"]
          fecha_pago?: string | null
          id?: string
          paid_by?: string | null
          profile_id?: string
          semana_fin?: string
          semana_inicio?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_settlements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_settlements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          created_by: string | null
          cuotas: number | null
          id: string
          metodo: Database["public"]["Enums"]["payment_method"]
          monto: number
          work_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cuotas?: number | null
          id?: string
          metodo: Database["public"]["Enums"]["payment_method"]
          monto: number
          work_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cuotas?: number | null
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          monto?: number
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
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
      stock_movements: {
        Row: {
          cantidad: number
          created_at: string
          created_by: string | null
          id: string
          motivo: string | null
          product_id: string
          tipo: Database["public"]["Enums"]["stock_movement_type"]
          work_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          product_id: string
          tipo: Database["public"]["Enums"]["stock_movement_type"]
          work_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          product_id?: string
          tipo?: Database["public"]["Enums"]["stock_movement_type"]
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          precio_snapshot: number
          service_id: string
          work_id: string
        }
        Insert: {
          precio_snapshot: number
          service_id: string
          work_id: string
        }
        Update: {
          precio_snapshot?: number
          service_id?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      work_products: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          product_id: string
          work_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          product_id: string
          work_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          product_id?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_products_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          appointment_id: string
          budget_id: string | null
          client_id: string
          cobrado_at: string | null
          created_at: string
          estado: Database["public"]["Enums"]["work_status"]
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          numero: number
          profile_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id: string
          budget_id?: string | null
          client_id: string
          cobrado_at?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["work_status"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          numero?: number
          profile_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          budget_id?: string | null
          client_id?: string
          cobrado_at?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["work_status"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          numero?: number
          profile_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      cobrar_trabajo: {
        Args: { p_pagos: Json; p_work_id: string }
        Returns: {
          cobrado: boolean
          total_pagado: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      liquidar_semana: {
        Args: {
          p_profile_id: string
          p_semana_fin: string
          p_semana_inicio: string
        }
        Returns: string
      }
      marcar_liquidacion_pagada: {
        Args: { p_settlement_id: string }
        Returns: undefined
      }
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
      payment_method:
        | "EFECTIVO"
        | "TRANSFERENCIA"
        | "TARJETA"
        | "TARJETA_CREDITO"
        | "TARJETA_DEBITO"
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
      payment_method: [
        "EFECTIVO",
        "TRANSFERENCIA",
        "TARJETA",
        "TARJETA_CREDITO",
        "TARJETA_DEBITO",
      ],
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
