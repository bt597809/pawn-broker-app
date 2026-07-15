import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { loanService } from "@/services/loanService";
import PrintButton from "@/app/PrintButton";

export const dynamic = "force-dynamic";

export default async function LoanTicketPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  let details;
  try {
    details = await loanService.getLoanDetails(id);
  } catch {
    notFound();
  }

  const { loan, summary, displayStatus } = details;

  return (
    <div className="print-sheet">
      <div className="no-print" style={{ marginBottom: 12 }}>
        <PrintButton />
      </div>
      <h1>Pawn Ticket</h1>
      <p className="muted">Pawn Broker Shop</p>
      <hr />
      <p>
        <strong>Voucher:</strong> {loan.voucherNo}
        <br />
        <strong>Status:</strong> {displayStatus}
        <br />
        <strong>Loan date:</strong> {loan.loanDate.toISOString().slice(0, 10)}
        <br />
        <strong>Due date:</strong>{" "}
        {loan.dueDate ? loan.dueDate.toISOString().slice(0, 10) : "—"}
      </p>
      <p>
        <strong>Customer:</strong> {loan.customerName}
        {loan.customer?.phone ? ` · ${loan.customer.phone}` : ""}
      </p>
      <p>
        <strong>Item:</strong> {loan.pledgedItemName}
        <br />
        <strong>Metal:</strong> {loan.metalType} {loan.purityKarat}K
        <br />
        <strong>Gross / Stone / Net:</strong> {loan.grossWeightGm} / {loan.stoneWeightGm} /{" "}
        {loan.netWeightGm} gm
      </p>
      <p>
        <strong>Loan amount:</strong> {formatMoney(loan.loanAmountPaise)}
        <br />
        <strong>Rate:</strong> {loan.interestRateMonthly}% per month
        <br />
        <strong>Est. value:</strong> {formatMoney(loan.estimatedValuePaise)}
        <br />
        <strong>Mode:</strong> {loan.paymentMode}
      </p>
      <p>
        <strong>Balance principal:</strong> {formatMoney(summary.balancePrincipalPaise)}
        <br />
        <strong>Interest till date:</strong> {formatMoney(summary.interestTillDatePaise)}
        <br />
        <strong>Total payable:</strong> {formatMoney(summary.totalPayablePaise)}
      </p>
      {loan.comments && (
        <p>
          <strong>Comments:</strong>
          <br />
          <span style={{ whiteSpace: "pre-wrap" }}>{loan.comments}</span>
        </p>
      )}
      <p className="muted">
        Created by: {loan.createdBy?.name || "—"}
        <br />
        Keep this ticket safe. Produce it to redeem ornaments.
      </p>
    </div>
  );
}
