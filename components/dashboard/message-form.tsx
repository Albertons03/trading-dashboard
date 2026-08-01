'use client'

// Client Component — kell: useState (input érték), useRouter (refresh)
// A szülő (dashboard/page.tsx) Server Component marad
// Ez a minta: Server Component rendereli az adatot, Client Component kezeli az interakciót

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MessageForm() {
  const router = useRouter()

  // Két state: az input mező értéke + loading flag
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

   async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()                    // megakadályozza az oldal újratöltést
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // POST /api/chat — a már meglévő API route-ot hívjuk
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? 'Hiba történt')
        return
      }

      // Sikeres küldés után:
      setContent('')        // input kiürítése

      // router.refresh() → Next.js újrafuttatja a Server Componentt
      // Ez nem oldal újratöltés — csak az adatlekérés fut újra a szerveren
      // → a messages lista frissül az új üzenettel
      router.refresh()

    } catch {
      setError('Hálózati hiba, próbáld újra.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="font-semibold text-white mb-3">Új üzenet küldése</h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Controlled input: value = state, onChange = state frissítés */}
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Írj egy üzenetet..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 bg-blue-400 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
        >
          {isLoading ? 'Küldés...' : 'Küld'}
        </button>
      </form>

      {/* Hibaüzenet — csak ha van error state */}
      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  )
}
