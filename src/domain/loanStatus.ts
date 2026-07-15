export type LoanStatus =
  | "ACTIVE"
  | "RENEWED"
  | "OVERDUE"
  | "NOTICE"
  | "AUCTIONED"
  | "CLOSED";

const TERMINAL = new Set(["CLOSED", "AUCTIONED"]);

export function isOpenLoan(status: string): boolean {
  return !TERMINAL.has(status);
}

/** Display status: past dueDate upgrades ACTIVE/RENEWED to OVERDUE for UI. */
export function displayLoanStatus(
  status: string,
  dueDate: Date | null | undefined,
  asOf: Date = new Date()
): string {
  if (TERMINAL.has(status) || status === "NOTICE" || status === "OVERDUE") {
    return status;
  }
  if (dueDate) {
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);
    if (asOf > due && (status === "ACTIVE" || status === "RENEWED")) {
      return "OVERDUE";
    }
  }
  return status;
}
