import { Banknote, CalendarCheck, CheckCircle2, PlayCircle, ReceiptText, Scissors, TrendingUp, Trophy, UsersRound, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getAdminDashboard, getAdminFinanceOverview, runAdminSettlement } from "../../api/admin";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { AdminDashboard } from "../../types/booking";
import type { AdminFinanceOverview } from "../../types/finance";
import { formatDateLong, todayISO } from "../../utils/date";

interface StatCard {
  label: string;
  value: number;
  hint: string;
  icon: typeof UsersRound;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

export function DashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [finance, setFinance] = useState<AdminFinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlementBusy, setSettlementBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getAdminDashboard(), getAdminFinanceOverview()])
      .then(([nextData, nextFinance]) => { setData(nextData); setFinance(nextFinance); setError(""); })
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("focus", load);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, [load]);

  const cards: StatCard[] = data
    ? [
        {
          label: "Total Barbers",
          value: data.total_barbers,
          hint: "Registered",
          icon: UsersRound,
          gradient: "linear-gradient(135deg, #0d0d0f, #1f2022)",
          iconBg: "rgba(255,255,255,0.12)",
          iconColor: "#ffffff",
        },
        {
          label: "Active Barbers",
          value: data.active_barbers,
          hint: "Currently active",
          icon: Scissors,
          gradient: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
          iconBg: "#fef3c7",
          iconColor: "#c9a84c",
        },
        {
          label: "Today's Bookings",
          value: data.today_bookings,
          hint: formatDateLong(todayISO()),
          icon: CalendarCheck,
          gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)",
          iconBg: "#fde68a",
          iconColor: "#a8873a",
        },
        {
          label: "Completed",
          value: data.completed_bookings,
          hint: "Total completed",
          icon: CheckCircle2,
          gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          iconBg: "#bbf7d0",
          iconColor: "#16a34a",
        },
      ]
    : [];

  const financeCards = finance
    ? [
        { label: "Today commission", value: finance.total_platform_commission_today, hint: "Accrued today", icon: ReceiptText },
        { label: "Month commission", value: finance.total_platform_commission_month, hint: "Current month", icon: TrendingUp },
        { label: "Barber debt", value: finance.total_barber_debt, hint: "Open debt", icon: Wallet },
        { label: "Top-ups", value: finance.total_topups, hint: "All time", icon: Banknote },
        { label: "Unsettled", value: finance.unsettled_commissions, hint: "Pending deduction", icon: PlayCircle },
      ]
    : [];

  async function handleRunSettlement() {
    setSettlementBusy(true);
    setError("");
    try {
      await runAdminSettlement(todayISO());
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setSettlementBusy(false);
    }
  }

  function money(value: number) {
    return `${value.toLocaleString()} UZS`;
  }

  return (
    <div>
      {/* Page header */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="section-title mb-1">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0d0d0f]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#64748b]">{formatDateLong(todayISO())}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#eef0f5] bg-white px-4 py-2.5" style={{ boxShadow: "var(--shadow-panel)" }}>
          <TrendingUp size={16} className="text-[#c9a84c]" />
          <span className="text-sm font-semibold text-[#334155]">Live stats</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </header>

      {loading ? <LoadingState count={4} /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {data ? (
        <div className="space-y-8 animate-fade-up">
          {/* Stat cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, i) => {
              const Icon = card.icon;
              const isDark = i === 0;
              return (
                <article
                  key={card.label}
                  className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: card.gradient,
                    boxShadow: "var(--shadow-panel)",
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: card.iconBg }}
                  >
                    <Icon size={20} style={{ color: card.iconColor }} />
                  </div>
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: isDark ? "#ffffff" : "#0d0d0f" }}
                  >
                    {card.value}
                  </p>
                  <p
                    className="mt-1.5 text-sm font-semibold"
                    style={{ color: isDark ? "rgba(255,255,255,0.70)" : "#334155" }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-xs font-normal"
                    style={{ color: isDark ? "rgba(255,255,255,0.40)" : "#94a3b8" }}
                  >
                    {card.hint}
                  </p>
                </article>
              );
            })}
          </section>

          {finance ? (
            <section className="panel-card p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0d0d0f]">Finance Overview</h2>
                  <p className="text-xs text-[#94a3b8]">Commission, debts, top-ups and unsettled bookings</p>
                </div>
                <button className="btn-primary w-full sm:w-auto" type="button" onClick={handleRunSettlement} disabled={settlementBusy}>
                  <PlayCircle size={18} />
                  {settlementBusy ? "Running..." : "Run settlement"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {financeCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.label} className="rounded-xl border border-[#eef0f5] bg-[#fafafa] p-4">
                      <Icon size={18} className="text-[#c9a84c]" />
                      <p className="mt-3 text-xl font-bold text-[#0d0d0f]">{money(item.value)}</p>
                      <p className="text-xs font-semibold text-[#334155]">{item.label}</p>
                      <p className="text-[11px] text-[#94a3b8]">{item.hint}</p>
                    </article>
                  );
                })}
              </div>
              {finance.barbers_with_debt.length > 0 ? (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-bold text-[#0d0d0f]">Barbers with debt</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {finance.barbers_with_debt.slice(0, 6).map((item) => (
                      <div key={item.barber_id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <span className="text-sm font-semibold text-amber-900">{item.full_name}</span>
                        <span className="text-sm font-bold text-amber-800">{money(item.debt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Lower section */}
          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            {/* Top barbers */}
            <article className="panel-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #0d0d0f, #1f2022)" }}
                >
                  <Trophy size={18} className="text-[#c9a84c]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0d0d0f]">Top Barbers</h2>
                  <p className="text-xs text-[#94a3b8]">By bookings & revenue</p>
                </div>
              </div>

              <div className="space-y-3">
                {data.top_barbers.length === 0 ? (
                  <EmptyState title="No bookings yet" subtitle="Stats will appear here" />
                ) : null}
                {data.top_barbers.map((item, index) => {
                  const pct = item.bookings_count
                    ? Math.round((item.completed_count / item.bookings_count) * 100)
                    : 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#eef0f5] bg-[#fafafa] p-4 transition-all hover:border-[#e2e6ee]"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              background: index === 0
                                ? "linear-gradient(135deg, #c9a84c, #a8873a)"
                                : index === 1 ? "#e2e8f0" : "#f1f5f9",
                              color: index === 0 ? "#ffffff" : "#334155",
                            }}
                          >
                            {index + 1}
                          </span>
                          <span className="truncate text-sm font-semibold text-[#0d0d0f]">{item.full_name}</span>
                        </div>
                        <span className="shrink-0 rounded-full border border-[#eef0f5] bg-white px-2.5 py-0.5 text-xs font-medium text-[#64748b]">
                          {item.bookings_count} bookings
                        </span>
                      </div>
                      <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #c9a84c, #fbbf24)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#94a3b8]">
                        <span>{item.completed_count} completed ({pct}%)</span>
                        <span className="font-semibold text-[#334155]">{item.revenue.toLocaleString()} UZS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Stats summary */}
            <article className="panel-card p-6">
              <h2 className="mb-5 text-lg font-bold text-[#0d0d0f]">Quick Stats</h2>
              <div className="space-y-4">
                {cards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 rounded-xl border border-[#eef0f5] bg-[#fafafa] p-3.5"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: item.iconBg }}
                      >
                        <Icon size={16} style={{ color: item.iconColor }} />
                      </span>
                      <span className="flex-1 text-sm font-medium text-[#334155]">{item.label}</span>
                      <span className="text-lg font-bold text-[#0d0d0f]">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        </div>
      ) : null}
    </div>
  );
}
