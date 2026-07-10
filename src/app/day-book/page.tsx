"use client";

import { useEffect, useState } from "react";

type DayBookRow = {
  date: string;
  voucherNo: string;
  account: string;
  debit: string;
  credit: string;
};

export default function DayBookPage() {
  const [rows, setRows] = useState<DayBookRow[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/day-book?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to load day book");
      return;
    }
    setRows(json.data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="card">
        <h2>Day Book</h2>
        <div className="grid">
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <p style={{ marginTop: 12 }}>
          <button type="button" onClick={load}>Filter</button>
        </p>
        {error && <p className="error">{error}</p>}
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Voucher No.</th>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5}>No entries yet.</td>
            </tr>
          )}
          {rows.map((row, idx) => (
            <tr key={`${row.voucherNo}-${row.account}-${idx}`}>
              <td>{row.date}</td>
              <td>{row.voucherNo}</td>
              <td>{row.account}</td>
              <td>{row.debit}</td>
              <td>{row.credit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
