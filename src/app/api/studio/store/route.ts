import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { verifyOtp } from "@/lib/otp";

// GET /api/studio/store
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({
    where: { userId: session!.user!.id! },
    include: { _count: { select: { products: true } } },
  });
  if (!store) return err("Toko tidak ditemukan", 404);
  return ok(store);
}

// PATCH /api/studio/store
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const body = await req.json();

  // Jika mengubah rekening bank — wajib verifikasi OTP
  const isBankChange = body.bankName !== undefined || body.bankAccount !== undefined || body.bankHolder !== undefined;
  if (isBankChange) {
    if (!body.otp) return err("Kode OTP wajib untuk mengubah rekening bank");
    const otpResult = await verifyOtp(session!.user!.id!, body.otpType ?? "bank_change", body.otp);
    if (!otpResult.valid) return err(otpResult.error ?? "OTP tidak valid");
  }

  const allowed = ["name","description","province","city","district","village","address","postalCode","phone","logoUrl","bannerUrl","bankName","bankAccount","bankHolder"];
  const updateData: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const updated = await prisma.store.update({ where: { id: store.id }, data: updateData });
  return ok(updated);
}
