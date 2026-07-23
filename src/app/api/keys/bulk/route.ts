import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "node:crypto";

// POST /api/keys/bulk - Generate multiple keys at once
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount = 5,
      prefix = "VIP_",
      format = "random", // "random" | "guid" | "jwt"
      expiration = "30d",
      permissions = "read",
      licenseType = "lifetime",
      maxDevices = 1,
      rateLimit = 60,
    } = body;

    const quantity = Math.max(1, Math.min(100, parseInt(amount) || 1));
    const createdKeys: { key: string; name: string }[] = [];

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expiration !== "never") {
      const days = parseInt(expiration) || 30;
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    const keysToCreate = [];
    const plainKeys: string[] = [];

    for (let i = 1; i <= quantity; i++) {
      let keyString = "";
      if (format === "guid") {
        keyString = `${prefix}${crypto.randomUUID()}`;
      } else if (format === "jwt") {
        const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
        const payload = Buffer.from(JSON.stringify({ sub: session.user.id, iat: Date.now() })).toString("base64url");
        const sig = crypto.randomBytes(16).toString("hex");
        keyString = `${prefix}${header}.${payload}.${sig}`;
      } else {
        const randomPart = crypto.randomBytes(16).toString("hex");
        keyString = `${prefix}${randomPart}`;
      }

      plainKeys.push(keyString);
      const keySuffix = keyString.slice(-4);
      const keyPrefix = prefix;

      keysToCreate.push({
        name: `Batch Key #${i} (${prefix})`,
        key: keyString,
        keyPrefix,
        keySuffix,
        permissions,
        licenseType,
        maxDevices: Math.max(1, parseInt(maxDevices) || 1),
        rateLimit: Math.max(1, Math.min(10000, parseInt(rateLimit) || 60)),
        expiration,
        expiresAt,
        userId: session.user.id,
      });
    }

    // Insert all in transaction
    await db.$transaction(
      keysToCreate.map((data) => db.apiKey.create({ data }))
    );

    // Audit Log
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    await db.auditLog.create({
      data: {
        action: "BULK_KEY_GENERATE",
        details: `Generated ${quantity} keys with prefix ${prefix} (${licenseType}, ${maxDevices} devices)`,
        ipAddress: clientIp,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      count: quantity,
      plainKeys,
    });
  } catch (error) {
    console.error("Bulk Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate keys in bulk" },
      { status: 500 }
    );
  }
}
