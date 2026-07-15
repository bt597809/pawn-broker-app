import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { loanService } from "@/services/loanService";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = {
    q: searchParams.q || "",
    status: searchParams.status || "ALL",
    from: searchParams.from || "",
    to: searchParams.to || "",
  };
  const loans = await loanService.listLoans(filters);

  return (
    <div>
      <div className="card">
        <p className="muted">Active, overdue, and closed loans</p>
        <form method="get">
          <div className="grid" style={{ marginTop: 12 }}>
            <label>
              Search
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Voucher, customer, item, staff"
              />
            </label>
            <label>
              Status
              <select name="status" defaultValue={filters.status}>
                <option value="ALL">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="RENEWED">RENEWED</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="NOTICE">NOTICE</option>
                <option value="CLOSED">CLOSED</option>
                <option value="AUCTIONED">AUCTIONED</option>
              </select>
            </label>
            <label>
              Loan date from
              <input name="from" type="date" defaultValue={filters.from} />
            </label>
            <label>
              Loan date to
              <input name="to" type="date" defaultValue={filters.to} />
            </label>
          </div>
          <p style={{ marginTop: 12 }}>
            <button type="submit">Search</button> <Link href="/">Clear</Link>
          </p>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>Voucher</th>
            <th>Customer</th>
            <th>Loan Date</th>
            <th>Due</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Created by</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loans.length === 0 && (
            <tr>
              <td colSpan={9}>No loans match the filter.</td>
            </tr>
          )}
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td>{loan.voucherNo}</td>
              <td>{loan.customerName}</td>
              <td>{loan.loanDate.toISOString().slice(0, 10)}</td>
              <td>{loan.dueDate ? loan.dueDate.toISOString().slice(0, 10) : "—"}</td>
              <td>{formatMoney(loan.loanAmountPaise)}</td>
              <td>{formatMoney(loan.summary.balancePrincipalPaise)}</td>
              <td>{loan.displayStatus}</td>
              <td>{loan.createdBy?.name || "—"}</td>
              <td>
                <Link href={`/loans/${loan.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
