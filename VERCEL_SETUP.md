# Vercel deployment checklist

Your code is ready on GitHub: https://github.com/bt597809/pawn-broker-app

The Neon database is already migrated and seeded.

## Steps (about 5 minutes)

### 1. Create Vercel account
- Go to https://vercel.com/signup
- Click **Continue with GitHub**

### 2. Import project
- Click **Add New → Project**
- Select **pawn-broker-app**
- Click **Import**

### 3. Environment variable (required)
Before deploying, add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |

Enable for Production, Preview, and Development.

### 4. Node.js version
- Project Settings → General → Node.js Version → **20.x**

### 5. Deploy
- Click **Deploy**
- Wait 2–4 minutes

### 6. Test live URL
1. Open the Vercel URL (e.g. `https://pawn-broker-app.vercel.app`)
2. Create a loan
3. Record a payment
4. Check Day Book

## Already done for you
- Prisma switched to PostgreSQL
- Migrations applied on Neon
- Chart of accounts seeded
- Build script runs `prisma migrate deploy` on each deploy

## If create loan fails on live site
Re-run seed against Neon (from project folder with `.env` set):

```bash
npm run db:seed
```

## Security reminder
Reset your Neon database password since it was shared in chat. Update `DATABASE_URL` in Vercel after resetting.
