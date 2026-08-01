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
 * Bemenet: Fear & Greed Index + hírek
 * Kimenet: rövid sentiment elemzés (bullish/bearish/mixed)
 */
export function buildSentimentPrompt(
  headlines: string[]
): string {
  return `
You are a crypto sentiment analyst.


Current real-time news headlines:
${headlines.join('\n')}


Tasks:
1. Analyze the overall market narrative from these headlines.
2. Identify major risks or catalysts (e.g., regulatory news, macro events, hack reports, institutional inflows).
3. Determine the immediate intraday trading sentiment: Bullish, Bearish, or Mixed.

Be concise, clear, and direct. Focus strictly on market impact.
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
  market: Pick<MarketData, 'btcPrice' | 'solPrice'>,
  macro: string,
  technical: string,
  sentiment: string
): string {
  return `
You are the final trading decision agent.

Current BTC price: ${market.btcPrice}
Current SOL price: ${market.solPrice}

Macro agent:
${macro}

Technical agent:
${technical}

Sentiment agent:
${sentiment}

Return a JSON object with this exact structure (no extra text, only JSON):
{
  "bias": "LONG" or "SHORT" or "NO TRADE",
  "confidence": number between 1-10,
  "quality": "A" or "B" or "C",
  "action": "VALID TRADE" or "NO TRADE",
  "entry": number (BTC price, e.g. 84200),
  "stopLoss": number (BTC price, e.g. 83500),
  "target": number (BTC price, e.g. 86000),
  "reason": "short explanation"
}

Be strict. If uncertain, set bias to "NO TRADE" and action to "NO TRADE".
`.trim()
}