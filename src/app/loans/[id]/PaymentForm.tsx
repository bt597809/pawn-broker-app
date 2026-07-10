"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function PaymentForm({
  loanId,
  maxAmount,
}: {
  loanId: number;
  maxAmount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch(`/api/loans/${loanId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Payment failed");
      return;
    }

    router.refresh();
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        <label>
          Payment date
          <input name="paymentDate" type="date" defaultValue={today} required />
        </label>
        <label>
          Amount (max {maxAmount.toFixed(2)})
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={maxAmount}
            required
          />
        </label>
        <label>
          Payment mode
          <select name="paymentMode" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
          </select>
        </label>
      </div>
      <p style={{ marginTop: 12 }}>
        <button type="submit">Record Payment</button>
      </p>
    </form>
  );
}
