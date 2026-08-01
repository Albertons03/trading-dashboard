/**
 * =====================================================
 * Todo oldal (/todo)
 * =====================================================
 *
 * 'use client' direktíva:
 * ------------------------
 * Kell a useState, useEffect és fetch használatához.
 * Nélküle ez Server Component lenne, ahol ezek
 * (state, életciklus, böngésző API) NEM használhatók.
 *
 * Két fő rész:
 *   1. API hívások (fetch) — backend kommunikáció
 *   2. UI render — amit a felhasználó lát
 *
 * RÉSZLETES MAGYARÁZAT minden függvénynél!
 * =====================================================
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

// ─────────────────────────────────────────────────────
// TÍPUSOK
// ─────────────────────────────────────────────────────

/**
 * Egy TODO elem szerkezete.
 * Ugyanaz, mint a backend-en (api/todo/route.ts).
 * 
 * Gyakorlatban: egy shared típusfájlból jönne (lib/types.ts),
 * hogy ne kelljen kétszer leírni.
 */
type Task = {
  id: number
  text: string
  done: boolean
}

/**
 * A backend /api/todo által visszaadott válasz formátuma.
 * 
 * Segít a TypeScript-nek:
 *   - tudja, milyen mezőkre számíthatunk
 *   - hibát jelez, ha rossz mezőt próbálunk olvasni
 */
type TodoApiResponse = {
  success: boolean
  todos: Task[]
  count: number
  error?: string
  details?: Record<string, string[]>
}

// =====================================================
// KOMPONENS
// =====================================================

