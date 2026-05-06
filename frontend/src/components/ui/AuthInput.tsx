import { Eye, EyeOff, LucideIcon } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
}

export function AuthInput({ label, icon: Icon, type = "text", className = "", ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-semibold text-[#334155]">
        {label}
      </label>
      <div 
        className={`relative flex items-center rounded-2xl border bg-[#f9fafb] px-4 transition-all duration-300 ease-out
          ${isFocused 
            ? "border-[#c9a84c] bg-white ring-4 ring-[#c9a84c]/10" 
            : "border-[#e2e6ee] hover:border-[#c8ccda]"}`}
      >
        <Icon size={20} className={`shrink-0 transition-colors duration-300 ${isFocused ? "text-[#c9a84c]" : "text-[#94a3b8]"}`} />
        
        <input
          type={inputType}
          className="w-full bg-transparent px-3 py-3.5 text-[15px] text-[#0d0d0f] outline-none placeholder:text-[#b8c0ce] font-medium"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#94a3b8] transition-colors hover:bg-black/5 hover:text-[#334155]"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
