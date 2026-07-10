export type VoucherPrefix = "LN" | "RC";

export function formatVoucherNo(prefix: VoucherPrefix, date: Date, seq: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seqStr = String(seq).padStart(3, "0");
  return `${prefix}-${y}${m}${d}-${seqStr}`;
}
