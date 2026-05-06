import { CalendarClock, MapPin, ReceiptText, RefreshCw, Star, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { StatusBadge } from "./StatusBadge";
import type { BookingWithBarber } from "../types/booking";
import { formatDateLong, formatTime } from "../utils/date";

interface Props {
  booking: BookingWithBarber;
  onCancel?: (id: number) => void;
  onReschedule?: (booking: BookingWithBarber) => void;
  onReview?: (booking: BookingWithBarber) => void;
}

function formatPrice(value?: number | null) {
  if (value == null) return "Price on visit";
  return `${Math.round(value).toLocaleString("uz-UZ")} so'm`;
}

export function CustomerBookingCard({ booking, onCancel, onReschedule, onReview }: Props) {
  const navigate = useNavigate();
  const isPending = booking.status === "pending";
  const isCompleted = booking.status === "completed";
  const isCancelledOrNoShow = booking.status === "cancelled" || booking.status === "no_show";
  const placeName = booking.barbershop_name || booking.barber_address;

  const handleRebook = () => {
    const serviceQuery = booking.service_id ? `&serviceId=${booking.service_id}` : "";
    navigate(booking.service_id
      ? `/book/time?barberId=${booking.barber_id}${serviceQuery}`
      : `/book/service?barberId=${booking.barber_id}`
    );
  };

  return (
    <article
      className="group relative flex flex-col rounded-3xl border border-[#eef0f5] bg-white p-5 transition-all duration-300 hover:border-[#e2e6ee]"
      style={{ boxShadow: "0 8px 32px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#eef0f5]"
            style={{ background: "linear-gradient(135deg, #f8f9fb 0%, #eef0f5 100%)" }}
          >
            {booking.barber_photo_url ? (
              <img src={booking.barber_photo_url} alt={booking.barber_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#64748b]">{booking.barber_name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#0d0d0f]">{booking.barber_name}</h3>
            <p className="text-sm font-medium text-[#64748b]">{booking.service_name ?? booking.barber_specialty}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-5 mb-5 h-px w-full bg-gradient-to-r from-transparent via-[#eef0f5] to-transparent" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Date & Time</span>
          <p className="mt-1 text-sm font-medium text-[#0d0d0f]">
            {formatDateLong(booking.booking_date)} <br />
            <span className="text-[#64748b]">{formatTime(booking.booking_time)}</span>
          </p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Booking Code</span>
          <p className="mt-1 text-sm font-bold tracking-wide text-[#0d0d0f]">{booking.booking_code}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl border border-[#eef0f5] bg-[#fafafa] p-3 text-sm text-[#64748b]">
        <div className="flex items-start gap-2">
          <ReceiptText size={15} className="mt-0.5 shrink-0 text-[#c9a84c]" />
          <span>
            <span className="font-semibold text-[#0d0d0f]">{formatPrice(booking.price)}</span>
            {booking.duration_minutes ? <span className="ml-2 text-xs">/{booking.duration_minutes} min</span> : null}
          </span>
        </div>
        {placeName ? (
          <div className="flex items-start gap-2">
            <MapPin size={15} className="mt-0.5 shrink-0 text-[#c9a84c]" />
            <span className="min-w-0 leading-relaxed">
              {booking.barbershop_name ? <span className="font-semibold text-[#0d0d0f]">{booking.barbershop_name}</span> : null}
              {booking.barbershop_name && booking.barber_address ? <span> - </span> : null}
              {booking.barber_address}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {isPending && (
          <>
            <button
              className="btn-ghost flex-1 py-2 text-sm"
              type="button"
              onClick={() => onCancel?.(booking.id)}
            >
              <XCircle size={15} />
              Cancel
            </button>
            <button
              className="btn-primary flex-1 py-2 text-sm"
              type="button"
              onClick={() => onReschedule?.(booking)}
            >
              <CalendarClock size={15} />
              Reschedule
            </button>
            <button
              className="btn-ghost w-full py-2 text-sm"
              type="button"
              onClick={handleRebook}
            >
              <RefreshCw size={15} />
              Book Again
            </button>
          </>
        )}
        
        {isCompleted && (
          <>
            <button
              className="btn-ghost flex-1 py-2 text-sm text-[#c9a84c] hover:bg-[#fef9ec]"
              type="button"
              onClick={() => onReview?.(booking)}
            >
              <Star size={15} className="fill-current" />
              Leave Review
            </button>
            <button
              className="btn-primary flex-1 py-2 text-sm"
              type="button"
              onClick={handleRebook}
            >
              <RefreshCw size={15} />
              Book Again
            </button>
          </>
        )}

        {isCancelledOrNoShow && (
          <button
            className="btn-primary w-full py-2 text-sm"
            type="button"
            onClick={handleRebook}
          >
            <RefreshCw size={15} />
            Book Again
          </button>
        )}
      </div>
    </article>
  );
}
