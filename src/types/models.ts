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
export type Work = Tables["works"]["Row"];
export type WorkItem = Tables["work_items"]["Row"];
export type WorkProduct = Tables["work_products"]["Row"];
export type StockMovement = Tables["stock_movements"]["Row"];
export type Payment = Tables["payments"]["Row"];
export type EmployeeCommission = Tables["employee_commissions"]["Row"];
export type CashMovement = Tables["cash_movements"]["Row"];
export type EmployeeSettlement = Tables["employee_settlements"]["Row"];
export type SettlementStatus = Enums["settlement_status"];
export type CashMovementType = Enums["cash_movement_type"];

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