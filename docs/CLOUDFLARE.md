# Cloudflare deployment

This app runs on Cloudflare Workers with `@opennextjs/cloudflare`, including
Supabase authentication, Server Actions, protected dashboard pages and API routes.
The Worker is named `assignwork`; its configuration is in `wrangler.jsonc`.

Live URL: https://assignwork.uk

## Deploy locally

Use Node 24 and install dependencies with `npm ci`. Keep the existing Supabase
settings in `.env.local`; do not commit that file.

```powershell
npx wrangler login
npm run build:cloudflare
npx opennextjs-cloudflare deploy -- --secrets-file .env.local
```

`--secrets-file` uploads the environment values as Worker secrets with the same
deployment. Both `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must also be available during the build,
because Next.js embeds public variables in the browser bundle.
`SUPABASE_SERVICE_ROLE_KEY` must remain server-only.

After the first deployment, `npm run deploy:cloudflare` rebuilds and deploys while
preserving the existing runtime variables and secrets. To update their values,
use the command with `--secrets-file` again.

## Build and runtime choices

- Cloudflare builds use Webpack to reduce duplicated server chunks. The normal
  `npm run build` and `npm run dev` still use Next.js defaults.
- Build output and Wrangler state are ignored by Git.
- Public prerendered pages use the read-only Static Assets incremental cache.
  Authenticated pages and pricing read request cookies and render dynamically.
  Introducing ISR or cached database reads requires a writable cache and tag
  invalidation setup first.
- `/images/payments/*` runs through the Worker so the application's existing
  paused-payment protection also applies to static payment QR assets.
- Cloudflare Images supplies image optimization through the `IMAGES` binding.
- OpenNext marks Node.js Proxy support as experimental. Verify `/login`,
  `/dashboard`, `/admin` and session refresh after framework/adapter updates.

## Git-based builds

To enable automatic deployments later, connect this repository to the existing
Worker, use `npm run build:cloudflare` as the build command and
`npx opennextjs-cloudflare deploy` as the deploy command. Configure public
Supabase values in build variables and all required values in runtime secrets.

In Supabase Authentication URL settings, allow the deployed site URL for any
email confirmation, password reset or OAuth redirects used by the application.
Custom domains are configured separately from the default `workers.dev` URL.

This deployment does not apply Supabase migrations or change payment settings.
Postgres `pg_cron` jobs run independently of the website host. The existing daily
commission-clearing request is also preserved in Cloudflare through
`cloudflare-worker.mjs`, at `20:00 UTC` (01:00 PKT the following day), matching
`vercel.json`. The handler calls the existing endpoint over its internal service
binding, authenticates with `CRON_SECRET`, and reports failures to Workers logs.
The cron handler is tested with mocked requests, without moving real funds.

## Production checks

- `/api/health` is an uncached liveness endpoint. It does not test database health.
- Security headers apply to application routes and static assets.
- `/robots.txt` and `/sitemap.xml` use `NEXT_PUBLIC_SITE_URL`, which requires a
  rebuild when changed. Protected routes, auth pages, referrals and APIs are
  excluded from indexing; database permissions remain the access boundary.
- Unverified demo statistics are omitted from production.
- Cloudflare invocation/error logging is enabled; preview-version URLs are off.
- An error boundary offers retry without showing internal error messages.

The application still marks its legal documents as drafts. Contact delivery,
newsletter delivery, database backup/restore coverage, Supabase authentication
URL settings and legal/business information require their own verified setup.
Do not describe those as completed merely because the website is deployed.

`npm audit fix --ignore-scripts` applied compatible dependency fixes. Remaining
advisories involve the lint dependency chain (`braces`) and local image tooling
(`sharp` through Miniflare/Wrangler). npm's suggested force fixes downgrade the
deployment/lint tools incompatibly, so they have not been applied. Recheck when
upstream compatible releases are available.

## Domain handoff

On 7 October 2026, `assignwork.uk` became active in the deployment account.
Both `assignwork.uk` and `www.assignwork.uk` are attached to the production
Worker through dashboard-managed Custom Domains. Preserve these bindings when
deploying; they are intentionally managed in the dashboard rather than Wrangler
routes. `NEXT_PUBLIC_SITE_URL=https://assignwork.uk` is the build/runtime origin.
The Worker permanently redirects `www` and the old `workers.dev` hostname to
the canonical HTTPS origin, preserving paths and query strings.

Home-page Organization/WebSite JSON-LD contains the site name, URL and logo;
unverified addresses and business claims are not added to structured data.
Unpublished task previews have individual titles/canonicals but are noindex.
Search Console verification and sitemap submission require the owner's Google
sign-in; use `https://assignwork.uk/sitemap.xml` after verification. Submission
does not guarantee indexing or search ranking.

To undo a release, use `npx wrangler rollback <VERSION_ID>` with a verified prior
Worker version. A rollback restores Worker code/config, not database changes.
