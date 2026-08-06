***PROMPT***

export function buildSentimentPrompt(
  headlines: string[]
): string {
  return `
You are a crypto sentiment analyst.

Return exactly one valid JSON object only. Do not include markdown, explanation text, or anything outside the JSON.

The JSON must have exactly these top-level fields:
- items
- overallSentiment
- overallWeightedScore
- confidence
- intradayBias
- shortTermBias
- strongestBullishCatalyst
- strongestBearishRisk
- summary

Do not use a top-level "headlines" array. Do not wrap the summary fields inside a nested object.

Each item in the "items" array must have exactly these fields:
- headline
- category: "ETF" | "REGULATION" | "SECURITY" | "INSTITUTIONAL" | "MACRO" | "MARKET" | "OTHER"
- btcRelevance: number between 0 and 10
- sentimentScore: number between -100 and 100
- confidence: number between 0 and 100
- impact: "LOW" | "MEDIUM" | "HIGH"
- timeframe: "INTRADAY" | "SHORT_TERM" | "MEDIUM_TERM"
- duplicateGroupId: string or null
- isDuplicate: boolean
- reasoning: short text explaining the classification

Example output structure:
{
  "items": [
    {
      "headline": "Example headline",
      "category": "OTHER",
      "btcRelevance": 0,
      "sentimentScore": 0,
      "confidence": 50,
      "impact": "LOW",
      "timeframe": "INTRADAY",
      "duplicateGroupId": null,
      "isDuplicate": false,
      "reasoning": "Short explanation"
    }
  ],
  "overallSentiment": "NEUTRAL",
  "overallWeightedScore": 0,
  "confidence": 50,
  "intradayBias": "Mixed signals.",
  "shortTermBias": "Neutral to slightly bearish.",
  "strongestBullishCatalyst": null,
  "strongestBearishRisk": null,
  "summary": "Overall sentiment is neutral."
}

Rules:
- Do not treat all headlines as equally important.
- Score direct BTC relevance separately from broader crypto news.
- Distinguish direct BTC catalysts from broader crypto headlines.
- Do not invent missing context.
- Reduce confidence for ambiguous headlines.
- Detect duplicate or near-duplicate stories.
- Do not count duplicates twice.
- Distinguish intraday and medium-term impact.
- Return valid JSON only.
- Do not provide personalized financial advice.

Headlines:
${headlines.map((headline, index) => `${index + 1}. ${headline}`).join('\n')}
`.trim()
}
---------------------------------------------------------------------------------------

types---

export type HeadlineSentimentItem = {
  headline: string;
  category:
    | "ETF"
    | "REGULATION"
    | "SECURITY"
    | "INSTITUTIONAL"
    | "MACRO"
    | "MARKET"
    | "OTHER";
  btcRelevance: number; // 0-10
  sentimentScore: number; // -100 to +100
  confidence: number; // 0-100
  impact: "LOW" | "MEDIUM" | "HIGH";
  timeframe: "INTRADAY" | "SHORT_TERM" | "MEDIUM_TERM";
  duplicateGroupId: string | null;
  isDuplicate: boolean;
  reasoning: string;
};

export type OverallSentimentLabel =
  | "STRONGLY_BEARISH"
  | "BEARISH"
  | "SLIGHTLY_BEARISH"
  | "NEUTRAL"
  | "SLIGHTLY_BULLISH"
  | "BULLISH"
  | "STRONGLY_BULLISH";

export type NewsSentimentResponse = {
  overallSentiment: OverallSentimentLabel;
  overallWeightedScore: number;
  confidence: number;
  intradayBias: string;
  shortTermBias: string;
  strongestBullishCatalyst: string | null;
  strongestBearishRisk: string | null;
  items: HeadlineSentimentItem[];
  summary: string;
};
-------------------------------------------------------------------------------

CalcWeight...

import { HeadlineSentimentItem } from "./types";

