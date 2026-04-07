# Cavaridge Internal Status Page

Live platform status dashboard restricted to `@cavaridge.com` Google Workspace accounts.

## What It Does

- Pings all Railway-deployed apps every 60 seconds via `/healthz`
- Pings infrastructure services (Supabase, Stripe, OpenRouter, GitHub, Langfuse) via public APIs
- Shows real latency, live/degraded/down status with pulse indicators
- Per-suite and per-infra health bars
- Only manual control is "Under Maintenance" toggle
- Google OAuth login — only `@cavaridge.com` emails allowed

## Setup (15 minutes)

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your Cavaridge Google Workspace project (or create one)
3. Click **Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Name: `Cavaridge Status Page`
6. Authorized redirect URIs:
   - `https://status.cavaridge.com/auth/google/callback` (production)
   - `http://localhost:3900/auth/google/callback` (local dev)
7. Click **Create** — copy the **Client ID** and **Client Secret**

### 2. Add Secrets to Doppler

Add these to your Doppler `cavaridge-platform` project (or a separate `cavaridge-status` project):

| Secret | Value |
|--------|-------|
| `GOOGLE_CLIENT_ID` | From step 1 |
| `GOOGLE_CLIENT_SECRET` | From step 1 |
| `SESSION_SECRET` | Generate with `openssl rand -hex 32` |
| `BASE_URL` | `https://status.cavaridge.com` (or Railway URL) |
| `NODE_ENV` | `production` |

### 3. Deploy to Railway

```bash
# Option A: Add as a service in the monorepo
cp -r cavaridge-status/ apps/status/
# Push to GitHub, Railway auto-deploys

# Option B: Standalone repo
cd cavaridge-status
git init
git add .
git commit -m "Initial status page"
# Create Railway project, link repo, deploy
```

### 4. Set Custom Domain

In Railway dashboard for this service:
1. Go to **Settings → Custom Domain**
2. Add `status.cavaridge.com`
3. In Cloudflare DNS, add a CNAME record:
   - Name: `status`
   - Target: `<railway-service>.up.railway.app`
   - Proxy: ON (orange cloud)

### 5. Update BASE_URL

After Railway gives you the domain, update `BASE_URL` in Doppler to `https://status.cavaridge.com`.

Also go back to Google Cloud Console and ensure `https://status.cavaridge.com/auth/google/callback` is in the redirect URIs.

## Local Development

```bash
# Set env vars
export GOOGLE_CLIENT_ID="your-id"
export GOOGLE_CLIENT_SECRET="your-secret"
export SESSION_SECRET="dev-secret"
export BASE_URL="http://localhost:3900"

npm install
npm run dev
```

Open `http://localhost:3900` — you'll be redirected to Google login.

## How Auth Works

1. User visits `status.cavaridge.com` → redirected to `/login`
2. Click "Sign in with Google" → Google OAuth with `hd=cavaridge.com` (pre-filters to your domain)
3. Server verifies the email domain is exactly `cavaridge.com` — rejects all others
4. Session cookie lasts 24 hours
5. All routes except `/login`, `/healthz`, and `/auth/*` require authentication

## Architecture

```
Express Server (Node.js)
├── Passport.js — Google OAuth 2.0
├── express-session — 24hr cookie sessions
├── helmet — security headers (CSP allows Railway domains)
├── /auth/* — public auth routes
├── /healthz — public health check for Railway
├── /login — public login page
└── /* — protected, serves React status page

public/
├── index.html — shell with user bar + React mount
└── app-component.jsx — full status dashboard (Babel in-browser)
```

## Security

- Google OAuth with domain restriction (`hd` parameter + server-side verification)
- helmet security headers with scoped CSP
- httpOnly, secure, sameSite cookies
- No API keys or secrets exposed to the browser
- Health pings are made from the browser to public endpoints only
- Session secret from Doppler, not hardcoded

---

🐾 Powered by Ducky Intelligence | Cavaridge, LLC
