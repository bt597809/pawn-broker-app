import Link from "next/link";
import { dashboardService } from "@/services/dashboardService";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const s = await dashboardService.getTodaySummary();

  return (
    <div>
      <div className="card dash-summary">
        <h2 className="dash-heading">Today&apos;s summary</h2>
        <p className="muted">{new Date().toISOString().slice(0, 10)}</p>
        <div className="grid" style={{ marginTop: 12 }}>
          <p>
            Loans created: <strong>{s.loansCreatedToday}</strong>
          </p>
          <p>
            Disbursed:{" "}
            <strong className="dash-metric dash-out">{s.disbursedToday.toFixed(2)}</strong>
          </p>
          <p>
            Collections:{" "}
            <strong className="dash-metric dash-in">{s.collectionsToday.toFixed(2)}</strong>
          </p>
          <p>
            Interest collected: <strong>{s.interestCollectedToday.toFixed(2)}</strong>
          </p>
          <p>
            Receipts today: <strong>{s.receiptsToday}</strong>
          </p>
          <p>
            Open loans: <strong>{s.openLoans}</strong>
          </p>
          <p>
            Overdue / notice:{" "}
            <strong className="dash-metric dash-alert">{s.overdueCount}</strong>
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Loans created today</h3>
        <table>
          <thead>
            <tr>
              <th>Voucher</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {s.loansToday.length === 0 && (
              <tr>
                <td colSpan={5}>No loans created today.</td>
              </tr>
            )}
            {s.loansToday.map((l) => (
              <tr key={l.id}>
                <td>{l.voucherNo}</td>
                <td>{l.customerName}</td>
                <td>{l.amount.toFixed(2)}</td>
                <td>{l.by}</td>
                <td>
                  <Link href={`/loans/${l.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Collections today</h3>
        <table>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Loan</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {s.paymentsToday.length === 0 && (
              <tr>
                <td colSpan={6}>No collections today.</td>
              </tr>
            )}
            {s.paymentsToday.map((p) => (
              <tr key={p.id}>
                <td>{p.voucherNo}</td>
                <td>
                  <Link href={`/loans/${p.loanId}`}>{p.loanVoucher}</Link>
                </td>
                <td>{p.customerName}</td>
                <td>{p.txnType}</td>
                <td>{p.amount.toFixed(2)}</td>
                <td>{p.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
