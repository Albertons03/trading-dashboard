// NINCS 'use client' → ez Server Component
// Következmény: nincs useState, nincs useEffect, nincs fetch()
// Helyette: async/await közvetlenül a komponensben — a szerveren fut

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { MessageForm } from '@/components/dashboard/message-form'

// Típus a chat_messages tábla egy sorához
type ChatMessage = {
  id: string
  user_id: string
  content: string
  created_at: string
}

// async komponens → Next.js várja míg lefut, csak utána küldi a HTML-t
export default async function DashboardPage() {

  // createServerSupabaseClient: cookie-ból olvassa a sessiont (szerveren)
  const supabase = await createServerSupabaseClient()

  // Auth ellenőrzés — szerveren, nem a böngészőben
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Supabase lekérdezés — közvetlenül, nem fetch('/api/...')-en át
  // Ez csak a bejelentkezett user üzeneteit adja vissza (user_id filter)
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)          // csak a saját üzenetek
    .order('created_at', { ascending: false })  // legújabb elöl
    .limit(10)                        // max 10 db

  // Ha adatbázis hiba → egyszerű hibaüzenet (nem redirect)
  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
        Hiba az üzenetek betöltésekor: {error.message}
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────
  // Idáig minden a szerveren futott. Amit visszaadunk → HTML lesz.
  return (
    <div className="space-y-6">

      {/* Üdvözlő fejléc */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 mt-1">Bejelentkezve: {user.email}</p>
      </div>

      {/* Stat kártya — hány üzenet van */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Üzenetek száma</p>
          <p className="text-3xl font-bold text-white mt-1">
            {messages?.length ?? 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">User ID</p>
          <p className="text-xs font-mono text-gray-300 mt-1 truncate">
            {user.id}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Legutóbbi üzenet</p>
          <p className="text-sm text-gray-300 mt-1">
            {messages?.[0]
              ? new Date(messages[0].created_at).toLocaleString('hu-HU')
              : '–'}
          </p>
        </div>
      </div>

      {/* Org navigáció — 7. lépés: valódi slug kell a Supabase organizations táblából */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <p className="text-blue-400 text-sm mb-1">Organization oldalak</p>
        <p className="text-gray-600 text-xs mb-3">
          Írd be a saját org slug-odat az URL-be: /dashboard/[a-te-slug-od]
        </p>
        <div className="flex gap-2 flex-wrap">
          {/* Ezeket cseréld le a valódi org slug-jaidra (Supabase → organizations tábla → slug oszlop) */}
          {['albertons'].map((slug) => ( 
            <a
              key={slug}
              href={`/dashboard/${slug}`}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 rounded-md text-sm transition-colors font-mono"
            >
              /dashboard/{slug}
            </a>
          ))}
        </div>
      </div>

      {/* MessageForm — Client Component a Server Component belsejében
          Ez teljesen normális: a szülő szerver, a gyerek lehet kliens
          A form küldés után router.refresh() → a szülő újrafut → frissül a lista */}
      <MessageForm />

      {/* Üzenetek lista */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Legutóbbi üzenetek</h3>
          <p className="text-green-400 text-sm mt-0.5">
            chat_messages tábla — szerveren lekérve, nem fetch()-csel
          </p>
        </div>

        {messages && messages.length > 0 ? (
          <ul className="divide-y divide-gray-800">
            {messages.map((msg: ChatMessage) => (
              <li key={msg.id} className="p-4 flex items-start gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  {/* Üzenet szöveg */}
                  <p className="text-gray-200 text-sm">{msg.content}</p>
                  {/* Időbélyeg */}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(msg.created_at).toLocaleString('hu-HU')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          // Üres állapot — ha nincs még üzenet
          <div className="p-8 text-center text-gray-500">
            <p>Még nincs üzenet.</p>
            <a href="/chat" className="text-blue-400 hover:underline text-sm mt-2 inline-block">
              Írj egyet a /chat oldalon →
            </a>
          </div>
        )}
      </div>

    </div>
  )
}
