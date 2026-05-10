export interface DemoBarberFinance {
  demo_balance: number;
  demo_debt: number;
  commission_percent: number;
  today_completed_bookings: number;
  today_gross_revenue: number;
  today_commission: number;
  today_net_earning: number;
  is_financially_blocked: boolean;
  message: string;
}

export interface DemoBarberTransaction {
  id: number;
  barber_id: number;
  booking_id?: number | null;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  debt_before: number;
  debt_after: number;
  description?: string | null;
  created_at: string;
}

export interface AdminDemoFinanceOverview {
  total_platform_commission_today: number;
  total_platform_commission_month: number;
  total_barber_debt: number;
  total_demo_topups: number;
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
    demo_balance: number;
    demo_debt: number;
    is_financially_blocked: boolean;
  }>;
}

export type BarberBalance = DemoBarberFinance;
export type BarberTransaction = DemoBarberTransaction;
export type AdminFinanceOverview = AdminDemoFinanceOverview;
