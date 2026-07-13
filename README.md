# Mini Pawn Broker Module

A small loan management app for a pawn broker shop. Built with **Next.js**, **Node.js API routes**, **Prisma**, and **PostgreSQL** (Neon).

The focus here is backend logic: interest calculation, payment allocation, transaction history, and double-entry accounting.

## Setup

Requirements: Node.js 18+ recommended.

```bash
npm install
cp .env.example .env   # add your DATABASE_URL
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Run tests:

```bash
npm test
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Create a free database at [Neon](https://neon.tech) and copy the connection string
3. Sign up at [Vercel](https://vercel.com) and import the GitHub repo
4. Add environment variable: `DATABASE_URL` = your Neon connection string
5. Set Node.js version to **20.x** in Vercel project settings
6. Deploy — migrations run automatically via `prisma migrate deploy` in the build step
7. After first deploy, seed the chart of accounts:
   ```bash
   npm run db:seed
   ```
   (run locally with production `DATABASE_URL` in `.env`)

**Do not commit** `.env` or share your database password.

## Features

1. **Create Loan** — customer details, pledged item weights, auto net weight, payment mode (Cash/Bank)
2. **Loan Details** — loan amount, interest till date, principal/interest paid, balance, total payable
3. **Receive Payment** — partial/multiple payments; interest is cleared first, then principal
4. **Day Book** — debit/credit ledger entries for every loan and payment

## Approach

### Database design

- `loans` — loan master record
- `payments` — every receipt is stored separately (no balance overwrites)
- `ledger_entries` — double-entry accounting lines
- `accounts` — chart of accounts (seeded)

Loan balances are **derived** from the original loan amount plus payment history.

### Interest calculation

Simple interest, pro-rated by days using a 30-day month:

```
interest = principal × (monthlyRate / 100) × (days / 30)
```

Interest is calculated on the outstanding principal from the loan date (or last payment date) till today.

### Payment allocation

When a payment comes in:

1. Accrued interest is calculated on outstanding principal
2. Payment clears interest first
3. Remaining amount reduces principal

### Accounting

**Chart of accounts**

| Code | Account | Type |
|------|---------|------|
| CASH | Cash | Asset |
| BANK | Bank | Asset |
| LOAN_REC | Loan Receivable | Asset |
| INT_INC | Interest Income | Income |

**On loan disbursement**

| Account | Debit | Credit |
|---------|-------|--------|
| Loan Receivable | loan amount | |
| Cash / Bank | | loan amount |

**On payment receipt**

| Account | Debit | Credit |
|---------|-------|--------|
| Cash / Bank | payment amount | |
| Interest Income | | interest portion |
| Loan Receivable | | principal portion |

### Code structure

- `src/domain/` — pure business helpers (interest, allocation, vouchers)
- `src/repositories/` — Prisma data access (Repository pattern)
- `src/services/` — application logic and validations
- `src/app/api/` — REST endpoints

Money is stored as integer paise to avoid floating-point issues.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List loans |
| POST | `/api/loans` | Create loan |
| GET | `/api/loans/:id` | Loan details |
| POST | `/api/loans/:id/payments` | Record payment |
| GET | `/api/day-book` | Day book report |

## Sample flow

1. Create a loan for a customer with a gold chain
2. Open loan details — check interest till date
3. Record a partial payment
4. Record another payment to close the loan
5. Open Day Book — verify debit/credit entries

## Notes

- UI is intentionally simple
- No authentication (out of scope for the task)
- Voucher format: `LN-YYYYMMDD-001` for loans, `RC-YYYYMMDD-001` for receipts
