# PillMind Medication Platform

A full-stack medication management platform that combines a patient-facing treatment workspace, rich analytics, and branded marketing surfaces. The app is built on Next.js 15 App Router with TypeScript, Tailwind CSS 4, Prisma, and a modern component system to deliver an accessible, mobile-first experience for adherence tracking and caregiver collaboration.

## Table of contents
- [Overview](#overview)
- [Core capabilities](#core-capabilities)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Data & persistence](#data--persistence)
- [API surface](#api-surface)
- [State & business logic](#state--business-logic)
- [Design system](#design-system)
- [Content & marketing pages](#content--marketing-pages)
- [Configuration](#configuration)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Quality checks](#quality-checks)
- [Contributing](#contributing)
- [License & support](#license--support)

## Overview
PillMind delivers two complementary experiences:

- **Authenticated workspace** (`/home`, `/profile`) that helps patients plan schedules, record doses, snooze reminders, and keep prescriptions, analytics, and adherence data in sync with their local timezone and preferences.
- **Public marketing layer** (landing page, brandbook, marketing materials) that showcases the product value, trust signals, and downloadable assets for partners and campaigns.

Both surfaces share a cohesive design language, metadata, and SEO configuration, enabling consistent storytelling from acquisition through engagement.

## Core capabilities
### Medication management workspace
- Weekly navigation with dynamic adherence metrics, day schedules, PRN quick actions, and snooze flows for real-time dose control.
- Visual summaries of taken, scheduled, missed, and skipped doses that adapt badges and progress bars based on adherence percentage thresholds.
- Inventory alerts with one-click refill helpers to restore medication quantities to safe thresholds.

### Intelligence, analytics, and inventory
- Client-side analytics service that computes adherence reports, inventory insights, and weekly/daily breakdowns backed by API data.
- Rich medication utilities for timezone-aware scheduling, day aggregation, and action guards that keep interactions safe and deterministic.

### Account & security tooling
- Profile area with multi-tab layout covering account data, password management, authentication providers, notification preferences, and account deletion controls.
- NextAuth integration supporting credentials, Google, and GitHub providers with JWT sessions and Prisma adapter persistence.

### Marketing & branding
- Landing page hero, feature blocks, trust signals, pricing, FAQ, and CTA modules for conversion-focused storytelling.
- Dedicated brandbook with motion guidelines, accessibility principles, voice, and downloadable asset sections for consistent partner communication.

## Technology stack
- **Framework**: Next.js 15 App Router with React 19 and TypeScript 5.9.
- **Styling**: Tailwind CSS 4, custom theme tokens, and shadcn/ui-inspired components with Framer Motion animations.
- **Data & auth**: Prisma 6 (PostgreSQL), NextAuth.js with Prisma adapter, bcrypt for credential hashing.
- **State & forms**: Zustand with devtools/persist, React Hook Form + Zod validation, reusable form primitives.
- **Data viz & UX**: Recharts, Embla Carousel, Lucide icons, Sonner toasts, and motion libraries for interactive experiences.

## Architecture
```
app/
├─ (auth)/        // Login & registration routes
├─ api/           // Route handlers for medications, doses, providers, analytics
├─ brandbook/     // Brand guidelines microsite
├─ home/          // Authenticated home dashboard
├─ profile/       // Account management hub
├─ marketing-materials/ // Campaign assets portal
├─ layout.tsx     // Global layout with SEO metadata
└─ sitemap.ts     // Dynamic sitemap generation
components/
├─ home/          // Dashboard widgets & controls
├─ sections/      // Landing page feature sections
├─ shared/        // Header, footer, CTA, container, logo, icons
└─ ui/            // Styled primitives (button, form, drawer, etc.)
content/          // MDX (FAQ, terms)
hooks/            // Custom hooks (user store bridge, FK search, debounce)
lib/              // Auth, analytics, medication utilities, validation, API clients
prisma/           // Prisma schema, client helper
stores/           // Zustand state stores
```

The App Router powers both marketing and authenticated sub-apps while sharing layout, fonts, and SEO metadata in `app/layout.tsx`. Shared primitives in `components/ui` and `components/shared` keep surfaces visually aligned.

## Data & persistence
The Prisma schema models users, medications, prescriptions, schedules, dose logs, inventory, notifications, and care providers with rich enums for forms, units, and routes. Relationships enforce cascading deletes and maintain referential integrity between prescriptions, schedules, inventories, and dose logs.

A generated Prisma client (`prisma/prisma-client.ts`) is shared across route handlers and services, and the `postinstall` script runs `prisma generate` automatically.

## API surface
Route handlers under `app/api` expose JSON endpoints for the front-end:

| Endpoint | Description |
| --- | --- |
| `GET/POST /api/medications` | CRUD access for user-specific medication catalog with validation and inventory includes. |
| `GET/POST /api/prescriptions` | Manage prescriptions and their schedules for authenticated users. |
| `GET /api/dose` | Fetch dose logs for a date range to populate schedules and analytics. |
| `PATCH /api/dose/[id]` | Update dose status (taken/skipped) with optimistic UI flows. |
| `POST /api/notifications` | Trigger notification workflows and log delivery attempts. |
| `GET /api/dashboard` | Aggregate adherence metrics for dashboard charts. |
| `POST /api/register` | Handle credential-based user registration with hashed passwords. |
| `GET /api/care-providers` | Provide linked care provider records for collaboration features. |

All endpoints rely on `getUserIdFromSession` to enforce authentication, returning `401` responses when sessions are missing. Validation is performed with Zod to keep payloads predictable.

## State & business logic
Global client state lives in a persisted Zustand store (`stores/user-store.ts`) that tracks profile, settings, medications, prescriptions, dose logs, and loading/error flags while exposing async actions to call the API routes. React hooks (`hooks/useUserStore.ts`, `hooks/useEnsureSettings.ts`, etc.) bridge the store with components, while medication utilities consolidate timezone-aware calculations.

## Design system
- Brand tokens for typography, radii, and PillMind color palette are defined in `app/globals.css`, including dark mode overrides and Tailwind theme tokens.
- UI primitives such as buttons, forms, drawers, navigation, and badges extend shadcn/ui patterns with PillMind-specific variants for consistent styling.
- The brandbook microsite documents logo usage, motion, accessibility, and tone guidelines to align all marketing assets.

## Content & marketing pages
Marketing copy, FAQ, and legal terms are authored in MDX under `content/`, enabling rich markdown features for the landing page and support content. The main marketing page composes hero, trust, features, security, pricing, FAQ, and CTA sections with shared header/footer components.

## Configuration
Create a `.env.local` file in the project root and configure the following keys:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for Prisma models. |
| `POSTGRES_URL_NON_POOLING` | Direct connection for Prisma migrations when pooling is unavailable. |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks and session cookies. |
| `NEXTAUTH_SECRET` | Secret used to sign JWT sessions for NextAuth. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials for Google login. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth credentials for GitHub login. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID for marketing insights. |
| `SITE_URL` | Public site URL used in metadata and sitemap generation. |

## Getting started
1. **Install dependencies** (Node.js 18+, pnpm recommended):
   ```bash
   pnpm install
   ```
2. **Generate Prisma client & apply schema** (runs automatically on install, but you can push to your database):
   ```bash
   pnpm prisma:push
   ```
3. **Start the development server**:
   ```bash
   pnpm dev
   ```
4. **Open** `http://localhost:3000` to explore the marketing page, `http://localhost:3000/home` for the dashboard (requires authentication), and `http://localhost:3000/profile` for account settings.
5. **Build for production** when ready to deploy:
   ```bash
   pnpm build
   pnpm start
   ```

## Scripts
| Script | Description |
| --- | --- |
| `pnpm dev` | Run the Next.js development server with hot reloading. |
| `pnpm build` | Build the production bundle with optimized assets. |
| `pnpm start` | Launch the production server (after `pnpm build`). |
| `pnpm lint` | Run Next.js ESLint checks (ignored during build by default). |
| `pnpm prisma:push` | Synchronize Prisma schema with the database. |
| `pnpm prisma:studio` | Launch Prisma Studio for inspecting records. |
| `pnpm prisma:pull` | Introspect the database to update the Prisma schema. |

## Quality checks
- **TypeScript & ESLint**: run `pnpm lint` locally; the build configuration skips lint/type errors in CI to unblock experiments, so running lint before commits is recommended.
- **Runtime validation**: API routes validate request bodies with Zod to avoid invalid data entering the system.

## Contributing
1. Fork the repository and create a feature branch from `main`.
2. Install dependencies with `pnpm install` and configure environment variables.
3. Write changes with tests or validation where possible, and run `pnpm lint` before opening a PR.
4. Submit a pull request describing the problem and solution, including screenshots for UI changes when applicable.

## License & support
- **License**: MIT – see the `LICENSE` file if present in your fork (add one if distributing externally).
- **Support**: Reach out via `support@pillmind.app` or open an issue for bug reports and feature requests. The FAQ in `content/faq.mdx` covers common product questions.

---
Built with ❤️ to simplify medication adherence and empower healthier routines.
