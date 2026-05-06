import { Bell, CalendarPlus, Heart, LogOut, Search, Star } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation, Link } from "react-router-dom";

import {
  addCustomerFavorite,
  cancelCustomerBooking,
  getCustomerBookingHistory,
  getCustomerBookings,
  getCustomerFavorites,
  getNotifications,
  rescheduleCustomerBooking,
  reviewCustomerBooking,
} from "../../api/bookings";
import { CustomerBookingCard } from "../../components/CustomerBookingCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import { authStore } from "../../store/authStore";
import type { Barber } from "../../types/barber";
import type { BookingWithBarber, NotificationItem } from "../../types/booking";

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-150 ${
        active
          ? "border-b-2 border-[#c9a84c] text-[#0d0d0f]"
          : "border-b-2 border-transparent text-[#94a3b8] hover:text-[#334155]"
      }`}
    >
      {label}
    </button>
  );
}

export function CustomerCabinetPage() {
  const auth = useSyncExternalStore(authStore.subscribe, authStore.getState);
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as any)?.successMessage || null
  );
  const [warningMessage, setWarningMessage] = useState<string | null>(
    (location.state as any)?.warningMessage || null
  );

  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [history, setHistory] = useState<BookingWithBarber[]>([]);
  const [favorites, setFavorites] = useState<Barber[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reviewing, setReviewing] = useState<BookingWithBarber | null>(null);
  const [rescheduling, setRescheduling] = useState<BookingWithBarber | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"bookings" | "history" | "favorites" | "notifications">("bookings");

  const authed = auth.token && auth.user?.role === "customer";

  async function load() {
    if (!authed) return;
    setLoading(true);
    try {
      const [current, past, favoriteItems, notificationItems] = await Promise.all([
        getCustomerBookings(),
        getCustomerBookingHistory(),
        getCustomerFavorites(),
        getNotifications(),
      ]);
      setBookings(current);
      setHistory(past);
      setFavorites(favoriteItems);
      setNotifications(notificationItems);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [authed]);

  useEffect(() => {
    if (successMessage || warningMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setWarningMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, warningMessage]);

  async function submitReview() {
    if (!reviewing) return;
    await reviewCustomerBooking(reviewing.id, { rating, comment });
    setReviewing(null);
    setComment("");
    await load();
  }

  async function submitReschedule() {
    if (!rescheduling) return;
    await rescheduleCustomerBooking(rescheduling.id, { appointment_date: rescheduleDate, appointment_time: rescheduleTime });
    setRescheduling(null);
    await load();
  }

  /* ── Authenticated view ──────────────────────────────────────── */
  return (
    <main className="phone-shell">
      <section className="phone-card relative">
        {successMessage && (
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md animate-fade-up">
            {successMessage}
          </div>
        )}
        {warningMessage && (
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md animate-fade-up">
            {warningMessage}
          </div>
        )}
        
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-[#eef0f5] px-7 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0d0d0f, #1f2022)" }}
            >
              {auth.user?.email?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-[#0d0d0f]">My Bookings</p>
              <p className="truncate text-xs text-[#94a3b8]">{auth.user?.email}</p>
            </div>
          </div>
          <button
            className="btn-icon shrink-0"
            type="button"
            onClick={() => authStore.signOut()}
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-[#eef0f5] px-2">
          <TabButton label="Bookings" active={tab === "bookings"} onClick={() => setTab("bookings")} />
          <TabButton label="History"  active={tab === "history"}  onClick={() => setTab("history")} />
          <TabButton label="Favorites" active={tab === "favorites"} onClick={() => setTab("favorites")} />
          <TabButton label="Alerts"   active={tab === "notifications"} onClick={() => setTab("notifications")} />
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
          {loading ? <LoadingState count={3} /> : null}
          {error ? <ErrorMessage message={error} /> : null}

          {/* ── Active Bookings tab ── */}
          {tab === "bookings" && !loading && (
            <>
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center">
                  <EmptyState
                    title="No upcoming bookings"
                    subtitle="Your next appointment will appear here as soon as it is booked."
                    icon={
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fef9ec] text-[#c9a84c]">
                        <CalendarPlus size={26} />
                      </div>
                    }
                  />
                  <Link to="/book" className="btn-primary mt-4 py-2.5 px-6">
                    <CalendarPlus size={17} />
                    Book an appointment
                  </Link>
                </div>
              ) : null}
              <div className="space-y-4">
                {bookings.map((booking, i) => (
                  <div key={booking.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <CustomerBookingCard
                      booking={booking}
                      onCancel={async (id) => {
                        if (confirm("Are you sure you want to cancel this booking?")) {
                          await cancelCustomerBooking(id);
                          await load();
                        }
                      }}
                      onReschedule={(b) => {
                        setRescheduling(b);
                        setRescheduleDate(b.booking_date);
                        setRescheduleTime(b.booking_time.substring(0, 5));
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── History tab ── */}
          {tab === "history" && !loading && (
            <>
              {history.length === 0 ? (
                <EmptyState title="No booking history" subtitle="Past, completed, cancelled, and no-show bookings will appear here." />
              ) : null}
              <div className="space-y-4">
                {history.map((booking, i) => (
                  <div key={booking.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <CustomerBookingCard
                      booking={booking}
                      onReview={(b) => setReviewing(b)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Favorites tab ── */}
          {tab === "favorites" && !loading && (
            <>
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center">
                  <EmptyState
                    title="No favorites yet"
                    subtitle="Save your favorite barbers for faster booking."
                    icon={
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                        <Heart size={26} />
                      </div>
                    }
                  />
                  <Link to="/book" className="btn-primary mt-4 py-2.5 px-6">
                    <Search size={17} />
                    Browse barbers
                  </Link>
                </div>
              ) : null}
              <div className="space-y-2.5">
                {favorites.map((barber, i) => (
                  <article
                    key={barber.id}
                    className="flex items-center gap-3.5 rounded-xl border border-[#eef0f5] bg-white p-3.5 animate-fade-up"
                    style={{ boxShadow: "var(--shadow-card)", animationDelay: `${i * 40}ms` }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg, #fff1f2, #ffe4e6)" }}
                    >
                      <Heart size={16} className="text-rose-500" fill="currentColor" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#0d0d0f]">{barber.full_name}</p>
                      <p className="text-xs text-[#94a3b8]">{barber.specialty}</p>
                    </div>
                    <button
                      className="btn-ghost shrink-0 rounded-xl py-1.5 px-3 text-xs"
                      type="button"
                      onClick={() => addCustomerFavorite(barber.id)}
                    >
                      Saved
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* ── Notifications tab ── */}
          {tab === "notifications" && !loading && (
            <>
              {notifications.length === 0 ? (
                <EmptyState title="No alerts yet" subtitle="Booking reminders and status updates will appear here." />
              ) : null}
              <div className="space-y-2.5">
                {notifications.slice(0, 5).map((item, i) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#eef0f5] bg-[#fafafa] p-4 animate-fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}
                      >
                        <Bell size={14} className="text-[#c9a84c]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0d0d0f]">{item.title}</p>
                        <p className="mt-0.5 whitespace-pre-line text-xs text-[#64748b] leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Review modal */}
      {reviewing ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#0d0d0f]">Rate Your Barber</h2>
            <p className="mt-1 text-sm text-[#64748b]">{reviewing.barber_name}</p>

            {/* Star rating */}
            <div className="mt-5 flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={star <= rating ? "text-[#c9a84c] fill-[#c9a84c]" : "text-[#e2e6ee]"}
                  />
                </button>
              ))}
            </div>

            <textarea
              className="input mt-4 min-h-[100px] resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
            />
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" type="button" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn-primary flex-1" type="button" onClick={submitReview}>Submit</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reschedule modal */}
      {rescheduling ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#0d0d0f]">Reschedule Booking</h2>
            <p className="mt-1 text-sm text-[#64748b]">{rescheduling.barber_name}</p>
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#334155]">New Date</span>
                <input className="input" type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#334155]">New Time</span>
                <input className="input" type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" type="button" onClick={() => setRescheduling(null)}>Cancel</button>
              <button className="btn-primary flex-1" type="button" onClick={submitReschedule}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
