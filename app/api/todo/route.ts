/**
 * =====================================================
 * TODO API Route (/api/todo)
 * =====================================================
 *
 * MI AZ API ROUTE?
 * -----------------
 * Ez a fájl kezeli a /api/todo címre érkező HTTP kéréseket.
 * Next.js-ben a fájl neve határozza meg az URL-t:
 *   app/api/todo/route.ts  →  /api/todo
 *
 * MIT CSINÁL?
 * -----------
 * GET    → Visszaadja az összes TODO-t (csak auth felhasználóknak)
 * POST   → Új TODO létrehozása 
 * PUT    → Meglévő TODO módosítása (szöveg és/vagy done állapot)
 * DELETE → TODO törlése
 *
 * ⚠️ FIGYELEM: Ez a verzió még IN-MEMORY tárolóval dolgozik!
 *    A TODO-k elvesznek, ha a szerver újraindul.
 *    Ez a projekt gyakorlásnak való, nem éles használatra.
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import {
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
} from '@/lib/validations/todo'

// =====================================================
// TÍPUSOK
// =====================================================

/**
 * Egyetlen TODO elem szerkezete.
 * 
 * @property id   - Egyedi azonosító (számláló alapján)
 * @property text - A feladat szövege
 * @property done - Teljesítve / nem teljesítve
 */
type Task = {
  id: number
  text: string
  done: boolean
}

// =====================================================
// IN-MEMORY TÁROLÓ
// =====================================================

/**
 * ⚠️ MEGJEGYZÉS KEZDŐKNEK:
 * 
 * Normál esetben itt egy adatbázis (pl. Supabase) lenne.
 * Ez a változó a szerver memóriájában él:
 *   - Előny: gyors, egyszerű, nem kell hozzá adatbázis
 *   - Hátrány: ha a szerver újraindul (pl. npm run dev alatt
 *     bármikor mentéskor), a TODO-k eltűnnek!
 * 
 * Ezért hívjuk "gyakorló projektnek" 😄
 */
let todos: Task[] = []

/**
 * Automatikusan növekvő azonosító.
 * Minden új TODO kap egy új id-t: 0, 1, 2, 3...
 * 
 * Miért "let" és nem "const"?
 * Mert a counter++ módosítja az értékét (növeli eggyel).
 */
let counter = 0

// =====================================================
// SEGÉDFÜGGVÉNY: Auth ellenőrzés
// =====================================================

/**
 * Ellenőrzi, hogy a kérés bejelentkezett felhasználótól jön-e.
 * 
 * MIÉRT KELL SAJÁT FÜGGVÉNY?
 * --------------------------
 * Korábban minden endpoint-ban (GET, POST, PUT, DELETE)
 * külön le volt írva ugyanez a logika. Ha valamit változtatni
 * kellett, 4 helyen kellett módosítani.
 * 
 * Ez a DRY elv (Don't Repeat Yourself — ne ismételd magad).
 * 
 * @returns { session } - Ha van érvényes session
 * @returns { null } - Ha a felhasználó nincs bejelentkezve
 * @throws { Error } - Ha Supabase hiba történik
 */
async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('❌ [Todo API] Supabase session error:', error)
    return null
  }

  return session
}

// =====================================================
// GET /api/todo — Összes TODO lekérése
// =====================================================

