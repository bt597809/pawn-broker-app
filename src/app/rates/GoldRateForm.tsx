"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoldRateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/gold-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to save rate");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        <label>
          Metal
          <select name="metalType" defaultValue="GOLD">
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </select>
        </label>
        <label>
          Rate per gram
          <input name="ratePerGram" type="number" step="0.01" min="0.01" required />
        </label>
        <label>
          Effective date
          <input name="effectiveDate" type="date" defaultValue={today} required />
        </label>
      </div>
      <p style={{ marginTop: 12 }}>
        <button type="submit">Save rate</button>
      </p>
    </form>
  );
}
