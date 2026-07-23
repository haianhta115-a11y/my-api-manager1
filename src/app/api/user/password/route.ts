import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 })
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For demo, we check against the hardcoded admin password
    if (currentPassword !== 'admin') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // In production, hash the password
    const salt = crypto.randomBytes(16).toString('hex')
    const hashed = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex')
    const stored = `${salt}:${hashed}`

    await db.user.update({
      where: { id: session.user.id },
      data: { password: stored },
    })

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
