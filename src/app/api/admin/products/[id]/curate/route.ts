import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sendEmail, buildProductCuratedEmail } from "@/lib/email";

// POST /api/admin/products/[id]/curate — admin setujui kurasi
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
    data: { isCurated: true, curatedAt: new Date(), isActive: true, rejectionReason: null },
  });

  // In-app notif
  await createNotification({
    userId: product.store.userId,
    type: "product_curated",
    title: "Karya Lolos Kurasi! ✅",
    body: `Karya "${product.name}" telah lolos kurasi tim MajaCraft. Selamat, karya Anda sudah terverifikasi!`,
    data: { productId: product.id, productSlug: product.slug },
  });

  // Email ke seller
  const sellerEmail = product.store.user?.email;
  if (sellerEmail) {
    sendEmail({
      to: sellerEmail,
      subject: `[MajaCraft] Karya Anda Lolos Kurasi — ${product.name}`,
      html: buildProductCuratedEmail(product.name, product.slug),
    }).catch(e => console.error("[email curate]", e));
  }

  return ok({ message: "Produk lolos kurasi" });
}
