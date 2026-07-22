import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// POST /api/users/kyc — submit dokumen KYC
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;
  const { ktpUrl, selfieUrl, nik } = await req.json();

  if (!ktpUrl || !selfieUrl) return err("Foto KTP dan selfie wajib diupload");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } });
  if (!user) return err("Pengguna tidak ditemukan", 404);

  if (user.kycStatus === "VERIFIED") return err("Akun Anda sudah terverifikasi");
  if (user.kycStatus === "PENDING") return err("Dokumen Anda sedang dalam proses verifikasi");

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: "PENDING",
      kycKtpUrl: ktpUrl,
      kycSelfieUrl: selfieUrl,
      ...(nik && { kycNik: nik }),
    },
  });

  return ok({ message: "Dokumen berhasil dikirim, menunggu verifikasi admin" });
}

// GET /api/users/kyc — cek status KYC
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, kycVerifiedAt: true, kycKtpUrl: true, kycSelfieUrl: true },
  });

  return ok(user);
}
