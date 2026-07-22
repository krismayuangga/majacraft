import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { trackWaybill } from "@/lib/rajaongkir";

// GET /api/orders/[id]/tracking — live tracking resi untuk buyer pemilik order
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const userId = session!.user!.id!;

  const order = await prisma.order.findUnique({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      courierName: true,
      courierService: true,
      trackingNumber: true,
      estimatedArrival: true,
      shippedAt: true,
      deliveredAt: true,
    },
  });

  if (!order) return err("Pesanan tidak ditemukan", 404);
  if (!order.trackingNumber) return err("Nomor resi belum tersedia", 400);
  if (!order.courierName) return err("Data kurir belum tersedia", 400);

  try {
    const live = await trackWaybill({
      waybill: order.trackingNumber,
      courier: order.courierName,
    });

    return ok({
      source: "live",
      courierName: order.courierName,
      courierService: order.courierService,
      trackingNumber: order.trackingNumber,
      status: live.status,
      delivered: live.delivered,
      lastUpdate: live.lastUpdate,
      events: live.events,
      estimatedArrival: order.estimatedArrival,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    });
  } catch {
    // Fallback agar halaman buyer tetap bisa menampilkan info pengiriman walau provider timeout/error.
    return ok({
      source: "fallback",
      courierName: order.courierName,
      courierService: order.courierService,
      trackingNumber: order.trackingNumber,
      status: order.status === "DELIVERED" || order.status === "COMPLETED" ? "Diterima" : "Dalam pengiriman",
      delivered: order.status === "DELIVERED" || order.status === "COMPLETED",
      lastUpdate: order.deliveredAt ?? order.shippedAt,
      events: [],
      estimatedArrival: order.estimatedArrival,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      warning: "Tracking live sementara tidak tersedia",
    });
  }
}
