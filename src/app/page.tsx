import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { loanService } from "@/services/loanService";

export default async function HomePage() {
  const loans = await loanService.listLoans();

  return (
    <div>
      <div className="card">
        <p className="muted">Active and closed loans</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Voucher</th>
            <th>Customer</th>
            <th>Loan Date</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loans.length === 0 && (
            <tr>
              <td colSpan={7}>No loans yet. Create one to get started.</td>
            </tr>
          )}
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td>{loan.voucherNo}</td>
              <td>{loan.customerName}</td>
              <td>{loan.loanDate.toISOString().slice(0, 10)}</td>
              <td>{formatMoney(loan.loanAmountPaise)}</td>
              <td>{formatMoney(loan.summary.balancePrincipalPaise)}</td>
              <td>{loan.status}</td>
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
