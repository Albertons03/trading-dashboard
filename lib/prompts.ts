/**
 * =====================================================
 * AI Prompt Template-ek
 * =====================================================
 *
 * MIT CSINÁL?
 * -----------
 *   - Összegyűjti az összes OpenAI promptot, amit a bias API használ
 *   - Minden prompt egy függvény, ami a bemenő adatokból építi fel a szöveget
 *
 * MIÉRT KÜLÖN FÁJL?
 * -----------------
 *   - A route.ts-ben 4 prompt volt, ami elvonta a figyelmet a fő logikáról
 *   - Könnyebb módosítani a promptokat anélkül, hogy a route-hoz nyúlnánk
 *   - Új prompt hozzáadása = új függvény, nem kell a route-ot bővíteni
 * =====================================================
 */

import type { MarketData } from './market-data'

// =====================================================
// 1. Makro elemző prompt
// =====================================================

/**
 * Megkérdezi az AI-t, hogy milyen a makro környezet a kereskedéshez.
 * 
 * Bemenet: BTC és SOL árfolyamok
 * Kimenet: rövid makro elemzés (risk-on vs risk-off)
 */
export function buildMacroPrompt(market: Pick<MarketData, 'btcPrice' | 'solPrice'>): string {
  return `
You are a macro analyst for crypto trading.

Current market:
- BTC: ${market.btcPrice}
- SOL: ${market.solPrice}

Based on general market logic, write a short macro view for intraday trading.
Focus on risk-on vs risk-off conditions.

Be concise, practical, and 15m-intraday aware.
`.trim()
}

// =====================================================
// 2. Technikai elemző prompt
// =====================================================

/**
 * Megkérdezi az AI-t, hogy milyen a technikai kép.
 * 
 * Bemenet: BTC és SOL árfolyamok
 * Kimenet: rövid technikai elemzés (support/resistance, struktúra)
 */
export function buildTechnicalPrompt(market: Pick<MarketData, 'btcPrice' | 'solPrice'>): string {
  return `
You are a technical analyst.

Current market:
- BTC: ${market.btcPrice}
- SOL: ${market.solPrice}

Give a short intraday technical view:
- BTC support
- BTC resistance
- short-term structure
- possible intraday scenarios

Be concise and practical for 15m trading.
`.trim()
}

// =====================================================
// 3. Sentiment elemző prompt
// =====================================================

/**
 * Megkérdezi az AI-t, hogy milyen a piaci hangulat.
 *
 * Bemenet: headlines
 * Kimenet: részletes, struktúrált JSON elemzés minden címre
 */
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
- First compare every headline with all other headlines before assigning scores.
- Do not treat all headlines as equally important.
- Score direct BTC relevance separately from broader crypto news.
- Distinguish direct BTC catalysts from broader crypto headlines.
- Do not invent missing context.
- Reduce confidence for ambiguous headlines.
- Distinguish intraday, short-term and medium-term impact.

Duplicate handling:
- Headlines are duplicates when they describe the same underlying event.
- Treat them as duplicates even if:
  - the wording is different,
  - they come from different publishers,
  - one is a follow-up report,
  - the reported loss amount or affected-address count has changed,
  - one headline describes the incident and another describes the market reaction to it.
- Every headline describing the same underlying event must receive the same descriptive duplicateGroupId.
- Use a readable identifier such as "coldcard-exploit-2026", not a number such as "1".
- Only the most complete or most recent headline in a duplicate group may have isDuplicate: false.
- All other headlines in that group must have isDuplicate: true.
- Headlines that do not belong to a duplicate group must have duplicateGroupId: null and isDuplicate: false.
- Do not count duplicate headlines twice when producing the summary or overall interpretation.

Output rules:
- Return valid JSON only.
- Do not include markdown or text outside the JSON.
- Do not provide personalized financial advice.

The overallSentiment field must be exactly one of these values:

"STRONGLY_BEARISH"
"BEARISH"
"SLIGHTLY_BEARISH"
"NEUTRAL"
"SLIGHTLY_BULLISH"
"BULLISH"
"STRONGLY_BULLISH"

