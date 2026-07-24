import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser, sendPushToUsers } from "@/lib/push";
import {
  sendEmail,
  buildDisputeCreatedEmail,
  buildDisputeStatusEmail,
} from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://majacraft.id";

const REASON_LABEL: Record<string, string> = {
  NOT_RECEIVED: "Barang tidak diterima",
  WRONG_ITEM: "Barang tidak sesuai",
  DAMAGED: "Barang rusak/cacat",
  INCOMPLETE: "Barang kurang",
  COUNTERFEIT: "Produk palsu/tidak autentik",
  NOT_AS_DESCRIBED: "Tidak sesuai deskripsi",
  OTHER: "Lainnya",
};

type DisputeContext = {
  id: string;
  disputeNumber: string;
  description: string;
  reason: string;
  orderId: string;
  order: { orderNumber: string };
  buyer: { id: string; name: string; email: string | null };
  seller: { id: string; name: string; email: string | null };
  assignedAdminId: string | null;
};

async function getDisputeContext(disputeId: string): Promise<DisputeContext | null> {
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      disputeNumber: true,
      description: true,
      reason: true,
      orderId: true,
      assignedAdminId: true,
      order: { select: { orderNumber: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });
}

function disputeUrl(orderId: string, disputeId: string) {
  return `${BASE_URL}/pesanan/${orderId}/komplain/${disputeId}`;
}

export async function notifyDisputeCreated(disputeId: string) {
  const ctx = await getDisputeContext(disputeId);
  if (!ctx) return;

  const title = "Komplain Baru Diterima";
  const body = `Komplain ${ctx.disputeNumber} diajukan pembeli. Mohon respons dalam 2x24 jam.`;

  await createNotification({
    userId: ctx.seller.id,
    type: "dispute_created",
    title,
    body,
    data: { disputeId: ctx.id, orderId: ctx.orderId },
  });

  await sendPushToUser(ctx.seller.id, title, body, { disputeId: ctx.id, orderId: ctx.orderId });

  if (ctx.seller.email) {
    sendEmail({
      to: ctx.seller.email,
      subject: `[MajaCraft] Komplain Baru ${ctx.disputeNumber}`,
      html: buildDisputeCreatedEmail({
        recipientName: ctx.seller.name,
        disputeNumber: ctx.disputeNumber,
        orderNumber: ctx.order.orderNumber,
        reasonLabel: REASON_LABEL[ctx.reason] ?? ctx.reason,
        description: ctx.description,
        detailUrl: disputeUrl(ctx.orderId, ctx.id),
      }),
    }).catch((e) => console.error("[dispute created email]", e));
  }
}

export async function notifyDisputeSellerResponded(disputeId: string, agreed: boolean) {
  const ctx = await getDisputeContext(disputeId);
  if (!ctx) return;

  const title = agreed ? "Penjual Menyetujui Komplain" : "Penjual Merespons Komplain";
  const body = agreed
    ? `Komplain ${ctx.disputeNumber} disetujui penjual dan sedang diproses.`
    : `Penjual sudah merespons komplain ${ctx.disputeNumber}.`;

  await createNotification({
    userId: ctx.buyer.id,
    type: "dispute_seller_responded",
    title,
    body,
    data: { disputeId: ctx.id, orderId: ctx.orderId, agreed },
  });

  await sendPushToUser(ctx.buyer.id, title, body, { disputeId: ctx.id, orderId: ctx.orderId, agreed });

  if (ctx.buyer.email) {
    sendEmail({
      to: ctx.buyer.email,
      subject: `[MajaCraft] Update Komplain ${ctx.disputeNumber}`,
      html: buildDisputeStatusEmail({
        recipientName: ctx.buyer.name,
        title: agreed ? "✅ Penjual Menyetujui Komplain" : "💬 Penjual Telah Merespons",
        message: body,
        disputeNumber: ctx.disputeNumber,
        orderNumber: ctx.order.orderNumber,
        detailUrl: disputeUrl(ctx.orderId, ctx.id),
      }),
    }).catch((e) => console.error("[dispute seller responded email]", e));
  }
}

