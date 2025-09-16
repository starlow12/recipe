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
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'RecipeGram - Share Your Culinary Adventures',
    description: 'Discover and share amazing recipes with the world',
    url: 'https://your-domain.com',
    siteName: 'RecipeGram',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RecipeGram - Recipe Sharing Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecipeGram - Share Your Culinary Adventures',
    description: 'Discover and share amazing recipes with the world',
    images: ['/twitter-image.png'],
  },
  icons: {
  icon: [
    { url: '/favicon.svg', type: 'image/svg+xml' },
    { url: '/favicon.ico' }  // גיבוי למקרה שהדפדפן לא תומך ב-SVG
  ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
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
        {/* Additional meta tags */}
        <meta name="application-name" content="RecipeGram" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RecipeGram" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#FF6B35" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
