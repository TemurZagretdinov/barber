import { ArrowLeft, Clock3, Scissors } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getPublicBarber, getPublicBarberServices } from "../../api/barbers";
import { BarberCard } from "../../components/BarberCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { Barber, BarberService } from "../../types/barber";

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("uz-UZ")} so'm`;
}

export function SelectServicePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const barberId = Number(params.get("barberId"));
  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<BarberService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!barberId) { navigate("/book"); return; }
    setLoading(true);
    Promise.all([getPublicBarber(barberId), getPublicBarberServices(barberId)])
      .then(([barberData, serviceData]) => {
        setBarber(barberData);
        setServices(serviceData);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [barberId, navigate]);

  return (
    <main className="phone-shell">
      <section className="phone-card">
        <header className="page-header">
          <button
            className="btn-icon shrink-0"
            type="button"
            onClick={() => navigate("/book")}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#0d0d0f]">Choose Service</h1>
            <p className="mt-0.5 truncate text-sm text-[#64748b]">{barber?.full_name ?? "Loading..."}</p>
          </div>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
          {loading ? <LoadingState count={2} variant="row" /> : null}
          {error ? <ErrorMessage message={error} /> : null}

          {barber && !loading ? (
            <div className="animate-fade-in">
              <BarberCard barber={barber} compact />
            </div>
          ) : null}

          {!loading && services.length === 0 ? (
            <EmptyState title="No services available" subtitle="This barber hasn't added services yet" />
          ) : null}

          <div className="space-y-3">
            {services.map((service, i) => (
              <button
                key={service.id}
                className="
                  group w-full rounded-2xl border border-[#eef0f5] bg-white p-4 text-left
                  transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c9a84c]
                  animate-fade-up
                "
                style={{
                  boxShadow: "var(--shadow-panel)",
                  animationDelay: `${i * 70}ms`,
                }}
                type="button"
                onClick={() => navigate(`/book/time?barberId=${barberId}&serviceId=${service.id}`)}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200"
                    style={{ background: "linear-gradient(135deg, #0d0d0f, #2d2d30)", boxShadow: "0 4px 12px rgba(13,13,15,0.20)" }}
                  >
                    <Scissors size={20} className="text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-[#0d0d0f] group-hover:text-[#0d0d0f]">
                      {service.name}
                    </span>
                    {service.description ? (
                      <span className="mt-0.5 block text-sm text-[#64748b] line-clamp-1">{service.description}</span>
                    ) : null}
                    <span className="mt-2.5 flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-bold text-[#0d0d0f]">{formatPrice(service.price)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#eef0f5] bg-[#f8f9fb] px-2.5 py-0.5 text-xs font-semibold text-[#64748b]">
                        <Clock3 size={12} className="text-[#c9a84c]" />
                        {service.duration_minutes} min
                      </span>
                    </span>
                  </span>
                  <span className="text-[#c9a84c] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
