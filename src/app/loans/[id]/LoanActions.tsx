"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";

export default function LoanActions({
  loanId,
  totalPayablePaise,
  interestTillDatePaise,
  isOpen,
}: {
  loanId: number;
  totalPayablePaise: number;
  interestTillDatePaise: number;
  isOpen: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  if (!isOpen) return null;

  async function post(path: string, body: Record<string, unknown>) {
    setError("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Action failed");
      return;
    }
    router.refresh();
  }

  async function handleSettle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await post(`/api/loans/${loanId}/settle`, Object.fromEntries(form.entries()));
  }

  async function handleRenew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await post(`/api/loans/${loanId}/renew`, Object.fromEntries(form.entries()));
  }

  async function handleNotice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await post(`/api/loans/${loanId}/notices`, Object.fromEntries(form.entries()));
  }

  async function handleAuction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await post(`/api/loans/${loanId}/auction`, Object.fromEntries(form.entries()));
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Settle / Pre-closure</h3>
        <p className="muted">
          Pay full amount payable ({formatMoney(totalPayablePaise)}) and release ornament.
        </p>
        <form onSubmit={handleSettle}>
          <div className="grid">
            <label>
              Date
              <input name="paymentDate" type="date" defaultValue={today} required />
            </label>
            <label>
              Mode
              <select name="paymentMode" defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
              </select>
            </label>
          </div>
          <label>
            Comments
            <textarea name="comments" rows={2} placeholder="Settlement notes" />
          </label>
          <p style={{ marginTop: 8 }}>
            <button type="submit">Settle loan</button>
          </p>
        </form>
      </div>

      <div className="card">
        <h3>Renew (pay interest, extend tenure)</h3>
        <p className="muted">
          Interest due now: {formatMoney(interestTillDatePaise)}
        </p>
        <form onSubmit={handleRenew}>
          <div className="grid">
            <label>
              Date
              <input name="paymentDate" type="date" defaultValue={today} required />
            </label>
            <label>
              Mode
              <select name="paymentMode" defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
              </select>
            </label>
          </div>
          <label>
            Comments
            <textarea name="comments" rows={2} placeholder="Renewal notes" />
          </label>
          <p style={{ marginTop: 8 }}>
            <button type="submit" disabled={interestTillDatePaise <= 0}>
              Renew loan
            </button>
          </p>
        </form>
      </div>

      <div className="card">
        <h3>Default notice</h3>
        <form onSubmit={handleNotice}>
          <div className="grid">
            <label>
              Notice date
              <input name="noticeDate" type="date" defaultValue={today} required />
            </label>
            <label>
              Channel
              <select name="channel" defaultValue="SHOP">
                <option value="SHOP">Shop</option>
                <option value="PHONE">Phone</option>
                <option value="LETTER">Letter</option>
              </select>
            </label>
          </div>
          <label>
            Notes / comments
            <textarea name="notes" rows={2} />
          </label>
          <p style={{ marginTop: 8 }}>
            <button type="submit">Record notice</button>
          </p>
        </form>
      </div>

      <div className="card">
        <h3>Auction pledged item</h3>
        <p className="muted">Physical auction recorded. Surplus payable / shortfall write-off booked.</p>
        <form onSubmit={handleAuction}>
          <div className="grid">
            <label>
              Auction date
              <input name="auctionDate" type="date" defaultValue={today} required />
            </label>
            <label>
              Sale amount
              <input name="saleAmount" type="number" step="0.01" min="0.01" required />
            </label>
            <label>
              Expenses
              <input name="expenses" type="number" step="0.01" min="0" defaultValue="0" />
            </label>
            <label>
              Mode
              <select name="paymentMode" defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
              </select>
            </label>
          </div>
          <label>
            Comments
            <textarea name="comments" rows={2} placeholder="Auction notes" />
          </label>
          <p style={{ marginTop: 8 }}>
            <button type="submit">Record auction</button>
          </p>
        </form>
      </div>
    </div>
  );
}
