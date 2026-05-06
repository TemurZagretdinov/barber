import { Edit2, MapPin, Plus, Star, Trash2, Wallet, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { createAdminBarber, deleteAdminBarber, getAdminBarbers, updateAdminBarber } from "../../api/admin";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import type { AdminBarber, BarberFormPayload } from "../../types/barber";

const emptyForm = {
  full_name: "",
  specialty: "",
  barbershop_name: "",
  photo_url: "",
  phone: "",
  rating: "4.8",
  years_experience: "1",
  price_from: "45000",
  base_price: "45000",
  address: "",
  latitude: "",
  longitude: "",
  work_start_time: "09:00",
  work_end_time: "18:00",
  off_days: ["sunday"] as string[],
  email: "",
  password: "",
  bio: "",
  is_active: true,
};

type BarberForm = typeof emptyForm;

function toForm(barber: AdminBarber): BarberForm {
  return {
    full_name: barber.full_name,
    specialty: barber.specialty,
    barbershop_name: barber.barbershop_name ?? "",
    photo_url: barber.photo_url ?? barber.avatar ?? "",
    phone: barber.phone ?? "",
    rating: String(barber.rating ?? barber.average_rating ?? 4.8),
    years_experience: String(barber.years_experience ?? 1),
    price_from: String(barber.price_from ?? ""),
    base_price: String(barber.base_price ?? barber.price_from ?? ""),
    address: barber.address ?? "",
    latitude: barber.latitude == null ? "" : String(barber.latitude),
    longitude: barber.longitude == null ? "" : String(barber.longitude),
    work_start_time: barber.work_start_time?.slice(0, 5) ?? "09:00",
    work_end_time: barber.work_end_time?.slice(0, 5) ?? "18:00",
    off_days: barber.off_days ?? [],
    email: barber.email,
    password: "",
    bio: barber.bio ?? "",
    is_active: barber.is_active,
  };
}

function toPayload(form: BarberForm, editing: boolean): BarberFormPayload {
  return {
    full_name: form.full_name,
    specialty: form.specialty,
    barbershop_name: form.barbershop_name || null,
    photo_url: form.photo_url,
    phone: form.phone || null,
    rating: Number(form.rating.replace(",", ".")),
    years_experience: Number(form.years_experience),
    price_from: form.base_price ? Number(form.base_price.replace(",", ".")) : form.price_from ? Number(form.price_from.replace(",", ".")) : null,
    base_price: form.base_price ? Number(form.base_price.replace(",", ".")) : null,
    address: form.address || null,
    latitude: form.latitude ? Number(form.latitude.replace(",", ".")) : null,
    longitude: form.longitude ? Number(form.longitude.replace(",", ".")) : null,
    work_start_time: form.work_start_time,
    work_end_time: form.work_end_time,
    off_days: form.off_days,
    email: form.email,
    password: form.password || (editing ? undefined : "123456"),
    bio: form.bio,
    is_active: form.is_active,
  };
}

const weekdays = [
  ["monday", "Mon"],
  ["tuesday", "Tue"],
  ["wednesday", "Wed"],
  ["thursday", "Thu"],
  ["friday", "Fri"],
  ["saturday", "Sat"],
  ["sunday", "Sun"],
] as const;

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid #eef0f5" }}>
        <h3 className="text-sm font-bold text-[#0d0d0f]">{title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#64748b]">{label}</span>
      {children}
    </label>
  );
}

