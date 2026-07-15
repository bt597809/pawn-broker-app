"use client";

import { useEffect, useMemo, useState } from "react";

type DayBookRow = {
  date: string;
  voucherNo: string;
  account: string;
  debit: string;
  credit: string;
  staff: string;
  narration: string;
};

export default function DayBookPage() {
  const [rows, setRows] = useState<DayBookRow[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("");
  const [staff, setStaff] = useState("");
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

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const acc = account.trim().toLowerCase();
    const st = staff.trim().toLowerCase();

    return rows.filter((row) => {
      if (acc && !row.account.toLowerCase().includes(acc)) return false;
      if (st && !(row.staff || "").toLowerCase().includes(st)) return false;
      if (text) {
        const hay = [row.voucherNo, row.account, row.staff, row.narration, row.debit, row.credit]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
  }, [rows, q, account, staff]);

  async function clearFilters() {
    setFrom("");
    setTo("");
    setQ("");
    setAccount("");
    setStaff("");
    setError("");
    try {
      const res = await fetch("/api/day-book");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load day book");
        return;
      }
      setRows(json.data);
    } catch {
      setError("Failed to load day book");
    }
  }

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
          <label>
            Search
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Voucher, narration, amounts"
            />
          </label>
          <label>
            Account
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Cash, Bank, Loan Receivable…"
            />
          </label>
          <label>
            Staff
            <input
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              placeholder="Staff name"
            />
          </label>
        </div>
        <p style={{ marginTop: 12 }}>
          <button type="button" onClick={load}>
            Apply date filter
          </button>{" "}
          <button type="button" onClick={clearFilters}>
            Clear
          </button>
        </p>
        {error && <p className="error">{error}</p>}
        <p className="muted">{filtered.length} row(s)</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Voucher No.</th>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Staff</th>
            <th>Narration</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7}>No entries match the filter.</td>
            </tr>
          )}
          {filtered.map((row, idx) => (
            <tr key={`${row.voucherNo}-${row.account}-${idx}`}>
              <td>{row.date}</td>
              <td>{row.voucherNo}</td>
              <td>{row.account}</td>
              <td>{row.debit}</td>
              <td>{row.credit}</td>
              <td>{row.staff || "—"}</td>
              <td style={{ whiteSpace: "pre-wrap" }}>{row.narration || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
