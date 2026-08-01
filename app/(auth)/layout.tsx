export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AI Commerce Lead Gen
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            AI-powered e-commerce lead generation
          </p>
        </div>

        {/* Auth Form */}
        {children}
      </div>
    </div>
  )
}
