import type { Metadata, Viewport } from 'next'
import { Geist, Space_Grotesk } from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'MTU Hub Admin',
  description: 'Manage users, forums, and posts for MTU Hub.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1f8a8a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
