import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/keys - List all API keys
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const userRole = (session.user as any).role || "user";
    const isMasterAdmin = session.user.email === "hjk@admin.com" || userRole === "admin";

    const where: Record<string, unknown> = isMasterAdmin ? {} : { userId: session.user.id };
    if (environment && environment !== 'all') {
      where.environment = environment;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    let keys = await db.apiKey.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    if (search) {
      const q = search.toLowerCase()
      keys = keys.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.keyPrefix.toLowerCase().includes(q) ||
          k.keySuffix.toLowerCase().includes(q) ||
          (k.tags && k.tags.toLowerCase().includes(q))
      )
    }

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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      expiration = 'never',
      permissions = 'read',
      rateLimit = 60,
      licenseType = 'lifetime',
      maxDevices = 1,
      environment = 'production',
      allowedIps = '',
      tags = '',
      notes = '',
    } = body

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

    const validLicenseTypes = ['trial', 'lifetime', 'subscription', 'concurrent']
    if (!validLicenseTypes.includes(licenseType)) {
      return NextResponse.json(
        { error: 'Invalid license type.' },
        { status: 400 }
      )
    }

    const validEnvironments = ['production', 'staging', 'development']
    const safeEnv = validEnvironments.includes(environment) ? environment : 'production'

    // Generate a cryptographically random API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => chars[b % chars.length])
      .join('')
    const keyPrefix = safeEnv === 'production' ? 'sk_live_' : safeEnv === 'staging' ? 'sk_stg_' : 'sk_test_'
    const fullKey = `${keyPrefix}${randomPart}`
    const keySuffix = fullKey.slice(-4)

    // Calculate flexible expiration date (supports hours, days, custom dates, never)
    let expiresAt: Date | null = null
    if (expiration && expiration !== 'never') {
      const str = String(expiration).trim();
      if (str.endsWith('h')) {
        const hours = parseFloat(str.slice(0, -1));
        if (!isNaN(hours) && hours > 0) expiresAt = new Date(Date.now() + Math.round(hours * 3600 * 1000));
      } else if (str.endsWith('m')) {
        const mins = parseFloat(str.slice(0, -1));
        if (!isNaN(mins) && mins > 0) expiresAt = new Date(Date.now() + Math.round(mins * 60 * 1000));
      } else if (str.endsWith('d')) {
        const days = parseFloat(str.slice(0, -1));
        if (!isNaN(days) && days > 0) expiresAt = new Date(Date.now() + Math.round(days * 24 * 3600 * 1000));
      } else if (str.endsWith('y')) {
        const years = parseFloat(str.slice(0, -1));
        if (!isNaN(years) && years > 0) expiresAt = new Date(Date.now() + Math.round(years * 365 * 24 * 3600 * 1000));
      } else if (!isNaN(parseFloat(str)) && !str.includes('-') && !str.includes('T')) {
        const days = parseFloat(str);
        if (days > 0) expiresAt = new Date(Date.now() + Math.round(days * 24 * 3600 * 1000));
      } else {
        const parsedDate = new Date(str);
        if (!isNaN(parsedDate.getTime())) expiresAt = parsedDate;
      }
    }

    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        key: fullKey,
        keyPrefix,
        keySuffix,
        permissions,
        licenseType,
        environment: safeEnv,
        allowedIps: allowedIps ? allowedIps.trim() : null,
        tags: tags ? tags.trim() : null,
        notes: notes ? notes.trim() : null,
        maxDevices: Math.max(1, parseInt(maxDevices) || 1),
        rateLimit: Math.max(1, Math.min(10000, parseInt(rateLimit) || 60)),
        expiration,
        expiresAt,
        userId: session.user.id,
      },
    })

    // Log audit log
    await db.auditLog.create({
      data: {
        action: 'KEY_CREATED',
        details: `Created API Key '${name.trim()}' (${safeEnv})`,
        userId: session.user.id,
      },
    })

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