// Server Component — params.orgSlug alapján lekérjük az org adatait Supabase-ből
// Ha nincs ilyen org → hibaüzenet (nem redirect, hogy lássuk mi történik)

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Lokális típus — a practice projekt Database típusában nincs organizations definiálva
// Ezért kézzel írjuk le a tábla releváns mezőit
// (A főprojektben ez lib/supabase/types.ts-ben van megoldva generált típusokkal)
type Org = {
  id: string
  name: string
  slug: string
  description: string | null
  subscription_tier: string
  created_at: string
}

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const supabase = await createServerSupabaseClient()

  // Auth ellenőrzés — ha nincs bejelentkezve, login oldalra
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // organizations tábla lekérés slug alapján
  // .eq('slug', orgSlug) → WHERE slug = 'my-store'
  // .single() → pontosan 1 sort vár (ha nincs találat → data = null)
  // as any → kikerüljük a TypeScript panaszát a Database típus hiánya miatt
  // A valódi projektben ez nem kell mert ott a Database típus tartalmazza az organizations táblát
  const { data: org, error } = await (supabase as any)
    .from('organizations')
    .select('id, name, slug, description, subscription_tier, created_at')
    .eq('slug', orgSlug)
    .single() as { data: Org | null, error: any }

  // Ha nincs ilyen slug a táblában
  if (error || !org) {
    return (
      <div className="space-y-4">
        <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-6">
          <h3 className="text-red-400 font-semibold text-lg">Org nem található</h3>
          <p className="text-red-300/70 text-sm mt-1">
            Nincs <code className="bg-red-900/40 px-1.5 py-0.5 rounded">{orgSlug}</code> slug-gal rendelkező organization a Supabase-ben.
          </p>
          <p className="text-gray-500 text-xs mt-3">
            Supabase hiba: {error?.message ?? 'Nem található'}
          </p>
        </div>

        {/* Segítség: hova navigáljon */}
        <Link
          href="/dashboard"
          className="inline-block text-sm text-blue-400 hover:underline"
        >
          ← Vissza a dashboardra
        </Link>
      </div>
    )
  }

  // ── Org megtalálva → megjelenítjük ─────────────────────────
  return (
    <div className="space-y-6">

      {/* Fejléc — valódi org.name az adatbázisból */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{org.name}</h2>
          {org.description && (
            <p className="text-gray-400 mt-1">{org.description}</p>
          )}
        </div>
        {/* Subscription badge */}
        <span className="px-3 py-1 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs rounded-full">
          {org.subscription_tier}
        </span>
      </div>

      {/* Adatok kártyákban */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Org ID</p>
          <p className="text-xs font-mono text-gray-300 truncate">{org.id}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Slug</p>
          {/* Ez az amit az URL-ből olvastunk — egyezik a params.orgSlug-gal */}
          <p className="text-white font-mono">{org.slug}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Létrehozva</p>
          <p className="text-white text-sm">
            {new Date(org.created_at).toLocaleDateString('hu-HU')}
          </p>
        </div>

      </div>

      {/* Magyarázó box */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm space-y-2">
        <p className="text-gray-300 font-medium">Hogyan kerül ide az adat?</p>
        <div className="font-mono text-xs space-y-1">
          <p className="text-gray-500">
            URL: <span className="text-blue-400">/dashboard/{orgSlug}</span>
          </p>
          <p className="text-gray-500">
            params: <span className="text-green-400">{'{ orgSlug: "' + orgSlug + '" }'}</span>
          </p>
          <p className="text-gray-500">
            query: <span className="text-yellow-400">.eq('slug', '{orgSlug}')</span>
          </p>
          <p className="text-gray-500">
            result: <span className="text-white">org.name = "{org.name}"</span>
          </p>
        </div>
      </div>

      {/* Link a chatbot oldalra */}
      <Link
        href={`/dashboard/${orgSlug}/chatbot`}
        className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-blue-700 rounded-lg p-4 transition-colors group"
      >
        <div>
          <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
            💬 Chatbot tesztelése
          </p>
          <p className="text-gray-500 text-sm mt-0.5">/dashboard/{orgSlug}/chatbot</p>
        </div>
        <span className="text-gray-600 group-hover:text-blue-400 transition-colors">→</span>
      </Link>

    </div>
  )
}
