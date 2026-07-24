import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildProductRejectedEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason: string = body.reason ?? "";

  const product = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { userId: true, user: { select: { email: true } } } } },
  });
  if (!product) return err("Produk tidak ditemukan", 404);

  // Produk TETAP PUBLIK — hanya dikirim masukan/notifikasi ke seller untuk perbaikan
  // Admin bisa nonaktifkan produk secara manual jika ada pelanggaran serius
  await prisma.product.update({
    where: { id },
    data: { isModerated: false, moderatedAt: new Date(), rejectionReason: reason || null },
  });

  await createNotification({
    userId: product.store.userId,
    type: "product_rejected",
    title: "Produk Ditolak ⚠️",
    body: reason
      ? `Produk "${product.name}" ditolak: ${reason}`
      : `Produk "${product.name}" tidak sesuai panduan platform. Silakan perbaiki dan upload ulang.`,
    data: { productId: product.id, productSlug: product.slug, reason },
  });

  // Email ke seller
  const sellerEmail = product.store.user?.email;
  if (sellerEmail) {
    sendEmail({
      to: sellerEmail,
      subject: `[MajaCraft] Karya Perlu Diperbaiki — ${product.name}`,
      html: buildProductRejectedEmail(product.name, reason),
    }).catch(e => console.error("[email reject]", e));
  }

  return ok({ message: "Produk ditolak dan seller diberitahu" });
}
