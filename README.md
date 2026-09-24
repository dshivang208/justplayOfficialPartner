# JustPlay Partner — Venue Console

The venue-owner dashboard for JustPlay (Kanpur, India). A **separate project**
from the consumer-facing JustPlay app — its own package.json, its own routes,
its own auth context. It does not read or write the consumer app's database;
Phase 1 has no backend at all yet (mock data only), and when a backend is
added in a later phase it will get its own Supabase project/tables rather
than reusing the consumer app's.

## Stack

Same framework as the consumer app, for consistency: Vite + TanStack Start
(file-based routing) + Tailwind v4 + TypeScript. Same design tokens
(`src/styles.css`) — deep pitch green primary, warm ochre accent, Playfair
Display headings over Plus Jakarta Sans body — so the two apps read as one
product family.

## Structure

```
src/
  routes/           file-based routes (TanStack Router)
    index.tsx        login / signup
    pending.tsx       pending-approval screen
    dashboard.tsx      layout route — auth guard + sidebar shell
    dashboard.index.tsx  dashboard overview (Phase 1 content)
    dashboard.slots.tsx, .bookings.tsx, .payouts.tsx, .settings.tsx
                        stub pages for Phases 2–5
  components/partner/  shared UI (Button, Logo, DashboardShell, widgets…)
  lib/auth.tsx         mock partner auth context (Context + Provider + hook)
  data/dashboard.ts    mock dashboard data, typed for an easy backend swap
```

## Phase status

- **Phase 1 — Login/Signup + Dashboard Overview**: done (this codebase)
- Phase 2 — Slot & Inventory Management: not started
- Phase 3 — Booking Management: not started
- Phase 4 — Payouts & Earnings: not started
- Phase 5 — Venue Profile & Settings: not started

## Demo login

There's no real backend yet, so:

- **Log in** with any 10-digit phone number and any 4-digit OTP → lands on
  the dashboard as an already-approved demo partner (Greenfield Box Arena,
  populated with mock bookings/stats).
- **Sign up** as a new partner → lands on the Pending Approval screen. A
  "Preview: simulate approval" button there is a demo-only shortcut to see
  the dashboard's **empty state** (new partner, zero bookings) without a
  real approval workflow.

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (client + SSR + Nitro/Cloudflare server)
npm run lint
```
