import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildNewOrderEmailSeller, buildOrderConfirmEmail } from "@/lib/email";
import { notifyDisputeResolved } from "@/lib/dispute-notifications";

// POST /api/payment/callback — webhook notifikasi dari iPaymu
// iPaymu mengirim form-data atau JSON POST ke URL ini setelah pembayaran
export async function POST(req: NextRequest) {
  try {
    let data: Record<string, string> = {};

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      // iPaymu kadang kirim form-data
      const formData = await req.formData();
      formData.forEach((value, key) => { data[key] = String(value); });
    }

    const referenceId = data.reference_id ?? data.referenceId ?? data.trx_id;
    const status      = data.status ?? data.Status ?? "";
    const trxId       = data.trx_id ?? data.transactionId ?? "";

    // Log untuk debug — lihat di: pm2 logs majacraft
    console.log("[iPaymu callback] received:", JSON.stringify(data));
    console.log("[iPaymu callback] referenceId:", referenceId, "status:", status);

    if (!referenceId) {
      return NextResponse.json({ success: false, error: "Missing reference_id" }, { status: 400 });
    }

    // iPaymu status: "berhasil" / "pending" / "gagal"
    const statusLower = status.toLowerCase();

    let orderStatus: string | null = null;
    let escrowStatus: string | null = null;

    if (statusLower === "berhasil" || statusLower === "success" || statusLower === "1") {
      orderStatus  = "PROCESSING";
      escrowStatus = "LOCKED";
    } else if (statusLower === "refund" || statusLower === "3") {
      orderStatus = "REFUNDED";
      escrowStatus = "REFUNDED";
    } else if (statusLower === "gagal" || statusLower === "failed" || statusLower === "2") {
      orderStatus  = "CANCELLED";
      escrowStatus = "WAITING";
    }
    // "pending" → biarkan tetap PENDING_PAYMENT

    if (orderStatus) {
      await prisma.order.updateMany({
        where: { id: referenceId },
        data: {
          status: orderStatus as never,
          escrowStatus: escrowStatus as never,
          ...(orderStatus === "REFUNDED" && { paymentStatus: "REFUNDED" as never }),
          ...(trxId && { paymentRef: trxId }),
          ...(orderStatus === "PROCESSING" && { paidAt: new Date() }),
        },
      });

      // Jika callback menandakan refund sukses, sinkronkan dispute refund agar otomatis selesai.
      if (orderStatus === "REFUNDED") {
        const refundDispute = await prisma.dispute.findFirst({
          where: {
            orderId: referenceId,
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
                adminNotes: "Refund terkonfirmasi dari callback iPaymu",
              },
            });

            await tx.disputeTimeline.create({
              data: {
                disputeId: refundDispute.id,
                action: "refund_confirmed",
                description: "Refund terkonfirmasi oleh callback iPaymu",
                actorId: refundDispute.resolvedBy ?? refundDispute.buyerId,
                metadata: { callbackStatus: status },
              },
            });

            await tx.disputeMessage.create({
              data: {
                disputeId: refundDispute.id,
                senderId: refundDispute.resolvedBy ?? refundDispute.buyerId,
                senderRole: refundDispute.resolvedBy ? "ADMIN" : "BUYER",
                message: "Refund telah terkonfirmasi otomatis dari iPaymu.",
                isSystemMsg: true,
              },
            });
          });

          await notifyDisputeResolved(refundDispute.id, "Refund terkonfirmasi dari iPaymu");
        }
      }

      // Kirim notifikasi & email saat pembayaran sukses
      if (orderStatus === "PROCESSING") {
        try {
          const order = await prisma.order.findUnique({
            where: { id: referenceId },
            include: {
              user: { select: { email: true, name: true } },
              items: {
                include: {
                  product: {
                    include: {
                      store: {
                        include: { user: { select: { email: true } } },
                      },
                    },
                  },
                },
              },
              address: { select: { province: true, city: true } },
            },
          });

          if (order) {
            const storeUserId = order.items[0]?.product?.store?.userId;
            const storeName = order.items[0]?.product?.store?.name ?? "Toko";
            const sellerEmail = order.items[0]?.product?.store?.user?.email;
            const buyerEmail = order.user?.email;
            const buyerName = order.user?.name ?? "Pembeli";

            const itemsForEmail = order.items.map(i => ({
              productName: i.productName ?? i.product?.name ?? "Produk",
              qty: i.qty,
              price: i.price,
            }));

            // In-app notif → seller
            if (storeUserId) {
              await createNotification({
                userId: storeUserId,
                type: "new_order",
                title: "Pesanan Baru Masuk! 🛒",
                body: `Ada pesanan baru #${order.orderNumber} senilai Rp ${order.total.toLocaleString("id-ID")}. Segera proses!`,
                data: { orderId: order.id, orderNumber: order.orderNumber },
              });
            }

            // Email → seller
            if (sellerEmail) {
              sendEmail({
                to: sellerEmail,
                subject: `[MajaCraft] Pesanan Baru #${order.orderNumber}`,
                html: buildNewOrderEmailSeller(
                  { orderNumber: order.orderNumber, total: order.total, items: itemsForEmail, address: order.address },
                  storeName
                ),
              }).catch(e => console.error("[email seller]", e));
            }

            // Email → pembeli
            if (buyerEmail) {
              sendEmail({
                to: buyerEmail,
                subject: `[MajaCraft] Pembayaran Dikonfirmasi — #${order.orderNumber}`,
                html: buildOrderConfirmEmail(
                  { orderNumber: order.orderNumber, total: order.total, items: itemsForEmail, courierName: order.courierName, storeName },
                  buyerName
                ),
              }).catch(e => console.error("[email buyer]", e));
            }
          }
        } catch (e) {
          console.error("[callback notif error]", e);
        }
      }
    }

    // iPaymu mengharapkan response "OK"
    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("[iPaymu callback error]", e);
    return new NextResponse("ERROR", { status: 500 });
  }
}
