# Admin Dashboard — Cloudflare Deploy

Deploy the Next.js admin to **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare). Free tier covers typical operator traffic; no Vercel Pro needed for assistant streaming limits.

## Prerequisites

- Cloudflare account (free)
- Live NestJS API URL
- Supabase project (auth + optional audit table)
- `wrangler login` completed locally

## 1. Install & build

```bash
cd admin-dashboard
npm install
npm run build:cf    # OpenNext + Next production build
```

## 2. Secrets (production)

Set in Cloudflare Dashboard → Workers → photobooth-admin → Settings → Variables, or:

```bash
npx wrangler secret put ADMIN_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ASSISTANT_CONFIRM_SECRET
npx wrangler secret put ASSISTANT_DATABASE_URL   # optional; omit = in-memory checkpoints
```

Public (non-secret) vars in `wrangler.jsonc` under `vars` or Dashboard:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` |
| `BACKEND_API_URL` | same |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `ASSISTANT_MODEL` | `gpt-4o-mini` |

## 3. Deploy

```bash
npm run deploy
```

**Live URL:** https://photobooth-admin.mirsabudeen.workers.dev

### Build-time env (required for `NEXT_PUBLIC_*`)

Create `admin-dashboard/.env.production` from `.env.example` **before** `npm run deploy`.  
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` are baked in at build time.

Then redeploy: `npm run deploy`

## 4. Post-deploy

1. Add workers URL to backend `CORS_ORIGINS`
2. Run `supabase/assistant_audit.sql` in Supabase
3. Log in at `/login` and test Assistant (⌘K)

## GitHub auto-deploy (optional)

Cloudflare Dashboard → Workers & Pages → Create → Connect GitHub → repo `photoboothproject`:

- **Root directory:** `admin-dashboard`
- **Build command:** `npm run build:cf`
- **Deploy command:** `npm run deploy:cf`

## Checkpointer note

Without `ASSISTANT_DATABASE_URL`, LangGraph uses **in-memory** checkpoints (fine for single Worker instance). For durable approve/resume across instances, use Supabase/Neon Postgres + `ASSISTANT_DATABASE_URL`, or add Cloudflare Hyperdrive later.

## Local preview (Workers runtime)

```bash
npm run preview
```
