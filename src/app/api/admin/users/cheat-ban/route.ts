import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

    const body = await request.json();
    const { userId, reason = "Cheat/Tampering attempt detected" } = body;

    const targetUserId = userId || session?.user?.id;
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Do NOT ban Admin Master
    if (user.role === "admin" || user.email === "hjk@admin.com") {
      return NextResponse.json({ message: "Admin is exempt from automatic bans" });
    }

    // Ban/Block Normal User account
    await db.user.update({
      where: { id: targetUserId },
      data: { status: "blocked" }
    });

    // Automatically block User IP address
    if (clientIp && clientIp !== "127.0.0.1") {
      await db.blockedIp.upsert({
        where: { ipAddress: clientIp },
        create: { ipAddress: clientIp, reason: `Cheat detected for user ${user.name || user.email}` },
        update: {}
      });
    }

    // Log high priority security audit log
    await db.auditLog.create({
      data: {
        action: "CHEAT_DETECTED_AUTO_BAN",
        details: `CẢNH BÁO GIAN LẬN: Tài khoản '${user.name || user.email}' đã bị BAND tự động. Lý do: ${reason}`,
        ipAddress: clientIp,
        userId: targetUserId,
      }
    });

    return NextResponse.json({ message: "Tài khoản đã bị BAND do vi phạm gian lận." });
  } catch (error) {
    console.error("Cheat Ban Error:", error);
    return NextResponse.json({ error: "Failed to process cheat ban" }, { status: 500 });
  }
}
