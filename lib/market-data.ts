/**
 * =====================================================
 * Market Data API kliens
 * =====================================================
 *
 * MIT CSINÁL?
 * -----------
 *   - Lekéri a BTC és SOL árfolyamokat a CoinGecko-ról
 *   - Lekéri a Fear & Greed Index-et az alternative.me-ről
 *   - Lekéri a kripto híreket RSS-ből (delegálja a news.ts-nek)
 *
 * MIÉRT KÜLÖN FÁJL?
 * -----------------
 * A route.ts-ben 3-szor le volt írva ugyanaz a minta:
 *   const controller = new AbortController()
 *   const timeout = setTimeout(() => controller.abort(), 5000)
 *   const res = await fetch(url, { signal: controller.signal })
 *   clearTimeout(timeout)
 *
 * DRY elv: egy helyen van a timeout logika (fetchWithTimeout),
 * minden API hívás ezt használja.
 * =====================================================
 */

import { fetchRawHeadlines } from './news'

// =====================================================
// TÍPUSOK
// =====================================================



/** Piaci adatok — a három külső API összesített eredménye */
export type MarketData = {
  btcPrice: number
  solPrice: number
  headlines: string[]
}

// =====================================================
// SEGÉDFÜGGVÉNY: Fetch timeout-tal
// =====================================================

/**
 * Fetch wrapper, ami automatikusan időtúllépést kezel.
 * 
 * HOGYAN MŰKÖDIK?
 * ---------------
 *   AbortController: lehetővé teszi, hogy a fetch-et
 *   idő előtt megszakítsuk. A setTimeout 5 másodperc után
 *   meghívja a controller.abort()-ot, ami hibát dob a fetch-ben.
 * 
 * A try/catch elkapja ezt a hibát.
 * 
 * @param url - A lekérdezni kívánt URL
 * @param options - Továbbított fetch opciók (pl. headers)
 * @param timeoutMs - Időtúllépés ms-ben (alapértelmezett: 5000)
 * @returns A fetch Response objektuma
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    // finally: MINDIG lefut, akár siker, akár hiba.
    // Így biztos, hogy a timeout mindig törlődik.
    clearTimeout(timeoutId)
  }
}

// =====================================================
// 1. BTC / SOL árfolyam lekérése (CoinGecko)
// =====================================================

/**
 * CoinGecko API hívás a BTC és SOL árfolyamokért.
 * 
 * API végpont:
 *   GET https://api.coingecko.com/api/v3/simple/price
 *   ?ids=bitcoin,solana&vs_currencies=usd
 * 
 * Válasz formátuma:
 *   { "bitcoin": { "usd": 84200 }, "solana": { "usd": 145.50 } }
 * 
 * @returns { btcPrice, solPrice } - Az árfolyamok, vagy 0 ha hiba
 */
async function fetchPrices(): Promise<{ btcPrice: number; solPrice: number }> {
  try {
    const res = await fetchWithTimeout(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd'
    )
    const data = await res.json()

    return {
      btcPrice: data.bitcoin?.usd ?? 0,
      solPrice: data.solana?.usd ?? 0,
    }
  } catch (err) {
    console.error('❌ [MarketData] CoinGecko error:', err)
    return { btcPrice: 0, solPrice: 0 }
  }
}


// =====================================================
// 3. Hírek lekérése (RSS) — delegálja a news.ts-nek
// =====================================================

/**
 * Hírek betöltése a fetchRawHeadlines segítségével.
 * 
 * @returns Legfeljebb 15 headline, vagy placeholder szöveg
 */
async function fetchHeadlines(): Promise<string[]> {
  try {
    const raw = await fetchRawHeadlines()
    const sliced = raw.slice(0, 15)
    return sliced.length > 0
      ? sliced
      : ['No recent crypto news available']
  } catch (err) {
    console.error('❌ [MarketData] RSS news error:', err)
    return ['Could not fetch news']
  }
}

// =====================================================
// FŐ FÜGGVÉNY: Minden piaci adat lekérése egyszerre
// =====================================================

/**
 * Összes külső adat lekérése párhuzamosan.
 * 
 * MIÉRT KELL KÜLÖN FÜGGVÉNY?
 * ---------------------------
 * A route.ts-ben egymás után, 3 külön try/catch blokkban
 * voltak a hívások. Itt egyszerre indul minden (Promise.allSettled),
 * gyorsabb és átláthatóbb.
 * 
 * ⚠️ JAVÍTVA: Promise.allSettled — nem Promise.all!
 * 
 * Promise.all: ha az egyik hiba, az összes többi is elvész.
 * Promise.allSettled: minden lekérés lefut, a hibásakat
 * eldobjuk, a sikereseket megtartjuk.
 * 
 * Így ha a CoinGecko nem válaszol, a Fear&Greed és a hírek
 * még mindig megvannak.
 * 
 * @returns MarketData objektum az összes adattal
 */
export async function  fetchAllMarketData(): Promise<MarketData> {
  const [priceResult, headlinesResult] = await Promise.allSettled([
    fetchPrices(),
    fetchHeadlines(),
  ])

  return {
    btcPrice: priceResult.status === 'fulfilled' ? priceResult.value.btcPrice : 0,
    solPrice: priceResult.status === 'fulfilled' ? priceResult.value.solPrice : 0,
    headlines:
      headlinesResult.status === 'fulfilled'
        ? headlinesResult.value
        : ['Could not fetch news'],
  }
}

// =====================================================
// ELLENŐRZÉS: Van-e elegendő adat a folytatáshoz?
// =====================================================

/**
 * Ellenőrzi, hogy van-e minimum adat az AI elemzéshez.
 * 
 * Ha nincs BTC ár, nincs értelme az AI-t hívni.
 * 
 * @param data - A lekért MarketData
 * @returns true ha van BTC ár, false ha nincs
 */
export function hasValidMarketData(data: MarketData): boolean {
  return data.btcPrice > 0
}