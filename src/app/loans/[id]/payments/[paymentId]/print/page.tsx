import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/app/PrintButton";

export const dynamic = "force-dynamic";

export default async function PaymentReceiptPage({
  params,
}: {
  params: { id: string; paymentId: string };
}) {
  const loanId = Number(params.id);
  const paymentId = Number(params.paymentId);
  if (Number.isNaN(loanId) || Number.isNaN(paymentId)) notFound();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { loan: true, performedBy: true, voidedBy: true },
  });
  if (!payment || payment.loanId !== loanId) notFound();

  return (
    <div className="print-sheet">
      <div className="no-print" style={{ marginBottom: 12 }}>
        <PrintButton />
      </div>
      <h1>Payment Receipt</h1>
      <p className="muted">Pawn Broker Shop</p>
      <hr />
      {payment.voided && (
        <p className="error">
          <strong>VOIDED</strong> — {payment.voidReason}
        </p>
      )}
      <p>
        <strong>Receipt:</strong> {payment.voucherNo}
        <br />
        <strong>Type:</strong> {payment.txnType}
        <br />
        <strong>Date:</strong> {payment.paymentDate.toISOString().slice(0, 10)}
      </p>
      <p>
        <strong>Loan:</strong> {payment.loan.voucherNo}
        <br />
        <strong>Customer:</strong> {payment.loan.customerName}
      </p>
      <p>
        <strong>Amount received:</strong> {formatMoney(payment.amountPaise)}
        <br />
        <strong>Towards interest:</strong> {formatMoney(payment.interestPortionPaise)}
        <br />
        <strong>Towards principal:</strong> {formatMoney(payment.principalPortionPaise)}
      </p>
      {payment.comments && (
        <p>
          <strong>Comments:</strong>
          <br />
          <span style={{ whiteSpace: "pre-wrap" }}>{payment.comments}</span>
        </p>
      )}
      <p className="muted">
        Received by: {payment.performedBy?.name || "—"}
        {payment.voided
          ? ` · Voided by ${payment.voidedBy?.name || "—"}`
          : ""}
      </p>
    </div>
  );
}
