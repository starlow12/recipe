// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RecipeGram - Share Your Culinary Adventures',
  description: 'Discover and share amazing recipes with the world. Join our community of food lovers and create delicious stories together.',
  keywords: ['recipes', 'cooking', 'food', 'culinary', 'share', 'community'],
  authors: [{ name: 'RecipeGram' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
  },
  themeColor: '#FF6B35',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} mobile-text overflow-x-hidden`}>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: '#DC2626',
                color: '#fff',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
