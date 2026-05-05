# SERVLO

Next.js 14 SaaS starter for Australian trade businesses.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui setup
- Supabase (auth + Postgres schema + RLS)
- Stripe (subscription billing hooks)
- Montserrat (Google Font via `next/font`)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

3. Run local development server:

```bash
npm run dev
```

4. Apply Supabase migration in your Supabase project:

- `supabase/migrations/0001_init.sql`

## Role model

- `owner`: full visibility across business jobs, timesheets and settings
- `employee`: assigned jobs only, own timesheets, own clock in/out