export default function TodosPage() {
  // ── State változók ───────────────────────────────
  // A React state jelenti a "komponens memóriáját".
  // Ha változik, a komponens újrarajzolódik (re-render).
  
  const [todos, setTodos] = useState<Task[]>([])             // a TODO lista
  const [newText, setNewText] = useState('')                  // az input mező értéke
  const [editingId, setEditingId] = useState<number | null>(null)  // melyik TODO-t szerkesztjük
  const [editText, setEditText] = useState('')                // szerkesztés alatti szöveg
  const [loading, setLoading] = useState(true)                // adatok betöltése?
  const [error, setError] = useState<string | null>(null)     // hibaüzenet (ha van)

  // ── TODO-k betöltése az oldal megnyitásakor ──────
  /**
   * useEffect: akkor fut le, amikor a komponens először
   * megjelenik a képernyőn.
   * 
   * A [] (üres tömb) a függőségi lista. Jelentése:
   * "ezt csak egyszer futtasd le, az első render után".
   * 
   * Ha nem lenne ott a [], minden egyes renderkor lefutna
   * → végtelen hurok!
   */
  useEffect(() => {
    fetchTodos()
  }, [])

  // ── Adatok lekérése a backendről ─────────────────
  /**
   * useCallback: megjegyzi a függvény referenciáját.
   * 
   * MIÉRT KELL?
   * -----------
   * useCallback nélkül minden renderkor ÚJ függvény
   * jönne létre. Ha ez a függvény egy useEffect
   * függőségi listájában lenne, az végtelen ciklust okozna.
   * 
   * Most: a [] miatt egyszer jön létre, soha nem változik.
   */
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)    // mutatjuk a loading spinner-t
      setError(null)      // előző hiba törlése

      const res = await fetch('/api/todo')
      const data: TodoApiResponse = await res.json()

      // Ellenőrizzük a HTTP státuszt ÉS a success mezőt is
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nem sikerült betölteni a TODO-kat')
      }

      setTodos(data.todos)  // frissítjük a listát
    } catch (err) {
      // Hiba esetén: eltároljuk, a UI megjeleníti
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba')
    } finally {
      /**
       * finally: MINDIG lefut, akár siker, akár hiba.
       * Ezért jó hely a loading kikapcsolására.
       * 
       * Ha a try-ban lenne (setLoading(false) a sikeres ág végén),
       * akkor hiba esetén a felhasználó örökké a "Betöltés..."
       * üzenetet látná.
       */
      setLoading(false)
    }
  }, [])  // üres tömb = egyszer jön létre

  // ── Új TODO hozzáadása ─────────────────────────
  /**
   * Meghívódik, amikor a felhasználó elküldi a formot.
   * 
   * e.preventDefault():
   *   A form alapértelmezetten újratölti az oldalt.
   *   Ezt akadályozzuk meg — mi fetch()-el küldjük el az adatot.
   */
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newText.trim()) return

    try {
      setError(null)

      const res = await fetch('/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim() }),
      })

      const data: TodoApiResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nem sikerült hozzáadni')
      }

      // Sikeres hozzáadás: frissítjük a listát és ürítjük az inputot
      setTodos(data.todos)
      setNewText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba')
    }
  }

  // ── TODO állapotának váltása (done / not done) ───
  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    try {
      setError(null)

      const res = await fetch('/api/todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, done: !todo.done }),
      })

      const data: TodoApiResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nem sikerült módosítani')
      }

      setTodos(data.todos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba')
    }
  }

  // ── Szerkesztési mód bekapcsolása ──────────────
  /**
   * Amikor a ceruza ikonra kattintunk:
   *   - eltároljuk, melyik TODO-t szerkesztjük (editingId)
   *   - az aktuális szöveget betöltjük az editText-be
   * 
   * Ekkor a UI átvált: a szövegből input mező lesz.
   */
  const startEditing = (todo: Task) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  // ── Szerkesztés mentése ────────────────────────
  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return

    try {
      setError(null)

      const res = await fetch('/api/todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, text: editText.trim() }),
      })

      const data: TodoApiResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nem sikerült menteni')
      }

      setTodos(data.todos)
      setEditingId(null)  // szerkesztési mód kikapcsolása
      setEditText('')     // szerkesztési input ürítése
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba')
    }
  }

  // ── TODO törlése ──────────────────────────────
  /**
   * confirm(): böngésző natív megerősítő dialógus.
   * Ha a felhasználó "Mégse" → false, a függvény kilép.
   * Ha "OK" → true, folytatja a törlést.
   */
  const deleteTodo = async (id: number) => {
    if (!confirm('Biztosan törlöd ezt a teendőt?')) return

    try {
      setError(null)

      const res = await fetch('/api/todo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data: TodoApiResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nem sikerült törölni')
      }

      setTodos(data.todos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba')
    }
  }

  // =====================================================
  // UI RENDER
  // =====================================================

  // ── Loading állapot ────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-600">
        Betöltés...
      </div>
    )
  }

  // ── Hiba állapot (nincs adat, csak hiba) ───────
  if (error && todos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center">
              <p className="text-red-600 text-lg mb-4">❌ {error}</p>
              <button
                onClick={fetchTodos}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all"
              >
                Újrapróbálkozás
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Normál állapot ─────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            Teendőim
          </h1>

          {/* ── Új TODO form ────────────────────────── */}
          <form onSubmit={addTodo} className="flex gap-3 mb-10">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Mit kell megcsinálni?"
              className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all active:scale-95"
            >
              Hozzáadás
            </button>
          </form>

          {/* ── Hibaüzenet ──────────────────────────── */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ── TODO lista ──────────────────────────── */}
          <div className="space-y-3">
            {todos.length === 0 ? (
              <p className="text-center text-gray-500 py-16 text-lg">
                Még nincs teendő. Adj hozzá egyet!
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-6 py-4 hover:shadow-md transition-all"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-6 h-6 accent-blue-600 cursor-pointer"
                  />

                  {/* Szöveg vagy szerkesztő input */}
                  {editingId === todo.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      className="flex-1 px-3 py-2 border border-blue-400 rounded-lg focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => toggleTodo(todo.id)}
                      className={`flex-1 text-lg cursor-pointer ${
                        todo.done
                          ? 'line-through text-gray-500'
                          : 'text-gray-800'
                      }`}
                    >
                      {todo.text}
                    </span>
                  )}

                  {/* Művelet gombok (ceruza + kuka) */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(todo)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Szerkesztés"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Törlés"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}