import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, User, Phone, Loader2 } from "lucide-react";

import { login, registerCustomer } from "../../api/auth";
import { claimBooking } from "../../api/bookings";
import { AuthShell } from "../../components/layout/AuthShell";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { AuthInput } from "../../components/ui/AuthInput";
import { authStore } from "../../store/authStore";

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingCode = params.get("bookingCode");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const bookingCodeQuery = bookingCode ? `?bookingCode=${encodeURIComponent(bookingCode)}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerCustomer(email, password, fullName, phone);
      const response = await login(email, password);
      authStore.setSession(response);

      if (bookingCode) {
        try {
          await claimBooking(bookingCode);
          navigate("/customer", { state: { successMessage: "Booking added to your account" } });
          return;
        } catch (claimErr: any) {
          console.error("Failed to claim booking", claimErr);
          navigate("/customer", {
            state: {
              warningMessage: claimErr?.message || "Booking could not be linked to this account",
            },
          });
          return;
        }
      }

      navigate("/customer");
    } catch (err: any) {
      setError(err.message || "Failed to register");
      authStore.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Sign up to track your appointments."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <ErrorMessage message={error} /> : null}

        <AuthInput
          label="Full Name"
          icon={User}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          autoFocus
        />

        <AuthInput
          label="Phone Number"
          icon={Phone}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998901234567"
          required
        />

        <AuthInput
          label="Email Address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <AuthInput
          label="Password"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />

        <button className="btn-primary w-full mt-2" disabled={loading} type="submit">
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin opacity-70" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="mt-6 text-center text-[15px] text-[#64748b]">
          Already have an account?{" "}
          <Link
            className="font-semibold text-[#c9a84c] transition-colors hover:text-[#b8963e]"
            to={`/customer/login${bookingCodeQuery}`}
          >
            Log in instead
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
