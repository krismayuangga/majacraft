import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { DisputeResolution } from "@prisma/client";
import { notifyDisputeResolved } from "@/lib/dispute-notifications";
import { createRefund } from "@/lib/ipaymu";

const RESOLUTION_LABEL: Record<DisputeResolution, string> = {
  REFUND_APPROVED: "Refund disetujui",
  REFUND_REJECTED: "Refund ditolak",
  REPLACEMENT_SENT: "Penggantian barang dikirim",
  RETURN_APPROVED: "Retur disetujui",
  CLOSED_NO_ISSUE: "Ditutup tanpa masalah",
  CLOSED_RESOLVED: "Ditutup selesai",
  CLOSED_BUYER_FAULT: "Ditutup karena kesalahan pembeli",
};

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/disputes/[id]/resolve — resolve dispute
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Get user role from DB
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return err("Unauthorized", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { resolution, resolutionNotes, refundAmount } = body;

  if (!resolution) {
    return err("Resolution is required", 400);
  }

  const existingDispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      orderId: true,
      reason: true,
      requestedAction: true,
      returnTrackingNumber: true,
      returnReceivedAt: true,
      order: {
        select: {
          total: true,
          paymentRef: true,
          paymentMethod: true,
          status: true,
        },
      },
    },
  });

  if (!existingDispute) {
    return err("Komplain tidak ditemukan", 404);
  }

  if (["CLOSED", "CANCELLED"].includes(existingDispute.status)) {
    return err("Komplain sudah ditutup dan tidak dapat diproses refund", 400);
  }

  if (resolution === "REFUND_APPROVED" && refundAmount !== undefined && refundAmount !== null) {
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return err("Nominal refund tidak valid", 400);
    }
    if (amount > existingDispute.order.total) {
      return err("Nominal refund melebihi total pesanan", 400);
    }
  }

  const now = new Date();
  const isRefund = resolution === "REFUND_APPROVED";
  const amount = Number.isFinite(Number(refundAmount))
    ? Number(refundAmount)
    : existingDispute.order.total;

  const autoRefundEnabled = process.env.IPAYMU_AUTO_REFUND === "true";
  const hasRefundPath = Boolean(process.env.IPAYMU_REFUND_PATH);
  const needsReturnBeforeRefund =
    existingDispute.requestedAction === "RETURN_REFUND" ||
    existingDispute.reason !== "NOT_RECEIVED";

  if (isRefund) {
    if (needsReturnBeforeRefund && !existingDispute.returnReceivedAt) {
      if (!existingDispute.returnTrackingNumber) {
        return err("Refund belum bisa diproses: pembeli belum mengirim data resi retur", 400);
      }
      return err("Refund belum bisa diproses: barang retur belum dikonfirmasi diterima penjual", 400);
    }

    if (!existingDispute.order.paymentRef) {
      await prisma.dispute.update({
        where: { id },
        data: {
          status: "REFUND_FAILED",
          resolution: "REFUND_APPROVED",
          resolutionNotes: resolutionNotes || "Refund gagal: payment reference tidak ditemukan",
          refundAmount: amount,
          resolvedBy: session!.user!.id!,
        },
      });

      await prisma.disputeTimeline.create({
        data: {
          disputeId: id,
          action: "refund_failed",
          description: "Refund gagal: payment reference tidak ditemukan",
          actorId: session!.user!.id!,
        },
      });

      return err("Refund gagal otomatis: payment reference tidak ditemukan", 400);
    }

    await prisma.dispute.update({
      where: { id },
      data: {
        status: "REFUND_PENDING",
        resolution: "REFUND_APPROVED",
        resolutionNotes: resolutionNotes || null,
        refundAmount: amount,
        resolvedBy: session!.user!.id!,
      },
    });

    if (!autoRefundEnabled || !hasRefundPath) {
      await prisma.disputeTimeline.create({
        data: {
          disputeId: id,
          action: "refund_pending_manual",
          description: "Refund menunggu proses manual (endpoint gateway belum dikonfigurasi)",
          actorId: session!.user!.id!,
          metadata: { amount },
        },
      });

      await prisma.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: session!.user!.id!,
          senderRole: "ADMIN",
          message: "Refund disetujui dan masuk antrean proses manual. Sistem akan menunggu konfirmasi refund berhasil.",
          isSystemMsg: true,
        },
      });

      const pending = await prisma.dispute.findUnique({ where: { id } });
      return ok({
        dispute: pending,
        refundMode: "manual",
        message: "Auto refund belum aktif. Silakan proses refund manual dari dashboard iPaymu.",
      });
    }

    const refund = await createRefund({
      transactionId: existingDispute.order.paymentRef,
      amount,
      reason: resolutionNotes || `Refund dispute ${id}`,
      referenceId: existingDispute.orderId,
    });

    if (!refund.success) {
      await prisma.dispute.update({
        where: { id },
        data: {
          status: "REFUND_FAILED",
          adminNotes: refund.error || "Refund gateway gagal",
        },
      });

      await prisma.disputeTimeline.create({
        data: {
          disputeId: id,
          action: "refund_failed",
          description: `Refund gateway gagal${refund.error ? `: ${refund.error}` : ""}`,
          actorId: session!.user!.id!,
        },
      });

      await prisma.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: session!.user!.id!,
          senderRole: "ADMIN",
          message: `Refund gagal diproses otomatis.${refund.error ? ` ${refund.error}` : ""}`,
          isSystemMsg: true,
        },
      });

      return err(`Refund gateway gagal: ${refund.error ?? "unknown error"}`, 502);
    }

    await prisma.dispute.update({
      where: { id },
      data: {
        status: "REFUND_PENDING",
        adminNotes: refund.refundId
          ? `Refund gateway diajukan (${refund.refundId}) - menunggu konfirmasi`
          : "Refund gateway diajukan - menunggu konfirmasi",
      },
    });

    await prisma.disputeTimeline.create({
      data: {
        disputeId: id,
        action: "refund_submitted",
        description: "Refund berhasil diajukan ke gateway dan menunggu konfirmasi",
        actorId: session!.user!.id!,
        metadata: {
          resolution,
          resolutionNotes,
          refundAmount: amount,
          mode: "gateway",
          refundId: refund.refundId ?? null,
        },
      },
    });

    await prisma.disputeMessage.create({
      data: {
        disputeId: id,
        senderId: session!.user!.id!,
        senderRole: "ADMIN",
        message: "Refund sedang diproses di gateway. Komplain akan otomatis selesai setelah refund terkonfirmasi.",
        isSystemMsg: true,
      },
    });

    const updatedDispute = await prisma.dispute.findUnique({ where: { id } });
    return ok({ dispute: updatedDispute, refundMode: "gateway" });
  }

  await prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: resolution as DisputeResolution,
        resolutionNotes: resolutionNotes || null,
        resolvedAt: now,
        resolvedBy: session!.user!.id!,
      },
    });

  // Create timeline
  await prisma.disputeTimeline.create({
    data: {
      disputeId: id,
      action: "resolved",
      description: `Komplain diselesaikan oleh admin`,
      actorId: session!.user!.id!,
      metadata: { resolution, resolutionNotes },
    },
  });

  // Create system message
  await prisma.disputeMessage.create({
    data: {
      disputeId: id,
      senderId: session!.user!.id!,
      senderRole: "ADMIN",
      message: `Komplain telah diselesaikan. ${resolutionNotes || ""}`,
      isSystemMsg: true,
    },
  });

  await notifyDisputeResolved(id, RESOLUTION_LABEL[resolution as DisputeResolution] || String(resolution));

  const updatedDispute = await prisma.dispute.findUnique({ where: { id } });
  return ok({ dispute: updatedDispute, refundMode: "none" });
}
