import { prisma } from "@/lib/db";
import { generateToken } from "@/features/auth/services/tokenService";

export async function issueRefreshToken(userId: string, ttlDays = 30) {
  const token = generateToken(48);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);
  return prisma.refreshToken.create({
    data: { userId, token, expiresAt }
  });
}

export async function rotateRefreshToken(token: string, ttlDays = 30) {
  const existing = await prisma.refreshToken.findUnique({ where: { token } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  const replacement = await issueRefreshToken(existing.userId, ttlDays);
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedBy: replacement.token }
  });

  return replacement;
}
