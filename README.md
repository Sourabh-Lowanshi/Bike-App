# BlackPearl 🏍️

A fuel, mileage, trip, and maintenance tracker for a TVS Apache RTR 160 4V — built with Next.js 15, TypeScript, MongoDB, and a premium black glassmorphism UI.

This is **Phase 1** of the full spec: a real, buildable, end-to-end core. It compiles cleanly (`tsc --noEmit` and `next build` both pass) and covers auth, data models, mileage math, fuel logging with geolocation, live trip tracking, maintenance/expense tracking, and an analytics dashboard. See **"What's not in Phase 1 yet"** below for the rest of the original spec.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4
- MongoDB + Mongoose
- NextAuth v5 (Google + Guest login)
- TanStack Query, React Hook Form, Zod
- Recharts, Framer Motion, Sonner (toasts)
- next-pwa

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, AUTH_SECRET, Google OAuth keys
npm run seed                 # optional: populate demo data (demo@blackpearl.app)
npm run dev
```

Open http://localhost:3000. Use **Continue as Guest** on the login page to skip Google OAuth entirely while developing.

### Environment variables

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (or local `mongodb://localhost:27017/blackpearl`) |
| `AUTH_SECRET` | `npx auth secret` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth Client (Web), redirect URI `http://localhost:3000/api/auth/callback/google` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Reserved for Phase 2 (live map/polylines) — not required to run Phase 1 |

## Auth options

- **Google** and **Guest** (unchanged)
- **Email + password**: `/signup` to create an account, `/login` to sign in, `/forgot-password` → emailed reset link → `/reset-password`. Passwords are hashed with bcrypt; reset tokens are single-use, expire in 1 hour, and only their SHA-256 hash is stored (never the raw token).
- **Sessions last 30 days** by design (`session.maxAge` in `src/auth.config.ts`), refreshed on activity. If you were getting logged out constantly before, that was a middleware bug (now fixed) — the gatekeeper and the real session were disagreeing with each other.

### Setting up password-reset emails

