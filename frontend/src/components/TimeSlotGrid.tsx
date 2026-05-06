import type { AvailableSlot } from "../types/barber";
import { formatTime } from "../utils/date";

interface Props {
  slots: AvailableSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect }: Props) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {slots.map((slot) => {
          const selected = selectedTime === slot.time;
          const disabledLabel = slot.is_expired ? "O'tgan vaqt" : "Band";
          const available = slot.is_available;
          const expired = slot.is_expired;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={!available}
              onClick={() => onSelect(slot.time)}
              title={!available ? disabledLabel : undefined}
              className={`
                relative h-14 rounded-2xl border text-sm font-semibold transition-all duration-200
                ${selected
                  ? "border-transparent bg-[#0d0d0f] text-white shadow-float scale-[1.02]"
                  : available
                    ? "border-[#eef0f5] bg-[#f8f9fb] text-[#0d0d0f] hover:border-[#c9a84c] hover:bg-white hover:-translate-y-0.5"
                    : expired
                      ? "cursor-not-allowed border-[#fde8e8] bg-[#fff5f5] text-[#d5a0a0]"
                      : "cursor-not-allowed border-transparent bg-[#f2f3f6] text-[#c5cbd7]"
                }
              `}
            >
              {formatTime(slot.time)}
              {/* Gold dot on selected */}
              {selected && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#c9a84c]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#94a3b8]">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-[#0d0d0f]" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full border border-[#e2e6ee] bg-[#f8f9fb]" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-[#f2f3f6]" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full border border-[#fde8e8] bg-[#fff5f5]" />
          Expired
        </span>
      </div>
    </div>
  );
}
