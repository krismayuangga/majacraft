import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

// POST /api/orders/[id]/confirm — pembeli konfirmasi penerimaan barang
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const userId = session!.user!.id!;

  const order = await prisma.order.findUnique({
    where: { id, userId },
    include: {
      items: { include: { product: { include: { store: { include: { user: { select: { id: true, email: true } } } } } } } },
    },
  });
  if (!order) return err("Pesanan tidak ditemukan", 404);
  if (order.status !== "SHIPPED") return err("Pesanan belum dalam status dikirim");

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "COMPLETED",
      escrowStatus: "RELEASING",
      deliveredAt: new Date(),
    },
  });

  // Notifikasi ke seller
  const storeUserId = order.items[0]?.product?.store?.user?.id;
  const storeUserEmail = order.items[0]?.product?.store?.user?.email;
  if (storeUserId) {
    await createNotification({
      userId: storeUserId,
      type: "order_status",
      title: "Pembeli Konfirmasi Penerimaan! ✅",
      body: `Pesanan #${order.orderNumber} telah diterima pembeli. Dana escrow akan segera diproses.`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }
  if (storeUserEmail) {
    sendEmail({
      to: storeUserEmail,
      subject: `[MajaCraft] Pesanan #${order.orderNumber} Selesai — Dana Segera Dicairkan`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h2 style="color:#B8922A">Pesanan Selesai!</h2>
        <p>Pembeli telah mengkonfirmasi penerimaan pesanan <strong>#${order.orderNumber}</strong>.</p>
        <p>Status escrow diubah ke <strong>Releasing</strong>. Dana Anda akan segera dapat dicairkan dari dashboard Studio.</p>
        <p style="color:#888;font-size:12px">MajaCraft · majacraft.id</p>
      </div>`,
    }).catch(e => console.error("[email completed]", e));
  }

  return ok(updated);
}
