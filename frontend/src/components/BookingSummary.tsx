import { Calendar, Clock } from "lucide-react";

import type { Barber } from "../types/barber";
import { formatDateLong, formatTime } from "../utils/date";

export function BookingSummary({ barber, date, time }: { barber: Barber; date: string; time: string }) {
  const image =
    barber.photo_url ||
    barber.avatar ||
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80";

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-white"
      style={{ boxShadow: "0 8px 40px rgba(15,23,42,0.10)" }}
    >
      {/* Gold gradient top bar */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #c9a84c 0%, #fbbf24 50%, #c9a84c 100%)" }}
      />

      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 top-1 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, #c9a84c 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #c9a84c 0%, transparent 50%)`,
        }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94a3b8]">
            Booking Summary
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Confirmed
          </span>
        </div>

        {/* Barber info */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <img
              src={image}
              alt={barber.full_name}
              className="h-14 w-14 rounded-2xl object-cover"
              style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div>
            <p className="text-base font-bold text-[#0d0d0f]">{barber.full_name}</p>
            <p className="text-sm text-[#64748b]">{barber.specialty}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #e8ebf0, transparent)" }} />

        {/* Date & Time */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
            >
              <Calendar size={17} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Date</p>
              <p className="text-sm font-semibold text-[#0d0d0f]">{formatDateLong(date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #e0f2fe, #bae6fd)" }}
            >
              <Clock size={17} className="text-sky-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Time</p>
              <p className="text-sm font-semibold text-[#0d0d0f]">{formatTime(time)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}