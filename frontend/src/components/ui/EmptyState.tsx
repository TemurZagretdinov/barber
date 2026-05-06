import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, subtitle, icon }: Props) {
  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-[#eef0f5] bg-white p-10 text-center animate-fade-up"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      {icon ? (
        <div className="mb-5">{icon}</div>
      ) : (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f4f5f7]">
          <svg
            width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M9 16h.01M12 16h.01M15 16h.01" />
          </svg>
        </div>
      )}
      <p className="text-base font-semibold text-[#334155]">{title}</p>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-[#94a3b8]">{subtitle}</p>
      ) : null}
    </div>
  );
}
