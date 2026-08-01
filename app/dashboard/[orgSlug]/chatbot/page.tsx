'use client'

// Client Component — mert kell:
// - useState: üzenetek listája, input értéke, loading flag
// - useRef: auto-scroll az utolsó üzenethez
// Még nincs API hívás — a "bot válasz" statikus szöveg (9. lépésben cseréljük ki)

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Send } from 'lucide-react'

// Egy üzenet típusa
type Message = {
  id: string           // egyedi azonosító (Date.now() alapú)
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Segédfüggvény: egyedi id generálás
const genId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export default function ChatbotPage() {
  // useParams: Client Componentben így olvassuk a route paramétert
  // (Server Componentben await params props-ból jött — itt useParams hook kell)
  const params = useParams()
  const orgSlug = params.orgSlug as string

  // ── STATE ─────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    // Kezdő üzenet — mindig ott van
    {
      id: genId(),
      role: 'assistant',
      content: `Szia! Ez a(z) "${orgSlug}" chatbot. Írj valamit — az üzenet az /api/chat route-on keresztül a chat_messages táblába kerül.`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')       // input mező értéke
  const [isLoading, setIsLoading] = useState(false)  // küldés közben true

  // useRef: DOM elemre mutató referencia — nem okoz rerenderelést
  // Arra használjuk, hogy az utolsó üzenethez scrolloljunk
  const bottomRef = useRef<HTMLDivElement>(null)

  // useEffect: minden messages változáskor lefut → automatikus scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── ÜZENET KÜLDÉS ─────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: genId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    // Felhasználó üzenete azonnal megjelenik (optimistic update)
    // Nem várunk az API-ra — azonnal mutatjuk, közben küldünk
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Valódi API hívás a meglévő /api/chat route-ra
      // POST → elmenti a chat_messages táblába és visszaad egy assistantMessage-t
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!response.ok) {
        // HTTP hiba (401, 500 stb.) → hibaüzenet a chatben
        const errData = await response.json()
        throw new Error(errData.error ?? `HTTP ${response.status}`)
      }

      // A route visszaadja: { id, content, assistantMessage, created_at, ... }
      const data = await response.json()

      const botMessage: Message = {
        id: genId(),
        role: 'assistant',
        // assistantMessage az API válasz szövege
        content: data.assistantMessage,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, botMessage])

    } catch (err) {
      // Hálózati hiba vagy API hiba → hibaüzenet jelenik meg a chatben
      const errorMessage: Message = {
        id: genId(),
        role: 'assistant',
        content: `Hiba: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      // finally: mindig lefut, akár siker, akár hiba
      setIsLoading(false)
    }
  }

  // Enter billentyű kezelés
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">

      {/* Fejléc */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Chatbot</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          POST /api/chat → chat_messages tábla → assistantMessage válasz
        </p>
      </div>

      {/* Üzenetek területe — flex-1 = kitölti a maradék helyet */}
      <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              {msg.role === 'user' ? 'U' : 'AI'}
            </div>

            {/* Buborék */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'        // user: kék, jobb oldal
                : 'bg-gray-800 text-gray-200 rounded-tl-sm'    // bot: szürke, bal oldal
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {msg.timestamp.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator — isLoading state alapján jelenik meg */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              {/* Három pont animáció */}
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll célpont — ide scrollozunk új üzenet után */}
        <div ref={bottomRef} />
      </div>

      {/* Input sor */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Írj üzenetet... (Enter = küld)"
          disabled={isLoading}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
        >
          <Send size={18} />
        </button>
      </div>

    </div>
  )
}