Never use values such as:
"NEGATIVE"
"POSITIVE"
"MIXED"
"VERY_BEARISH"
"VERY_BULLISH"

Headlines:
${headlines.map((headline, index) => `${index + 1}. ${headline}`).join('\n')}
`.trim()
}

// =====================================================
// 4. Döntéshozó prompt (összegzi a 3 elemzést)
// =====================================================

/**
 * A végső döntéshozó agent promptja.
 * 
 * Bemenet: az összes eddigi adat + a 3 agent elemzése
 * Kimenet: JSON formátumú trade döntés
 * 
 * ⚠️ response_format: { type: "json_object" } miatt az OpenAI
 * garantáltan JSON-t ad vissza, nem kell stringből kiparsolni.
 */
export function buildDecisionPrompt(
  market: Pick<MarketData, "btcPrice" | "solPrice">,
  macro: string,
  technical: string,
  sentiment: string
): string {
  return `
You are the final trading decision agent for a Bitcoin-focused trading dashboard.

Your task is to combine:
- current market prices,
- macro analysis,
- technical analysis,
- structured news sentiment,

and return a disciplined trade decision.

Current BTC price: ${market.btcPrice}
Current SOL price: ${market.solPrice}

Macro analysis:
${macro}

Technical analysis:
${technical}

Sentiment analysis:
${sentiment}

Important decision rules:

1. Directional bias and trade readiness are not the same thing.
2. A LONG bias does not automatically mean a long trade is ready.
3. A SHORT bias does not automatically mean a short trade is ready.
4. Use WAIT_FOR_CONFIRMATION when the setup direction is clear but the required breakout, breakdown or candle confirmation has not yet occurred.
5. Use LONG_READY only when the required bullish confirmation has already happened.
6. Use SHORT_READY only when the required bearish confirmation has already happened.
7. Use NO_TRADE when the signals are conflicting, weak or unreliable.
8. Never invent confirmation levels that are unsupported by the technical analysis.
9. Never invent unavailable market data.
10. The recommended action must describe what should happen next, not merely repeat the bias.
11. Entry, stop loss and target must refer to BTC prices only.
12. If action is NO_TRADE:
   - confirmation may be null,
   - invalidation may be null,
   - plannedEntry must be null,
   - stopLoss must be null,
   - target must be null.
13. If action is WAIT_FOR_CONFIRMATION:
   - confirmation must not be null,
   - plannedEntry may represent the expected entry area after confirmation.
14. Confidence must be between 0 and 100.
15. Return valid JSON only.
16. Do not include markdown or explanation outside the JSON.
17. Do not provide personalized financial advice.

Consistency rules:

- confirmation.price must be the exact confirmation level referenced in confirmation.condition.
- recommendedAction must reference the same confirmation.price.
- plannedEntry must not be below the confirmation level for a LONG setup.
- plannedEntry must not be above the confirmation level for a SHORT setup.
- target must be above plannedEntry for LONG setups.
- target must be below plannedEntry for SHORT setups.
- stopLoss must be below plannedEntry for LONG setups.
- stopLoss must be above plannedEntry for SHORT setups.
- If these conditions cannot be satisfied, return NO_TRADE.

Allowed values:

bias:
"LONG"
"SHORT"
"NEUTRAL"

action:
"LONG_READY"
"SHORT_READY"
"WAIT_FOR_CONFIRMATION"
"NO_TRADE"

tradeQuality:
"A"
"B"
"C"

timeframe:
"15M"
"1H"
"4H"

direction:
"ABOVE"
"BELOW"

Return exactly this JSON structure:

{
  "bias": "LONG",
  "confidence": 0,
  "tradeQuality": "B",
  "action": "WAIT_FOR_CONFIRMATION",
  "confirmation": {
    "timeframe": "15M",
    "direction": "ABOVE",
    "price": 0,
    "condition": ""
  },
  "invalidation": {
    "timeframe": "4H",
    "direction": "BELOW",
    "price": 0,
    "condition": ""
  },
  "plannedEntry": 0,
  "stopLoss": 0,
  "target": 0,
  "recommendedAction": "",
  "reasoning": [
    ""
  ]
}
`.trim();
}