export function calculateWeightedSentiment(
  items: HeadlineSentimentItem[]
): number {
  const validItems = items.filter((item) => {
    return (
      !item.isDuplicate &&
      Number.isFinite(item.sentimentScore) &&
      Number.isFinite(item.btcRelevance) &&
      Number.isFinite(item.confidence) &&
      item.btcRelevance >= 0 &&
      item.btcRelevance <= 10 &&
      item.confidence >= 0 &&
      item.confidence <= 100 &&
      item.sentimentScore >= -100 &&
      item.sentimentScore <= 100
    );
  });

  if (validItems.length === 0) {
    return 0;
  }

  const totals = validItems.reduce(
    (acc, item) => {
      const relevanceWeight = item.btcRelevance / 10;
      const confidenceWeight = item.confidence / 100;
      const weight = relevanceWeight * confidenceWeight;

      return {
        weightedSum:
          acc.weightedSum + item.sentimentScore * weight,
        totalWeight: acc.totalWeight + weight,
      };
    },
    {
      weightedSum: 0,
      totalWeight: 0,
    }
  );

  if (totals.totalWeight === 0) {
    return 0;
  }

  const score = Math.round(totals.weightedSum / totals.totalWeight);

  return Math.max(-100, Math.min(100, score));
}

------------------------------------------------------------------------------------

***parseSentiment***

import { HeadlineSentimentItem, NewsSentimentResponse } from "./types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isOverallSentimentLabel(value: unknown): value is NewsSentimentResponse["overallSentiment"] {
  return [
    "STRONGLY_BEARISH",
    "BEARISH",
    "SLIGHTLY_BEARISH",
    "NEUTRAL",
    "SLIGHTLY_BULLISH",
    "BULLISH",
    "STRONGLY_BULLISH",
  ].includes(value as string);
}

function isCategory(value: unknown): value is HeadlineSentimentItem["category"] {
  return [
    "ETF",
    "REGULATION",
    "SECURITY",
    "INSTITUTIONAL",
    "MACRO",
    "MARKET",
    "OTHER",
  ].includes(value as string);
}

function isImpact(value: unknown): value is HeadlineSentimentItem["impact"] {
  return ["LOW", "MEDIUM", "HIGH"].includes(value as string);
}

function isTimeframe(value: unknown): value is HeadlineSentimentItem["timeframe"] {
  return ["INTRADAY", "SHORT_TERM", "MEDIUM_TERM"].includes(value as string);
}

function validateHeadlineItem(item: unknown): item is HeadlineSentimentItem {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const record = item as Record<string, unknown>;

  return (
    isString(record.headline) &&
    isCategory(record.category) &&
    isNumber(record.btcRelevance) &&
    record.btcRelevance >= 0 &&
    record.btcRelevance <= 10 &&
    isNumber(record.sentimentScore) &&
    record.sentimentScore >= -100 &&
    record.sentimentScore <= 100 &&
    isNumber(record.confidence) &&
    record.confidence >= 0 &&
    record.confidence <= 100 &&
    isImpact(record.impact) &&
    isTimeframe(record.timeframe) &&
    (isString(record.duplicateGroupId) || record.duplicateGroupId === null) &&
    isBoolean(record.isDuplicate) &&
    isString(record.reasoning)
  );
}

function validateResponse(value: unknown): value is NewsSentimentResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isOverallSentimentLabel(record.overallSentiment) &&
    isNumber(record.overallWeightedScore) &&
    record.overallWeightedScore >= -100 &&
    record.overallWeightedScore <= 100 &&
    isNumber(record.confidence) &&
    record.confidence >= 0 &&
    record.confidence <= 100 &&
    isString(record.intradayBias) &&
    isString(record.shortTermBias) &&
    (isString(record.strongestBullishCatalyst) || record.strongestBullishCatalyst === null) &&
    (isString(record.strongestBearishRisk) || record.strongestBearishRisk === null) &&
    Array.isArray(record.items) &&
    record.items.every(validateHeadlineItem) &&
    isString(record.summary)
  );
}

