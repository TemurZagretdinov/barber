import { MapPin, Star, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import type { Barber } from "../types/barber";

interface Props {
  barber: Barber;
  onSelect?: () => void;
  compact?: boolean;
  rightSlot?: ReactNode;
}

export function BarberCard({ barber, onSelect, compact = false, rightSlot }: Props) {
  const image =
    barber.photo_url ||
    barber.avatar ||
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80";
  const rating = barber.rating ?? barber.average_rating ?? 5;
  const detail =
    typeof barber.years_experience === "number"
      ? `${barber.years_experience} yrs exp`
      : typeof barber.completed_bookings_count === "number"
        ? `${barber.completed_bookings_count} completed`
        : barber.services?.length
          ? `${barber.services.length} services`
          : "Available today";
  const price =
    typeof barber.price_from === "number"
      ? new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(barber.price_from)
      : null;

  return (
    <article
      className={`
        group relative overflow-hidden rounded-2xl border border-[#eef0f5] bg-white
        transition-all duration-300 ease-spring
        ${onSelect ? "cursor-pointer hover:-translate-y-0.5" : ""}
        ${compact ? "flex items-center gap-3 px-4 py-3" : "flex items-center gap-4 p-5"}
      `}
      style={{ boxShadow: "var(--shadow-panel)" }}
      onClick={onSelect}
    >
      {/* Gold hover accent line */}
      {onSelect && (
        <div
          className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-[#c9a84c] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={image}
          alt={barber.full_name}
          className={`
            ${compact ? "h-11 w-11" : "h-[68px] w-[68px]"}
            rounded-2xl object-cover ring-2 ring-white
          `}
          style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.10)" }}
        />
        {/* Online dot */}
        {!compact && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400"
            aria-label="Available"
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`${compact ? "text-sm" : "text-base"} truncate font-bold text-[#0d0d0f]`}>
            {barber.full_name}
          </h3>
          {!compact && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className={`${compact ? "text-xs" : "mt-0.5 text-sm"} truncate text-[#64748b]`}>
          {barber.specialty}
        </p>
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#94a3b8]">{detail}</span>
            {price && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e8ebf0] bg-[#f8f9fb] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">
                <Wallet size={11} />
                {price} UZS
              </span>
            )}
            {typeof barber.distance_km === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0d0d0f] px-2.5 py-0.5 text-xs font-semibold text-white">
                <MapPin size={11} />
                {barber.distance_km.toFixed(1)} km
              </span>
            )}
          </div>
        )}
      </div>

      {rightSlot}

      {onSelect && !rightSlot && (
        <button
          className="btn-primary shrink-0 rounded-xl px-4 py-2.5 text-sm"
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          Select
        </button>
      )}
    </article>
  );
}
