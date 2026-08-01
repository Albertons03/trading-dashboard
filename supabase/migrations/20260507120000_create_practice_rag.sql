-- ─────────────────────────────────────────────────────────────────────────────
-- 001 — Practice RAG alaprendszer
-- ─────────────────────────────────────────────────────────────────────────────
-- Cél: termék-alapú RAG (retrieval-augmented generation) a chatbothoz.
-- Az ai-comerc-lead-generator `product_embeddings` tábláját másoljuk, DE:
--   • `practice_` prefix → ne ütközzön az ai-comerz táblákkal a közös DB-ben
--   • `organization_id` még NEM kerül be → az orgslug fázisban tesszük vissza
-- ─────────────────────────────────────────────────────────────────────────────

-- pgvector extension — vektor típus + similarity operátorok (<=>, <->, <#>)
-- IF NOT EXISTS: ha az ai-comerz már bekapcsolta, ez no-op
create extension if not exists vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tábla: practice_product_embeddings
-- ─────────────────────────────────────────────────────────────────────────────
-- Egy sor = egy termék + a hozzá tartozó embedding vektor.
-- Denormalizált: a termék mezői ugyanabban a sorban vannak, mint az embedding,
-- így a search RPC egy lekérdezésben visszaadja amit a chatnek kell.
create table if not exists public.practice_product_embeddings (
  id uuid primary key default gen_random_uuid(),

  -- Termék azonosító a forrás-rendszerből (CSV-ből, Shopify-ból stb.)
  -- Ez a kulcs amin upsertelünk, hogy ne legyen duplikátum.
  product_id text not null unique,

  product_name        text not null,
  product_description text,
  product_category    text,
  product_price       numeric,
  product_url         text,

  -- A vektor maga. 1536 dimenzió = OpenAI text-embedding-3-small kimenete.
  -- Ha másik modellre váltunk, a dimenzió is változik → új tábla / migráció kell.
  embedding vector(1536) not null,

  -- Melyik modellel készült az embedding. Tracking végett, hogy lássuk
  -- ha keverednek a régi/új modellek és újra kell embeddelni mindent.
  embedding_model text not null default 'text-embedding-3-small',

  -- Rugalmas metaadat tároló (tags, sku, custom fields stb.)
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Index: HNSW (Hierarchical Navigable Small World)
-- ─────────────────────────────────────────────────────────────────────────────
-- Approximate nearest neighbor index → gyors similarity keresés (~ms-os) akkor is,
-- ha sok ezer termék van. Cosine similarity-re optimalizálva (vector_cosine_ops).
-- m, ef_construction paraméterek azonosak az ai-comerz beállításával.
create index if not exists idx_practice_product_embeddings_vector
  on public.practice_product_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC függvény: practice_search_products
-- ─────────────────────────────────────────────────────────────────────────────
-- A chat API ezt hívja meg user üzenet → embedding után.
-- Visszaadja a top-K leghasonlóbb terméket similarity score-ral együtt.
--
-- Miért RPC és nem sima query?
--   • A vektort body-ban küldjük (URL túl rövid lenne 1536 floatra)
--   • A számítás (1 - cosine_distance) DB-oldalon olcsóbb
--   • Egy kerek felület: a kliens csak hívja, nem kell SQL-t írnia
--
-- security definer: a függvény a tulaj jogaival fut → RLS-t megkerüli
-- (a search-öt minden bejelentkezett user futtathatja, függetlenül a soronkénti
-- policy-któl). Az írás továbbra is csak service role-on keresztül megy.
--
-- search_path: `public, extensions` — Supabase a `vector` extensiont az
-- `extensions` sémában tartja, így a <=> cosine distance operátor onnan jön.
-- Ha csak `public`-ot adnánk, a függvény belsejében nem találná az operátort
-- (ERROR: operator does not exist: extensions.vector <=> extensions.vector).
create or replace function public.practice_search_products(
  p_query_embedding      vector(1536),
  p_match_count          int   default 5,
  p_similarity_threshold float default 0.3
)
returns table (
  id                  uuid,
  product_id          text,
  product_name        text,
  product_description text,
  product_category    text,
  product_price       numeric,
  product_url         text,
  metadata            jsonb,
  similarity          float
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    e.id,
    e.product_id,
    e.product_name,
    e.product_description,
    e.product_category,
    e.product_price,
    e.product_url,
    e.metadata,
    -- <=> = cosine distance (0 = azonos, 2 = ellentétes)
    -- 1 - distance = similarity (1 = azonos, -1 = ellentétes)
    1 - (e.embedding <=> p_query_embedding) as similarity
  from public.practice_product_embeddings e
  where 1 - (e.embedding <=> p_query_embedding) >= p_similarity_threshold
  order by e.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
-- Bekapcsoljuk, hogy az anon kulccsal NE lehessen olvasni a táblát.
-- Egy SELECT policy bejelentkezett usereknek (most még nincs org-szűrés —
-- az orgslug fázisban szigorítjuk org_id alapján).
-- Írás: nincs INSERT/UPDATE/DELETE policy → csak service role-os admin
-- klienssel megy (az API route-okból), ami megkerüli az RLS-t.
alter table public.practice_product_embeddings enable row level security;

-- DROP IF EXISTS + CREATE: idempotens — a migráció biztonságosan újrafuttatható
-- akkor is, ha egy korábbi részleges futás már létrehozta a policy-t.
drop policy if exists "practice_product_embeddings_select_authenticated"
  on public.practice_product_embeddings;

create policy "practice_product_embeddings_select_authenticated"
  on public.practice_product_embeddings
  for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: updated_at automatikus karbantartás
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.practice_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- DROP IF EXISTS + CREATE: idempotens újrafuttatáshoz
drop trigger if exists trg_practice_product_embeddings_updated_at
  on public.practice_product_embeddings;

create trigger trg_practice_product_embeddings_updated_at
  before update on public.practice_product_embeddings
  for each row
  execute function public.practice_set_updated_at();
