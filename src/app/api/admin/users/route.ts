import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id }
    });

    const isMasterAdmin = session.user.email === "hjk@admin.com" || currentUser?.role === "admin";
    if (!isMasterAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { apiKeys: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const blockedIps = await db.blockedIp.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ users, blockedIps });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id }
    });

    const isMasterAdmin = session.user.email === "hjk@admin.com" || currentUser?.role === "admin";
    if (!isMasterAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role = "vip" } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Username/Email and Password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { name: name?.trim() || cleanEmail }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Tài khoản hoặc Email này đã tồn tại trên hệ thống!" }, { status: 400 });
    }

    const newUser = await db.user.create({
      data: {
        name: name?.trim() || cleanEmail,
        email: cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@app.local`,
        password: password.trim(),
        role: role === "admin" ? "admin" : "vip",
        status: "active"
      }
    });

    await db.auditLog.create({
      data: {
        action: "USER_CREATED_BY_ADMIN",
        details: `Admin created new account '${newUser.name}' with role ${newUser.role}`,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "Tạo tài khoản mới thành công!", user: newUser });
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
