'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, MessageSquare, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react'

// ── PROPS DEFINÍCIÓ ──────────────────────────────────────────
// TypeScript interface: megmondjuk mit vár a komponens a szülőtől
interface SidebarProps {
  appName: string   // pl. "Practice App" — a szülő adja át
}

// Navigációs elemek listája (statikus adat, nem props, nem state)
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Chat',      href: '/chat',      icon: MessageSquare },
  { name: 'Todo',      href: '/todo',      icon: CheckSquare },
]

// ── KOMPONENS ────────────────────────────────────────────────
export function Sidebar({ appName }: SidebarProps) {
  // usePathname: megadja az aktuális URL-t, pl. "/dashboard"
  // Újrarenderel ha az URL változik → aktív link kiemelés frissül
  const pathname = usePathname()

  // useState: helyi memória — elvész ha a komponens unmountol
  // localStorage-ból töltjük be, hogy böngésző újranyitás után is megmaradjon
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // useEffect: lefut egyszer mountkor (üres [] = csak egyszer)
  // Feladata: localStorage-ból visszatölteni a mentett állapotot
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  // Collapse toggle: állapot váltás + localStorage mentés
  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'   // collapse esetén összeszűkül
      )}
    >
      {/* Fejléc: appName prop jelenik meg itt */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <span className="font-bold text-blue-500 truncate">{appName}</span>
        )}
        {/* Collapse gomb: onClick → toggleCollapse */}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white ml-auto"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigáció */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          // pathname === item.href → ez az aktív oldal
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isCollapsed && 'justify-center px-2',
                isActive
                  ? 'bg-blue-600 text-white'           // aktív: kék
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'  // inaktív
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {/* Csak akkor látható a szöveg ha nincs összezárva */}
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
