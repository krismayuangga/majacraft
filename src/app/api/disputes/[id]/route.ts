import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/disputes/[id] — get dispute detail
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          status: true,
          items: {
            select: {
              productName: true,
              price: true,
              qty: true,
              product: {
                select: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      },
      buyer: { select: { id: true, name: true, image: true, email: true } },
      seller: { select: { id: true, name: true, image: true, email: true } },
      assignedAdmin: { select: { id: true, name: true, image: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { name: true, image: true } },
        },
      },
      timeline: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);

  // Verify access: only buyer, seller, or admin can view
  const userId = session!.user!.id!;
  
  // Get user role from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isParticipant =
    dispute.buyerId === userId ||
    dispute.sellerId === userId ||
    dispute.assignedAdminId === userId ||
    user?.role === "ADMIN";

  if (!isParticipant) {
    return err("Anda tidak memiliki akses ke komplain ini", 403);
  }

  return ok(dispute);
}

// PATCH /api/disputes/[id] — return logistics actions
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const userId = session!.user!.id!;

  const payload = await req.json().catch(() => ({}));
  const action = String(payload?.action ?? "").trim();

  if (!action) return err("Action wajib diisi", 400);

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      assignedAdminId: true,
      status: true,
      resolution: true,
      reason: true,
      requestedAction: true,
      returnTrackingNumber: true,
      returnShippedAt: true,
      returnReceivedAt: true,
    },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";
  const isBuyer = dispute.buyerId === userId;
  const isSeller = dispute.sellerId === userId;

  if (!isAdmin && !isBuyer && !isSeller && dispute.assignedAdminId !== userId) {
    return err("Anda tidak memiliki akses ke komplain ini", 403);
  }

  const isReturnFlow =
    dispute.requestedAction === "RETURN_REFUND" ||
    dispute.resolution === "RETURN_APPROVED" ||
    dispute.resolution === "REFUND_APPROVED" ||
    dispute.reason !== "NOT_RECEIVED";

  if (!isReturnFlow) {
    return err("Komplain ini tidak menggunakan alur retur", 400);
  }

  if (action === "submit_return_tracking") {
    if (!isBuyer) return err("Hanya pembeli yang dapat mengirim data retur", 403);
    if (dispute.returnTrackingNumber) return err("Data resi retur sudah dikirim", 400);
    if (["CLOSED", "CANCELLED"].includes(dispute.status)) {
      return err("Komplain sudah ditutup", 400);
    }

    const courier = String(payload?.courier ?? "").trim();
    const trackingNumber = String(payload?.trackingNumber ?? "").trim();
    const shippingPayer = String(payload?.shippingPayer ?? "BUYER").trim().toUpperCase();

    if (!courier || !trackingNumber) {
      return err("Kurir dan nomor resi wajib diisi", 400);
    }

    if (!/[A-Za-z0-9-]{6,40}/.test(trackingNumber)) {
      return err("Nomor resi tidak valid", 400);
    }

    if (!["BUYER", "SELLER"].includes(shippingPayer)) {
      return err("Penanggung ongkir retur tidak valid", 400);
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id },
        data: {
          status: "REFUND_PENDING",
          resolvedAt: null,
          returnCourier: courier,
          returnTrackingNumber: trackingNumber,
          returnShippingPayer: shippingPayer,
          returnShippedAt: now,
        },
      });

      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: "return_shipped",
          description: `Pembeli mengirim barang retur via ${courier} (resi: ${trackingNumber})`,
          actorId: userId,
          metadata: { courier, trackingNumber, shippingPayer },
        },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: userId,
          senderRole: "BUYER",
          message: `Data retur dikirim: ${courier} / ${trackingNumber}. Ongkir retur ditanggung ${shippingPayer === "SELLER" ? "penjual" : "pembeli"}.`,
          isSystemMsg: true,
        },
      });
    });

    const updated = await prisma.dispute.findUnique({ where: { id } });
    return ok(updated);
  }

  if (action === "confirm_return_received") {
    if (!isSeller && !isAdmin) {
      return err("Hanya penjual/admin yang dapat konfirmasi barang retur diterima", 403);
    }
    if (!dispute.returnTrackingNumber) {
      return err("Resi retur belum dikirim pembeli", 400);
    }
    if (dispute.returnReceivedAt) {
      return err("Barang retur sudah dikonfirmasi diterima", 400);
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id },
        data: { status: "IN_MEDIATION", returnReceivedAt: now },
      });

      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          action: "return_received",
          description: "Barang retur dikonfirmasi telah diterima penjual",
          actorId: userId,
        },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: userId,
          senderRole: isAdmin ? "ADMIN" : "SELLER",
          message: "Barang retur telah diterima penjual. Admin dapat melanjutkan proses refund.",
          isSystemMsg: true,
        },
      });
    });

    const updated = await prisma.dispute.findUnique({ where: { id } });
    return ok(updated);
  }

  return err("Action tidak dikenali", 400);
}
