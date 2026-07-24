import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildProductModeratedEmail } from "@/lib/email";

// POST /api/admin/products/[id]/moderate — admin approve moderation (manually verify if needed)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { userId: true, user: { select: { email: true } } } } },
  });
  if (!product) return err("Produk tidak ditemukan", 404);

  await prisma.product.update({
    where: { id },
    data: { isModerated: true, moderatedAt: new Date(), isActive: true, rejectionReason: null },
  });

  // In-app notif
  await createNotification({
    userId: product.store.userId,
    type: "product_moderated",
    title: "Produk Disetujui! ✅",
    body: `Produk "${product.name}" telah disetujui dan aktif di marketplace.`,
    data: { productId: product.id, productSlug: product.slug },
  });

  // Email ke seller
  const sellerEmail = product.store.user?.email;
  if (sellerEmail) {
    sendEmail({
      to: sellerEmail,
      subject: `[MajaCraft] Produk Disetujui — ${product.name}`,
      html: buildProductModeratedEmail(product.name, product.slug),
    }).catch(e => console.error("[email moderate]", e));
  }

  return ok({ message: "Produk disetujui" });
}
