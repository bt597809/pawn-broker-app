# Mini Pawn Broker (India shop)

Lightweight Next.js pawn / gold-loan shop module for typical **Indian pawn broker** workflows: pledge jewellery, collect interest, renew, settle/pre-close, notice, and auction — with staff login and double-entry day book.

Built with **Next.js**, **Prisma**, **PostgreSQL (Neon)**. UI stays plain HTML/CSS for fast renders.

> Scope: shop-level demo. Not a full RBI NBFC compliance suite (KFS PDFs, newspaper auction ads, vault delay compensation, etc.). Those can be Phase 2.

## Setup

Node.js 18+ (20.x on Vercel).

```bash
npm install
cp .env.example .env
# set DATABASE_URL and SESSION_SECRET (32+ chars)
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → login.

### Default staff (after seed)

| Email | Password | Role |
|-------|----------|------|
| `admin@pawnshop.local` | `admin123` | ADMIN |
| `cashier@pawnshop.local` | `cashier123` | CASHIER |

Change these before sharing with a real client.

```bash
npm test
```

## Deploy to Vercel

1. Push to GitHub
2. Neon PostgreSQL → copy `DATABASE_URL`
3. Import repo on Vercel
4. Env vars:
   - `DATABASE_URL` = Neon connection string
   - `SESSION_SECRET` = long random string (32+ characters)
5. Node.js **20.x**
6. Deploy (build runs `prisma migrate deploy && next build`)
7. Seed once against production:
   ```bash
   npm run db:seed
   ```

## Indian shop flow (demo)

1. **Login** as staff
2. **Customers** → add borrower (name, phone, optional ID proof)
3. **Schemes** → Standard 90 days / Short 30 days (LTV + rate + tenure)
4. **New Loan** → select customer + scheme, enter metal/purity/rate/weights → LTV cap applied → due date from tenure
5. **Receive payment** → interest first, then principal (partial OK)
6. **Renew** → pay accrued interest, extend due date
7. **Settle / Pre-closure** → pay full amount payable, loan CLOSED (ornament released)
8. **Notice** → mark default notice path
9. **Auction** → record sale + expenses; surplus payable / write-off shortfall; status AUCTIONED
10. **Day Book** → every voucher’s debit/credit lines

## Features

- Staff authentication (session cookie; ADMIN / CASHIER)
- Customer master
- Loan schemes (rate, tenure, max LTV %, pre-close flag)
- LTV-aware pledge (net wt × rate × karat/24 × LTV%)
- Partial payments, settlement, renewal
- Overdue display (past due date)
- Notice + auction settlement
- Day book accounting

## Interest & allocation

```
interest = outstandingPrincipal × (monthlyRate / 100) × (days / 30)
```

Payments clear **interest first**, then principal. Balances are **derived** from loan + payment history (never overwrite silently).

## Accounting (chart of accounts)

| Code | Account | Type |
|------|---------|------|
| CASH / BANK | Cash / Bank | Asset |
| LOAN_REC | Loan Receivable | Asset |
| INT_INC | Interest Income | Income |
| AUCTION_EXP | Auction Expenses | Expense |
| SURPLUS_PAYABLE | Auction Surplus Payable | Liability |
| WRITE_OFF | Loan Write Off | Expense |

- **Disbursement:** Dr Loan Receivable / Cr Cash|Bank  
- **Payment / settle / renew interest:** Dr Cash|Bank / Cr Interest Income + Loan Receivable  
- **Auction:** Dr Cash (net of expenses) + Auction Exp (+ Write Off if short) / Cr Interest + Loan Rec (+ Surplus Payable if extra)

## API (main)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | |
| GET/POST | `/api/customers` | |
| GET/POST | `/api/schemes` | POST = ADMIN |
| GET/POST | `/api/loans` | |
| GET | `/api/loans/:id` | |
| POST | `/api/loans/:id/payments` | |
| GET | `/api/loans/:id/settlement-quote` | |
| POST | `/api/loans/:id/settle` | |
| POST | `/api/loans/:id/renew` | |
| POST | `/api/loans/:id/notices` | |
| POST | `/api/loans/:id/auction` | |
| GET | `/api/day-book` | |

## Code layout

- `src/domain/` — interest, LTV, allocation, status
- `src/repositories/` — Prisma
- `src/services/` — business rules
- `src/middleware.ts` — auth gate
- `src/app/` — light pages + API routes

## Phase 2 (out of scope here)

Multi-branch, SMS notices, newspaper auction workflow, full RBI KFS, customer self-login, ornament photo vault.