export async function notifyDisputeEscalated(disputeId: string) {
  const ctx = await getDisputeContext(disputeId);
  if (!ctx) return;

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true, email: true, name: true },
  });

  const title = "Komplain Butuh Mediasi Admin";
  const body = `Komplain ${ctx.disputeNumber} dieskalasi dan menunggu mediator.`;

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "dispute_escalated",
        title,
        body,
        data: { disputeId: ctx.id, orderId: ctx.orderId },
      })
    )
  );

  await sendPushToUsers(
    admins.map((a) => a.id),
    title,
    body,
    { disputeId: ctx.id, orderId: ctx.orderId }
  );
}

export async function notifyDisputeAssigned(disputeId: string, adminName: string) {
  const ctx = await getDisputeContext(disputeId);
  if (!ctx) return;

  const title = "Mediator Sudah Ditugaskan";
  const body = `Admin ${adminName} akan memediasi komplain ${ctx.disputeNumber}.`;

  const targets = [ctx.buyer.id, ctx.seller.id];
  await Promise.all(
    targets.map((userId) =>
      createNotification({
        userId,
        type: "dispute_admin_assigned",
        title,
        body,
        data: { disputeId: ctx.id, orderId: ctx.orderId },
      })
    )
  );

  await sendPushToUsers(targets, title, body, { disputeId: ctx.id, orderId: ctx.orderId });
}

export async function notifyDisputeResolved(disputeId: string, resolutionLabel: string) {
  const ctx = await getDisputeContext(disputeId);
  if (!ctx) return;

  const title = "Komplain Diselesaikan";
  const body = `Komplain ${ctx.disputeNumber} selesai. Hasil: ${resolutionLabel}.`;

  const targets = [ctx.buyer.id, ctx.seller.id];
  await Promise.all(
    targets.map((userId) =>
      createNotification({
        userId,
        type: "dispute_resolved",
        title,
        body,
        data: { disputeId: ctx.id, orderId: ctx.orderId, resolution: resolutionLabel },
      })
    )
  );

  await sendPushToUsers(targets, title, body, {
    disputeId: ctx.id,
    orderId: ctx.orderId,
    resolution: resolutionLabel,
  });

  if (ctx.buyer.email) {
    sendEmail({
      to: ctx.buyer.email,
      subject: `[MajaCraft] Komplain ${ctx.disputeNumber} Diselesaikan`,
      html: buildDisputeStatusEmail({
        recipientName: ctx.buyer.name,
        title: "✅ Komplain Diselesaikan",
        message: body,
        disputeNumber: ctx.disputeNumber,
        orderNumber: ctx.order.orderNumber,
        detailUrl: disputeUrl(ctx.orderId, ctx.id),
      }),
    }).catch((e) => console.error("[dispute resolved buyer email]", e));
  }

  if (ctx.seller.email) {
    sendEmail({
      to: ctx.seller.email,
      subject: `[MajaCraft] Komplain ${ctx.disputeNumber} Diselesaikan`,
      html: buildDisputeStatusEmail({
        recipientName: ctx.seller.name,
        title: "✅ Komplain Diselesaikan",
        message: body,
        disputeNumber: ctx.disputeNumber,
        orderNumber: ctx.order.orderNumber,
        detailUrl: disputeUrl(ctx.orderId, ctx.id),
      }),
    }).catch((e) => console.error("[dispute resolved seller email]", e));
  }
}

export async function notifyDisputeCancelled(disputeId: string) {
  const ctx = await getDisputeContext(disputeId);
  if (!ctx) return;

  const title = "Komplain Dibatalkan Pembeli";
  const body = `Komplain ${ctx.disputeNumber} telah dibatalkan oleh pembeli.`;

  await createNotification({
    userId: ctx.seller.id,
    type: "dispute_cancelled",
    title,
    body,
    data: { disputeId: ctx.id, orderId: ctx.orderId },
  });

  await sendPushToUser(ctx.seller.id, title, body, { disputeId: ctx.id, orderId: ctx.orderId });
}
