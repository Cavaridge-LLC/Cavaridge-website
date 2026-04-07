const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3900;

// --- Config from env (Doppler) ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-doppler";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ALLOWED_DOMAIN = "cavaridge.com";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("FATAL: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set.");
  console.error("Create OAuth credentials at https://console.cloud.google.com/apis/credentials");
  process.exit(1);
}

// --- Helmet (relaxed CSP for inline React) ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://*.up.railway.app", "https://*.supabase.co", "https://api.stripe.com", "https://openrouter.ai", "https://cloud.langfuse.com", "https://api.github.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// --- Sessions ---
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  })
);

// --- Passport ---
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value || "";
      const domain = email.split("@")[1];

      if (domain !== ALLOWED_DOMAIN) {
        return done(null, false, {
          message: `Access restricted to @${ALLOWED_DOMAIN} accounts.`,
        });
      }

      return done(null, {
        id: profile.id,
        email,
        name: profile.displayName,
        photo: profile.photos?.[0]?.value,
      });
    }
  )
);

// --- Auth routes ---
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    hd: ALLOWED_DOMAIN, // Pre-filter Google login to cavaridge.com domain
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=domain" }),
  (req, res) => res.redirect("/")
);

app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect("/login");
  });
});

app.get("/auth/me", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  res.json(req.user);
});

// --- Auth middleware ---
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// --- Login page (public) ---
app.get("/login", (req, res) => {
  const error = req.query.error === "domain"
    ? `Access is restricted to @${ALLOWED_DOMAIN} accounts only.`
    : null;

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cavaridge Status — Sign In</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',system-ui,sans-serif; background:#1B2A4A; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { background:#F5F2ED; border-radius:8px; padding:48px 40px; text-align:center; max-width:380px; width:90%; }
    .mark { width:48px; height:48px; background:#5E465C; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:20px; }
    .mark svg { width:28px; height:28px; }
    h1 { font-family:'DM Serif Display',Georgia,serif; font-size:24px; color:#5E465C; margin-bottom:6px; letter-spacing:0.04em; }
    .sub { font-size:13px; color:#7A7A7A; margin-bottom:28px; }
    .btn { display:inline-flex; align-items:center; gap:10px; padding:12px 28px; border-radius:6px; background:#C4883A; color:#fff; font-size:14px; font-weight:600; text-decoration:none; font-family:inherit; transition:transform 0.2s,box-shadow 0.2s; }
    .btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(196,136,58,0.3); }
    .btn svg { width:18px; height:18px; }
    .error { background:#B5453A15; border:1px solid #B5453A30; color:#B5453A; font-size:12px; font-weight:500; padding:10px 16px; border-radius:6px; margin-bottom:20px; }
    .footer { margin-top:24px; font-size:10px; color:#7A7A7A; }
  </style>
</head>
<body>
  <div class="card">
    <div class="mark">
      <svg viewBox="0 0 24 24" fill="none"><path d="M3 17L7.5 8L12 13L16 6L21 17" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <h1>CAVARIDGE</h1>
    <p class="sub">Internal Platform Status</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <a href="/auth/google" class="btn">
      <svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Sign in with Google
    </a>
    <p class="footer">Restricted to @cavaridge.com accounts</p>
  </div>
</body>
</html>`);
});

// --- Health check (public, for Railway) ---
app.get("/healthz", (req, res) => res.json({ ok: true, app: "cavaridge-status" }));

// --- Protected status page ---
app.use("/", requireAuth, express.static(path.join(__dirname, "../public")));

// --- SPA fallback ---
app.get("*", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Cavaridge Status running on port ${PORT}`);
  console.log(`Auth restricted to @${ALLOWED_DOMAIN}`);
  console.log(`Google OAuth callback: ${BASE_URL}/auth/google/callback`);
});
