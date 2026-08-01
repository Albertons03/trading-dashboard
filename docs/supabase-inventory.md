# Supabase Inventory

Ez a fájl listázza, hogy a **practice projekt** mit ad hozzá a **közös Supabase backendhez** (amit az `ai-comerc-lead-generator` projekttel megosztunk). Minden új migráció után frissítjük.

**Szabály:** minden practice-specifikus tábla / függvény neve `practice_` prefixszel kezdődik, hogy ránézésre meg lehessen különböztetni az ai-comerz dolgaitól a Supabase dashboardon.

## Megosztva (NEM mi kezeljük)

Ezekhez nem nyúlunk — az ai-comerz tulajdona:

- `auth.*` — Supabase auth sémájú táblák (users, sessions, stb.) — itt regisztrált userek mindkét appba beléphetnek
- `product_embeddings`, `messages`, `conversations`, `organizations`, `organization_members`, `api_keys` — ai-comerz táblák
- ai-comerz RLS policy-k és RPC függvények

## A practice projekt által hozzáadva

### Extensionök

| Név | Cél | Megjegyzés |
|---|---|---|
| `vector` | pgvector — embedding tárolás + similarity keresés | `CREATE EXTENSION IF NOT EXISTS` → ha az ai-comerz már bekapcsolta, no-op |

### Táblák

| Név | Cél | Migráció |
|---|---|---|
| `chat_messages` | Practice chat üzenetek (auth required, RLS-szel védett) | (létező, korábban hozzáadva) |
| `practice_product_embeddings` | Termék-RAG: termék mezők + 1536 dim embedding | `20260507120000_create_practice_rag.sql` |

### Indexek

| Név | Tábla | Típus | Migráció |
|---|---|---|---|
| `idx_practice_product_embeddings_vector` | `practice_product_embeddings` | HNSW (`vector_cosine_ops`, m=16, ef_construction=64) | `20260507120000_create_practice_rag.sql` |

### RPC függvények

| Név | Cél | Migráció |
|---|---|---|
| `practice_search_products(query_embedding, match_count, threshold)` | Top-K cosine similarity termékkeresés | `20260507120000_create_practice_rag.sql` |
| `practice_set_updated_at()` | Trigger function az `updated_at` mező automatikus frissítésére | `20260507120000_create_practice_rag.sql` |

### RLS policy-k

| Tábla | Policy | Művelet | Kinek |
|---|---|---|---|
| `practice_product_embeddings` | `practice_product_embeddings_select_authenticated` | SELECT | bármely bejelentkezett user (későbbi orgslug fázisban szigorítjuk org_id alapján) |

> Írás (INSERT/UPDATE/DELETE) nincs policy-val engedve → csak service role kulccsal megy (admin kliens az API route-okból).

## Migrációk listája

1. `20260507120000_create_practice_rag.sql` — pgvector + `practice_product_embeddings` + HNSW index + `practice_search_products` RPC + RLS

## Hogyan alkalmazzuk a migrációt

**Egyszerűbb (dashboard):**
1. Supabase dashboard → SQL Editor → New query
2. Bemásoljuk a `supabase/migrations/<file>.sql` tartalmát
3. Run → ellenőrizzük a Table Editor-ben, hogy a tábla létrejött `public` sémában

**CLI (ha linkelt projekt van):**
```bash
npx supabase db push
```

## Ellenőrzés a dashboardon

A migráció után a Database → Tables fülön látnod kell:
- `practice_product_embeddings` (új)
- `chat_messages` (létező)
- + az ai-comerz tábláit (azokhoz nem nyúltunk)

A Database → Functions fülön:
- `practice_search_products`
- `practice_set_updated_at`

A Database → Extensions-nél a `vector` extension `enabled` állapotban.
