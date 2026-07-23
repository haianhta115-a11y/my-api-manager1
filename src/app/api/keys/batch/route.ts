import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ids, targetEnv } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No key IDs provided' }, { status: 400 })
    }

    const validActions = ['revoke', 'activate', 'delete', 'lock', 'extend_30d', 'set_environment', 'reset_hwid']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid batch action' }, { status: 400 })
    }

    const keys = await db.apiKey.findMany({
      where: { id: { in: ids }, userId: session.user.id },
    })

    if (keys.length === 0) {
      return NextResponse.json({ error: 'No matching keys found' }, { status: 404 })
    }

    if (action === 'delete') {
      await db.apiKey.deleteMany({
        where: { id: { in: keys.map(k => k.id) } },
      })
    } else if (action === 'extend_30d') {
      for (const k of keys) {
        const currentExp = k.expiresAt ? new Date(k.expiresAt) : new Date()
        const newExp = new Date(Math.max(Date.now(), currentExp.getTime()) + 30 * 24 * 60 * 60 * 1000)
        await db.apiKey.update({
          where: { id: k.id },
          data: { expiresAt: newExp, status: 'active', expiration: '30d' },
        })
      }
    } else if (action === 'set_environment') {
      if (!['production', 'staging', 'development'].includes(targetEnv)) {
        return NextResponse.json({ error: 'Invalid target environment' }, { status: 400 })
      }
      await db.apiKey.updateMany({
        where: { id: { in: keys.map(k => k.id) } },
        data: { environment: targetEnv },
      })
    } else if (action === 'reset_hwid') {
      await db.apiKey.updateMany({
        where: { id: { in: keys.map(k => k.id) } },
        data: { hwid: null, hwidResetCount: { increment: 1 } },
      })
    } else {
      const statusMap: Record<string, string> = {
        revoke: 'revoked',
        activate: 'active',
        lock: 'locked',
      }
      await db.apiKey.updateMany({
        where: { id: { in: keys.map(k => k.id) } },
        data: { status: statusMap[action] },
      })
    }

    await db.auditLog.create({
      data: {
        action: `BATCH_${action.toUpperCase()}`,
        details: `Executed batch ${action} on ${keys.length} key(s)`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true, count: keys.length })
  } catch (error) {
    console.error('Batch operation error:', error)
    return NextResponse.json({ error: 'Batch operation failed' }, { status: 500 })
  }
}
