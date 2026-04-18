import { SignJWT } from "jose";
import { env } from "@/lib/env";

const encoder = new TextEncoder();

export async function signAccessToken(payload: Record<string, unknown>, ttl = "15m") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(encoder.encode(env.NEXTAUTH_SECRET));
}
