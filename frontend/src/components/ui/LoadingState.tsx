interface Props {
  label?: string;
  count?: number;
  variant?: "card" | "row" | "text";
}

export function LoadingState({ count = 3, variant = "card" }: Props) {
  if (variant === "text") {
    return (
      <div className="space-y-2 animate-fade-in">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-4 rounded-lg" style={{ width: `${60 + (i % 3) * 15}%`, opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className="space-y-3 animate-fade-in">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-[#eef0f5] bg-white p-4">
            <div className="skeleton h-12 w-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 rounded-lg w-2/5" />
              <div className="skeleton h-3 rounded-lg w-3/5" />
            </div>
            <div className="skeleton h-8 w-20 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className="space-y-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#eef0f5] bg-white p-5" style={{ boxShadow: "var(--shadow-panel)" }}>
          <div className="flex items-start gap-4">
            <div className="skeleton h-14 w-14 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-4 rounded-lg w-3/5" />
              <div className="skeleton h-3 rounded-lg w-4/5" />
              <div className="flex gap-2 mt-1">
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
