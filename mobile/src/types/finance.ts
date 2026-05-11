export interface BarberBalance {
  balance: number;
  debt: number;
  commission_percent: number;
  today_completed_bookings: number;
  today_gross_revenue: number;
  today_commission: number;
  today_net_earning: number;
  is_financially_blocked: boolean;
  message?: string;
}

export interface BarberTransaction {
  id: number;
  barber_id: number;
  top_up_order_id?: number | null;
  booking_id?: number | null;
  provider: string;
  type: string;
  status: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  debt_before: number;
  debt_after: number;
  external_transaction_id?: string | null;
  description?: string | null;
  created_at: string;
}

export interface TopUpOrder {
  id: number;
  order_id: number;
  barber_id: number;
  amount: number;
  provider: "mock" | "payme" | "click" | "manual" | string;
  status: string;
  external_transaction_id?: string | null;
  provider_payload?: Record<string, unknown> | null;
  created_at: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
  expires_at?: string | null;
  description?: string | null;
  message?: string;
}

export interface TopUpConfirmResponse {
  order: TopUpOrder;
  balance: number;
  debt: number;
  message?: string;
}

export interface AdminFinanceOverview {
  total_balance: number;
  total_debt: number;
  today_commission: number;
  month_commission: number;
  pending_top_up_orders: number;
  paid_top_up_orders: number;
  failed_top_up_orders: number;
  unsettled_commission: number;
  total_platform_commission_today: number;
  total_platform_commission_month: number;
  total_barber_debt: number;
  total_topups: number;
  unsettled_commissions: number;
  message: string;
  top_earning_barbers: Array<{
    barber_id: number;
    full_name: string;
    gross_revenue: number;
    completed_bookings: number;
    commission_total: number;
  }>;
  barbers_with_debt: Array<{
    barber_id: number;
    full_name: string;
    balance: number;
    debt: number;
    is_financially_blocked: boolean;
  }>;
}
