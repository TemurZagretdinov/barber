import { useSyncExternalStore } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authStore } from "../../store/authStore";

export function BookingSuccessPage() {
  const [params] = useSearchParams();
  const bookingCode = params.get("bookingCode");
  const navigate = useNavigate();
  const authState = useSyncExternalStore(authStore.subscribe, authStore.getState);

  const handleViewBookings = () => {
    if (authState.token && authState.user?.role === "customer") {
      navigate("/customer");
    } else {
      const qs = bookingCode ? `?bookingCode=${encodeURIComponent(bookingCode)}` : "";
      navigate(`/customer/register${qs}`);
    }
  };

  return (
    <main className="phone-shell">
      <section
        className="phone-card flex min-h-[720px] flex-col items-center justify-center px-8 text-center"
        style={{ background: "linear-gradient(160deg, #ffffff 0%, #fafaf8 60%, #fef9ec 100%)" }}
      >
        {/* Animated success icon */}
        <div className="relative mb-8 animate-pop-in">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 -m-4 rounded-full opacity-20 animate-pulse"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, #d4edda, #c3e6cb)",
              boxShadow: "0 8px 32px rgba(16,185,129,0.25)",
            }}
          >
            <CheckCircle2 size={48} className="text-emerald-600" strokeWidth={1.5} />
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <h1 className="text-3xl font-bold tracking-tight text-[#0d0d0f]">Booking Confirmed!</h1>
          <p className="mt-3 text-[#64748b] leading-relaxed">
            Your appointment has been saved.<br />See you soon!
          </p>

          {bookingCode ? (
            <div
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#eef0f5] bg-white px-5 py-3"
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              <span className="text-xs text-[#94a3b8] font-medium">Booking code</span>
              <span className="text-sm font-bold text-[#0d0d0f]">{bookingCode}</span>
            </div>
          ) : null}
        </div>

        {/* Decorative dots */}
        <div className="my-8 flex gap-2">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#e8ebf0]"
              style={{ opacity: 1 - (i - 1) * 0.3 }}
            />
          ))}
        </div>

        <div
          className="w-full animate-fade-up space-y-3"
          style={{ animationDelay: "200ms" }}
        >
          <Link className="btn-primary w-full" to="/book">
            Book Another Appointment
          </Link>
          <button className="btn-ghost w-full" onClick={handleViewBookings}>
            View My Bookings
          </button>
        </div>
      </section>
    </main>
  );
}
