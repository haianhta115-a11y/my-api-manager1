import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// DELETE /api/keys/[id] - Permanently delete an API key
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    await db.apiKey.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}