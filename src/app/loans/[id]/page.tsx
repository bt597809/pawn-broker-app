import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { isOpenLoan } from "@/domain/loanStatus";
import { loanService } from "@/services/loanService";
import PaymentForm from "./PaymentForm";
import LoanActions from "./LoanActions";

export const dynamic = "force-dynamic";

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

  const { loan, summary, displayStatus } = details;
  const open = isOpenLoan(loan.status);

  return (
    <div>
      <div className="card">
        <h2>{loan.customerName}</h2>
        <p className="muted">
          {loan.voucherNo} · {loan.pledgedItemName} · {displayStatus}
          {loan.dueDate ? ` · Due ${loan.dueDate.toISOString().slice(0, 10)}` : ""}
          {loan.createdBy ? ` · Created by ${loan.createdBy.name}` : ""}
        </p>

        <div className="grid">
          <p>
            Loan amount: <strong>{formatMoney(summary.loanAmountPaise)}</strong>
          </p>
          <p>
            Interest till date: <strong>{formatMoney(summary.interestTillDatePaise)}</strong>
          </p>
          <p>
            Principal paid: <strong>{formatMoney(summary.principalPaidPaise)}</strong>
          </p>
          <p>
            Interest paid: <strong>{formatMoney(summary.interestPaidPaise)}</strong>
          </p>
          <p>
            Balance principal: <strong>{formatMoney(summary.balancePrincipalPaise)}</strong>
          </p>
          <p>
            Total payable: <strong>{formatMoney(summary.totalPayablePaise)}</strong>
          </p>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          {loan.metalType} {loan.purityKarat}K · Net {loan.netWeightGm} gm · Max eligible{" "}
          {formatMoney(loan.maxEligiblePaise)}
          {loan.scheme ? ` · Scheme: ${loan.scheme.name}` : ""}
        </p>

        {loan.comments && (
          <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
            <strong>Loan comments:</strong>
            <br />
            {loan.comments}
          </p>
        )}
      </div>

      {open && (
        <div className="card">
          <h3>Receive Payment</h3>
          <PaymentForm loanId={loan.id} maxAmount={summary.totalPayablePaise / 100} />
        </div>
      )}

      <LoanActions
        loanId={loan.id}
        totalPayablePaise={summary.totalPayablePaise}
        interestTillDatePaise={summary.interestTillDatePaise}
        isOpen={open}
      />

      <div className="card">
        <h3>Payment History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Interest</th>
              <th>Principal</th>
              <th>By</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {loan.payments.length === 0 && (
              <tr>
                <td colSpan={8}>No payments recorded yet.</td>
              </tr>
            )}
            {loan.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.paymentDate.toISOString().slice(0, 10)}</td>
                <td>{p.voucherNo}</td>
                <td>{p.txnType}</td>
                <td>{formatMoney(p.amountPaise)}</td>
                <td>{formatMoney(p.interestPortionPaise)}</td>
                <td>{formatMoney(p.principalPortionPaise)}</td>
                <td>{p.performedBy?.name || "—"}</td>
                <td style={{ whiteSpace: "pre-wrap" }}>{p.comments || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loan.notices.length > 0 && (
        <div className="card">
          <h3>Notices</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loan.notices.map((n) => (
                <tr key={n.id}>
                  <td>{n.noticeDate.toISOString().slice(0, 10)}</td>
                  <td>{n.channel}</td>
                  <td>{n.performedBy?.name || "—"}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{n.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loan.auctions.length > 0 && (
        <div className="card">
          <h3>Auctions</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Sale</th>
                <th>Expenses</th>
                <th>Surplus</th>
                <th>Shortfall</th>
                <th>By</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {loan.auctions.map((a) => (
                <tr key={a.id}>
                  <td>{a.auctionDate.toISOString().slice(0, 10)}</td>
                  <td>{a.voucherNo}</td>
                  <td>{formatMoney(a.saleAmountPaise)}</td>
                  <td>{formatMoney(a.expensesPaise)}</td>
                  <td>{formatMoney(a.surplusPaise)}</td>
                  <td>{formatMoney(a.shortfallPaise)}</td>
                  <td>{a.performedBy?.name || "—"}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{a.comments || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
