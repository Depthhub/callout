import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { TestnetBanner } from './components/TestnetBanner'
import '@coinbase/onchainkit/styles.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'VOUCHEO - Base Sepolia Testnet',
  description: 'Put your take on record. Prediction markets for Base posts. TESTNET ONLY.',
  applicationName: 'VOUCHEO',
  robots: {
    index: false, // Don't index testnet app
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TestnetBanner />
        <div style={{ paddingTop: '28px' }}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}


