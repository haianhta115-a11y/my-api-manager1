import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/keys/metrics - Dashboard metrics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const totalKeys = await db.apiKey.count({
      where: { userId }
    })
    const activeKeys = await db.apiKey.count({
      where: { status: 'active', userId },
    })
    const revokedKeys = await db.apiKey.count({
      where: { status: 'revoked', userId },
    })

    // Simulate request count (in production, this would come from a real tracking system)
    const aggregate = await db.apiKey.aggregate({
      where: { userId },
      _sum: { requestCount: true },
    })
    const totalRequests = aggregate._sum.requestCount || 0

    // Simulate rate limit usage (calculate from all active keys)
    const activeKeysData = await db.apiKey.findMany({
      where: { status: 'active', userId },
      select: { rateLimit: true, requestCount: true },
    })
    const totalRateLimit = activeKeysData.reduce((sum, k) => sum + k.rateLimit, 0)
    const usagePercent = totalRateLimit > 0
      ? Math.min(100, Math.round((totalRequests / (totalRateLimit * 60 * 24)) * 100))
      : 0

    return NextResponse.json({
      totalKeys,
      activeKeys,
      revokedKeys,
      totalRequests,
      usagePercent,
    })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}