import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Scissors, Loader2 } from "lucide-react";

import { login } from "../../api/auth";
import { AuthShell } from "../../components/layout/AuthShell";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { AuthInput } from "../../components/ui/AuthInput";
import { authStore } from "../../store/authStore";

export function BarberLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlError = params.get("error");

  const [email, setEmail] = useState("jamshid@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState(urlError || "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login(email, password);
      if (session.role !== "barber") throw new Error("Barber access required");
      authStore.setSession(session);
      navigate("/barber/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Barber Login" subtitle="Open your daily schedule">
      <form className="space-y-5" onSubmit={submit}>
        {error ? <ErrorMessage message={error} /> : null}
        
        <AuthInput
          label="Email Address"
          icon={Scissors}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jamshid@gmail.com"
          required
        />
        
        <AuthInput
          label="Password"
          icon={Lock}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
        
        <button className="btn-primary w-full mt-2" disabled={loading} type="submit">
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin opacity-70" />
              Signing in...
            </>
          ) : (
            "Sign In to Dashboard"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
