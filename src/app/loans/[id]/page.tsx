import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { loanService } from "@/services/loanService";
import PaymentForm from "./PaymentForm";

export default async function LoanDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    notFound();
  }

  let details;
  try {
    details = await loanService.getLoanDetails(id);
  } catch {
    notFound();
  }

  const { loan, summary } = details;

  return (
    <div>
      <div className="card">
        <h2>{loan.customerName}</h2>
        <p className="muted">
          {loan.voucherNo} · {loan.pledgedItemName} · {loan.status}
        </p>

        <div className="grid">
          <p>Loan amount: <strong>{formatMoney(summary.loanAmountPaise)}</strong></p>
          <p>Interest till date: <strong>{formatMoney(summary.interestTillDatePaise)}</strong></p>
          <p>Principal paid: <strong>{formatMoney(summary.principalPaidPaise)}</strong></p>
          <p>Interest paid: <strong>{formatMoney(summary.interestPaidPaise)}</strong></p>
          <p>Balance principal: <strong>{formatMoney(summary.balancePrincipalPaise)}</strong></p>
          <p>Total payable: <strong>{formatMoney(summary.totalPayablePaise)}</strong></p>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          Net weight: {loan.netWeightGm} gm (gross {loan.grossWeightGm}, stone {loan.stoneWeightGm})
        </p>
      </div>

      {loan.status === "ACTIVE" && (
        <div className="card">
          <h3>Receive Payment</h3>
          <PaymentForm loanId={loan.id} maxAmount={summary.totalPayablePaise / 100} />
        </div>
      )}

      <div className="card">
        <h3>Payment History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher</th>
              <th>Amount</th>
              <th>Interest</th>
              <th>Principal</th>
            </tr>
          </thead>
          <tbody>
            {loan.payments.length === 0 && (
              <tr>
                <td colSpan={5}>No payments recorded yet.</td>
              </tr>
            )}
            {loan.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.paymentDate.toISOString().slice(0, 10)}</td>
                <td>{p.voucherNo}</td>
                <td>{formatMoney(p.amountPaise)}</td>
                <td>{formatMoney(p.interestPortionPaise)}</td>
                <td>{formatMoney(p.principalPortionPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
