import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id }
    });

    const isMasterAdmin = session.user.email === "hjk@admin.com" || currentUser?.role === "admin";
    if (!isMasterAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Không thể xóa chính tài khoản Admin của bạn!" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.user.delete({ where: { id: targetUserId } });

    await db.auditLog.create({
      data: {
        action: "USER_DELETED_BY_ADMIN",
        details: `Admin kicked & deleted user '${targetUser.name || targetUser.email}'`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: `Đã kick và xóa thành công tài khoản ${targetUser.name || targetUser.email}` });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id }
    });

    const isMasterAdmin = session.user.email === "hjk@admin.com" || currentUser?.role === "admin";
    if (!isMasterAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, ipAddress } = body; // action: "block_user" | "unblock_user" | "block_ip" | "unblock_ip"

    if (action === "block_user" || action === "unblock_user") {
      const newStatus = action === "block_user" ? "blocked" : "active";
      const updatedUser = await db.user.update({
        where: { id: targetUserId },
        data: { status: newStatus }
      });

      await db.auditLog.create({
        data: {
          action: action === "block_user" ? "USER_BLOCKED" : "USER_UNBLOCKED",
          details: `Admin ${action === "block_user" ? "blocked" : "unblocked"} user '${updatedUser.name}'`,
          userId: session.user.id
        }
      });

      return NextResponse.json({ message: `Đã ${action === "block_user" ? "khóa" : "mở khóa"} tài khoản thành công!`, user: updatedUser });
    }

    if (action === "block_ip" && ipAddress) {
      const cleanIp = ipAddress.trim();
      await db.blockedIp.upsert({
        where: { ipAddress: cleanIp },
        create: { ipAddress: cleanIp, reason: `Blocked by Admin for user ${targetUserId}` },
        update: {}
      });

      await db.auditLog.create({
        data: {
          action: "IP_BLOCKED_BY_ADMIN",
          details: `Admin blocked IP address ${cleanIp}`,
          ipAddress: cleanIp,
          userId: session.user.id
        }
      });

      return NextResponse.json({ message: `Đã khóa thành công IP: ${cleanIp}` });
    }

    if (action === "unblock_ip" && ipAddress) {
      const cleanIp = ipAddress.trim();
      await db.blockedIp.deleteMany({
        where: { ipAddress: cleanIp }
      });

      return NextResponse.json({ message: `Đã bỏ khóa IP: ${cleanIp}` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
