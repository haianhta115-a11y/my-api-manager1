import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, themePref: true, createdAt: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Failed to fetch user settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, themePref, role } = body

    const data: any = {}
    if (name !== undefined) data.name = name.trim()
    if (themePref !== undefined) {
      if (!['dark', 'light'].includes(themePref)) {
        return NextResponse.json({ error: 'Invalid theme preference' }, { status: 400 })
      }
      data.themePref = themePref
    }
    if (role !== undefined) {
      if (!['user', 'vip', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      data.role = role
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, themePref: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
