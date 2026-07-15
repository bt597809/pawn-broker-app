"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VoidPaymentButton({ paymentId }: { paymentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleVoid(e: FormEvent) {
    e.preventDefault();
    const reason = window.prompt("Reason for void (optional):", "Wrong amount entered");
    if (reason === null) return;

    setBusy(true);
    setError("");
    const res = await fetch(`/api/payments/${paymentId}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Void failed");
      return;
    }
    router.refresh();
  }

  return (
    <span>
      <button type="button" onClick={handleVoid} disabled={busy}>
        Void
      </button>
      {error && <span className="error"> {error}</span>}
    </span>
  );
}
