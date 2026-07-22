import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildOtpEmail } from "@/lib/email";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(userId: string, type: string, toEmail: string): Promise<{ success: boolean; error?: string }> {
  // Rate limit: tidak bisa minta OTP baru < 60 detik
  const recent = await prisma.otpCode.findFirst({
    where: {
      userId, type,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      usedAt: null,
    },
  });
  if (recent) return { success: false, error: "Mohon tunggu 1 menit sebelum minta kode baru" };

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

  // Invalidate OTP lama
  await prisma.otpCode.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.otpCode.create({ data: { userId, type, code: hashedOtp, expiresAt } });

  try {
    await sendEmail({
      to: toEmail,
      subject: `Kode OTP MajaCraft — ${otp}`,
      html: buildOtpEmail(otp, type),
    });
    return { success: true };
  } catch (e) {
    console.error("[OTP Email Error]", e);
    return { success: false, error: "Gagal mengirim email. Coba lagi." };
  }
}

export async function verifyOtp(userId: string, type: string, inputOtp: string): Promise<{ valid: boolean; error?: string }> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId, type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) return { valid: false, error: "Kode OTP tidak ditemukan atau sudah kedaluwarsa" };

  const isValid = await bcrypt.compare(inputOtp.trim(), otpRecord.code);
  if (!isValid) return { valid: false, error: "Kode OTP salah" };

  // Tandai sudah digunakan
  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });
  return { valid: true };
}

export async function verifyWithdrawalPin(userId: string, pin: string): Promise<{ valid: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { withdrawalPin: true } });
  if (!user?.withdrawalPin) return { valid: false, error: "PIN belum diset. Silakan set PIN pencairan terlebih dahulu." };
  const isValid = await bcrypt.compare(pin, user.withdrawalPin);
  if (!isValid) return { valid: false, error: "PIN salah" };
  return { valid: true };
}
