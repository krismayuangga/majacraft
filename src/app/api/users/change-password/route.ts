import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

/**
 * POST /api/users/change-password
 * Ubah password user — support Bearer JWT (mobile) dan NextAuth session (web)
 *
 * Body: { currentPassword: string, newPassword: string }
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;

  let currentPassword: string, newPassword: string;
  try {
    const body = await req.json();
    currentPassword = String(body.currentPassword ?? "").trim();
    newPassword     = String(body.newPassword     ?? "").trim();
  } catch {
    return err("Request body tidak valid", 400);
  }

  if (!currentPassword || !newPassword)
    return err("Current password dan password baru wajib diisi", 400);

  if (newPassword.length < 8)
    return err("Password baru harus minimal 8 karakter", 400);

  if (currentPassword === newPassword)
    return err("Password baru harus berbeda dengan password saat ini", 400);

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { email: true, password: true },
  });

  if (!user) return err("User tidak ditemukan", 404);

  if (!user.password)
    return err("Akun ini menggunakan login Google dan tidak memiliki password", 400);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return err("Password saat ini tidak sesuai", 401);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  console.log(`[change-password] ${user.email} changed password`);

  return ok({ message: "Password berhasil diubah" });
}
