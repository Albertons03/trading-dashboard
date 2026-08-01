# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no test suite configured.

## Architecture Overview

This is a **Next.js 15 + TypeScript** full-stack practice app with four main features:

| Feature | Route | Description |
|---|---|---|
| AI Trading Dashboard | `/` (home) | Multi-agent crypto analysis + trade setup |
| E-commerce Demo | `/dashboard`, `/dashboard/[id]` | Product grid with mock data |
| Chat | `/chat` | Persistent chat stored in Supabase |
| Todo | `/todo` | In-memory CRUD (not persisted to DB) |

### Authentication & Middleware

`middleware.ts` guards `/dashboard`, `/chat`, `/todo` — unauthenticated users are redirected to `/login`. Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`. The middleware uses a Supabase SSR client to validate sessions from cookies.

Auth flows use **Next.js server actions** (`lib/actions/auth.ts`), not API routes. Forms in `components/auth/` call these actions directly.

### Supabase Client Setup (`lib/supabase/client.ts`)

Three clients are exported:
- `createBrowserClient()` — for `'use client'` components
- `createServerClient()` — for server components, server actions, and API routes
- `createAdminClient()` — uses service role key, bypasses RLS (use sparingly)

Helper utilities (`getCurrentUser`, `getCurrentSession`, `isUserAuthenticated`) are also exported from this file.

### AI Trading System

The home page (`app/page.tsx`) fetches `/api/bias`, which orchestrates:
1. External data: CoinGecko prices, Alternative.me Fear & Greed Index, Reddit/crypto news
2. Three OpenAI `gpt-4o-mini` agents: Macro, Technical, Sentiment
3. Structured JSON response parsed by `lib/parser.ts`
4. Risk calculations via `lib/risk.ts` (position size, SL distance)

### API Routes (`app/api/`)

- `/api/bias` — AI trade analysis (OpenAI + CoinGecko + Fear&Greed)
- `/api/chat` — GET/POST chat messages (Supabase `chat_messages` table, auth required)
- `/api/todo` — GET/POST/PUT/DELETE todos (**in-memory only**, resets on server restart)
- `/api/price` — BTC/SOL spot prices from CoinGecko
- `/api/news` — Crypto headlines from Reddit
- `/api/messages` — Simple in-memory test route

### Validation

`lib/validations/auth.ts` contains Zod schemas for all auth forms. Password rules: 8+ chars, uppercase, lowercase, number. These schemas are imported by both server actions and client-side form components for consistent validation.

### UI Components

`components/ui/` holds shadcn-style primitives (Button, Card, Input, Label) built with `class-variance-authority`. Use these rather than raw HTML elements for consistency.

`lib/utils.ts` exports `cn()` — the standard `clsx` + `tailwind-merge` class helper used throughout.

### Mock Data

`lib/data/items.ts` is the static product list used by the dashboard and `[id]` detail pages. It is not backed by a database.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
