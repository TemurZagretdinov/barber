import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAdminBarbers, getAdminBookings, updateBookingStatus } from "../../api/admin";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { AdminBarber } from "../../types/barber";
import type { BookingStatus, BookingWithBarber } from "../../types/booking";
import { addDays, dateLabel, formatDateLong, formatTime, todayISO } from "../../utils/date";

const statuses = ["all", "pending", "completed", "cancelled", "no_show"] as const;

const statusLabels: Record<string, string> = {
  all: "All",
  pending: "Pending",
  completed: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function BookingsPage() {
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [barberId, setBarberId] = useState("");
  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [barbers, setBarbers] = useState<AdminBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totals = useMemo(
    () => ({
      total:   bookings.length,
      done:    bookings.filter((b) => b.status === "completed").length,
      pending: bookings.filter((b) => b.status === "pending").length,
    }),
    [bookings],
  );

  useEffect(() => { getAdminBarbers().then(setBarbers).catch(() => undefined); }, []);

  const loadBookings = useCallback(() => {
    setLoading(true);
    getAdminBookings({ date, search, status: status === "all" ? "" : status, barber_id: barberId })
      .then((items) => { setBookings(items); setError(""); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, search, status, barberId]);

  useEffect(() => {
    loadBookings();
    const timer = window.setInterval(loadBookings, 15000);
    return () => window.clearInterval(timer);
  }, [loadBookings]);

  async function changeStatus(id: number, nextStatus: BookingStatus) {
    await updateBookingStatus(id, nextStatus);
    const fresh = await getAdminBookings({ date, search, status: status === "all" ? "" : status, barber_id: barberId });
    setBookings(fresh);
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <p className="section-title mb-1">Management</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#0d0d0f]">Bookings</h1>
        <p className="mt-1 text-sm text-[#64748b]">Monitor and manage all appointments</p>
      </header>

      {/* Date navigator */}
      <div
        className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#eef0f5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <div className="flex items-center gap-2">
          <button className="btn-icon h-9 w-9" type="button" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
            <ChevronLeft size={17} />
          </button>
          <div className="flex items-center gap-2 px-2">
            <Calendar size={17} className="text-[#c9a84c]" />
            <span className="text-sm font-bold text-[#0d0d0f]">{dateLabel(date)}</span>
            <span className="text-sm text-[#94a3b8]">— {formatDateLong(date)}</span>
          </div>
          <button className="btn-icon h-9 w-9" type="button" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full border border-[#e2e6ee] bg-white px-3.5 py-1.5 text-xs font-bold text-[#334155] transition hover:border-[#0d0d0f] hover:text-[#0d0d0f]"
            type="button"
            onClick={() => setDate(todayISO())}
          >
            Today
          </button>
          <span className="rounded-full bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold text-[#64748b]">
            {totals.total} total
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            {totals.done} done
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
            {totals.pending} pending
          </span>
        </div>
      </div>

      {/* Filters */}
      <div
        className="mb-6 grid gap-3 rounded-2xl border border-[#eef0f5] bg-white p-4 xl:grid-cols-[1fr_200px_auto]"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        {/* Search */}
        <label className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={17} />
          <input
            className="input pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, phone, ID..."
          />
        </label>

        {/* Barber filter */}
        <select className="input" value={barberId} onChange={(e) => setBarberId(e.target.value)}>
          <option value="">All Barbers</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>{barber.full_name}</option>
          ))}
        </select>

        {/* Status tabs */}
        <div className="flex gap-1 rounded-xl border border-[#eef0f5] bg-[#f8f9fb] p-1">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition-all duration-150 ${
                status === s
                  ? "bg-white text-[#0d0d0f] shadow-card"
                  : "text-[#94a3b8] hover:text-[#334155]"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState count={4} variant="row" /> : null}
      {error ? <ErrorMessage message={error} /> : null}
      {!loading && bookings.length === 0 ? (
        <EmptyState title="No bookings found" subtitle="Try adjusting your date or filters" />
      ) : null}

      <section className="space-y-3">
        {bookings.map((booking, i) => (
          <article
            key={booking.id}
            className="grid gap-4 rounded-2xl border border-[#eef0f5] bg-white p-4 transition-all duration-200 hover:border-[#e2e6ee] lg:grid-cols-[1fr_1fr_140px_180px] lg:items-center animate-fade-up"
            style={{ boxShadow: "var(--shadow-panel)", animationDelay: `${i * 40}ms` }}
          >
            {/* Client */}
            <div>
              <p className="font-bold text-[#0d0d0f]">{booking.client_name}</p>
              <p className="mt-0.5 text-sm text-[#64748b]">{booking.client_phone}</p>
              <p className="mt-1 text-xs font-medium text-[#94a3b8]">ID #{booking.id}</p>
            </div>

            {/* Barber + time */}
            <div>
              <p className="text-sm font-semibold text-[#0d0d0f]">{booking.barber_name}</p>
              <p className="mt-0.5 text-sm text-[#64748b]">
                {booking.booking_date} · {formatTime(booking.booking_time)}
              </p>
            </div>

            <StatusBadge status={booking.status} />

            {/* Status change */}
            <select
              className="input py-2.5 text-sm"
              value={booking.status}
              disabled={booking.status === "completed"}
              onChange={(e) => changeStatus(booking.id, e.target.value as BookingStatus)}
            >
              <option value="pending">Pending</option>
              {booking.status === "completed" ? <option value="completed">Completed</option> : null}
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
            </select>
          </article>
        ))}
      </section>
    </div>
  );
}
