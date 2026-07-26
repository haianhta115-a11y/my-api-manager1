import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await db.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const userRole = (session.user as any).role || "user";
    const isMasterAdmin = session.user.email === "hjk@admin.com" || userRole === "admin";

    if (!isMasterAdmin && apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedKey = await db.apiKey.update({
      where: { id },
      data: {
        hwid: null,
        hwidResetCount: { increment: 1 },
      },
    });

    await db.auditLog.create({
      data: {
        action: "HWID_RESET",
        details: `Reset HWID binding for key '${apiKey.name}' (${apiKey.keySuffix})`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "HWID binding reset successfully",
      key: updatedKey,
    });
  } catch (error) {
    console.error("Failed to reset HWID:", error);
    return NextResponse.json(
      { error: "Failed to reset HWID" },
      { status: 500 }
    );
  }
}
