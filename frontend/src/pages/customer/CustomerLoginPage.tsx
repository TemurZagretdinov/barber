import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";

import { login } from "../../api/auth";
import { claimBooking } from "../../api/bookings";
import { AuthShell } from "../../components/layout/AuthShell";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { AuthInput } from "../../components/ui/AuthInput";
import { authStore } from "../../store/authStore";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingCode = params.get("bookingCode");
  const urlError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError || "");
  const [loading, setLoading] = useState(false);
  const bookingCodeQuery = bookingCode ? `?bookingCode=${encodeURIComponent(bookingCode)}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);
      authStore.setSession(response);

      if (response.user.role !== "customer") {
        throw new Error("You do not have a customer account.");
      }

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
      setError(err.message || "Failed to log in");
      authStore.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Log in to manage your appointments."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <ErrorMessage message={error} /> : null}

        <AuthInput
          label="Email Address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
        />

        <AuthInput
          label="Password"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <button className="btn-primary w-full mt-2" disabled={loading} type="submit">
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin opacity-70" />
              Logging in...
            </>
          ) : (
            "Log In"
          )}
        </button>

        <p className="mt-6 text-center text-[15px] text-[#64748b]">
          Don't have an account?{" "}
          <Link
            className="font-semibold text-[#c9a84c] transition-colors hover:text-[#b8963e]"
            to={`/customer/register${bookingCodeQuery}`}
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
