import { ArrowLeft, Phone, User } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getPublicBarber, getPublicBarberServices } from "../../api/barbers";
import { createBooking } from "../../api/bookings";
import { BookingSummary } from "../../components/BookingSummary";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { Barber, BarberService } from "../../types/barber";
import { BOOKING_DRAFT_KEY } from "./SelectTimePage";

interface Draft {
  barberId: number;
  serviceId: number;
  date: string;
  time: string;
}

export function BookingDetailsPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<BarberService | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) { navigate("/book"); return; }
    const parsed = JSON.parse(raw) as Draft;
    setDraft(parsed);
    Promise.all([getPublicBarber(parsed.barberId), getPublicBarberServices(parsed.barberId)])
      .then(([barberData, serviceData]) => {
        setBarber(barberData);
        setService(serviceData.find((item) => item.id === parsed.serviceId) ?? null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSubmitting(true);
    setError("");
    try {
      const booking = await createBooking({
        barber_id: draft.barberId,
        service_id: draft.serviceId,
        appointment_date: draft.date,
        appointment_time: draft.time,
        client_name: clientName,
        client_phone: clientPhone,
      });
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
      navigate(`/book/success?bookingCode=${encodeURIComponent(booking.booking_code ?? String(booking.id))}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="phone-shell">
      <section className="phone-card">
        <header className="page-header">
          <button className="btn-icon shrink-0" type="button" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#0d0d0f]">Your Details</h1>
            <p className="mt-0.5 text-sm text-[#64748b]">Almost done!</p>
          </div>
        </header>

        <form className="space-y-5 px-5 py-5 sm:px-7 sm:py-6" onSubmit={submit}>
          {loading ? <LoadingState count={1} /> : null}
          {error ? <ErrorMessage message={error} /> : null}

          {barber && draft ? (
            <div className="animate-fade-in">
              <BookingSummary barber={barber} date={draft.date} time={draft.time} />
            </div>
          ) : null}

          {service ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#eef0f5] bg-[#f8f9fb] px-4 py-3.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
              >
                <span className="text-sm">✂️</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#0d0d0f]">{service.name}</p>
                <p className="text-xs text-[#94a3b8]">
                  {service.duration_minutes} min · {Math.round(service.price).toLocaleString("uz-UZ")} so'm
                </p>
              </div>
            </div>
          ) : null}

          {/* Form fields */}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Full Name</span>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input
                  className="input pl-12"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Phone Number</span>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input
                  className="input pl-12"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+998 90 000 00 00"
                />
              </div>
            </label>
          </div>

          <p className="text-center text-xs text-[#94a3b8]">
            We'll send you a reminder before your appointment
          </p>

          <button
            className="btn-primary w-full"
            disabled={submitting || !clientName || !clientPhone}
            type="submit"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Confirming...
              </span>
            ) : "Confirm Booking"}
          </button>
        </form>
      </section>
    </main>
  );
}
