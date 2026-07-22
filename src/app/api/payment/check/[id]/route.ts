import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { checkTransaction } from "@/lib/ipaymu";

// GET /api/payment/check/[id] — cek status pembayaran order
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, paymentRef: true, total: true, orderNumber: true },
  });

  if (!order) return err("Pesanan tidak ditemukan", 404);

  // Kalau sudah PROCESSING atau lebih, tidak perlu cek iPaymu
  if (order.status !== "PENDING_PAYMENT") {
    return ok({ status: order.status, orderNumber: order.orderNumber });
  }

  // Cek ke iPaymu jika ada transactionId
  if (order.paymentRef) {
    const ipaymuData = await checkTransaction(order.paymentRef);
    if (ipaymuData?.Status === 200) {
      const ipaymuStatus = String(ipaymuData.Data?.Status ?? "").toLowerCase();
      if (ipaymuStatus === "berhasil" || ipaymuStatus === "1") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "PROCESSING", escrowStatus: "LOCKED", paidAt: new Date() },
        });
        return ok({ status: "PROCESSING", orderNumber: order.orderNumber });
      }
    }
  }

  return ok({ status: order.status, orderNumber: order.orderNumber });
}
