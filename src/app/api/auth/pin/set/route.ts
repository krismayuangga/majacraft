import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

// POST /api/auth/pin/set — set atau ubah PIN pencairan (memerlukan OTP)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { pin, otp } = await req.json();

  if (!pin || !/^\d{6}$/.test(pin)) return err("PIN harus 6 digit angka");
  if (!otp) return err("Kode OTP wajib diisi");

  const userId = session!.user!.id!;

  // Verifikasi OTP
  const otpResult = await verifyOtp(userId, "pin_reset", otp);
  if (!otpResult.valid) return err(otpResult.error ?? "OTP tidak valid");

  const hashedPin = await bcrypt.hash(pin, 12);
  await prisma.user.update({ where: { id: userId }, data: { withdrawalPin: hashedPin } });

  return ok({ message: "PIN pencairan berhasil disimpan" });
}

// GET /api/auth/pin/set — cek apakah PIN sudah diset
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { withdrawalPin: true },
  });
  return ok({ hasPin: !!user?.withdrawalPin });
}
