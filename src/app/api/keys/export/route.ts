import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const keys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const headers = ["ID", "Name", "KeyPrefix", "KeySuffix", "Status", "Environment", "Permissions", "LicenseType", "MaxDevices", "RateLimit", "Expiration", "AllowedIPs", "Tags", "RequestCount", "CreatedAt"];
      const rows = keys.map((k) => [
        k.id,
        `"${k.name.replace(/"/g, '""')}"`,
        k.keyPrefix,
        k.keySuffix,
        k.status,
        k.environment,
        k.permissions,
        k.licenseType,
        k.maxDevices,
        k.rateLimit,
        k.expiration,
        `"${(k.allowedIps || "").replace(/"/g, '""')}"`,
        `"${(k.tags || "").replace(/"/g, '""')}"`,
        k.requestCount,
        k.createdAt.toISOString(),
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="api-keys-export-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      count: keys.length,
      keys,
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export keys" }, { status: 500 });
  }
}
