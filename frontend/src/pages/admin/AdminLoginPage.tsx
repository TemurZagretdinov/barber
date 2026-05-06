import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";

import { login } from "../../api/auth";
import { AuthShell } from "../../components/layout/AuthShell";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { AuthInput } from "../../components/ui/AuthInput";
import { authStore } from "../../store/authStore";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlError = params.get("error");

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState(urlError || "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login(email, password);
      if (session.role !== "admin") throw new Error("Admin access required");
      authStore.setSession(session);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Admin Login" subtitle="Manage Sharp Cuts appointments">
      <form className="space-y-5" onSubmit={submit}>
        {error ? <ErrorMessage message={error} /> : null}
        
        <AuthInput
          label="Email Address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@gmail.com"
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
            "Sign In securely"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
