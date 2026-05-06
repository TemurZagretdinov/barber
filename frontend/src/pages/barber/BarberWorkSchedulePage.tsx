import { ArrowLeft, Clock3, Plus, Save, Scissors, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createBarberDayOff,
  createBarberService,
  createBarberVacation,
  deleteBarberDayOff,
  deleteBarberService,
  deleteBarberVacation,
  getBarberDayOffs,
  getBarberServices,
  getBarberVacations,
  getBarberWorkingSchedule,
  saveBarberWorkingSchedule,
  updateBarberService,
} from "../../api/barber";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { BarberDayOff, BarberScheduleItem, BarberService, BarberVacation } from "../../types/barber";
import { todayISO } from "../../utils/date";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ServiceForm = Omit<BarberService, "id" | "barber_id" | "created_at" | "updated_at">;

const blankService: ServiceForm = {
  name: "",
  description: "",
  price: 50000,
  duration_minutes: 30,
  is_active: true,
};

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border border-[#eef0f5] bg-white overflow-hidden"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      <div className="px-5 py-4 border-b border-[#eef0f5] bg-[#fafafa]">
        <h2 className="text-base font-bold text-[#0d0d0f]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function BarberWorkSchedulePage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<BarberService[]>([]);
  const [schedule, setSchedule] = useState<BarberScheduleItem[]>([]);
  const [dayOffs, setDayOffs] = useState<BarberDayOff[]>([]);
  const [vacations, setVacations] = useState<BarberVacation[]>([]);
  const [form, setForm] = useState<ServiceForm>(blankService);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dayOffDate, setDayOffDate] = useState(todayISO());
  const [vacation, setVacation] = useState({ start_date: todayISO(), end_date: todayISO(), reason: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [serviceItems, scheduleItems, offItems, vacationItems] = await Promise.all([
        getBarberServices(),
        getBarberWorkingSchedule(),
        getBarberDayOffs(),
        getBarberVacations(),
      ]);
      setServices(serviceItems);
      setSchedule(scheduleItems);
      setDayOffs(offItems);
      setVacations(vacationItems);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submitService(event: FormEvent) {
    event.preventDefault();
    if (editingId) { await updateBarberService(editingId, form); }
    else            { await createBarberService(form); }
    setEditingId(null);
    setForm(blankService);
    await load();
  }

  function editService(service: BarberService) {
    setEditingId(service.id);
    setForm({ name: service.name, description: service.description ?? "", price: service.price, duration_minutes: service.duration_minutes, is_active: service.is_active });
  }

  function updateSchedule(index: number, patch: Partial<BarberScheduleItem>) {
    setSchedule((items) => items.map((item) => (item.weekday === index ? { ...item, ...patch } : item)));
  }

  const closedDates = [
    ...dayOffs.map((d) => ({ id: d.id, label: d.date, type: "day" as const })),
    ...vacations.map((v) => ({ id: v.id, label: `${v.start_date} → ${v.end_date}`, type: "vacation" as const })),
  ];

  return (
    <main className="phone-shell">
      <section className="phone-card">
        <header className="page-header">
          <button className="btn-icon shrink-0" type="button" onClick={() => navigate("/barber/dashboard")} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#0d0d0f]">Work Schedule</h1>
            <p className="mt-0.5 text-sm text-[#64748b]">Services, breaks & days off</p>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          {loading ? <LoadingState count={2} /> : null}
          {error ? <ErrorMessage message={error} /> : null}

          {/* ─── Services catalog ─── */}
          <SectionCard title="Services Catalog" subtitle="Add and manage your offered services">
            <form className="space-y-3 mb-5" onSubmit={submitService}>
              <input className="input" placeholder="Service name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Description (optional)" value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#64748b]">Price (UZS)</span>
                  <input className="input" type="number" min={0} value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#64748b]">Duration (min)</span>
                  <input className="input" type="number" min={10} value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-[#eef0f5] bg-[#f8f9fb] px-4 py-3 cursor-pointer hover:border-[#c9a84c] transition-colors">
                <input type="checkbox" checked={form.is_active} className="h-4 w-4 accent-[#c9a84c]"
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm font-medium text-[#334155]">Active service</span>
              </label>
              <button className="btn-primary w-full" type="submit">
                <Plus size={17} />
                {editingId ? "Save Changes" : "Add Service"}
              </button>
            </form>

            {services.length === 0 ? (
              <EmptyState title="No services yet" subtitle="Add your first service above" />
            ) : (
              <div className="space-y-2.5">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 rounded-xl border border-[#eef0f5] bg-[#fafafa] p-3.5"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg, #0d0d0f, #1f2022)" }}
                    >
                      <Scissors size={15} className="text-[#c9a84c]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#0d0d0f]">{service.name}</p>
                      <p className="text-xs text-[#94a3b8]">
                        {Math.round(service.price).toLocaleString("uz-UZ")} UZS
                        <span className="mx-1.5">·</span>
                        <Clock3 size={10} className="inline text-[#c9a84c]" />
                        {" "}{service.duration_minutes} min
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button className="btn-icon py-1.5 px-2.5 text-xs" type="button" onClick={() => editService(service)}>
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                        type="button"
                        onClick={async () => { await deleteBarberService(service.id); await load(); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ─── Weekly Schedule ─── */}
          <SectionCard title="Weekly Schedule" subtitle="Set your working hours per day">
            <div className="mb-4 flex justify-end">
              <button
                className="btn-primary rounded-xl px-4 py-2.5 text-sm"
                type="button"
                onClick={async () => { await saveBarberWorkingSchedule(schedule); await load(); }}
              >
                <Save size={16} />
                Save Schedule
              </button>
            </div>
            <div className="space-y-3">
              {schedule.map((item, i) => (
                <div
                  key={item.weekday}
                  className={`rounded-xl border p-4 transition-colors ${item.is_working ? "border-[#eef0f5] bg-white" : "border-[#eef0f5] bg-[#f8f9fb] opacity-60"}`}
                >
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                        style={{
                          background: item.is_working ? "linear-gradient(135deg, #c9a84c, #a8873a)" : "#e2e8f0",
                          color: item.is_working ? "#ffffff" : "#94a3b8",
                        }}
                      >
                        {weekdaysShort[i].slice(0, 1)}
                      </span>
                      <span className="text-sm font-semibold text-[#0d0d0f]">{weekdays[i]}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={item.is_working}
                      className="h-4 w-4 accent-[#c9a84c]"
                      onChange={(e) => updateSchedule(item.weekday, { is_working: e.target.checked })}
                    />
                  </label>
                  {item.is_working && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-[#94a3b8]">Start</span>
                        <input className="input py-2.5 text-sm" type="time"
                          value={item.start_time?.slice(0, 5)}
                          onChange={(e) => updateSchedule(item.weekday, { start_time: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-[#94a3b8]">End</span>
                        <input className="input py-2.5 text-sm" type="time"
                          value={item.end_time?.slice(0, 5)}
                          onChange={(e) => updateSchedule(item.weekday, { end_time: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-[#94a3b8]">Break Start</span>
                        <input className="input py-2.5 text-sm" type="time"
                          value={item.break_start_time?.slice(0, 5) ?? ""}
                          onChange={(e) => updateSchedule(item.weekday, { break_start_time: e.target.value || null })} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-[#94a3b8]">Break End</span>
                        <input className="input py-2.5 text-sm" type="time"
                          value={item.break_end_time?.slice(0, 5) ?? ""}
                          onChange={(e) => updateSchedule(item.weekday, { break_end_time: e.target.value || null })} />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ─── Days Off & Vacation ─── */}
          <SectionCard title="Days Off & Vacation" subtitle="Block specific dates or vacation periods">
            <div className="space-y-3 mb-5">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-[#64748b]">Single day off</p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="date"
                    value={dayOffDate}
                    onChange={(e) => setDayOffDate(e.target.value)}
                  />
                  <button
                    className="btn-ghost shrink-0 px-4"
                    type="button"
                    onClick={async () => { await createBarberDayOff({ date: dayOffDate, reason: "Dam olish" }); await load(); }}
                  >
                    Block day
                  </button>
                </div>
              </div>

              <div className="border-t border-[#eef0f5] pt-3">
                <p className="mb-1.5 text-xs font-semibold text-[#64748b]">Vacation period</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-[#94a3b8]">From</span>
                    <input className="input" type="date" value={vacation.start_date}
                      onChange={(e) => setVacation({ ...vacation, start_date: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-[#94a3b8]">To</span>
                    <input className="input" type="date" value={vacation.end_date}
                      onChange={(e) => setVacation({ ...vacation, end_date: e.target.value })} />
                  </label>
                </div>
                <input className="input mb-2" placeholder="Reason (optional)" value={vacation.reason}
                  onChange={(e) => setVacation({ ...vacation, reason: e.target.value })} />
                <button
                  className="btn-primary w-full"
                  type="button"
                  onClick={async () => { await createBarberVacation(vacation); await load(); }}
                >
                  <Plus size={16} />
                  Add Vacation
                </button>
              </div>
            </div>

            {/* Closed dates list */}
            {closedDates.length === 0 ? (
              <EmptyState title="No blocked dates" subtitle="Your calendar is fully open" />
            ) : (
              <div className="space-y-2">
                {closedDates.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      item.type === "vacation"
                        ? "border-amber-200 bg-amber-50"
                        : "border-[#eef0f5] bg-[#f8f9fb]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0d0d0f]">{item.label}</p>
                      <p className="text-xs text-[#94a3b8] capitalize">{item.type === "vacation" ? "Vacation" : "Day off"}</p>
                    </div>
                    <button
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                      type="button"
                      onClick={async () => {
                        item.type === "day"
                          ? await deleteBarberDayOff(item.id)
                          : await deleteBarberVacation(item.id);
                        await load();
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </section>
    </main>
  );
}
