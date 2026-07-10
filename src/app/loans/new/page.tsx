"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NewLoanPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [stoneWeight, setStoneWeight] = useState("");

  const netWeight =
    grossWeight && stoneWeight
      ? Math.max(0, Number(grossWeight) - Number(stoneWeight))
      : "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to create loan");
      return;
    }

    router.push(`/loans/${json.data.id}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card">
      <h2>Create Loan</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid">
          <label>
            Customer name
            <input name="customerName" required />
          </label>
          <label>
            Loan date
            <input name="loanDate" type="date" defaultValue={today} required />
          </label>
          <label>
            Loan amount
            <input name="loanAmount" type="number" step="0.01" min="0.01" required />
          </label>
          <label>
            Interest rate per month (%)
            <input name="interestRateMonthly" type="number" step="0.01" min="0" required />
          </label>
          <label>
            Pledged item
            <input name="pledgedItemName" required />
          </label>
          <label>
            Estimated item value
            <input name="estimatedValue" type="number" step="0.01" min="0.01" required />
          </label>
          <label>
            Gross weight (gm)
            <input
              name="grossWeightGm"
              type="number"
              step="0.01"
              min="0"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              required
            />
          </label>
          <label>
            Stone weight (gm)
            <input
              name="stoneWeightGm"
              type="number"
              step="0.01"
              min="0"
              value={stoneWeight}
              onChange={(e) => setStoneWeight(e.target.value)}
              required
            />
          </label>
          <label>
            Net weight (gm)
            <input value={netWeight} readOnly />
          </label>
          <label>
            Payment mode
            <select name="paymentMode" defaultValue="CASH">
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
            </select>
          </label>
        </div>

        <p style={{ marginTop: 16 }}>
          <button type="submit">Save Loan</button>
        </p>
      </form>
    </div>
  );
}
