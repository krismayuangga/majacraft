import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { notifyDisputeResolved } from "@/lib/dispute-notifications";

// POST /api/admin/disputes/[id]/confirm-refund
// Admin menandai bahwa transfer refund manual sudah dilakukan
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const adminUser = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { role: true },
  });
  if (adminUser?.role !== "ADMIN") return err("Unauthorized", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const adminNote = String(body?.adminNote ?? "").trim() || "Transfer manual dikonfirmasi admin";

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      resolution: true,
      orderId: true,
      buyerId: true,
      refundAmount: true,
      resolvedBy: true,
    },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);
  if (dispute.status !== "REFUND_PENDING") {
    return err("Hanya komplain berstatus REFUND_PENDING yang dapat dikonfirmasi", 400);
  }
  if (dispute.resolution !== "REFUND_APPROVED") {
    return err("Resolusi harus REFUND_APPROVED sebelum konfirmasi transfer", 400);
  }

  const now = new Date();
  const adminId = session!.user!.id!;

  await prisma.$transaction(async (tx) => {
    // Update order
    await tx.order.update({
      where: { id: dispute.orderId },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
        escrowStatus: "REFUNDED",
      },
    });

    // Update dispute
    await tx.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        refundedAt: now,
        resolvedAt: now,
        resolvedBy: adminId,
        adminNotes: adminNote,
      },
    });

    // Timeline
    await tx.disputeTimeline.create({
      data: {
        disputeId: id,
        action: "refund_transferred",
        description: `Refund manual dikonfirmasi telah ditransfer oleh admin. ${adminNote}`,
        actorId: adminId,
        metadata: {
          refundAmount: dispute.refundAmount,
          confirmedBy: adminId,
          note: adminNote,
        },
      },
    });

    // System message di chat
    await tx.disputeMessage.create({
      data: {
        disputeId: id,
        senderId: adminId,
        senderRole: "ADMIN",
        message: `✅ Refund telah ditransfer secara manual oleh admin. Dana akan masuk ke metode pembayaran asal Anda dalam 1-3 hari kerja.`,
        isSystemMsg: true,
      },
    });
  });

  await notifyDisputeResolved(id, "Refund berhasil ditransfer admin");

  const updated = await prisma.dispute.findUnique({ where: { id } });
  return ok({ dispute: updated, message: "Konfirmasi transfer berhasil. Dispute selesai." });
}