export function parseSentimentResponse(
  text: string
): NewsSentimentResponse | null {
  try {
    const parsed = JSON.parse(text);
    if (!validateResponse(parsed)) {
      console.error("Invalid sentiment response structure", parsed);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("Failed to parse sentiment JSON", err);
    return null;
  }
}
---------------------------------------------------------------------------------

Api/bias route.ts---

/**
 * =====================================================
 * AI Trading Bias API (/api/bias)
 * =====================================================
 *
 * MIT CSINÁL?
 * -----------
 *   - Lekéri a piaci adatokat (BTC/SOL ár, Fear&Greed, hírek)
 *   - Meghív 3 AI agent-et: Macro, Technical, Sentiment
 *   - Egy 4. AI összegzi a döntést (LONG / SHORT / NO TRADE)
 *   - Visszaadja az eredményt a frontend-nek
 *
 * REFAKTOR (2026.07.08):
 *   - Adatlekérés → lib/market-data.ts (fetchAllMarketData)
 *   - Promptok → lib/prompts.ts (build*Prompt függvények)
 *   - Típusos OpenAI hívás → callAgent segédfüggvény
 *   - Eredeti: ~200 sor egyben → Most: ~80 sor, tiszta
 * =====================================================
 */

import OpenAI from 'openai'
import { fetchAllMarketData, hasValidMarketData } from '@/lib/market-data'
import {
  buildMacroPrompt,
  buildTechnicalPrompt,
  buildSentimentPrompt,
  buildDecisionPrompt,
} from '@/lib/prompts'
import {
  calculateWeightedSentiment,
  parseSentimentResponse,
} from '@/lib/sentiment'

// =====================================================
// TÍPUSOK
// =====================================================

/**
 * A bias API válaszának formátuma.
 * 
 * MIÉRT KELL TÍPUS?
 * -----------------
 * Korábban a Response.json()-ban nem volt típus, így ha
 * valaki elgépelt egy mezőnevet (pl. "headlines" helyett
 * "headLine"), csak futásidőben derült ki.
 * 
 * Most: TypeScript ellenőrzi, hogy minden mező helyes-e.
 */
export type BiasResponse = {
  btcPrice: number
  solPrice: number
  headlines: string[]
  macro: string
  technical: string
  sentiment: string
  decision: string
}

/** Három agent elemzésének összefogó típusa */
type AgentAnalyses = {
  macro: string
  technical: string
  sentiment: string
}

// =====================================================
// OPENAI KLIENS
// =====================================================

/**
 * Az OpenAI kliens egy példánya.
 * 
 * SINGLETON minta: az openai objektum egyszer jön létre
 * a modul betöltésekor, nem minden kérésnél.
 * 
 * Az apiKey az .env.local-ból jön (process.env.OPENAI_API_KEY).
 * Soha ne írd bele a kulcsot a kódba!
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// =====================================================
// SEGÉDFÜGGVÉNY: AI agent hívás
// =====================================================

/**
 * Meghív egy AI agent-et a megadott prompt-pal.
 * 
 * MIÉRT KELL KÜLÖN FÜGGVÉNY?
 * ---------------------------
 * A 3 agent hívása (macro, technical, sentiment) pontosan
 * ugyanaz a minta: ugyanaz a model, ugyanaz a messages
 * struktúra. Csak a prompt tartalma különbözik.
 * 
 * DRY elv: egy helyen van a logika, 3 helyett egyszer kell
 * javítani, ha változik a modell vagy a messages struktúra.
 * 
 * @param prompt - Az agent-nek adott utasítás
 * @returns Az AI válasz szövege, vagy "No output" ha hiba
 */
async function callAgent(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })
    return response.choices[0]?.message?.content ?? 'No output'
  } catch (err) {
    console.error('❌ [Bias API] Agent error:', err)
    return 'Error'
  }
}
// =====================================================
// SEGÉDFÜGGVÉNY: Döntéshozó AI hívás (JSON output)
// =====================================================

/**
 * Meghívja a döntéshozó agent-et.
 * 
 * Ez különbözik a callAgent-től, mert:
 *   - response_format: { type: "json_object" } → garantáltan JSON
 *   - A döntés az összes elemzés eredményét használja
 *   - Külön try/catch, mert ez a lépés kritikusabb
 * 
 * @param prompt - A döntéshozó prompt
 * @returns Az AI döntés JSON string-je
 */
