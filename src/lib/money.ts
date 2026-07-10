// Money is stored as integer paise to keep calculations clean.

export function toPaise(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Invalid amount");
  }
  return Math.round(amount * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function formatMoney(paise: number): string {
  return fromPaise(paise).toFixed(2);
}
