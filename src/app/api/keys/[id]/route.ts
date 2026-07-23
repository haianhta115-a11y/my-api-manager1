import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// DELETE /api/keys/[id] - Permanently delete an API key
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key || key.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    await db.apiKey.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'KEY_DELETED',
        details: `Deleted key '${key.name}' (${key.keySuffix})`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}

// PATCH /api/keys/[id] - Update an API key
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, permissions, rateLimit, status, licenseType, maxDevices, tags, notes, environment, allowedIps, expiresAt, hwid } = body

    const key = await db.apiKey.findUnique({ where: { id } })
    if (!key || key.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Key name is required' },
          { status: 400 }
        )
      }
    }

    if (permissions !== undefined) {
      const validPermissions = ['read', 'write', 'admin']
      if (!validPermissions.includes(permissions)) {
        return NextResponse.json(
          { error: 'Invalid permissions. Must be: read, write, or admin' },
          { status: 400 }
        )
      }
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'revoked', 'expired', 'locked']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
    }

    if (licenseType !== undefined) {
      const validLicenseTypes = ['trial', 'lifetime', 'subscription', 'concurrent']
      if (!validLicenseTypes.includes(licenseType)) {
        return NextResponse.json(
          { error: 'Invalid license type.' },
          { status: 400 }
        )
      }
    }

    const validEnvironments = ['production', 'staging', 'development']
    if (environment !== undefined && !validEnvironments.includes(environment)) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (permissions !== undefined) data.permissions = permissions
    if (status !== undefined) data.status = status
    if (licenseType !== undefined) data.licenseType = licenseType
    if (maxDevices !== undefined) data.maxDevices = Math.max(1, parseInt(maxDevices) || 1)
    if (rateLimit !== undefined) {
      data.rateLimit = Math.max(1, Math.min(10000, parseInt(rateLimit) || 60))
    }
    if (tags !== undefined) data.tags = tags ? tags.trim() : null
    if (notes !== undefined) data.notes = notes ? notes.trim() : null
    if (environment !== undefined) data.environment = environment
    if (allowedIps !== undefined) data.allowedIps = allowedIps ? allowedIps.trim() : null
    if (hwid !== undefined) data.hwid = hwid ? hwid.trim() : null
    if (expiresAt !== undefined) {
      data.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (expiresAt && new Date(expiresAt) > new Date()) {
        data.status = 'active'; // Auto-reactivate if extended
      }
    }

    const updatedKey = await db.apiKey.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        action: 'KEY_UPDATED',
        details: `Updated settings for key '${updatedKey.name}' (${updatedKey.keySuffix})`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ key: updatedKey })
  } catch (error) {
    console.error('Failed to update key:', error)
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    )
  }
}