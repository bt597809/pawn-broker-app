"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SchemeForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.precloseAllowed = form.get("precloseAllowed") ? "true" : "false";

    const res = await fetch("/api/schemes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed");
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
          Name
          <input name="name" required />
        </label>
        <label>
          Interest % / month
          <input name="interestRateMonthly" type="number" step="0.01" min="0" required />
        </label>
        <label>
          Tenure days
          <input name="tenureDays" type="number" min="1" required />
        </label>
        <label>
          Max LTV %
          <input name="maxLtvPercent" type="number" step="0.1" min="1" max="100" defaultValue="75" required />
        </label>
        <label className="checkbox-row">
          <input name="precloseAllowed" type="checkbox" defaultChecked /> Pre-close allowed
        </label>
      </div>
      <p style={{ marginTop: 12 }}>
        <button type="submit">Add scheme</button>
      </p>
    </form>
  );
}
