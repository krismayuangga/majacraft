import { NextRequest } from "next/server";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { sendOtp } from "@/lib/otp";

// POST /api/auth/otp/send — kirim OTP ke email user
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { type } = await req.json();
  if (!["bank_change", "pin_reset", "withdrawal"].includes(type))
    return err("Tipe OTP tidak valid");

  const userId = session!.user!.id!;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user?.email) return err("Email tidak ditemukan");

  const result = await sendOtp(userId, type, user.email);
  if (!result.success) return err(result.error ?? "Gagal mengirim OTP");

  return ok({ message: `Kode OTP dikirim ke ${user.email.replace(/(.{2})(.+)(@.+)/, "$1***$3")}` });
}
