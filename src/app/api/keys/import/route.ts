import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided for import" }, { status: 400 });
    }

    const createdKeys = [];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (const item of items) {
      const name = item.name || `Imported Key ${createdKeys.length + 1}`;
      const environment = item.environment || "production";
      const permissions = item.permissions || "read";
      const licenseType = item.licenseType || "lifetime";
      const maxDevices = parseInt(item.maxDevices) || 1;
      const rateLimit = parseInt(item.rateLimit) || 60;
      const allowedIps = item.allowedIps || null;
      const tags = item.tags || "imported";

      const keyPrefix = environment === "production" ? "sk_live_" : environment === "staging" ? "sk_stg_" : "sk_test_";
      const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => chars[b % chars.length])
        .join("");
      const fullKey = `${keyPrefix}${randomPart}`;
      const keySuffix = fullKey.slice(-4);

      const apiKey = await db.apiKey.create({
        data: {
          name: name.trim(),
          key: fullKey,
          keyPrefix,
          keySuffix,
          permissions,
          licenseType,
          environment,
          maxDevices,
          rateLimit,
          allowedIps,
          tags,
          userId: session.user.id,
        },
      });
      createdKeys.push(apiKey);
    }

    await db.auditLog.create({
      data: {
        action: "KEYS_IMPORTED",
        details: `Imported ${createdKeys.length} API keys`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      importedCount: createdKeys.length,
      keys: createdKeys,
    });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Failed to import keys" }, { status: 500 });
  }
}
