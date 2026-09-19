import type { Database } from "./database";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type Profile = Tables["profiles"]["Row"];
export type Client = Tables["clients"]["Row"];
export type Service = Tables["services"]["Row"];
export type Product = Tables["products"]["Row"];
export type BusinessHours = Tables["business_hours"]["Row"];
export type BusinessSettings = Tables["business_settings"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type BudgetItem = Tables["budget_items"]["Row"];

export type UserRole = Enums["user_role"];
export type UnitType = Enums["unit_type"];
export type AppointmentStatus = Enums["appointment_status"];
export type BudgetStatus = Enums["budget_status"];
export type WorkStatus = Enums["work_status"];
export type PaymentMethod = Enums["payment_method"];

/** Forma única de retorno de todas las Server Actions. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };