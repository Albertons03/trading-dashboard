// NESTED LAYOUT — csak az /dashboard/[orgSlug]/* route-okra vonatkozik
// A külső app/dashboard/layout.tsx (Sidebar + TopNav) MÉG MINDIG körülveszi ezt
// Tehát a layout stack: dashboard/layout → dashboard/[orgSlug]/layout → page

// params-t kapunk, mert dynamic segment van az URL-ben ([orgSlug])
// Next.js automatikusan átadja a props-ban
export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>  // Next.js 15-ben a params Promise
}) {
  // await kell, mert Next.js 15-ben a params aszinkron
  const { orgSlug } = await params

  return (
    <div className="space-y-4">

      {/* Org breadcrumb sáv — ez minden [orgSlug]/* oldalon megjelenik */}
      <div className="flex items-center gap-2 text-sm text-gray-400 border-b border-gray-800 pb-3">
        <a href="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </a>
        <span>/</span>
        {/* orgSlug az URL-ből jön — pl. /dashboard/my-store → "my-store" */}
        <span className="text-white font-medium">{orgSlug}</span>
      </div>

      {/* children = az aktuális [orgSlug]/*.tsx tartalma */}
      {children}

    </div>
  )
}
