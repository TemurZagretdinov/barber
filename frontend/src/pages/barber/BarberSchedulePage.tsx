import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { cancelBarberBooking, completeBarberBookingWithNote, getBarberSchedule, noShowBarberBooking } from "../../api/barber";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { BookingStatus, BookingWithBarber } from "../../types/booking";
import { addDays, dateLabel, formatDateLong, formatTime, todayISO } from "../../utils/date";

const filters = ["all", "pending", "completed", "cancelled", "no_show"] as const;
type ActionKind = "complete" | "no_show" | "cancel";

const filterLabels: Record<string, string> = {
  all: "All",
  pending: "Pending",
  completed: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function BarberSchedulePage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<(typeof filters)[number]>("all");
  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<{ kind: ActionKind; booking: BookingWithBarber } | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getBarberSchedule({ date, status: status === "all" ? "" : status })
      .then((items) => { setBookings(items); setError(""); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, status]);

  useEffect(load, [date, status]);
  useEffect(() => {
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function confirmAction() {
    if (!action) return;
    if (action.kind === "complete") await completeBarberBookingWithNote(action.booking.id, note);
    if (action.kind === "no_show")  await noShowBarberBooking(action.booking.id, note);
    if (action.kind === "cancel")   await cancelBarberBooking(action.booking.id, note);
    setAction(null);
    setNote("");
    load();
  }

  function openAction(kind: ActionKind, booking: BookingWithBarber) {
    setAction({ kind, booking });
    setNote("");
  }

  const actionMeta: Record<ActionKind, { title: string; color: string }> = {
    complete: { title: "Mark as Completed", color: "btn-primary" },
    no_show:  { title: "Mark as No-show",   color: "btn-ghost" },
    cancel:   { title: "Cancel Booking",     color: "btn-danger" },
  };

  return (
    <main className="phone-shell">
      <section className="phone-card">
        <header className="page-header">
          <button className="btn-icon shrink-0" type="button" onClick={() => navigate("/barber/dashboard")} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#0d0d0f]">Daily Schedule</h1>
            <p className="mt-0.5 text-sm text-[#64748b]">All appointments</p>
          </div>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
          {/* Date navigator */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#eef0f5] bg-[#f8f9fb] px-3 py-2">
            <button className="btn-icon h-9 w-9 shrink-0 bg-white" type="button" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
              <ChevronLeft size={17} />
            </button>
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-[#0d0d0f]">{dateLabel(date)}</p>
              <p className="text-[11px] text-[#94a3b8]">{formatDateLong(date)}</p>
            </div>
            <button className="btn-icon h-9 w-9 shrink-0 bg-white" type="button" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Status filter */}
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#eef0f5] bg-[#f8f9fb] p-1">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatus(f)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 ${
                  status === f
                    ? "bg-white text-[#0d0d0f] shadow-card"
                    : "text-[#94a3b8] hover:text-[#334155]"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>

          {loading ? <LoadingState count={3} variant="row" /> : null}
          {error ? <ErrorMessage message={error} /> : null}
          {!loading && bookings.length === 0 ? (
            <EmptyState title="No appointments" subtitle="Nothing scheduled for this day" />
          ) : null}

          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-[#eef0f5] bg-white p-4 animate-fade-up"
                style={{ boxShadow: "var(--shadow-panel)", animationDelay: `${i * 50}ms` }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#0d0d0f]">{booking.client_name}</p>
                    <p className="mt-0.5 text-xs text-[#94a3b8]">{booking.client_phone}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#eef0f5] bg-[#f8f9fb] px-2.5 py-0.5 text-sm font-bold text-[#c9a84c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c]" />
                      {formatTime(booking.booking_time)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status as BookingStatus} />
                </div>

                {/* Bottom meta */}
                <div className="mt-3 flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>#{booking.booking_code ?? booking.id}</span>
                  {booking.service_note ? (
                    <span className="line-clamp-1 max-w-[160px]">{booking.service_note}</span>
                  ) : null}
                </div>

                {/* Action buttons */}
                {booking.status === "pending" ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      className="btn-primary flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs"
                      type="button"
                      onClick={() => openAction("complete", booking)}
                    >
                      <CheckCircle2 size={14} />
                      Complete
                    </button>
                    <button
                      className="btn-ghost flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs"
                      type="button"
                      onClick={() => openAction("no_show", booking)}
                    >
                      <XCircle size={14} />
                      No-show
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      type="button"
                      onClick={() => openAction("cancel", booking)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        {/* Action modal */}
        {action ? (
          <div className="modal-backdrop">
            <div className="modal-card max-w-sm p-6">
              <h2 className="text-lg font-bold text-[#0d0d0f]">
                {action.kind === "complete" ? "Confirm Completed" : action.kind === "no_show" ? "Mark as No-show" : "Cancel Booking"}
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                {action.booking.client_name} · {formatTime(action.booking.booking_time)}
              </p>
              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-semibold text-[#64748b]">
                  {action.kind === "complete" ? "Service note (optional)" : "Reason (optional)"}
                </span>
                <textarea
                  className="input min-h-[100px] resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                />
              </label>
              <div className="mt-5 flex gap-3">
                <button className="btn-ghost flex-1" type="button" onClick={() => setAction(null)}>
                  Cancel
                </button>
                <button className={`${actionMeta[action.kind].color} flex-1`} type="button" onClick={confirmAction}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
