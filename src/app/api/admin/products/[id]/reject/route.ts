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

  await prisma.product.update({
    where: { id },
    data: { isActive: false, isCurated: false, rejectionReason: reason || null },
  });

  await createNotification({
    userId: product.store.userId,
    type: "product_rejected",
    title: "Karya Perlu Perbaikan ⚠️",
    body: reason
      ? `Karya "${product.name}" perlu diperbaiki: ${reason}`
      : `Karya "${product.name}" tidak lolos kurasi. Silakan perbaiki dan upload ulang.`,
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