`src/lib/services/mailer.ts` sends via [EmailJS](https://www.emailjs.com/) (their REST API, no SMTP server needed):

1. In the EmailJS dashboard: add an **Email Service** (Gmail, Outlook, custom SMTP, etc.) → note its Service ID.
2. Create an **Email Template** with these variables: `{{to_email}}`, `{{user_name}}`, `{{reset_link}}`.
3. Under **Account → API Keys**, grab your Public Key and Private Key.
4. Set `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, and `APP_URL` in `.env.local`.

If you actually meant the `emailjs` npm SMTP package instead of the emailjs.com service, swap the body of `sendPasswordResetEmail()` in that file for a nodemailer/emailjs SMTP call — nothing else needs to change (token generation, routes, and pages are all mailer-agnostic).

## How mileage is calculated

```
distanceTravelled = currentOdometer - previousFuelEntryOdometer
mileage = distanceTravelled / litersFilled
```

This runs automatically in `POST /api/fuel-entries` (`src/lib/mileage.ts`) every time you log a fill-up — no manual entry needed.

## Project structure

```
src/
  app/            # routes (dashboard, fuel/new, trips, maintenance, login, api/*)
  auth.ts         # NextAuth v5 config (Google + Guest, Mongo user upsert)
  middleware.ts   # Edge-safe route protection (JWT check only, no DB import)
  components/     # ui primitives, dashboard, fuel, trips, maintenance, layout
  lib/            # db connection, mileage math, zod schemas, client-safe constants
  models/         # Mongoose schemas: User, Bike, FuelEntry, Trip, Maintenance
  types/          # shared TS types
scripts/seed.ts   # demo data seeder
```

## What's in Phase 1 + Phase 2 additions

- Google + Guest auth, protected routes via middleware
- **Multi-bike support**: a Garage page to add/edit/delete bikes, a bike switcher in the navbar (Zustand + persisted), and every fuel/trip/maintenance entry + the dashboard is scoped to whichever bike is active. First bike added is the default; deleting the default promotes another automatically.
- **Admin panel** (`/admin`, `/admin/users`, `/admin/users/[id]`): gated by `role: "admin"` on the User model (bootstrap via `ADMIN_EMAILS` env var). Platform-wide stats, a user list with per-user fuel spend/bike count, and a detail view where an admin can rename a user, change their role, edit/delete any of their bikes, or delete the account and cascade-delete all their data.
- **Challan + insurance compliance checks** (`/compliance`): no official free API exists for this in India (see note below), so this integrates against a RapidAPI-style third-party provider you configure yourself, with a 6-hour DB cache per bike to avoid burning paid quota, and a graceful "not configured" state when no key is set.
- **Daily personal expenses** (`/expenses`): a separate tracker for everyday spends — breakfast, lunch, dinner, tea, milk, cigarettes, bus/train, other — with quick-add category chips, today/month totals, and history. Not tied to any bike, since these are personal costs rather than vehicle costs.
- Bike/User/FuelEntry/Trip/Maintenance MongoDB models
- Add Fuel form: browser geolocation → OpenStreetMap reverse geocoding → auto mileage calc
- Live trip tracking: Start/End Ride using `watchPosition`, computes distance (haversine), duration, avg speed
- Maintenance/expense log across all categories from the spec (Service, Engine Oil, Insurance, Fine, etc.)
- Dashboard: all core stat cards, fuel-expense-by-month, mileage trend, expense breakdown, fuel-vs-maintenance charts
- PWA manifest + service worker (via next-pwa)
- Seed script, `.env.example`, black/glass theme, mobile-responsive nav

### Setting up the challan/insurance check

There is **no official free public API** for this in India — Parivahan/VAHAN's e-Challan portal is a captcha-protected website, not an API. `src/lib/services/vehicle-compliance.ts` integrates against a generic RapidAPI-style provider instead:

1. Sign up on [RapidAPI](https://rapidapi.com) and subscribe to an "RTO Vehicle Information" or "Challan Information India" listing (or use a KYC provider like Surepass/Signzy if you need something more official). Most have a handful of free calls, then paid tiers.
2. Set `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, and `RAPIDAPI_BASE_URL` in `.env.local` to match your provider's dashboard.
3. Open `mapChallanResponse` / `mapInsuranceResponse` in that file and adjust the field names to match your provider's actual JSON — every provider's schema differs slightly, so this is the one part that needs a quick check against your provider's own docs/Postman collection.
4. Add a bike's registration number in the Garage, then use the "Check" buttons on `/compliance`.

Until configured, the Compliance page shows a clear "not configured yet" message instead of crashing.

### Admin access

Add your email to `ADMIN_EMAILS` in `.env.local` (comma-separated for multiple admins) *before* logging in with that account — the role is assigned on first sign-in, and re-checked on every login in case you add someone later. Then the "Admin" link appears in the navbar for that account.


## What's not built yet

These are real features from the original spec that still need their own pass — happy to build any of them next:

- **Google Maps JS API** live map with markers/polylines (Phase 1 uses OpenStreetMap reverse geocoding only, no map widget)
- **PDF/Excel export** (jspdf, exceljs are installed but unwired)
- **OCR fuel-bill scanner**, **voice entry**
- **Push notifications** for service due / insurance / PUC expiry
- **Search & filters** across entries/trips/expenses
- **Settings page** (import/export, delete-my-own-account self-service)
- **Offline support** beyond the base PWA shell

## Known sandbox-only caveats (won't affect real deployment)

- `next/font/google` was swapped for a plain CSS font stack because this build sandbox has no network access to `fonts.googleapis.com`. On Vercel (which does have that access), you can restore premium fonts by re-adding `next/font/google` imports in `src/app/layout.tsx`.
- The bundled ESLint flat config had a version mismatch (`eslint-config-next` vs `eslint` in this box) — fixed import extensions in `eslint.config.mjs`, but re-run `npm run lint` after `npm install` on your machine to confirm it's clean there.
- `public/icon-192.png` / `icon-512.png` referenced in `manifest.json` are placeholders — swap in real app icons before shipping as an installable PWA.

## PWA install & trip-tracking accuracy

- **Real app icons are now included** (`public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) — earlier builds only had a placeholder SVG, which is why "Add to Home Screen" wasn't showing up reliably on some phones.
- **Trip tracking uses the Wake Lock API** to keep the screen on during an active ride (`src/components/trips/trip-tracker.tsx`), because mobile browsers throttle or fully suspend GPS callbacks once the screen sleeps. This helps a lot, but it's a partial mitigation, not a guarantee:
  - Wake Lock keeps the screen from *auto-sleeping* — it can't stop you manually pressing the power button.
  - It's released whenever the tab/app is backgrounded (switching apps, screen off) and is automatically re-requested when you come back to the tab mid-ride.
  - If you install BlackPearl as a PWA and it still gets backgrounded (e.g. you switch to Maps for navigation), GPS updates will still pause — this is a browser-level restriction, not something fixable from app code. A native app or Capacitor wrapper with OS-level background location is the only fully reliable fix.
- **Safety net**: if the screen was locked/backgrounded for most of a ride and barely any GPS points came in, the tracked distance would show as ~0.0 km. Now, if that happens, the app falls back to a straight-line distance between your actual start and end GPS points and tells you via a toast that it's an estimate, not your real route — so a ride should never again show 0.0 km with several minutes on the clock.

## Deployment (Vercel)

1. Push to GitHub, import into Vercel.
2. Add all `.env.example` variables in Project Settings → Environment Variables.
3. Set the Google OAuth redirect URI to `https://<your-domain>/api/auth/callback/google`.
4. Deploy.
