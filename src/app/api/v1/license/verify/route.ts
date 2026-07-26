import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

const RESPONSE_SIGNING_SECRET = process.env.LICENSE_SIGNING_SECRET || "VIP_KEY_SERVER_SUPER_SECRET_SIGNATURE_KEY_2026";

async function triggerWebhooks(event: string, payload: Record<string, unknown>, userId?: string | null) {
  try {
    const webhooks = await db.webhook.findMany({
      where: {
        status: "active",
        ...(userId ? { userId } : {}),
      },
    });

    for (const hook of webhooks) {
      try {
        const eventsList: string[] = JSON.parse(hook.events || "[]");
        if (eventsList.includes(event) || eventsList.includes("*")) {
          const bodyStr = JSON.stringify({ event, timestamp: new Date().toISOString(), payload });
          const res = await fetch(hook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": hook.secret
                ? crypto.createHmac("sha256", hook.secret).update(bodyStr).digest("hex")
                : "",
            },
            body: bodyStr,
          });

          await db.webhookLog.create({
            data: {
              webhookId: hook.id,
              event,
              statusCode: res.status,
              payload: bodyStr.substring(0, 1000),
              response: (await res.text()).substring(0, 500),
            },
          });
        }
      } catch (err) {
        console.error(`Failed to trigger webhook ${hook.id}:`, err);
      }
    }
  } catch (err) {
    console.error("Webhook dispatch error:", err);
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "Unknown";

  let keyIdForLog: string | null = null;
  let responseStatusCode = 200;

  try {
    const body = await request.json();
    const { key, hwid, app_name = "ClientApp", client_version = "1.0.0" } = body;

    // 0. Check Global Blocked IP Table
    const isGlobalBlocked = await db.blockedIp.findUnique({
      where: { ipAddress: clientIp }
    });

    if (isGlobalBlocked) {
      responseStatusCode = 403;
      return NextResponse.json(
        { valid: false, code: "IP_BLOCKED_BY_ADMIN", message: `Địa chỉ IP ${clientIp} đã bị Admin khóa khỏi hệ thống.` },
        { status: 403 }
      );
    }

    if (!key || typeof key !== "string") {
      responseStatusCode = 400;
      return NextResponse.json(
        { valid: false, code: "MISSING_KEY", message: "License key is required." },
        { status: 400 }
      );
    }

    if (!hwid || typeof hwid !== "string") {
      responseStatusCode = 400;
      return NextResponse.json(
        { valid: false, code: "MISSING_HWID", message: "Hardware ID (HWID) is required for binding." },
        { status: 400 }
      );
    }

    // 1. Find key in DB
    const cleanKey = key.trim();
    const apiKey = await db.apiKey.findFirst({
      where: {
        OR: [
          { key: cleanKey },
          { keyPrefix: cleanKey },
        ]
      },
      include: {
        user: {
          select: { status: true, role: true }
        }
      }
    });

    if (!apiKey) {
      responseStatusCode = 404;
      return NextResponse.json(
        { valid: false, code: "INVALID_KEY", message: "License key does not exist." },
        { status: 404 }
      );
    }

    if (apiKey.user && apiKey.user.status === "blocked") {
      responseStatusCode = 403;
      return NextResponse.json(
        { valid: false, code: "USER_BLOCKED", message: "Tài khoản của người tạo Key này đã bị Admin KHÓA vĩnh viễn." },
        { status: 403 }
      );
    }

    keyIdForLog = apiKey.id;

    // 2. Check Allowed IPs if specified
    if (apiKey.allowedIps) {
      const allowedList = apiKey.allowedIps.split(",").map((i) => i.trim()).filter(Boolean);
      if (allowedList.length > 0 && !allowedList.includes(clientIp) && !allowedList.includes("*")) {
        responseStatusCode = 403;
        await db.auditLog.create({
          data: {
            action: "IP_BLOCKED",
            details: `Key ${apiKey.keySuffix} access blocked from unauthorized IP ${clientIp}`,
            ipAddress: clientIp,
            userId: apiKey.userId,
          },
        });
        return NextResponse.json(
          { valid: false, code: "IP_RESTRICTED", message: `Access denied from IP ${clientIp}. Add IP to whitelist.` },
          { status: 403 }
        );
      }
    }

    // 3. Check Key Status
    if (apiKey.status === "revoked") {
      responseStatusCode = 403;
      return NextResponse.json(
        { valid: false, code: "KEY_REVOKED", message: "This license key has been revoked by admin." },
        { status: 403 }
      );
    }

    if (apiKey.status === "locked") {
      responseStatusCode = 403;
      return NextResponse.json(
        { valid: false, code: "KEY_LOCKED", message: "This license key is locked due to security anomaly." },
        { status: 403 }
      );
    }

    // 4. Check Expiration
    if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
      await db.apiKey.update({
        where: { id: apiKey.id },
        data: { status: "expired" },
      });
      responseStatusCode = 403;
      triggerWebhooks("license.expired", { keyId: apiKey.id, name: apiKey.name }, apiKey.userId);
      return NextResponse.json(
        { valid: false, code: "KEY_EXPIRED", message: "This license key has expired." },
        { status: 403 }
      );
    }

    // 5. HWID Binding & Device Limit Check
    let currentHwids: string[] = [];
    if (apiKey.hwid) {
      currentHwids = apiKey.hwid.split(",").map((h) => h.trim()).filter(Boolean);
    }

    const cleanHwid = hwid.trim();
    let isHwidBound = currentHwids.includes(cleanHwid);

    if (!isHwidBound) {
      if (currentHwids.length >= apiKey.maxDevices) {
        await db.auditLog.create({
          data: {
            action: "HWID_REJECTED",
            details: `Key ${apiKey.keySuffix} rejected attempt from HWID ${cleanHwid} (Max limit ${apiKey.maxDevices} reached)`,
            ipAddress: clientIp,
            userId: apiKey.userId,
          },
        });
        responseStatusCode = 403;
        triggerWebhooks("hwid.mismatch", { keyId: apiKey.id, hwid: cleanHwid }, apiKey.userId);
        return NextResponse.json(
          {
            valid: false,
            code: "HWID_LIMIT_EXCEEDED",
            message: `HWID limit reached (${currentHwids.length}/${apiKey.maxDevices} devices bound). Reset HWID or contact support.`,
            maxDevices: apiKey.maxDevices,
            boundCount: currentHwids.length,
          },
          { status: 403 }
        );
      } else {
        currentHwids.push(cleanHwid);
        isHwidBound = true;
      }
    }

    // 6. Update Key Metrics & HWID in DB
    const updatedHwidString = currentHwids.join(",");
    const timestamp = Date.now();

    await db.apiKey.update({
      where: { id: apiKey.id },
      data: {
        hwid: updatedHwidString,
        lastUsedAt: new Date(),
        lastIp: clientIp,
        requestCount: { increment: 1 },
      },
    });

    // 7. Digital Signature (HMAC-SHA256 Response Protection)
    const payloadToSign = `${apiKey.id}:${cleanHwid}:${timestamp}:VALID`;
    let digitalSignature = "";
    let signatureAlgorithm = "HMAC-SHA256";
    try {
      digitalSignature = crypto
        .createHmac("sha256", RESPONSE_SIGNING_SECRET)
        .update(payloadToSign)
        .digest("hex");
    } catch (sigErr) {
      console.error("HMAC signing failed, using fallback:", sigErr);
      signatureAlgorithm = "HMAC-SHA256-FALLBACK";
      digitalSignature = crypto
        .createHash("sha256")
        .update(payloadToSign + RESPONSE_SIGNING_SECRET)
        .digest("hex");
    }

    responseStatusCode = 200;
    return NextResponse.json({
      valid: true,
      code: "SUCCESS",
      message: "License key is active and verified.",
      license: {
        id: apiKey.id,
        name: apiKey.name,
        environment: apiKey.environment,
        type: apiKey.licenseType,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        boundDevices: currentHwids.length,
        maxDevices: apiKey.maxDevices,
        rateLimit: apiKey.rateLimit,
      },
      security: {
        timestamp,
        signature: digitalSignature,
        signatureAlgorithm,
      },
    });
  } catch (error) {
    console.error("License Verification Error:", error);
    responseStatusCode = 500;
    return NextResponse.json(
      { valid: false, code: "SERVER_ERROR", message: "Internal verification error" },
      { status: 500 }
    );
  } finally {
    const latencyMs = Date.now() - startTime;
    // Log API Request asynchronously
    db.apiRequestLog.create({
      data: {
        apiKeyId: keyIdForLog,
        endpoint: "/api/v1/license/verify",
        statusCode: responseStatusCode,
        latencyMs,
        ipAddress: clientIp,
        userAgent,
      },
    }).catch(() => {});
  }
}
