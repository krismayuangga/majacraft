import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { DisputeReason, DisputeAction } from "@prisma/client";
import { notifyDisputeCreated } from "@/lib/dispute-notifications";

// GET /api/disputes — list komplain user (buyer or seller)
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = session!.user!.id!;
  const role = searchParams.get("role") || "buyer"; // buyer or seller

  const where = role === "seller"
    ? { sellerId: userId }
    : { buyerId: userId };

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          items: {
            select: {
              productName: true,
              price: true,
              qty: true,
            },
          },
        },
      },
      buyer: { select: { name: true, image: true } },
      seller: { select: { name: true, image: true } },
      assignedAdmin: { select: { name: true, image: true } },
      _count: { select: { messages: true } },
    },
  });

  return ok(disputes);
}

// POST /api/disputes — submit komplain baru (buyer only)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const {
    orderId,
    orderItemId,
    reason,
    description,
    evidenceUrls,
    requestedAction,
  } = body;

  // Validation
  if (!orderId || !reason || !description || !requestedAction) {
    return err("Data tidak lengkap", 400);
  }

  // Verify order belongs to buyer
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { store: true },
          },
        },
      },
    },
  });

  if (!order) return err("Pesanan tidak ditemukan", 404);
  if (order.userId !== session!.user!.id!) {
    return err("Anda tidak berhak mengajukan komplain untuk pesanan ini", 403);
  }

  // Komplain dapat diajukan saat paket sedang/baru selesai pengiriman
  // dan sebelum transaksi final COMPLETED.
  if (order.status !== "SHIPPED" && order.status !== "DELIVERED") {
    return err("Komplain hanya bisa diajukan setelah pesanan diterima", 400);
  }

  // Check if already has active dispute
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      orderId,
      status: { in: ["PENDING_SELLER", "SELLER_RESPONDED", "IN_MEDIATION", "REFUND_PENDING", "REFUND_FAILED"] },
    },
  });

  if (existingDispute) {
    return err("Sudah ada komplain aktif untuk pesanan ini", 400);
  }

  // Check dispute deadline (max 3 days after shipment/delivered signal)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const disputeWindowStart = order.deliveredAt ?? order.shippedAt;
  if (disputeWindowStart && disputeWindowStart < threeDaysAgo) {
    return err("Batas waktu komplain sudah lewat (max 3 hari setelah diterima)", 400);
  }

  // Get seller ID
  const sellerId = order.items[0]?.product?.store?.userId;
  if (!sellerId) return err("Seller tidak ditemukan", 404);

  // Generate dispute number: DSP-YYYYMMDD-XXXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.dispute.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
      },
    },
  });
  const disputeNumber = `DSP-${dateStr}-${String(count + 1).padStart(5, "0")}`;

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      disputeNumber,
      orderId,
      orderItemId: orderItemId || null,
      buyerId: session!.user!.id!,
      sellerId,
      reason: reason as DisputeReason,
      description,
      evidenceUrls: evidenceUrls || [],
      requestedAction: requestedAction as DisputeAction,
      status: "PENDING_SELLER",
    },
  });

  // Create timeline entry
  await prisma.disputeTimeline.create({
    data: {
      disputeId: dispute.id,
      action: "created",
      description: `Komplain diajukan oleh pembeli`,
      actorId: session!.user!.id!,
      metadata: { reason, requestedAction },
    },
  });

  // Create system message
  await prisma.disputeMessage.create({
    data: {
      disputeId: dispute.id,
      senderId: session!.user!.id!,
      senderRole: "BUYER",
      message: `Komplain telah diajukan. Penjual memiliki 2x24 jam untuk merespons.`,
      isSystemMsg: true,
    },
  });

  await notifyDisputeCreated(dispute.id);

  return ok({ dispute, disputeNumber }, 201);
}
