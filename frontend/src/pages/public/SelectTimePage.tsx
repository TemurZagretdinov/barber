import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getAvailableSlots, getPublicBarber, getPublicBarberServices } from "../../api/barbers";
import { BarberCard } from "../../components/BarberCard";
import { TimeSlotGrid } from "../../components/TimeSlotGrid";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { AvailableSlot, Barber, BarberService } from "../../types/barber";
import { addDays, dateLabel, formatDateLong, todayISO } from "../../utils/date";

export const BOOKING_DRAFT_KEY = "sharp-cuts-booking-draft";

export function SelectTimePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const barberId = Number(params.get("barberId"));
  const serviceId = Number(params.get("serviceId"));
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<BarberService | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const subtitle = useMemo(() => formatDateLong(date), [date]);

  useEffect(() => {
    if (!barberId || !serviceId) { navigate("/book"); return; }
    setLoading(true);
    Promise.all([getPublicBarber(barberId), getPublicBarberServices(barberId), getAvailableSlots(barberId, date, serviceId)])
      .then(([barberData, serviceData, slotData]) => {
        setBarber(barberData);
        setService(serviceData.find((item) => item.id === serviceId) ?? null);
        setSlots(slotData);
        setSelectedTime(null);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [barberId, serviceId, date, navigate]);

  function continueToDetails() {
    if (!barber || !selectedTime || !service) return;
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify({ barberId: barber.id, serviceId: service.id, date, time: selectedTime }));
    navigate("/book/details");
  }

  return (
    <main className="phone-shell">
      <section className="phone-card">
        <header className="page-header">
          <button className="btn-icon shrink-0" type="button" onClick={() => navigate("/book")} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#0d0d0f]">Select Time</h1>
            <p className="mt-0.5 truncate text-sm text-[#64748b]">{barber?.full_name ?? "Loading..."}</p>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          {loading ? <LoadingState count={2} /> : null}
          {error ? <ErrorMessage message={error} /> : null}

          {barber && service && !loading ? (
            <>
              <div className="animate-fade-in">
                <BarberCard barber={barber} compact />
              </div>

              {/* Service chip */}
              <div className="flex items-center gap-3 rounded-2xl border border-[#eef0f5] bg-[#f8f9fb] px-4 py-3.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                >
                  <span className="text-sm">✂️</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#0d0d0f] truncate">{service.name}</p>
                  <p className="text-xs text-[#94a3b8]">
                    {service.duration_minutes} min · {Math.round(service.price).toLocaleString("uz-UZ")} so'm
                  </p>
                </div>
              </div>

              {/* Date navigator */}
              <div className="flex items-center gap-3">
                <button
                  className="btn-icon h-11 w-11 shrink-0"
                  type="button"
                  onClick={() => setDate(addDays(date, -1))}
                  aria-label="Previous day"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1 text-center">
                  <p className="text-base font-bold text-[#0d0d0f]">{dateLabel(date)}</p>
                  <p className="text-xs text-[#94a3b8]">{subtitle}</p>
                </div>
                <button
                  className="btn-icon h-11 w-11 shrink-0"
                  type="button"
                  onClick={() => setDate(addDays(date, 1))}
                  aria-label="Next day"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Time slots */}
              <div>
                <p className="section-title mb-3">Available Times</p>
                <TimeSlotGrid slots={slots} selectedTime={selectedTime} onSelect={setSelectedTime} />
              </div>

              <button
                className="btn-primary w-full"
                disabled={!selectedTime}
                type="button"
                onClick={continueToDetails}
              >
                {selectedTime ? "Continue to Details" : "Select a time slot"}
              </button>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
