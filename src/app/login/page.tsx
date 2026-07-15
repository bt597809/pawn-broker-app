"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Login failed");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "48px auto" }}>
      <h2>Staff Login</h2>
      <p className="muted">Pawn Broker shop access</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" defaultValue="admin@pawnshop.local" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        <p style={{ marginTop: 16 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