export function BarbersPage() {
  const [barbers, setBarbers] = useState<AdminBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBarber | null>(null);
  const [form, setForm] = useState<BarberForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getAdminBarbers()
      .then((items) => { setBarbers(items); setError(""); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);
  useEffect(() => {
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(barber: AdminBarber) { setEditing(barber); setForm(toForm(barber)); setModalOpen(true); }

  async function save(event: FormEvent) {
    event.preventDefault();
    const price = Number(form.base_price.replace(",", "."));
    const latitude = form.latitude ? Number(form.latitude.replace(",", ".")) : null;
    const longitude = form.longitude ? Number(form.longitude.replace(",", ".")) : null;
    if (!form.full_name.trim() || !form.email.trim()) { setError("Full name va email majburiy."); return; }
    if (!Number.isFinite(price)) { setError("Xizmat narxi raqam bo'lishi kerak."); return; }
    if ((latitude !== null && !Number.isFinite(latitude)) || (longitude !== null && !Number.isFinite(longitude))) {
      setError("Latitude va longitude raqam bo'lishi kerak."); return;
    }
    if (form.work_start_time >= form.work_end_time) { setError("Ish boshlanish vaqti tugash vaqtidan oldin bo'lishi kerak."); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) { await updateAdminBarber(editing.id, toPayload(form, true)); }
      else { await createAdminBarber(toPayload(form, false)); }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save barber");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this barber?")) return;
    await deleteAdminBarber(id);
    load();
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-title mb-1">Management</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0d0d0f]">Barbers</h1>
          <p className="mt-1 text-sm text-[#64748b]">{barbers.length} barber{barbers.length !== 1 ? "s" : ""} on the team</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" type="button" onClick={openCreate}>
          <Plus size={18} />
          Add Barber
        </button>
      </header>

      {loading ? <LoadingState count={3} variant="row" /> : null}
      {error ? <div className="mb-5"><ErrorMessage message={error} /></div> : null}

      <section className="space-y-4">
        {barbers.map((barber, i) => (
          <article
            key={barber.id}
            className="flex flex-col gap-5 rounded-2xl border border-[#eef0f5] bg-white p-5 transition-all duration-200 hover:border-[#e2e6ee] sm:flex-row sm:items-center animate-fade-up"
            style={{ boxShadow: "var(--shadow-panel)", animationDelay: `${i * 50}ms` }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={barber.photo_url ?? barber.avatar ?? "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80"}
                alt={barber.full_name}
                className="h-20 w-20 rounded-2xl object-cover"
                style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }}
              />
              {barber.is_active ? (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400" title="Active" />
              ) : (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#e2e6ee]" title="Inactive" />
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-[#0d0d0f]">{barber.full_name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {(barber.rating ?? barber.average_rating ?? 5).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-[#64748b]">{barber.specialty}</p>
              <p className="mt-1.5 text-xs text-[#94a3b8]">
                {barber.years_experience ?? 0} yrs exp · {barber.email} · {barber.total_bookings} bookings
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {barber.price_from ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#eef0f5] bg-[#f8f9fb] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">
                    <Wallet size={11} className="text-[#c9a84c]" />
                    {barber.price_from.toLocaleString()} UZS
                  </span>
                ) : null}
                {barber.address ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#eef0f5] bg-[#f8f9fb] px-2.5 py-0.5 text-xs text-[#64748b]">
                    <MapPin size={11} />
                    {barber.address}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Today count */}
            <div className="hidden sm:block text-center px-4">
              <p className="text-3xl font-bold text-[#0d0d0f]">{barber.today_bookings}</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">today</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                className="btn-icon"
                type="button"
                onClick={() => openEdit(barber)}
                title="Edit barber"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-500 transition-all duration-200 hover:bg-red-100 hover:border-red-300"
                type="button"
                onClick={() => remove(barber.id)}
                title="Delete barber"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* Modal */}
      {modalOpen ? (
        <div className="modal-backdrop items-start overflow-y-auto py-10">
          <form
            className="modal-card w-full max-w-2xl"
            onSubmit={save}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#eef0f5] px-7 py-6">
              <div>
                <h2 className="text-xl font-bold text-[#0d0d0f]">
                  {editing ? "Edit Barber" : "Add New Barber"}
                </h2>
                <p className="mt-0.5 text-sm text-[#94a3b8]">
                  {editing ? "Update barber information" : "Fill in the details to add a new barber"}
                </p>
              </div>
              <button
                className="btn-icon"
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-7 p-7">
              {error ? <ErrorMessage message={error} /> : null}

              {/* Personal info */}
              <FormSection title="Personal Information">
                {[
                  ["full_name",  "Full Name",         "e.g. Marcus Johnson"],
                  ["email",      "Email / Login",      "e.g. jamshid@gmail.com"],
                  ["password",   "Password",           editing ? "Leave blank to keep current" : "Auto: 123456"],
                  ["phone",      "Phone Number",       "+998901234567"],
                  ["specialty",  "Specialty",          "e.g. Fade & Line-ups"],
                ].map(([key, label, placeholder]) => (
                  <FieldLabel key={key} label={label}>
                    <input
                      className="input"
                      required={!editing || key !== "password"}
                      type={key === "password" ? "password" : key === "email" ? "email" : "text"}
                      placeholder={placeholder}
                      value={form[key as keyof BarberForm] as string}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </FieldLabel>
                ))}
                <label className="flex items-center gap-3 rounded-xl border border-[#eef0f5] bg-[#f8f9fb] px-4 py-3 cursor-pointer hover:border-[#c9a84c] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 accent-[#c9a84c]"
                  />
                  <span className="text-sm font-medium text-[#334155]">Active barber</span>
                </label>
              </FormSection>

              {/* Location */}
              <FormSection title="Barbershop Location">
                <FieldLabel label="Barbershop Name">
                  <input className="input" placeholder="Sharp Cuts Yunusabad" value={form.barbershop_name}
                    onChange={(e) => setForm({ ...form, barbershop_name: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Address">
                  <input className="input" placeholder="Amir Temur Avenue, Tashkent" value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Latitude">
                  <input className="input" inputMode="decimal" placeholder="41.3111" value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Longitude">
                  <input className="input" inputMode="decimal" placeholder="69.2797" value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </FieldLabel>
              </FormSection>

              {/* Schedule & Pricing */}
              <FormSection title="Schedule & Pricing">
                <FieldLabel label="Work Start Time">
                  <input className="input" type="time" value={form.work_start_time}
                    onChange={(e) => setForm({ ...form, work_start_time: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Work End Time">
                  <input className="input" type="time" value={form.work_end_time}
                    onChange={(e) => setForm({ ...form, work_end_time: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Base Price (UZS)">
                  <input className="input" required inputMode="decimal" placeholder="e.g. 45000"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value, price_from: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Rating (1–5)">
                  <input className="input" required value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Years Experience">
                  <input className="input" required type="number" min="0" value={form.years_experience}
                    onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
                </FieldLabel>

                {/* Off days — full width */}
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-xs font-semibold text-[#64748b]">Days Off</span>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map(([value, label]) => {
                      const active = form.off_days.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
                            active
                              ? "border-[#0d0d0f] bg-[#0d0d0f] text-white"
                              : "border-[#e2e6ee] bg-white text-[#64748b] hover:border-[#c9a84c] hover:text-[#c9a84c]"
                          }`}
                          onClick={() =>
                            setForm({
                              ...form,
                              off_days: active
                                ? form.off_days.filter((d) => d !== value)
                                : [...form.off_days, value],
                            })
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FormSection>

              {/* Photo & Bio */}
              <FormSection title="Photo & Bio">
                <div className="sm:col-span-2">
                  <FieldLabel label="Photo URL">
                    <input className="input" required placeholder="https://..." value={form.photo_url}
                      onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
                  </FieldLabel>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel label="Bio">
                    <textarea className="input min-h-[100px] resize-none" placeholder="Short description..."
                      value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                  </FieldLabel>
                </div>
              </FormSection>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 border-t border-[#eef0f5] px-7 py-5">
              <button className="btn-ghost flex-1" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary flex-1" disabled={saving} type="submit">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving...
                  </span>
                ) : "Save Barber"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
