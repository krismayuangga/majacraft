import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { verifyWithdrawalPin } from "@/lib/otp";

// GET /api/studio/balance — saldo seller (dari order COMPLETED yang belum dicairkan)
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  // Baca fee dari settings
  let feePercent = 5;
  try {
    const s = await prisma.platformSetting.findUnique({ where: { key: "fee_percent" } });
    if (s) feePercent = Number(s.value);
  } catch {}

  // Total dari order COMPLETED milik toko ini
  const completedOrders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      escrowStatus: { in: ["RELEASING", "RELEASED"] },
      items: { some: { product: { storeId: store.id } } },
    },
    select: {
      id: true,
      shippingCost: true,
      items: { where: { product: { storeId: store.id } }, select: { price: true, qty: true } },
    },
  });

  // grossRevenue = produk saja (fee dihitung dari ini)
  const grossRevenue = completedOrders.reduce((sum, order) => {
    return sum + order.items.reduce((s, i) => s + i.price * i.qty, 0);
  }, 0);

  // ongkir pass-through (seller bayar kurir, tidak kena fee platform)
  const shippingTotal = completedOrders.reduce((sum, order) => sum + (order.shippingCost ?? 0), 0);

  // netRevenue = produk setelah dipotong fee + ongkir pass-through
  const feeAmount = Math.round(grossRevenue * feePercent / 100);
  const netRevenue = grossRevenue - feeAmount + shippingTotal;

  // Total yang sudah dicairkan
  const withdrawn = await prisma.withdrawal.aggregate({
    where: { storeId: store.id, status: { in: ["APPROVED", "TRANSFERRED"] } },
    _sum: { netAmount: true },
  });
  const totalWithdrawn = withdrawn._sum.netAmount ?? 0;
  const availableBalance = netRevenue - totalWithdrawn;

  // Riwayat pencairan
  const withdrawals = await prisma.withdrawal.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return ok({
    grossRevenue,           // total produk saja (sebelum fee)
    shippingTotal,          // total ongkir pass-through
    feePercent,
    feeAmount,
    netRevenue,             // grossRevenue - fee + ongkir
    totalWithdrawn,
    availableBalance,
    withdrawals,
  });
}

// POST /api/studio/balance — ajukan pencairan
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);
  if (!store.bankName || !store.bankAccount || !store.bankHolder)
    return err("Lengkapi rekening bank di Pengaturan Toko terlebih dahulu");

  const { amount, pin } = await req.json();
  if (!amount) return err("Jumlah pencairan wajib diisi");
  if (!pin) return err("PIN pencairan wajib diisi");

  // Verifikasi PIN
  const userId = session!.user!.id!;
  const pinResult = await verifyWithdrawalPin(userId, pin);
  if (!pinResult.valid) return err(pinResult.error ?? "PIN salah");

  // Cek saldo mencukupi
  let feePercent = 5;
  try {
    const s = await prisma.platformSetting.findUnique({ where: { key: "fee_percent" } });
    if (s) feePercent = Number(s.value);
  } catch {}

  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED", escrowStatus: { in: ["RELEASING", "RELEASED"] }, items: { some: { product: { storeId: store.id } } } },
    select: { shippingCost: true, items: { where: { product: { storeId: store.id } }, select: { price: true, qty: true } } },
  });
  const grossRevenue = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.qty, 0), 0);
  const shippingTotal = completedOrders.reduce((sum, o) => sum + (o.shippingCost ?? 0), 0);
  const withdrawn = await prisma.withdrawal.aggregate({ where: { storeId: store.id, status: { in: ["APPROVED", "TRANSFERRED"] } }, _sum: { netAmount: true } });
  // netRevenue = produk setelah fee + ongkir pass-through
  const availableBalance = Math.round(grossRevenue * (1 - feePercent / 100)) + shippingTotal - (withdrawn._sum.netAmount ?? 0);

  if (amount > availableBalance) return err(`Saldo tidak mencukupi. Saldo tersedia: Rp ${availableBalance.toLocaleString("id-ID")}`);
  if (amount < 50000) return err("Minimal pencairan Rp 50.000");

  // Cek tidak ada pending withdrawal
  const pending = await prisma.withdrawal.findFirst({ where: { storeId: store.id, status: "PENDING" } });
  if (pending) return err("Anda masih memiliki pengajuan pencairan yang sedang diproses");

  const feeAmount = 0; // Fee platform sudah dipotong dari saldo tersedia — tidak double charge
  const withdrawal = await prisma.withdrawal.create({
    data: {
      storeId: store.id,
      amount,
      fee: feeAmount,
      netAmount: amount,   // seller terima penuh sesuai saldo tersedia
      bankName: store.bankName!,
      bankAccount: store.bankAccount!,
      bankHolder: store.bankHolder!,
    },
  });

  return ok(withdrawal, 201);
}