/**
 * GET handler — csak auth felhasználóknak.
 * 
 * HOGYAN MŰKÖDIK?
 * 1. Ellenőrizzük a session-t
 * 2. Ha nincs session → 401 Unauthorized
 * 3. Ha van → visszaadjuk a TODO listát
 * 
 * @param req - A beérkező HTTP kérés (NextRequest)
 * @returns JSON válasz a TODO listával
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth ellenőrzés ──────────────────────────────
    // A segédfüggvényt használjuk, nem kézzel írjuk ki
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'A kéréshez bejelentkezés szükséges' },
        { status: 401 }
      )
    }

    // ── Sikeres válasz ───────────────────────────────
    // NextResponse.json() automatikusan beállítja
    // a Content-Type: application/json fejlécet
    return NextResponse.json({
      success: true,
      todos,
      count: todos.length,  // plusz infó: hány elem van
    })
  } catch (error) {
    // ── Váratlan hiba ────────────────────────────────
    // A try/catch elkap minden nem várt hibát:
    //   - JSON parse hiba
    //   - memória hiba
    //   - bármi más
    // 
    // Enélkül a Next.js 500-as hibát dobna, de nem
    // küldene szép JSON választ a frontendnek.
    console.error('❌ [Todo API] GET error:', error)
    return NextResponse.json(
      { error: 'Szerverhiba történt' },
      { status: 500 }
    )
  }
}

// =====================================================
// POST /api/todo — Új TODO létrehozása
// =====================================================

/**
 * POST handler — új feladat hozzáadása.
 * 
 * BEMENET (JSON body):
 *   { "text": "Bevásárolni" }
 * 
 * VÁLASZ:
 *   { success: true, todos: [...] }
 * 
 * VALIDÁCIÓ:
 *   - text: kötelező, string, nem lehet üres
 *   - A Zod séma a lib/validations/todo.ts-ben
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ellenőrzés ──────────────────────────────
    // UGYANAZ a függvény, mint a GET-ben!
    // Ez a DRY elv a gyakorlatban.
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'A kéréshez bejelentkezés szükséges' },
        { status: 401 }
      )
    }

    // ── Request body kiolvasása ─────────────────────
    // req.json() JSON-ná alakítja a kérés törzsét.
    // HA NEM JSON: a try/catch elkapja, szép hibaüzenettel.
    const body = await req.json()

    // ── Zod validáció ────────────────────────────────
    // safeParse() NEM dob hibát, hanem visszaad egy
    // objektumot: { success: true, data: ... } vagy
    // { success: false, error: ... }
    //
    // Miért safeParse és nem simán parse()?
    // Mert a sima parse() DOBJA a hibát (kivétel),
    // a safeParse() pedig eldönthetjük, mit csináljunk.
    const result = createTodoSchema.safeParse(body)

    if (!result.success) {
      // Ha a validáció hibát talál, a Zod részletes
      // hibainformációt ad. A flatten() egyszerűbb formátumba
      // alakítja, amit a frontend könnyen megjeleníthet.
      return NextResponse.json(
        {
          error: 'Érvénytelen bemeneti adatok',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // --- Innen már BIZTOS, hogy valid adat ---
    // A result.data TypeScript típusa: { text: string }
    // A Zod automatikusan megcsinálta a .trim()-et is!
    const { text } = result.data

    // ── Új TODO létrehozása ─────────────────────────
    // A counter++ először használja a counter aktuális értékét,
    // UTÁNA növeli meg eggyel.
    // Tehát az első TODO id = 0, a második id = 1, stb.
    const newTodo: Task = {
      id: counter++,
      text,
      done: false,  // új TODO mindig "nem teljesített"
    }

    todos.push(newTodo)

    // ── Sikeres válasz ───────────────────────────────
    // Visszaadjuk a teljes TODO listát, hogy a frontend
    // ne kelljen újabb GET kérést indítania.
    // Ez a "optimistic update" egyszerűbb változata.
    return NextResponse.json({
      success: true,
      todos,
      count: todos.length,
    })
  } catch (error) {
    console.error('❌ [Todo API] POST error:', error)

    // Ha a JSON.parse elszáll (pl. nem JSON a body)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'A kérés törzse nem érvényes JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Szerverhiba történt' },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT /api/todo — TODO módosítása
// =====================================================

/**
 * PUT handler — meglévő TODO frissítése.
 * 
 * BEMENET (JSON body):
 *   { "id": 0, "text": "Új szöveg" }      ← csak szöveg
 *   { "id": 0, "done": true }              ← csak állapot
 *   { "id": 0, "text": "...", "done": true } ← mindkettő
 * 
 * VALIDÁCIÓ:
 *   - id: kötelező, szám, pozitív
 *   - text: opcionális, string, nem üres
 *   - done: opcionális, boolean
 */
