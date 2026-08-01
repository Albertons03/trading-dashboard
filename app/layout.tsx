import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* Navbar placeholder */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Dashboard</h1>
            <div className="flex gap-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</Link>
              <Link href="/chat" className="text-gray-700 hover:text-indigo-600">Chat</Link>
              <Link href="/todo" className="text-gray-700 hover:text-indigo-600">Todo</Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
