import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { sendEmail, buildOrderShippedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { trackWaybill } from "@/lib/rajaongkir";

const TRACKING_REGEX = /^[A-Z0-9]+$/;

function normalizeCourier(raw: unknown) {
  return String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
}

function normalizeTracking(raw: unknown) {
  return String(raw ?? "").trim().toUpperCase().replace(/[\s-]+/g, "");
}

// POST /api/studio/orders/[id]/ship — seller input no resi dan kirim
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const payload = await req.json();
  const trackingNumber = normalizeTracking(payload?.trackingNumber);
  const courierName = normalizeCourier(payload?.courierName);
  const courierService = normalizeCourier(payload?.courierService);

  if (!trackingNumber) return err("Nomor resi wajib diisi");
  if (trackingNumber.length < 8 || trackingNumber.length > 30) {
    return err("Nomor resi harus 8-30 karakter");
  }
  if (!TRACKING_REGEX.test(trackingNumber)) {
    return err("Nomor resi hanya boleh huruf dan angka tanpa spasi/simbol");
  }

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const order = await prisma.order.findFirst({
    where: { id, items: { some: { product: { storeId: store.id } } } },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  if (!order) return err("Pesanan tidak ditemukan", 404);
  if (order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "COMPLETED") {
    return err("Pesanan sudah dikirim sebelumnya", 409);
  }
  if (order.status !== "PROCESSING") return err("Pesanan belum dalam status diproses");

  const finalCourierName = courierName || order.courierName || "Kurir";
  const finalCourierService = courierService || order.courierService || null;

  // Hard check: resi harus bisa dilacak secara live sebelum status berubah ke SHIPPED.
  try {
    const live = await trackWaybill({
      waybill: trackingNumber,
      courier: finalCourierName,
    });

    const noLiveSignal = live.events.length === 0 && /not\s*found|tidak\s*ditemukan|invalid|unknown|belum/i.test(live.status);
    if (noLiveSignal) {
      return err("Nomor resi belum terdeteksi di sistem kurir. Gunakan resi aktif yang valid.", 422);
    }
  } catch {
    return err("Nomor resi belum terdeteksi di sistem kurir. Gunakan resi aktif yang valid.", 422);
  }

  await prisma.order.update({
    where: { id },
    data: {
      status: "SHIPPED",
      trackingNumber,
      courierName: finalCourierName,
      courierService: finalCourierService,
      shippedAt: new Date(),
    },
  });

  // Email ke pembeli — pesanan dikirim + nomor resi
  if (order.user?.email) {
    sendEmail({
      to: order.user.email,
      subject: `[MajaCraft] Pesananmu #${order.orderNumber} Sedang Dikirim!`,
      html: buildOrderShippedEmail(
        {
          orderNumber: order.orderNumber,
          trackingNumber,
          courierName: finalCourierService ? `${finalCourierName} ${finalCourierService}` : finalCourierName,
          items: order.items.map(i => ({
            productName: i.productName ?? i.product?.name ?? "Produk",
            qty: i.qty,
          })),
        },
        order.user.name ?? "Pembeli"
      ),
    }).catch(e => console.error("[email shipped]", e));
  }

  // In-app notifikasi ke buyer
  await createNotification({
    userId: order.userId,
    type: "order_status",
    title: "Pesananmu Sedang Dalam Perjalanan! 🚚",
    body: `Pesanan #${order.orderNumber} dikirim via ${finalCourierService ? `${finalCourierName} ${finalCourierService}` : finalCourierName} - Resi: ${trackingNumber}`,
    data: { orderId: order.id, trackingNumber },
  });

  return ok({ message: "Pesanan ditandai sudah dikirim" });
}