export async function PUT(req: NextRequest) {
  try {
    // ── Auth ellenőrzés ──────────────────────────────
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'A kéréshez bejelentkezés szükséges' },
        { status: 401 }
      )
    }

    // ── Body kiolvasása ─────────────────────────────
    const body = await req.json()

    // ── Zod validáció ────────────────────────────────
    const result = updateTodoSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Érvénytelen bemeneti adatok',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { id, text, done } = result.data

    // ── TODO megkeresése ─────────────────────────────
    // findIndex() végigmegy a tömbön, és visszaadja
    // az első elem indexét, ahol a feltétel igaz.
    // Ha nincs ilyen elem, -1-et ad vissza.
    const index = todos.findIndex((todo) => todo.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: `Nem található TODO a következő ID-val: ${id}` },
        { status: 404 }
      )
    }

    // ── Módosítás ────────────────────────────────────
    // A text !== undefined ellenőrzés azért kell, mert
    // a text mező opcionális. Ha nem küldte a frontend,
    // akkor nem változtatjuk meg.
    //
    // Miért !== undefined és nem simán if(text)?
    // Mert a "text"-ként üres string "" is lehet, ami
    // falsy, de ha a Zod átengedte, akkor valid.
    if (text !== undefined) {
      todos[index].text = text
    }

    if (done !== undefined) {
      todos[index].done = done
    }

    return NextResponse.json({
      success: true,
      todos,
      count: todos.length,
    })
  } catch (error) {
    console.error('❌ [Todo API] PUT error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'A kérés törzse nem érvényes JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Szerverhiba történt' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE /api/todo — TODO törlése
// =====================================================

/**
 * DELETE handler — TODO eltávolítása.
 * 
 * BEMENET (JSON body):
 *   { "id": 0 }
 * 
 * VALIDÁCIÓ:
 *   - id: kötelező, szám, pozitív
 * 
 * HOGYAN MŰKÖDIK?
 *   A filter() metódus létrehoz egy ÚJ tömböt, ami
 *   csak azokat az elemeket tartalmazza, amelyekre
 *   a feltétel igaz. Tehát ha id=0, akkor a kivételezett
 *   TODO kimarad, a többi marad.
 * 
 *   Az eredeti tömböt (todos) felülírjuk az újjal.
 */
export async function DELETE(req: NextRequest) {
  try {
    // ── Auth ellenőrzés ──────────────────────────────
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'A kéréshez bejelentkezés szükséges' },
        { status: 401 }
      )
    }

    // ── Body kiolvasása ─────────────────────────────
    const body = await req.json()

    // ── Zod validáció ────────────────────────────────
    const result = deleteTodoSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Érvénytelen bemeneti adatok',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { id } = result.data

    // ── Törlés előtti állapot mentése ─────────────────
    // Azért kell a hosszt ELŐRE elmenteni, mert a filter()
    // UTÁN már az új hosszt kapnánk.
    const initialLength = todos.length

    // ── Törlés ────────────────────────────────────────
    // filter() nem változtatja meg az eredeti tömböt,
    // ezért kell a todos = todos.filter(...)
    todos = todos.filter((todo) => todo.id !== id)

    // ── Ellenőrzés: történt-e változás? ──────────────
    // Ha a hossz nem változott, akkor nem találtuk a TODO-t
    // (vagy már eleve nem létezett)
    if (todos.length === initialLength) {
      return NextResponse.json(
        { error: `Nem található TODO a következő ID-val: ${id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      todos,
      count: todos.length,
    })
  } catch (error) {
    console.error('❌ [Todo API] DELETE error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'A kérés törzse nem érvényes JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Szerverhiba történt' },
      { status: 500 }
    )
  }
}