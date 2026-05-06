import { Banknote, CalendarDays, CheckCircle2, ChevronRight, Clock3, LogOut, TrendingUp, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getBarberDashboard } from "../../api/barber";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import { authStore } from "../../store/authStore";
import type { BarberDashboard } from "../../types/booking";
import { formatDateLong, formatTime, todayISO } from "../../utils/date";

export function BarberDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<BarberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getBarberDashboard(todayISO())
      .then((nextData) => { setData(nextData); setError(""); })
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, [load]);

  const statCards = data
    ? [
        {
          label: "Today's Bookings",
          value: data.today_bookings,
          icon: UsersRound,
          gradient: "linear-gradient(135deg, #0d0d0f, #1f2022)",
          iconBg: "rgba(255,255,255,0.12)",
          iconColor: "#c9a84c",
          textColor: "#ffffff",
          subColor: "rgba(255,255,255,0.45)",
        },
        {
          label: "Completed",
          value: data.completed_count,
          icon: CheckCircle2,
          gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          iconBg: "#bbf7d0",
          iconColor: "#16a34a",
          textColor: "#0d0d0f",
          subColor: "#94a3b8",
        },
        {
          label: "Pending",
          value: data.pending_count,
          icon: Clock3,
          gradient: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
          iconBg: "#e2e8f0",
          iconColor: "#64748b",
          textColor: "#0d0d0f",
          subColor: "#94a3b8",
        },
        {
          label: "Today's Revenue",
          value: data.today_revenue.toLocaleString(),
          icon: Banknote,
          gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)",
          iconBg: "#fde68a",
          iconColor: "#a8873a",
          textColor: "#0d0d0f",
          subColor: "#94a3b8",
          suffix: " UZS",
        },
      ]
    : [];

  return (
    <main className="phone-shell">
      <section className="phone-card">
        {loading ? <div className="p-8"><LoadingState count={2} /></div> : null}
        {error ? <div className="p-8"><ErrorMessage message={error} /></div> : null}

        {data ? (
          <>
            {/* Header */}
            <header
              className="relative overflow-hidden px-7 pt-7 pb-6"
              style={{ borderBottom: "1px solid #eef0f5" }}
            >
              {/* Decorative glow */}
              <div
                className="absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-[0.06]"
                style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="section-title mb-1">Welcome back</p>
                  <h1 className="text-2xl font-bold text-[#0d0d0f]">Barber Dashboard</h1>
                </div>
                <button
                  className="btn-icon"
                  type="button"
                  onClick={() => { authStore.signOut(); navigate("/barber/login"); }}
                  aria-label="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </div>
              <div className="relative mt-4 flex items-center gap-2 text-xs text-[#94a3b8]">
                <CalendarDays size={14} className="text-[#c9a84c]" />
                {formatDateLong(todayISO())}
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
              {/* Stat cards */}
              <section className="grid grid-cols-2 gap-3">
                {statCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <article
                      key={card.label}
                      className="rounded-2xl p-4 animate-fade-up"
                      style={{
                        background: card.gradient,
                        boxShadow: "var(--shadow-panel)",
                        animationDelay: `${i * 60}ms`,
                      }}
                    >
                      <div
                        className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: card.iconBg }}
                      >
                        <Icon size={18} style={{ color: card.iconColor }} />
                      </div>
                      <p className="text-2xl font-bold" style={{ color: card.textColor }}>
                        {card.value}
                        {card.suffix ? <span className="text-xs font-medium">{card.suffix}</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs font-medium" style={{ color: card.subColor }}>
                        {card.label}
                      </p>
                    </article>
                  );
                })}
              </section>

              {/* Quick nav links */}
              <div className="space-y-2">
                <Link
                  to="/barber/schedule"
                  className="flex items-center gap-4 rounded-2xl border border-[#eef0f5] bg-white p-4 transition-all duration-200 hover:border-[#c9a84c] hover:-translate-y-0.5 group"
                  style={{ boxShadow: "var(--shadow-panel)" }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #0d0d0f, #1f2022)", boxShadow: "0 4px 12px rgba(13,13,15,0.20)" }}
                  >
                    <TrendingUp size={19} className="text-[#c9a84c]" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-[#0d0d0f]">Daily Schedule</span>
                    <span className="text-xs text-[#94a3b8]">View all appointments</span>
                  </span>
                  <ChevronRight size={18} className="text-[#94a3b8] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/barber/work-schedule"
                  className="flex items-center gap-4 rounded-2xl border border-[#eef0f5] bg-white p-4 transition-all duration-200 hover:border-[#c9a84c] hover:-translate-y-0.5 group"
                  style={{ boxShadow: "var(--shadow-panel)" }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8f9fb]"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <Clock3 size={19} className="text-[#c9a84c]" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-[#0d0d0f]">Work Schedule</span>
                    <span className="text-xs text-[#94a3b8]">Services, breaks & days off</span>
                  </span>
                  <ChevronRight size={18} className="text-[#94a3b8] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Today's appointments */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0d0d0f]">Today's Appointments</h2>
                  <span className="text-xs text-[#94a3b8]">{data.week_completed} this week</span>
                </div>
                <div className="space-y-2.5">
                  {data.bookings.length === 0 ? (
                    <EmptyState title="No appointments today" />
                  ) : (
                    data.bookings.slice(0, 5).map((booking, i) => (
                      <article
                        key={booking.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#eef0f5] bg-white p-4 animate-fade-up"
                        style={{ boxShadow: "var(--shadow-card)", animationDelay: `${i * 50}ms` }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0d0d0f]">{booking.customer_name}</p>
                          <p className="mt-0.5 text-xs text-[#94a3b8]">
                            <span className="font-medium text-[#c9a84c]">{formatTime(booking.time)}</span>
                            {" · "}{booking.customer_phone}
                          </p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
