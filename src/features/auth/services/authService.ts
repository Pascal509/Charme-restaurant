import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/features/auth/services/passwordService";
import { generateToken, expiresInHours } from "@/features/auth/services/tokenService";

export async function registerUser(email: string, password: string, name?: string) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash
    }
  });
}

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function createEmailVerification(userId: string) {
  const token = generateToken();
  return prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt: expiresInHours(24)
    }
  });
}

export async function createPasswordReset(userId: string) {
  const token = generateToken();
  return prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt: expiresInHours(2)
    }
  });
}
