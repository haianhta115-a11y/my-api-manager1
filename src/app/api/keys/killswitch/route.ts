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
    const { targetEnvironment = "all", action = "lock" } = body; // action: "lock" | "unlock"

    const where: Record<string, unknown> = { userId: session.user.id };
    if (targetEnvironment !== "all") {
      where.environment = targetEnvironment;
    }

    const targetStatus = action === "lock" ? "locked" : "active";

    const result = await db.apiKey.updateMany({
      where,
      data: { status: targetStatus },
    });

    await db.auditLog.create({
      data: {
        action: action === "lock" ? "KILLSWITCH_ACTIVATED" : "KILLSWITCH_DEACTIVATED",
        details: `Emergency Killswitch ${action === "lock" ? "LOCKED" : "UNLOCKED"} ${result.count} keys in environment: ${targetEnvironment}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: `Killswitch executed successfully. ${result.count} keys updated to ${targetStatus}.`,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error("Killswitch Error:", error);
    return NextResponse.json({ error: "Failed to execute killswitch" }, { status: 500 });
  }
}
