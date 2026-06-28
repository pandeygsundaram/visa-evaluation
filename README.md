# VisaEval — AI-Powered Visa Evaluation Platform

A Next.js 16 application for AI-powered visa document processing. Upload documents, extract structured data, assess eligibility, and generate detailed reports — all in one glassmorphic UI.

> **Note:** The backend has been moved to a separate repository. This repo is now the frontend only.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with glassmorphism design system
- **Font**: Plus Jakarta Sans
- **Animation**: motion/react (parallax, infinite marquee)
- **Auth**: JWT with jose, Google OAuth
- **Payments**: Stripe subscriptions
- **AI / Document extraction**: Extend AI SDK
- **Database**: SQLite via better-sqlite3
- **Storage**: Cloudflare R2
- **Tests**: Vitest

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/
│   ├── (auth)/          # Login & signup pages
│   ├── api/             # Next.js API routes (auth, evaluations, subscriptions)
│   ├── dashboard/       # Protected dashboard pages
│   ├── pricing/         # Public pricing page
│   ├── globals.css      # Glassmorphism design tokens + CSS vars
│   └── page.tsx         # Landing page (8 sections)
├── components/
│   ├── landing/         # Hero, TrustedBy, DiscoverSmarter, ElevateData,
│   │                    # HowIndustriesUse, DataSecurity, Newsletter, Footer
│   ├── dashboard/       # Glassmorphic navbar
│   ├── auth/            # Auth navbar
│   └── ui/              # Card, Input, Button, DropdownMenu
├── lib/
│   ├── api/             # API client & typed endpoints
│   ├── auth.ts          # JWT helpers
│   ├── config/          # Visa data config
│   ├── db/              # SQLite connection
│   ├── services/        # Stripe, OpenAI/Extend AI services
│   ├── stores/          # Zustand auth store
│   └── utils/           # Document extractor, R2, Google OAuth
├── public/              # Landing page assets & brand logos
└── __tests__/           # Vitest test suite
```

## Features

- **Landing page** — Parallax hero, infinite CSS marquee, glassmorphic sections, real brand assets
- **Authentication** — Email/password + Google OAuth, JWT sessions, protected routes via middleware
- **Evaluations** — Upload visa documents, AI extraction via Extend AI, eligibility scoring
- **Dashboard** — Evaluation history, API key management, usage analytics
- **Subscriptions** — Stripe-powered Free / Basic / Pro / Enterprise plans with quota enforcement
- **Public API** — REST API with API key auth for programmatic access

## Supported Visa Types

US (O-1A, O-1B, H-1B) · Ireland (CSEP) · Germany (EU Blue Card, ICT) · France (Talent Passport) · Netherlands (Knowledge Migrant) · Poland (Work Permit C)

## Environment Variables

```env
JWT_SECRET=
DATABASE_URL=
EXTEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ENDPOINT=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Running Tests

```bash
npm run test
```

## Deployment

Recommended: **Vercel** for the frontend. Set all environment variables in the Vercel dashboard and configure Stripe webhooks to point to `/api/webhook`.
