export interface BarberBalance {
  balance: number;
  debt: number;
  commission_percent: number;
  today_gross_revenue: number;
  today_commission: number;
  today_net_earning: number;
  is_financially_blocked: boolean;
}

export interface BarberTransaction {
  id: number;
  barber_id: number;
  booking_id?: number | null;
  type: "top_up" | "commission_charge" | "debt_created" | "debt_paid" | "adjustment" | string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
  created_at: string;
}

export interface DailySettlement {
  id: number;
  barber_id: number;
  date: string;
  total_bookings: number;
  gross_revenue: number;
  commission_total: number;
  barber_earning_total: number;
  balance_before: number;
  balance_after: number;
  debt_created: number;
  status: "pending" | "completed" | "failed" | string;
  created_at: string;
  completed_at?: string | null;
}

export interface SettlementRunResponse {
  date: string;
  settlements_created: number;
  bookings_charged: number;
  commission_total: number;
  debt_created: number;
  settlements: DailySettlement[];
}

export interface AdminFinanceOverview {
  total_platform_commission_today: number;
  total_platform_commission_month: number;
  total_barber_debt: number;
  total_topups: number;
  unsettled_commissions: number;
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

export interface AdminBarberFinance {
  barber_id: number;
  full_name: string;
  balance: number;
  debt: number;
  commission_percent: number;
  is_financially_blocked: boolean;
  total_revenue: number;
  commission_paid: number;
  unsettled_commission: number;
  transactions: BarberTransaction[];
  settlements: DailySettlement[];
}
