import { ArrowLeft, Scissors } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <main className="flex min-h-screen" style={{ background: "var(--color-canvas)" }}>
      {/* Left decorative panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0d0d0f 0%, #1a1a1e 55%, #252529 100%)",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 40px)`,
          }}
        />
        {/* Gold accent circle */}
        <div
          className="absolute top-[-120px] right-[-120px] h-[480px] w-[480px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-80px] left-[-80px] h-[320px] w-[320px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #a8873a 100%)",
              boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
            }}
          >
            <Scissors size={36} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Sharp Cuts</h2>
          <p className="mt-3 text-[#7a8090] text-base max-w-xs leading-relaxed">
            Premium barbershop booking platform. Manage appointments, schedules, and more.
          </p>

          {/* Decorative testimonial card */}
          <div
            className="mt-12 rounded-2xl border border-white/10 px-6 py-5 text-left max-w-xs"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
          >
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#c9a84c">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <p className="text-sm text-[#9aa3b4] leading-relaxed italic">
              "The most seamless booking experience I've used. Absolutely love it."
            </p>
            <p className="mt-3 text-xs font-semibold text-[#c9a84c]">— Satisfied Client</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #c9a84c 0%, #a8873a 100%)" }}
            >
              <Scissors size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">Sharp Cuts</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#0d0d0f]">{title}</h1>
            <p className="mt-2 text-[#64748b]">{subtitle}</p>
          </div>

          <div
            className="relative rounded-[2rem] border border-white bg-white/95 p-8 sm:p-10 backdrop-blur-2xl"
            style={{ 
              boxShadow: "0 24px 48px -12px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.03)" 
            }}
          >
            {/* Subtle top inner highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            {children}
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8b95aa] transition hover:text-[#334155]"
              to="/book"
            >
              <ArrowLeft size={15} />
              Back to booking
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
