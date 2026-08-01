// ─────────────────────────────────────────────────────────────────────────────
// Embedding wrapper az OpenAI embeddings köré
// ─────────────────────────────────────────────────────────────────────────────
// Cél: egységes API a RAG pipeline-nak. Akármi hívja (ingest endpoint, chat
// route, jövőbeli batch script), ugyanazt a függvényt használja.
//
// Az ai-comerz `lib/ai/embedding-service.ts` mintáját követjük, csak kisebb /
// egyszerűbb felülettel — most még nincs retry, batch progress callback,
// cost tracker stb. Ezeket akkor adjuk hozzá ha szükségünk lesz rájuk.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";

// Külön kliens-példány az embeddingekhez. (A chat route saját kliensével
// most még nem osztozunk — ha később több helyen kellene, kiemelhetjük
// `lib/ai/openai.ts`-be singleton-ként.)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Konstansok
// ─────────────────────────────────────────────────────────────────────────────
// FONTOS: ezek MUSZÁJ szinkronban legyenek a Supabase migrációval.
// Ha modellt váltunk → változik a dimenzió → új tábla / migráció kell,
// MERT a `vector(1536)` típus fix méretet vár.
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSION = 1536;

// OpenAI limit: egy embedding hívás max 2048 inputot vesz át.
// Ennél nagyobbra a hívóoldal felel a darabolásért.
const MAX_BATCH_SIZE = 2048;

// ─────────────────────────────────────────────────────────────────────────────
// Termék → embeddelhető szöveg
// ─────────────────────────────────────────────────────────────────────────────
// Egy termék több mezőből áll (név, leírás, kategória, ár). Ezeket egyetlen
// szöveggé fűzzük, amit aztán embeddelünk. A stratégia ugyanaz mint az
// ai-comerz `prepareTextForEmbedding`-jében:
//   • a search-höt nem segítő mezők (URL, ID) NEM kerülnek bele
//   • lowercase + whitespace normalizálás → stabilabb vektorok
//   • magyar ékezetek megmaradnak (NE használj pl. unidecode-ot)
// ─────────────────────────────────────────────────────────────────────────────
export type ProductInput = {
  product_id: string;
  product_name: string;
  product_description?: string | null;
  product_category?: string | null;
  product_price?: number | null;
};

export function prepareProductText(p: ProductInput): string {
  const parts = [
    p.product_name,
    p.product_description ?? "",
    p.product_category ? `Kategória: ${p.product_category}` : "",
    p.product_price != null ? `Ár: ${p.product_price}` : "",
  ].filter(Boolean);

  return parts
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// embedText — egyetlen szöveg → vektor
// ─────────────────────────────────────────────────────────────────────────────
// Használat: chat retrieval (user üzenet → query vektor), egyedi termék ingest.
// ─────────────────────────────────────────────────────────────────────────────
export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("embedText: üres szöveg nem embeddelhető");
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  });

  const vector = response.data[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `embedText: váratlan dimenzió (${vector?.length}), várt ${EMBEDDING_DIMENSION}`
    );
  }

  return vector;
}

// ─────────────────────────────────────────────────────────────────────────────
// embedBatch — több szöveg → vektorok, az inputok sorrendjében
// ─────────────────────────────────────────────────────────────────────────────
// Használat: tömeges termék ingest (CSV → embeddings). Egy hívás olcsóbb
// és gyorsabb mint N külön hívás. Az OpenAI az `index` mezővel jelzi,
// melyik vektor melyik inputhoz tartozik — biztosak hogy stimmel,
// index szerint rendezzük.
// ─────────────────────────────────────────────────────────────────────────────
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(
      `embedBatch: max ${MAX_BATCH_SIZE} input, ${texts.length} érkezett`
    );
  }

  // Üres vagy whitespace-only inputot az OpenAI elutasít → előre szűrjünk.
  const trimmed = texts.map((t) => t.trim());
  const emptyIdx = trimmed.findIndex((t) => !t);
  if (emptyIdx !== -1) {
    throw new Error(`embedBatch: üres szöveg a(z) ${emptyIdx}. indexen`);
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  });

  // Sorrend biztosítása: OpenAI általában tartja az input sorrendet, de
  // a doc szerint az `index` mező az autoritatív → arra rendezünk.
  return response.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
