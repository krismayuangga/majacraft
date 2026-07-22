import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { createRedirectPayment } from "@/lib/ipaymu";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://majacraft.id";

// POST /api/payment/create — buat pembayaran iPaymu dari orderId
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { orderId } = await req.json();
  if (!orderId) return err("orderId wajib diisi");

  const userId = session!.user!.id!;

  // Ambil order + items + user profile (termasuk phone)
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) return err("Pesanan tidak ditemukan", 404);
  if (order.status !== "PENDING_PAYMENT") {
    return err("Pesanan tidak dalam status menunggu pembayaran");
  }

  // Validasi env vars iPaymu sebelum call
  if (!process.env.IPAYMU_VA || !process.env.IPAYMU_API_KEY) {
    console.error("[payment/create] IPAYMU_VA / IPAYMU_API_KEY tidak diset di .env");
    return err("Konfigurasi payment gateway belum lengkap", 500);
  }

  const products = order.items.map((item) => ({
    name: item.product?.name ?? item.productName,
    qty: item.qty,
    price: item.price,
  }));

  // Tambahkan ongkir sebagai line item agar iPaymu hitung total yang benar
  if (order.shippingCost > 0) {
    products.push({
      name: `Ongkos Kirim (${order.courierName ?? "Kurir"})`,
      qty: 1,
      price: order.shippingCost,
    });
  }

  const result = await createRedirectPayment({
    orderId: order.id,
    amount: order.total,
    products,
    buyer: {
      name:  order.user?.name  ?? "Pembeli",
      email: order.user?.email ?? "",
      phone: order.user?.phone ?? "08000000000",
    },
    returnUrl:  `${SITE_URL}/pesanan?ref=${order.id}`,
    cancelUrl:  `${SITE_URL}/checkout?cancel=${order.id}`,
    notifyUrl:  `${SITE_URL}/api/payment/callback`,
  });

  if (!result.success) {
    console.error("[payment/create] iPaymu error:", result.error);
    return err(result.error ?? "Gagal membuat pembayaran");
  }

  // Simpan sessionId iPaymu ke order
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentRef: result.sessionId ?? null },
  });

  return ok({ url: result.url, sessionId: result.sessionId, orderId: order.id });
}
