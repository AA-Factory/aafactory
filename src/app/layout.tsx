import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import HeaderNav from '@/components/Header'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AA Factory',
  description: 'Frontend for AA Factory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HeaderNav />
        {children}
      </body>
    </html>
  )
}
