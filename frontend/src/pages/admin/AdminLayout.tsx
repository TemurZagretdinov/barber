import { CalendarDays, LayoutDashboard, LogOut, Scissors, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { authStore } from "../../store/authStore";

const navItems = [
  { to: "/admin",          label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/barbers",  label: "Barbers",   icon: UsersRound },
  { to: "/admin/bookings", label: "Bookings",  icon: CalendarDays },
];

export function AdminLayout() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen" style={{ background: "var(--color-canvas)" }}>
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 hidden w-[280px] flex-col lg:flex"
        style={{
          background: "linear-gradient(180deg, #0d0d0f 0%, #141416 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-7 py-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #c9a84c 0%, #a8873a 100%)", boxShadow: "0 4px 16px rgba(201,168,76,0.30)" }}
          >
            <Scissors size={20} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Sharp Cuts</p>
            <p className="text-xs text-[#6b7280]">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4b5563]">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-[#6b7280] hover:bg-white/05 hover:text-[#d1d5db]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive ? "bg-[#c9a84c]/20" : "bg-white/05"
                      }`}
                    >
                      <Icon size={17} className={isActive ? "text-[#c9a84c]" : ""} />
                    </span>
                    {item.label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c9a84c]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #374151, #1f2937)" }}
            >
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="truncate text-xs text-[#6b7280]">admin@sharpcuts.co</p>
            </div>
          </div>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6b7280] transition-colors hover:bg-white/05 hover:text-[#d1d5db]"
            type="button"
            onClick={() => { authStore.signOut(); navigate("/admin/login"); }}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <section className="lg:pl-[280px]">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 border-b border-[#eef0f5] bg-white px-5 py-4 lg:hidden"
          style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #c9a84c 0%, #a8873a 100%)" }}
          >
            <Scissors size={16} className="text-white" />
          </div>
          <p className="font-bold text-[#0d0d0f]">Sharp Cuts Admin</p>
        </div>
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 xl:px-16">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
