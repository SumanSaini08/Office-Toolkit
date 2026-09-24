# Deployment — Vercel + Render

Single-page deployment reference for Office-Toolkit. Frontend lives on **Vercel**, API server on **Render**, database is **Supabase**.

```
Browser ──▶ https://office-toolkit.vercel.app  (Vercel SPA + static + prerendered routes)
               │  /api/*  ──proxy──▶  https://office-toolkit-api.onrender.com  (Render, Express 5)
               └  /sitemap.xml ───proxy──▶  same Render backend
Backend ──▶ Supabase (Storage: content.json, images, og/, admin-password.json)
```

## Vercel (frontend)

- Project: `office-toolkit` (scope/team: `akhil-bhartiya-school`)
- Live URL: `https://office-toolkit.vercel.app`
- Live backend for preview: `BACKEND_URL` env (Production) = `https://office-toolkit-api.onrender.com` (set as Secret)
- Source: `artifacts/office-toolkit`
- Config file: `vercel.json` (repo root) —

| Key | Value |
|---|---|
| installCommand | `corepack enable && corepack prepare pnpm@11.9.0 --activate && pnpm install` |
| buildCommand | `pnpm --filter @workspace/office-toolkit run build:full` (vite build + prefix prerender of 22 routes) |
| outputDirectory | `artifacts/office-toolkit/dist/public` |
| routes | `^/api/(.*)` → `${BACKEND_URL}/api/$1`, `^/sitemap.xml$` → `${BACKEND_URL}/sitemap.xml`, then `handle: "filesystem"`, then catch-all `/(.*)` → `/index.html` |

Note: `handle: filesystem` is required so static assets (`/assets/*.js`, favicons) are served from disk instead of being rewritten to `index.html` (fixes the `Failed to load module script` MIME error).

CLI deploy (project already linked):

```powershell
$env:VERCEL_TOKEN = "vcp_..."
vercel deploy --prod --yes
```

## Render (backend)

- Service: `office-toolkit-api`, id `srv-daqivjvf3r2c73bhbqo0`, workspace `tea-d96vgusvikkc73db45t0`
- URL: `https://office-toolkit-api.onrender.com` — dashboard: `https://dashboard.render.com/web/srv-daqivjvf3r2c73bhbqo0`
- Plan: free · Region: oregon · Health check: `/api/healthz`
- Git: repo `https://github.com/SumanSaini08/Office-Toolkit`, branch `app-source`, **auto-deploy on push**
- Source: `artifacts/api-server`

| Setting | Value |
|---|---|
| rootDir | `artifacts/api-server` |
| buildCommand | `pnpm install && pnpm --filter @workspace/api-server run build` |
| startCommand | `node --enable-source-maps ./dist/index.mjs` |

Env vars (service):

| Key | Value |
|---|---|
| NODE_VERSION | `24` |
| SUPABASE_URL | `https://lunuslwrmzzxvnupueto.supabase.co` |
| SUPABASE_SECRET_KEY | `sb_secret_...` |
| ADMIN_PASSWORD | `muskansaini` (initial; change from admin panel) |
| SESSION_SECRET | long random string (committed `.env` value) |
| CORS_ORIGINS | `https://office-toolkit.vercel.app,http://localhost:5173` |

`CORS_ORIGINS` is a comma-separated allowlist. If missing/empty, code falls back to the same defaults (`artifacts/api-server/src/app.ts`). `PORT` is injected by Render automatically.

## Connect rules / gotchas

- Frontend code never calls the Render URL directly — it uses relative `/api/*`, and Vercel proxies it (also avoids browser CORS).
- CORS is defense-in-depth only: allowed origins get an `Access-Control-Allow-Origin` echo, others get none.
- Render build image has pnpm preinstalled — do **not** use `corepack enable` in the buildCommand (EROFS error on `/usr/bin/pnpm`).
- `corepack` + pnpm pin is fine on Vercel (installCommand), where corepack exists.
- `.env` files are committed to git (legacy); service env vars override them in deployment.
- DB (Drizzle / `DATABASE_URL`) is dead code — backend only needs Supabase + ADMIN_PASSWORD + SESSION_SECRET.

## Verify

```powershell
# Vercel proxy → backend
Invoke-WebRequest https://office-toolkit.vercel.app/api/healthz
Invoke-WebRequest https://office-toolkit.vercel.app/api/content
# Asset must be application/javascript, NOT text/html
(Invoke-WebRequest https://office-toolkit.vercel.app/).Content -match 'assets/[^"]+\.js'
# Direct backend CORS
Invoke-WebRequest https://office-toolkit-api.onrender.com/api/healthz -Headers @{ Origin = "https://office-toolkit.vercel.app" }
```