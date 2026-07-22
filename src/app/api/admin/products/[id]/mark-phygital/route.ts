import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// POST /api/admin/products/[id]/mark-phygital — toggle phygital (hasCertificate)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, hasCertificate: true, certificateId: true } });
  if (!product) return err("Produk tidak ditemukan", 404);

  // Jika sudah punya certificateId (NFT sudah minted), tidak bisa di-toggle
  if (product.certificateId) return err("NFT sudah di-generate, tidak bisa dibatalkan", 400);

  const updated = await prisma.product.update({
    where: { id },
    data: { hasCertificate: !product.hasCertificate },
  });

  return ok({
    hasCertificate: updated.hasCertificate,
    message: updated.hasCertificate ? "Produk ditandai sebagai Phygital" : "Tanda Phygital dicabut",
  });
}
