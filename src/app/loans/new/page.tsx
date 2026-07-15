"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = { id: number; name: string; phone: string | null };
type Scheme = {
  id: number;
  name: string;
  interestRateMonthly: number;
  tenureDays: number;
  maxLtvPercent: number;
};

export default function NewLoanPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [grossWeight, setGrossWeight] = useState("");
  const [stoneWeight, setStoneWeight] = useState("");
  const [purity, setPurity] = useState("22");
  const [rate, setRate] = useState("");
  const [schemeId, setSchemeId] = useState("");

  const netWeight =
    grossWeight !== "" && stoneWeight !== ""
      ? Math.max(0, Number(grossWeight) - Number(stoneWeight))
      : 0;

  const selectedScheme = schemes.find((s) => String(s.id) === schemeId);

  const estimated = useMemo(() => {
    if (!netWeight || !rate || !purity) return 0;
    return netWeight * Number(rate) * (Number(purity) / 24);
  }, [netWeight, rate, purity]);

  const maxEligible = useMemo(() => {
    if (!selectedScheme || !estimated) return 0;
    return estimated * (selectedScheme.maxLtvPercent / 100);
  }, [selectedScheme, estimated]);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/schemes").then((r) => r.json()),
    ]).then(([c, s]) => {
      setCustomers(c.data || []);
      setSchemes(s.data || []);
      if (s.data?.[0]) setSchemeId(String(s.data[0].id));
    });
  }, []);

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
      <h2>Create Loan (Pledge)</h2>
      {error && <p className="error">{error}</p>}
      {customers.length === 0 && (
        <p className="error">
          Add a customer first from the Customers page.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid">
          <label>
            Customer
            <select name="customerId" required>
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` (${c.phone})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scheme
            <select
              name="schemeId"
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
              required
            >
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.interestRateMonthly}% / mo, {s.tenureDays}d, LTV{" "}
                  {s.maxLtvPercent}%
                </option>
              ))}
            </select>
          </label>
          <label>
            Loan date
            <input name="loanDate" type="date" defaultValue={today} required />
          </label>
          <label>
            Metal
            <select name="metalType" defaultValue="GOLD">
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
            </select>
          </label>
          <label>
            Purity (karat)
            <input
              name="purityKarat"
              type="number"
              step="0.1"
              min="1"
              max="24"
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              required
            />
          </label>
          <label>
            Rate per gram
            <input
              name="goldRatePerGram"
              type="number"
              step="0.01"
              min="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
          </label>
          <label>
            Pledged item
            <input name="pledgedItemName" required />
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
            <input value={netWeight || ""} readOnly />
          </label>
          <label>
            Est. value (auto)
            <input value={estimated ? estimated.toFixed(2) : ""} readOnly />
          </label>
          <label>
            Max eligible (LTV)
            <input value={maxEligible ? maxEligible.toFixed(2) : ""} readOnly />
          </label>
          <label>
            Loan amount
            <input
              name="loanAmount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxEligible || undefined}
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
        <p className="muted" style={{ marginTop: 8 }}>
          Due date is set from scheme tenure. Interest rate defaults from scheme.
        </p>
        <p style={{ marginTop: 16 }}>
          <button type="submit" disabled={customers.length === 0}>
            Save Loan
          </button>
        </p>
      </form>
    </div>
  );
}
