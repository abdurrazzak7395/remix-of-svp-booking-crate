# Deployment Guide — SVP Booking Crate

This app supports **dual backend modes** out of the box:

| Mode | Env var | Used by |
|---|---|---|
| Supabase Edge Functions (default) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` | Local dev, Emergent preview |
| Direct Railway / custom backend | `VITE_BACKEND_URL` (highest priority) | Production Vercel deploy |

`src/lib/api.ts` picks `VITE_BACKEND_URL` first, falls back to `${VITE_SUPABASE_URL}/functions/v1`. Throws at boot if neither is set.

---

## Vercel Deployment

The repo ships a `vercel.json` at `frontend/vercel.json` configured for Vite + SPA routing.

### 1. Connect repository on Vercel
- **Framework Preset**: Vite (auto-detected from `vercel.json`)
- **Root Directory**: `frontend`
- **Build Command**: `yarn build`
- **Output Directory**: `dist`
- **Install Command**: `yarn install`

### 2. Environment Variables (set in Vercel dashboard → Project → Settings → Environment Variables)

```
VITE_SUPABASE_PROJECT_ID=qdlqrsvkenalwhmfdbaf
VITE_SUPABASE_URL=https://qdlqrsvkenalwhmfdbaf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<copy from frontend/.env>
VITE_BACKEND_URL=https://remix-of-svp-booking-crate-production.up.railway.app
```

> ⚠️ **If your Railway backend is down (HTTP 502)**, simply OMIT `VITE_BACKEND_URL` and the app will call Supabase Edge Functions directly. Both backends expose the same `/svp-auth`, `/svp-proxy`, `/access-*` routes.

### 3. Custom Domain
- Project → Domains → Add your domain
- Vercel auto-issues SSL via Let's Encrypt
- DNS: add CNAME `your-domain.com → cname.vercel-dns.com`

---

## Railway Backend (optional)

The Railway service at `https://remix-of-svp-booking-crate-production.up.railway.app` mirrors the Supabase Edge Function routes (`/svp-auth/*`, `/svp-proxy/*`, `/access-*`).

### Health check
```
curl https://remix-of-svp-booking-crate-production.up.railway.app/svp-proxy/occupations
```
Should return JSON (probably 401 without a token). If you get HTTP 502, the Railway service is down — wake it via Railway dashboard.

### Why dual backend?
- Supabase Edge Functions have cold-start latency (~500ms-2s on first request).
- Railway always-on container removes cold start → snappier user experience.
- Either is a fully-supported drop-in replacement for the other.

---

## GitHub Push

Use the **"Save to GitHub"** button in the Emergent chat input — it handles auth, branch, and push automatically. Direct `git push` from inside the container is not the recommended path (credentials live in the platform layer).

### .gitignore guarantees
- All `.env*` files are excluded (including `frontend/.env` and `backend/.env`)
- `memory/test_credentials.md` is excluded
- `node_modules/`, `dist/`, `.cache/` excluded

So push is safe — no secrets leak.

---

## Pre-deploy checklist

- [x] `yarn build` succeeds (`/app/frontend`)
- [x] 95/95 vitest tests pass
- [x] No hardcoded secrets / URLs in source
- [x] `.env` excluded from git
- [x] `vercel.json` ships SPA rewrites
- [x] Deployment agent reports PASS
- [ ] Set production env vars in Vercel dashboard (see step 2 above)
- [ ] Verify Railway backend health (or omit `VITE_BACKEND_URL` to fall back to Supabase)

---

## Troubleshooting

### "No backend configured" thrown at runtime
→ Neither `VITE_BACKEND_URL` nor `VITE_SUPABASE_URL` is set in your deploy env. Set at least one.

### Vercel build fails with `Cannot find module ...`
→ Make sure **Root Directory** is set to `frontend` (not the repo root).

### Auto-reveal toast never fires after login
→ Open browser DevTools → Network: confirm `/occupations` returns 200. The toast fires AFTER occupations load. If 401, the SVP token is missing/expired — re-do OTP login.

### Reschedule lands in wrong centre
→ Should not happen with the current payload (`{id, exam_session_id, language_code}` only). If it does, check Network: the reschedule POST must NOT carry a `site_id` field. File a bug if it does.
