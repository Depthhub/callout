import { NextResponse } from 'next/server'

// Mini App manifest for Base App / Farcaster
// This file is required for the app to be recognized as a mini app
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voucheo.app'

  const manifest = {
    accountAssociation: {
      // These will be generated when you register your app
      // Use Base Build's account association tool to generate these
      header: process.env.FARCASTER_HEADER || '',
      payload: process.env.FARCASTER_PAYLOAD || '',
      signature: process.env.FARCASTER_SIGNATURE || '',
    },
    frame: {
      version: 'next',
      name: 'VOUCHEO',
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: '#0B0B0F',
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
    },
  }

  return NextResponse.json(manifest)
}
