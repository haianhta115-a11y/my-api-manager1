import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/keys - List all API keys
export async function GET() {
  try {
    const keys = await db.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Failed to fetch keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, expiration = 'never', permissions = 'read', rateLimit = 60 } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      )
    }

    const validPermissions = ['read', 'write', 'admin']
    if (!validPermissions.includes(permissions)) {
      return NextResponse.json(
        { error: 'Invalid permissions. Must be: read, write, or admin' },
        { status: 400 }
      )
    }

    const validExpiration = ['7d', '30d', '90d', 'never']
    if (!validExpiration.includes(expiration)) {
      return NextResponse.json(
        { error: 'Invalid expiration. Must be: 7d, 30d, 90d, or never' },
        { status: 400 }
      )
    }

    // Generate a cryptographically random API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => chars[b % chars.length])
      .join('')
    const fullKey = `sk_live_${randomPart}`
    const keyPrefix = 'sk_live_'
    const keySuffix = fullKey.slice(-4)

    // Calculate expiration date
    let expiresAt: Date | null = null
    if (expiration !== 'never') {
      const days = parseInt(expiration)
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
    }

    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        key: fullKey,
        keyPrefix,
        keySuffix,
        permissions,
        rateLimit: Math.max(1, Math.min(10000, parseInt(rateLimit) || 60)),
        expiration,
        expiresAt,
      },
    })

    // Return the full key ONLY on creation — it will never be shown again
    return NextResponse.json(
      { key: apiKey, plainKey: fullKey },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}