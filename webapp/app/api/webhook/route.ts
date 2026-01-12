import { NextRequest, NextResponse } from 'next/server'

// Rate limiting: Simple in-memory store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute per IP

function getRateLimitKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'
  return `webhook:${ip}`
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  
  record.count++
  return record.count > RATE_LIMIT_MAX_REQUESTS
}

// Webhook endpoint for mini app notifications and events
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(request)
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Too many requests' }, 
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const body = await request.json()

    // Validate webhook payload structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { event } = body

    // Validate event type (whitelist allowed events)
    const allowedEvents = [
      'frame_added',
      'frame_removed', 
      'notifications_enabled',
      'notifications_disabled'
    ]

    if (!event || typeof event !== 'string' || !allowedEvents.includes(event)) {
      // Log unknown events for monitoring without exposing payload data
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Webhook] Unknown event type: ${event ? String(event).slice(0, 50) : 'undefined'}`)
      }
      return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    // Process valid events
    // NOTE: In production, implement proper event handling here
    // Do NOT log user data or sensitive information
    switch (event) {
      case 'frame_added':
      case 'frame_removed':
      case 'notifications_enabled':
      case 'notifications_disabled':
        // Event acknowledged - implement business logic as needed
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Log error type only, not the full error or stack trace
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Webhook] Processing error:', error instanceof Error ? error.name : 'Unknown error')
    }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
