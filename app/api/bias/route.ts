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
  const [macro, technical, sentiment] = await Promise.all([
    callAgent(buildMacroPrompt(marketData)),
    callAgent(buildTechnicalPrompt(marketData)),
    callAgent(buildSentimentPrompt( marketData.headlines)),
  ])



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