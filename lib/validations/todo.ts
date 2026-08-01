/**
 * =====================================================
 * TODO Validation Schemas (Zod)
 * =====================================================
 *
 * MIÉRT KELL ZOD?
 * ---------------
 * A request.body JSON-ból jön a böngészőből.
 * Egy támadó bármit küldhet — nem bízhatunk meg a bejövő adatban.
 * 
 * Zod segítségével:
 *   ✅ biztosítjuk, hogy a mezők léteznek
 *   ✅ biztosítjuk a helyes típust (string, boolean, number)
 *   ✅ automatikus hibaüzeneteket kapunk
 *   ✅ TypeScript típust is generál belőle (z.infer)
 *
 * HASZNÁLAT:
 *   const result = createTodoSchema.safeParse(body)
 *   if (!result.success) {
 *     return Response.json({ error: result.error.flatten() }, { status: 400 })
 *   }
 *   // innentől a result.data tuti valid
 * =====================================================
 */

import { z } from 'zod'

// ─────────────────────────────────────────────────────
// Séma: új TODO létrehozása (POST /api/todo)
// ─────────────────────────────────────────────────────
// A .trim() levágja a whitespace-t az elejéről és végéről
// A .min(1) garantálja, hogy nem üres a szöveg
export const createTodoSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'A todo szövege nem lehet üres'),
})

// ─────────────────────────────────────────────────────
// Séma: TODO módosítása (PUT /api/todo)
// ─────────────────────────────────────────────────────
// Itt minden mező OPCIONÁLIS (partial), mert előfordulhat,
// hogy csak a "done" flag-et állítjuk, és a text marad.
// Kivétel: az "id" kötelező — ezzel azonosítjuk a módosítandó elemet.
export const updateTodoSchema = z.object({
  id: z.number().int('Az ID csak egész szám lehet').positive('Az ID nem lehet negatív'),
  text: z
    .string()
    .trim()
    .min(1, 'A todo szövege nem lehet üres')
    .optional(),               // ← opcionális: lehet, hogy nem változik a szöveg
  done: z
    .boolean()
    .optional(),               // ← opcionális: lehet, hogy csak a szöveget módosítjuk
})

// ─────────────────────────────────────────────────────
// Séma: TODO törlése (DELETE /api/todo)
// ─────────────────────────────────────────────────────
export const deleteTodoSchema = z.object({
  id: z.number().int('Az ID csak egész szám lehet').positive('Az ID nem lehet negatív'),
})

// ─────────────────────────────────────────────────────
// TypeScript típusok — automatikusan a sémákból
// ─────────────────────────────────────────────────────
// A z.infer<typeof schema> kiolvassa a séma szerkezetét,
// és legenerálja a TypeScript típust.
// Előny: ha változik a séma, a típus automatikusan követi.
export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
export type DeleteTodoInput = z.infer<typeof deleteTodoSchema>