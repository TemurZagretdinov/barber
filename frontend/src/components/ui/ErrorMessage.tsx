import { AlertCircle } from "lucide-react";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm animate-slide-down">
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
      <p className="font-medium text-red-700 leading-snug">{message}</p>
    </div>
  );
}
