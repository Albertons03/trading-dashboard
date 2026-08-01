'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import { useState } from 'react'
import { LogOut, User } from 'lucide-react'

// ── PROPS ────────────────────────────────────────────────────
interface TopNavProps {
  // user lehet null: amíg a layout tölti, nem tudja átadni
  user: {
    email: string
    full_name?: string | null
  } | null
}

// Segédfüggvény: névből kezdőbetűk, pl. "John Doe" → "JD"
function getInitials(name?: string | null, email?: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email?.[0]?.toUpperCase() ?? '?'
}

// Segédfüggvény: URL-ből olvasható lapnév, pl. "/dashboard" → "Dashboard"
function getPageTitle(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

// ── KOMPONENS ────────────────────────────────────────────────
export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // isLoading: sign out közben spinner helyett disabled gomb
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    const result = await signOut()  // server action hívás
    if (result.success) {
      router.push('/login')         // sikeres kilépés → login oldal
    }
    setIsLoading(false)
  }

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">

      {/* Bal oldal: aktuális oldal neve */}
      <h1 className="text-white font-semibold text-lg">
        {getPageTitle(pathname)}
      </h1>

      {/* Jobb oldal: user info + sign out */}
      <div className="flex items-center gap-3">

        {/* user prop null amíg tölt → skeleton placeholder */}
        {user ? (
          <>
            {/* Avatar kör kezdőbetűkkel */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {getInitials(user.full_name, user.email)}
            </div>

            {/* Név vagy email megjelenítés */}
            <span className="text-gray-300 text-sm hidden md:block">
              {user.full_name ?? user.email}
            </span>

            {/* Sign out gomb — callback a server actionre */}
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
            >
              <LogOut size={15} />
              {isLoading ? 'Kilépés...' : 'Kilépés'}
            </button>
          </>
        ) : (
          // Töltés közbeni placeholder (user még null)
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            <div className="w-24 h-4 bg-gray-700 rounded animate-pulse hidden md:block" />
          </div>
        )}

      </div>
    </header>
  )
}
