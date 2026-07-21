import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// PATCH /api/keys/revoke - Revoke an API key
export async function PATCH(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    if (key.status === 'revoked') {
      return NextResponse.json(
        { error: 'API key is already revoked' },
        { status: 400 }
      )
    }

    const updated = await db.apiKey.update({
      where: { id },
      data: { status: 'revoked' },
    })

    return NextResponse.json({ key: updated })
  } catch (error) {
    console.error('Failed to revoke key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}