import { Gem, LocateFixed, Map, MapPin, MapPinOff, Rows3, SlidersHorizontal, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { type BarberSort, getPublicBarbers } from "../../api/barbers";
import { BarberCard } from "../../components/BarberCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { Barber } from "../../types/barber";

type UserLocation = { latitude: number; longitude: number };

const sortOptions: Array<{
  value: BarberSort;
  label: string;
  description: string;
  icon: typeof LocateFixed;
}> = [
  { value: "nearest",  label: "Nearest",  description: "By location",    icon: LocateFixed },
  { value: "cheapest", label: "Cheapest", description: "Lowest price",   icon: Wallet },
  { value: "expensive",label: "Premium",  description: "Top specialists", icon: Gem },
];

const sortLabels: Record<BarberSort, string> = {
  nearest:  "Nearest",
  cheapest: "Cheapest",
  expensive: "Premium",
};

export function SelectBarberPage() {
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [sort, setSort] = useState<BarberSort | undefined>();
  const [view, setView] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sort === "nearest" && !userLocation) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    getPublicBarbers({
      sort,
      userLat: sort === "nearest" ? userLocation?.latitude : undefined,
      userLng: sort === "nearest" ? userLocation?.longitude : undefined,
    })
      .then(setBarbers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sort, userLocation]);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationMessage("Brauzeringiz lokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    setLocationMessage("Lokatsiya aniqlanmoqda...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationMessage("");
      },
      () => {
        setUserLocation(null);
        setLocationMessage("Lokatsiya ruxsati berilmagan, eng yaqin barberlarni aniqlab bo'lmadi.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  function selectSort(nextSort: BarberSort) {
    setSort(nextSort);
    if (nextSort === "nearest") { requestLocation(); return; }
    setLocationMessage("");
  }

  return (
    <main className="phone-shell">
      <section className="phone-card">
        {/* Hero header */}
        <header className="relative overflow-hidden px-7 pt-8 pb-7" style={{ borderBottom: "1px solid #eef0f5" }}>
          {/* Decorative gradient blob */}
          <div
            className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="section-title mb-1">Premium Barbershop</p>
              <h1 className="text-3xl font-bold tracking-tight text-[#0d0d0f]">Choose Barber</h1>
              <p className="mt-1.5 text-sm text-[#64748b]">Find your perfect stylist</p>
            </div>
            {sort && (
              <span
                className="mt-1 rounded-full px-3.5 py-1.5 text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0d0d0f, #2d2d30)" }}
              >
                {sortLabels[sort]}
              </span>
            )}
          </div>
        </header>

        <div className="px-5 py-5 sm:px-7 sm:py-6 space-y-5">
          {/* Filter & View Panel */}
          <section className="panel-card overflow-hidden p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                >
                  <SlidersHorizontal size={16} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0d0d0f]">Sort barbers</h2>
                  <p className="text-[11px] text-[#94a3b8]">By distance or price</p>
                </div>
              </div>
              {/* View toggle */}
              <div className="flex rounded-xl border border-[#eef0f5] bg-[#f8f9fb] p-0.5">
                <button
                  className={`rounded-lg p-2.5 transition-all duration-200 ${view === "list" ? "bg-white shadow-card" : "text-[#94a3b8]"}`}
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <Rows3 size={16} />
                </button>
                <button
                  className={`rounded-lg p-2.5 transition-all duration-200 ${view === "map" ? "bg-white shadow-card" : "text-[#94a3b8]"}`}
                  type="button"
                  onClick={() => setView("map")}
                  aria-label="Map view"
                >
                  <Map size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const active = sort === option.value;
                return (
                  <button
                    key={option.value}
                    className={`
                      group flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200
                      ${active
                        ? "border-[#0d0d0f] bg-[#0d0d0f] text-white"
                        : "border-[#eef0f5] bg-[#f8f9fb] text-[#0d0d0f] hover:border-[#c9a84c] hover:bg-white"
                      }
                    `}
                    type="button"
                    onClick={() => selectSort(option.value)}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${active ? "bg-white/10" : "bg-white"}`}
                      style={!active ? { boxShadow: "var(--shadow-card)" } : undefined}
                    >
                      <Icon size={17} className={active ? "text-white" : "text-[#c9a84c]"} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className={`mt-0.5 block text-xs ${active ? "text-white/60" : "text-[#94a3b8]"}`}>
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {locationMessage && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800 animate-slide-down">
                <MapPinOff size={15} className="mt-0.5 shrink-0" />
                <span>{locationMessage}</span>
              </div>
            )}
          </section>

          {/* Barber list */}
          <div className="space-y-3">
            {loading ? <LoadingState count={3} /> : null}
            {error ? <ErrorMessage message={error} /> : null}
            {!loading && !error && barbers.length === 0 ? (
              <EmptyState title="No barbers available" subtitle="Try a different sort option" />
            ) : null}

            {view === "map" && barbers.length > 0 ? (
              <section className="overflow-hidden rounded-2xl border border-[#eef0f5]" style={{ boxShadow: "var(--shadow-panel)" }}>
                {/* Mock map */}
                <div
                  className="relative min-h-[240px]"
                  style={{
                    background: "linear-gradient(135deg, #e8edf2 0%, #d8e3ea 100%)",
                    backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, transparent 1px, transparent 36px),
                      repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, transparent 1px, transparent 36px)`,
                  }}
                >
                  {barbers.slice(0, 6).map((barber, index) => (
                    <button
                      key={barber.id}
                      type="button"
                      className="absolute rounded-full bg-[#0d0d0f] p-2 text-white transition-transform hover:scale-110"
                      style={{
                        left: `${12 + (index % 3) * 32}%`,
                        top:  `${18 + Math.floor(index / 3) * 34}%`,
                        boxShadow: "0 4px 16px rgba(13,13,15,0.30)",
                      }}
                      onClick={() => navigate(`/book/service?barberId=${barber.id}`)}
                      title={barber.full_name}
                    >
                      <MapPin size={16} />
                    </button>
                  ))}
                </div>
                <div className="space-y-2 bg-white p-4">
                  {barbers.slice(0, 4).map((barber) => (
                    <div key={barber.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef0f5] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0d0d0f]">{barber.full_name}</p>
                        <p className="text-xs text-[#94a3b8]">
                          {barber.distance_km ? `${barber.distance_km} km · ` : ""}
                          {barber.price_from ? `${barber.price_from.toLocaleString()} UZS` : barber.address}
                        </p>
                      </div>
                      {barber.latitude && barber.longitude ? (
                        <a
                          className="btn-ghost shrink-0 rounded-xl py-1.5 px-3 text-xs"
                          href={`https://www.google.com/maps/dir/?api=1&destination=${barber.latitude},${barber.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Directions
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              barbers.map((barber, i) => (
                <div key={barber.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
                  <BarberCard
                    barber={barber}
                    onSelect={() => navigate(`/book/service?barberId=${barber.id}`)}
                  />
                </div>
              ))
            )}

            {/* Footer links */}
            <div className="flex items-center justify-center gap-5 pt-4 text-xs text-[#94a3b8]">
              <Link className="transition hover:text-[#0d0d0f] font-medium" to="/barber/login">
                Barber login →
              </Link>
              <span className="h-4 w-px bg-[#e8ebf0]" />
              <Link className="transition hover:text-[#0d0d0f] font-medium" to="/customer">
                My bookings →
              </Link>
              <span className="h-4 w-px bg-[#e8ebf0]" />
              <Link className="transition hover:text-[#0d0d0f] font-medium" to="/admin/login">
                Admin →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
