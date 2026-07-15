"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed");
      return;
    }
    router.push("/customers");
    router.refresh();
  }

  return (
    <div className="card">
      <h2>New Customer</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Phone
            <input name="phone" />
          </label>
          <label>
            ID proof type
            <input name="idProofType" placeholder="Aadhaar / PAN" />
          </label>
          <label>
            ID proof no
            <input name="idProofNo" />
          </label>
          <label>
            Address
            <input name="address" />
          </label>
        </div>
        <p style={{ marginTop: 16 }}>
          <button type="submit">Save</button>
        </p>
      </form>
    </div>
  );
}