async function callDecisionAgent(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    return response.choices[0]?.message?.content ?? 'No decision output'
  } catch (err) {
    console.error('❌ [Bias API] Decision agent error:', err)
    return '{"bias":"NO TRADE","confidence":0,"quality":"C","action":"NO TRADE","entry":0,"stopLoss":0,"target":0,"reason":"AI error - could not generate analysis"}'
  }
}

// =====================================================
// SEGÉDFÜGGVÉNY: Fallback válasz (ha nincs adat)
// =====================================================

/**
 * Létrehoz egy hibaüzenetet, ha nincs elegendő piaci adat.
 * 
 * @param reason - A hiba oka
 * @returns BiasResponse objektum "No data" értékekkel
 */
function createErrorResponse(reason: string): BiasResponse {
  return {
    btcPrice: 0,
    solPrice: 0,
    headlines: [],
    macro: 'No data',
    technical: 'No data',
    sentiment: 'No data',
    decision: reason,
  }
}

// =====================================================
// FŐ FÜGGVÉNY: GET /api/bias
// =====================================================

/**
 * GET handler — a teljes AI elemzés előállítása.
 * 
 * LÉPÉSEK:
 *   1. Piaci adatok lekérése (párhuzamosan)
 *   2. Ha nincs BTC ár → korai visszatérés hibával
 *   3. 3 AI agent párhuzamos meghívása
 *   4. Döntéshozó AI meghívása a 3 elemzés alapján
 *   5. Eredmény összeállítása és visszaküldése
 * 
 * @returns BiasResponse JSON
 */
export async function GET(): Promise<Response> {
  // ── 1. Piaci adatok lekérése ──────────────────────
  // A fetchAllMarketData már kezeli a hibákat:
  //   - Ha CoinGecko hibázik → btcPrice = 0
  //   - Ha Fear&Greed hibázik → value = 0
  //   - Ha RSS hibázik → headlines = placeholder
  const marketData = await fetchAllMarketData()

  // ── 2. Korai kilépés, ha nincs BTC ár ────────────
  // Nincs értelme az AI-t hívni, ha nincs árfolyam adat
  if (!hasValidMarketData(marketData)) {
    return Response.json(
      createErrorResponse('⚠️ Network error – cannot fetch market data')
    )
  }

  // ── 3. AI agent-ek párhuzamos meghívása ──────────
  // Mindhárom agent egyszerre indul (Promise.all).
  // A callAgent már kezeli a hibákat (saját try/catch).
  const [macro, technical, sentimentRaw] = await Promise.all([
    callAgent(buildMacroPrompt(marketData)),
    callAgent(buildTechnicalPrompt(marketData)),
    callAgent(buildSentimentPrompt(marketData.headlines)),
  ])
    //console.log('Bias Api Sentiment Raw:', sentimentRaw);
  const parsedSentiment = parseSentimentResponse(sentimentRaw)

  console.log('Bias Api Parsed Sentiment:', parsedSentiment);

  if (!parsedSentiment) {
    console.error('⚠️ Sentiment parse failed; falling back to raw sentiment string for decision prompt.')
  }

  if (parsedSentiment) {
    const overallWeightedScore = calculateWeightedSentiment(
      parsedSentiment.items
    )

    console.log(
      '[Bias API] parsed sentiment items:',
      parsedSentiment.items.length,
      'overallWeightedScore:',
      overallWeightedScore
    )
  }

  const sentiment = sentimentRaw

  // ── 4. Döntéshozó AI meghívása ──────────────────
  // Összegzi a 3 elemzést és hozza meg a végső döntést
  const decision = await callDecisionAgent(
    buildDecisionPrompt(marketData, macro, technical, sentiment)
  )

  // ── 5. Válasz összeállítása ──────────────────────
  // A típus (BiasResponse) garantálja, hogy nem hagytunk ki
  // mezőt és nem gépeltünk el semmit.
  return Response.json({
    btcPrice: marketData.btcPrice,
    solPrice: marketData.solPrice,
    headlines: marketData.headlines,
    macro,
    technical,
    sentiment,
    decision,
  } satisfies BiasResponse)
}

----------------------------------------------------------------------