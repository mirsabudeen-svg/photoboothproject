# MCP & Tooling Recommendations

Install only MCPs that add measurable value to this monorepo.

## Recommended (High Value)

| MCP | Purpose | Value for this project |
|-----|---------|------------------------|
| **Playwright MCP** | Admin E2E, visual regression | No tests exist — highest ROI |
| **GitHub MCP** | PRs, issues, CI status | When repo on GitHub |
| **PostgreSQL MCP** | Schema inspection, query debugging | Backend TypeORM debugging |
| **Sentry MCP** | Crash triage | Critical for kiosk field ops |
| **Context7 MCP** | NestJS/Compose/CameraX docs | Faster correct implementations |

## Conditional

| MCP | When to add |
|-----|-------------|
| **Supabase MCP** | If migrating off self-hosted Postgres |
| **Browser MCP** | Manual QA automation alternative to Playwright |
| **PostHog MCP** | After analytics pipeline wired |
| **Figma MCP** | When design team delivers Figma tokens |

## Not Recommended (MVP)

| MCP | Reason |
|-----|--------|
| Perplexity / Firecrawl | Research phase complete |
| Filesystem / Git MCP | Cursor built-in sufficient |
| BullMQ / Redis MCP | No queue infra yet |

## CI/CD Tooling (Non-MCP)

1. **GitHub Actions:** `./gradlew assembleDevDebug`, `npm test`, `npm run build` ×2
2. **Dependabot:** npm + Gradle
3. **Detox or Maestro:** Android smoke
4. **ESLint + Prettier:** backend + admin (missing today)

## Modernization Stack Decision

| Library | Verdict |
|---------|---------|
| shadcn/ui + Radix | **Yes** for admin Phase 2 |
| TanStack Query | **Defer** — 3 pages only |
| Zustand | **No** — unnecessary |
| React Hook Form + Zod | **Yes** when forms grow |
| Framer Motion | **Optional** for attract screen |
| Prisma/Drizzle | **Defer** — TypeORM OK until migrations pain |
| Better Auth / Clerk | **Yes** for admin login |
| Redis + BullMQ | **Yes** when Twilio SMS at scale |
| Vercel | **Yes** for admin deploy |
| Cloudflare | **Already using R2** |

## AI Enhancements (High Value Only)

| Feature | Verdict |
|---------|---------|
| On-device beauty filter | **Keep** — already present |
| Cloud AI stylization | **No** — out of MVP scope |
| AI moderation (NSFW) | **Recommend Phase 2** before public gallery |
| AI tagging | **Low** — wedding context is homogeneous |
| AI personalization | **Defer** to platform phase |
