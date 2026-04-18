import { randomBytes } from "crypto";

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function expiresInHours(hours: number) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt;
}
