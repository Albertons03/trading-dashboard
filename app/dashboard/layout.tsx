'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNav } from '@/components/dashboard/top-nav'
import { getCurrentUser } from '@/lib/actions/auth'

// User típus — csak amit megjelenítünk
type DashboardUser = {
  email: string
  full_name?: string | null
} | null

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // user state: null = még tölt, object = betöltve
  // Ez az adat "lefelé folyik" a gyerek komponensekbe propson keresztül
  const [user, setUser] = useState<DashboardUser>(null)

  // useEffect: mountkor egyszer fut le
  // Feladata: lekérni ki van bejelentkezve
  useEffect(() => {
    const loadUser = async () => {
      // getCurrentUser() itt közvetlenül null-t VAGY a profile objektumot adja vissza
      // (nem { success, user } wrapper — ez project-specifikus különbség!)
      const profile = await getCurrentUser()

      if (!profile) {
        router.push('/login')
        return
      }

      // profile.email és profile.full_name a users táblából jön
      setUser({
        email: profile.email ?? '',
        full_name: profile.full_name ?? null,
      })
    }

    loadUser()
  }, [router])  // router stabil referencia, nem okoz infinite loop

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      {/* Sidebar — appName propot kap, nem függ a user-től */}
      <Sidebar appName="Practice App for Dev" />

      {/* Jobb oldal */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TopNav — user propot kap (lehet null amíg tölt) */}
        <TopNav user={user} />

        {/* children = az aktuális page.tsx */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}
