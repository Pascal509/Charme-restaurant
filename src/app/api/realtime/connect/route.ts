import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  try {
    const payload = await verifyJwt(token);
    return NextResponse.json({
      ok: true,
      userId: payload.sub ?? null,
      role: payload.role ?? "CUSTOMER"
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

async function verifyJwt(token: string) {
  const secret = encoder.encode(env.NEXTAUTH_SECRET);
  const result = await jwtVerify(token, secret);
  return result.payload as { sub?: string; role?: string };
}

function extractToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring("Bearer ".length);
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/charme\.session-token=([^;]+)/);
  if (match) return match[1];

  return null;
}
