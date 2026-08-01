# Mini Trader – Projekt elemzés (jelenlegi állapot)

## 1) Áttekintés

Next.js 15 + TypeScript alapú mini trading dashboard. Négy fő funkció:

| Route | Funkció |
|---|---|
| `/` | AI Trading Dashboard (fő funkció) |
| `/dashboard`, `/dashboard/[id]` | E-commerce demo (mock adat) |
| `/chat` | Perzisztens chat (Supabase) |
| `/todo` | In-memory CRUD (nem perzisztens) |

---

## 2) Jelenlegi architektúra – AI Trading rész

```
User (böngésző)
      │
      ▼
app/page.tsx  ("use client")
      │  fetch("/api/bias")
      ▼
app/api/bias/route.ts
      │
      ├── [1] CoinGecko API          → btcPrice, solPrice        (5s timeout)
      ├── [2] Alternative.me API     → fearGreed value + label   (5s timeout)
      └── [3] lib/news.ts scraper    → headlines string[]        (5s timeout / forrás)
                  ├── CoinDesk RSS
                  ├── CoinTelegraph RSS
                  └── Decrypt RSS
      │
      ▼  (párhuzamosan, Promise.all)
      ├── Macro Agent     (gpt-4o-mini) → risk-on/off elemzés
      ├── Technical Agent (gpt-4o-mini) → support/resistance, szcenáriók
      └── Sentiment Agent (gpt-4o-mini) → fearGreed + hírek → bullish/bearish/mixed
      │
      ▼
Decision Agent (gpt-4o-mini, JSON mode)
      │
      ▼  JSON response:
      {
        bias, confidence, quality,
        action, entry, stopLoss,
        target, reason
      }
      │
      ▼
app/page.tsx
      ├── parseDecision()  (lib/parser.ts)  → Decision objektum
      └── calculateRisk()  (lib/risk.ts)    → riskAmount, positionSize, stopDistance
                                              (700$ account, 2% risk)
      │
      ▼
UI: Trade Setup kártya + Agent panelek + News lista
```

---

## 3) API route-ok

| Endpoint | Módszer | Leírás |
|---|---|---|
| `/api/bias` | GET | Fő AI elemzés (OpenAI + külső adatok) |
| `/api/chat` | GET, POST | Chat üzenetek (Supabase, auth kell) |
| `/api/todo` | GET, POST, PUT, DELETE | In-memory todo (restart törli) |
| `/api/price` | GET | BTC/SOL ár CoinGecko-ról |
| `/api/news` | GET | Reddit r/cryptocurrency headlines |
| `/api/messages` | GET, POST | In-memory teszt route |

---

## 4) Auth és middleware

- `middleware.ts` (deprecated, átnevezendő `proxy.ts`-re – Next.js 16 figyelmeztetés)
- Védett route-ok: `/dashboard`, `/chat`, `/todo`
- Nem bejelentkezett user → `/login` redirect
- Bejelentkezett user `/login` vagy `/signup` oldalon → `/dashboard` redirect
- Supabase SSR client validálja a session cookie-t

Auth flow: **Next.js server actions** (`lib/actions/auth.ts`), nem API route-ok.

---

## 5) Kulcsfájlok

| Fájl | Feladata |
|---|---|
| `app/page.tsx` | Trading dashboard UI + adatlekérés |
| `app/api/bias/route.ts` | AI elemzés orchestrálása |
| `lib/news.ts` | RSS scraper (3 forrás, párhuzamos fetch) |
| `lib/parser.ts` | Decision JSON → Decision objektum |
| `lib/risk.ts` | Pozícióméret és kockázat számítás |
| `lib/supabase/client.ts` | Browser / Server / Admin Supabase kliensek |
| `lib/actions/auth.ts` | Bejelentkezés, regisztráció server actions |
| `lib/validations/auth.ts` | Zod sémák (jelszó: 8+ kar, nagy, kis, szám) |
| `lib/data/items.ts` | Mock termékadatok (dashboard demo) |
| `components/ui/` | shadcn-stílusú UI primitívek (Button, Card, Input, Label) |

---

## 6) Jelenlegi erősségek

- Tiszta multi-agent gondolkodás: 3 független nézőpont + 1 döntéshozó
- RSS scraper nem igényel API kulcsot, `Promise.allSettled` védi a részleges hibák ellen
- Decision agent JSON mode-ban fut → megbízhatóbb parse
- Risk számítás külön utilban → újrahasználható
- `Promise.all` a 3 agentnél → párhuzamos futás, gyorsabb válasz

---

## 7) Ismert technikai adósságok

| # | Probléma | Hol |
|---|---|---|
| 1 | `middleware.ts` deprecated, `proxy.ts`-re kell átnevezni | `middleware.ts` |
| 2 | `/api/news` route Reddit-et scrape-el, de a bias route már nem használja | `app/api/news/route.ts` |
| 3 | `/api/messages` in-memory, restart után elveszik | `app/api/messages/route.ts` |
| 4 | Todo adatok in-memory, nem perzisztens | `app/api/todo/route.ts` |
| 5 | Nincs cache a külső API hívásokra (CoinGecko, Alternative.me) | `app/api/bias/route.ts` |
| 6 | `entry`/`sl` 0 értéket ad vissza ha az AI nem ad meg számot | `lib/parser.ts` |

---

## 8) Fejlesztési javaslatok (prioritás szerint)

### Gyors nyerések
- `middleware.ts` → `proxy.ts` átnevezés (Next.js figyelmeztetés megszüntetése)
- CoinGecko hívás eredményét cache-elni (pl. 60s) — rate limit elkerülés

### Megfontolásra érdemes
- `agentTrace` mező hozzáadása a bias response-hoz (melyik agent mennyit futott)
- Todo és messages route Supabase-re kötése (perzisztencia)
- `/api/news` route frissítése RSS scraperre a Reddit helyett (konzisztens a bias-szal)
