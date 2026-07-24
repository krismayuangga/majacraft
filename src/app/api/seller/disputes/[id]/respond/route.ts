import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { notifyDisputeSellerResponded } from "@/lib/dispute-notifications";

type Params = { params: Promise<{ id: string }> };

// POST /api/seller/disputes/[id]/respond — seller response to dispute
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { agreed, response } = body;

  if (typeof agreed !== "boolean" || !response?.trim()) {
    return err("Data tidak lengkap", 400);
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      sellerId: true,
      buyerId: true,
      status: true,
      sellerResponse: true,
      requestedAction: true,
      orderId: true,
      order: { select: { total: true } },
    },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);

  // Verify seller
  if (dispute.sellerId !== session!.user!.id!) {
    return err("Anda tidak berhak merespons komplain ini", 403);
  }

  // Can only respond if pending
  if (dispute.status !== "PENDING_SELLER") {
    return err("Komplain sudah direspons atau diselesaikan", 400);
  }

  // Update dispute
  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      sellerResponse: response.trim(),
      sellerAgreed: agreed,
      sellerRespondedAt: new Date(),
      status: "SELLER_RESPONDED",
    },
  });

  // Create timeline entry
  await prisma.disputeTimeline.create({
    data: {
      disputeId: id,
      action: "seller_responded",
      description: `Penjual ${agreed ? "menyetujui" : "menolak"} komplain`,
      actorId: session!.user!.id!,
      metadata: { agreed },
    },
  });

  // Create message
  await prisma.disputeMessage.create({
    data: {
      disputeId: id,
      senderId: session!.user!.id!,
      senderRole: "SELLER",
      message: response.trim(),
    },
  });

  // If seller agrees, auto-resolve based on requested action
  if (agreed) {
    const isRefundFlow = ["REFUND_FULL", "REFUND_PARTIAL", "RETURN_REFUND"].includes(dispute.requestedAction);
    const resolution = "CLOSED_RESOLVED";

    if (isRefundFlow) {
      await prisma.dispute.update({
        where: { id },
        data: {
          status: "IN_MEDIATION",
          adminNotes: "Penjual menyetujui refund. Menunggu admin mengeksekusi refund.",
        },
      });

      await prisma.disputeTimeline.create({
        data: {
          disputeId: id,
          action: "awaiting_admin_refund",
          description: "Menunggu admin mengeksekusi refund sesuai kesepakatan",
          actorId: session!.user!.id!,
        },
      });
    } else {
      await prisma.dispute.update({
        where: { id },
        data: {
          status: "RESOLVED",
          resolution,
          resolvedAt: new Date(),
          resolvedBy: session!.user!.id!,
        },
      });
    }

    await prisma.disputeMessage.create({
      data: {
        disputeId: id,
        senderId: session!.user!.id!,
        senderRole: "SELLER",
        message: isRefundFlow
          ? "Penjual menyetujui komplain. Menunggu admin mengeksekusi refund."
          : "Penjual menyetujui komplain dan transaksi diselesaikan.",
        isSystemMsg: true,
      },
    });
  }

  await notifyDisputeSellerResponded(id, agreed);

  return ok(updated);
}
