// ─────────────────────────────────────────────────────────────────────────────
// /api/ingest — termékek embeddingelése + beszúrás a vektor-tudásbázisba
// ─────────────────────────────────────────────────────────────────────────────
// Cél: betanítjuk a chatbotot egy terméklistára. Bemenet: termékek tömbje JSON-ban.
// Kimenet: hány terméket sikerült feltölteni / mennyi idő alatt.
//
// Mit csinál a végén a DB-ben:
//   minden bemeneti termékhez egy sort hoz létre / frissít a
//   `practice_product_embeddings` táblában, ami tartalmazza:
//     • az eredeti termék mezőket (név, leírás, ár, stb.)
//     • az embedding vektort (1536 dim, OpenAI text-embedding-3-small)
//
// ai-comerz párja: `app/api/train-bot/route.ts` — ennek egyszerűsített verziója.
// Most még nincs: progress streaming, retry, partial failure recovery, cost limit.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/client";
import {
  embedBatch,
  prepareProductText,
  EMBEDDING_MODEL,
} from "@/lib/ai/embedding";

// ─────────────────────────────────────────────────────────────────────────────
// Validáció
// ─────────────────────────────────────────────────────────────────────────────
// Egy termék minimuma: ID és név. A többi mező opcionális — ha nincs, üres
// szövegként megy az embeddingbe.
const ProductSchema = z.object({
  product_id:          z.string().min(1, "product_id kötelező"),
  product_name:        z.string().min(1, "product_name kötelező"),
  product_description: z.string().optional().nullable(),
  product_category:    z.string().optional().nullable(),
  product_price:       z.number().optional().nullable(),
  product_url:         z.string().url().optional().nullable(),
  metadata:            z.record(z.string(), z.any()).optional(),
});

// 2048 az OpenAI batch embed limitje — ennél több termékkel a kliensnek
// több hívást kell csinálnia. A 2048 fölötti auto-chunkingot most kihagyjuk,
// inkább explicit limit + világos hibaüzenet.
const RequestSchema = z.object({
  products: z.array(ProductSchema).min(1).max(2048),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ingest
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    // ── 1. Auth — bárki bejelentkezett user ingest-elhet (single-tenant fázis) ──
    // Az orgslug fázisban szigorítjuk: csak az adott org tagjai ingestelhetnek
    // a saját org tudásbázisába.
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Be kell jelentkezni az ingest használatához." },
        { status: 401 }
      );
    }

    // ── 2. Body parse + validáció ──────────────────────────────────────────────
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validációs hiba a bemeneten.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { products } = parsed.data;

    // ── 3. Termék mezők → embeddelhető szövegek ────────────────────────────────
    const texts = products.map(prepareProductText);

    // ── 4. Embedding generálás (egy batch hívás az OpenAI-nak) ─────────────────
    let vectors: number[][];
    try {
      vectors = await embedBatch(texts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ingest] OpenAI embed hiba:", msg);
      return NextResponse.json(
        { error: "Embedding generálás sikertelen.", message: msg },
        { status: 502 } // Bad Gateway — upstream (OpenAI) hiba
      );
    }

    // ── 5. Soronkénti payload az upserthez ─────────────────────────────────────
    // pgvector text formátum: `[0.1,0.2,...]` — szóköz nélkül, Postgres ezt
    // implicit-castolja a `vector(1536)` típusra. JS array is működne sok
    // esetben, de a string formátum a legmegbízhatóbb.
    const rows = products.map((p, i) => ({
      product_id:          p.product_id,
      product_name:        p.product_name,
      product_description: p.product_description ?? null,
      product_category:    p.product_category ?? null,
      product_price:       p.product_price ?? null,
      product_url:         p.product_url ?? null,
      embedding:           `[${vectors[i].join(",")}]`,
      embedding_model:     EMBEDDING_MODEL,
      metadata:            p.metadata ?? {},
    }));

    // ── 6. Upsert admin klienssel (bypass-olja az RLS-t) ───────────────────────
    // Miért admin?
    //   • A `practice_product_embeddings` táblán nincs INSERT/UPDATE policy →
    //     anon és sima authenticated kulcs nem írhat
    //   • Az admin (service role) kliens megkerüli az RLS-t — ez a tervezett
    //     mintázat: olvasás user kulccsal, írás server-side admin kulccsal
    //
    // onConflict: "product_id" → ha ugyanaz a product_id már létezik, a sor
    // frissül (overwrite), nem dob unique constraint hibát.
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("practice_product_embeddings")
      .upsert(rows, { onConflict: "product_id" })
      .select("id, product_id");

    if (error) {
      console.error("[ingest] DB upsert hiba:", error);
      return NextResponse.json(
        { error: "Adatbázis upsert sikertelen.", message: error.message },
        { status: 500 }
      );
    }

    // ── 7. Válasz ──────────────────────────────────────────────────────────────
    return NextResponse.json({
      success:    true,
      processed:  products.length,
      upserted:   data?.length ?? 0,
      model:      EMBEDDING_MODEL,
      durationMs: Date.now() - startedAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ingest] váratlan hiba:", err);
    return NextResponse.json(
      { error: "Ingest sikertelen.", message: msg },
      { status: 500 }
    );
  }
}
