import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { checkTransaction } from "@/lib/ipaymu";
import { notifyDisputeResolved } from "@/lib/dispute-notifications";

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

  // Cek ke iPaymu jika ada transactionId
  if (order.paymentRef) {
    const ipaymuData = await checkTransaction(order.paymentRef);
    if (ipaymuData?.Status === 200) {
      const ipaymuStatus = String(ipaymuData.Data?.Status ?? "").toLowerCase();
      if (ipaymuStatus === "berhasil" || ipaymuStatus === "1") {
        if (order.status === "PENDING_PAYMENT") {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "PROCESSING", escrowStatus: "LOCKED", paidAt: new Date() },
          });
          return ok({ status: "PROCESSING", orderNumber: order.orderNumber });
        }

        return ok({ status: order.status, orderNumber: order.orderNumber });
      }
      if (ipaymuStatus === "refund" || ipaymuStatus === "3") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "REFUNDED", paymentStatus: "REFUNDED", escrowStatus: "REFUNDED" },
        });

        const refundDispute = await prisma.dispute.findFirst({
          where: {
            orderId,
            status: { in: ["REFUND_PENDING", "REFUND_FAILED", "IN_MEDIATION"] },
            resolution: "REFUND_APPROVED",
          },
          orderBy: { createdAt: "desc" },
        });

        if (refundDispute) {
          await prisma.$transaction(async (tx) => {
            await tx.dispute.update({
              where: { id: refundDispute.id },
              data: {
                status: "RESOLVED",
                refundedAt: new Date(),
                resolvedAt: refundDispute.resolvedAt ?? new Date(),
                adminNotes: "Refund terkonfirmasi dari check status iPaymu",
              },
            });

            await tx.disputeTimeline.create({
              data: {
                disputeId: refundDispute.id,
                action: "refund_confirmed",
                description: "Refund terkonfirmasi dari check status iPaymu",
                actorId: refundDispute.resolvedBy ?? refundDispute.buyerId,
                metadata: { source: "payment-check", ipaymuStatus: ipaymuData.Data?.Status },
              },
            });

            await tx.disputeMessage.create({
              data: {
                disputeId: refundDispute.id,
                senderId: refundDispute.resolvedBy ?? refundDispute.buyerId,
                senderRole: refundDispute.resolvedBy ? "ADMIN" : "BUYER",
                message: "Refund telah terkonfirmasi otomatis dari pengecekan status iPaymu.",
                isSystemMsg: true,
              },
            });
          });

          await notifyDisputeResolved(refundDispute.id, "Refund terkonfirmasi dari iPaymu");
        }

        return ok({ status: "REFUNDED", orderNumber: order.orderNumber });
      }
    }
  }

  return ok({ status: order.status, orderNumber: order.orderNumber });
}
