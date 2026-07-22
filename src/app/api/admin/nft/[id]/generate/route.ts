import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { generateCertificateImageV2 } from "@/lib/certificate-generator-v2";
// v1 backup: import { generateCertificateImage } from "@/lib/certificate-generator";

// Generate certificate ID — format: MAJA-YYYY-XXXXXXXX
function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const hex = Array.from(
    { length: 8 },
    () => Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join("");
  const seq = Date.now().toString(36).toUpperCase().slice(-4);
  return `MAJA-${year}-${seq}${hex}`;
}

// POST /api/admin/nft/[id]/generate — generate Soulbound Certificate untuk produk
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      store: { select: { userId: true, name: true, user: { select: { name: true } } } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });
  if (!product) return err("Produk tidak ditemukan", 404);
  if (!product.hasCertificate) return err("Produk belum ditandai sebagai Phygital", 400);
  if (product.certificateId) return err("Sertifikat sudah pernah di-generate", 400);

  const certificateId = generateCertificateId();
  const issuedAt = new Date();

  // Dimensi dari field DB
  const dims =
    product.length && product.width && product.height
      ? `${product.length} × ${product.width} × ${product.height} cm`
      : product.dimensions ?? null;

  const weightStr = product.weight ? `${product.weight} gram` : null;

  // Generate gambar sertifikat
  const primaryImage = product.images[0]?.url ?? null;
  let imageUrl: string | null = null;
  try {
    imageUrl = await generateCertificateImageV2({
      data: {
        certificateId,
        productName: product.name,
        material: product.material,
        dimensions: dims,
        weight: weightStr,
        origin: product.origin,
        sellerName: product.store.user.name,
        sellerStore: product.store.name,
        studioName: product.store.name,
        issuedAt,
      },
      productImagePath: primaryImage,
      verifyBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://majacraft.id",
    });
  } catch {
    // Lanjutkan meski gambar gagal generate; ID tetap disimpan
  }

  // Simpan ke tabel Certificate + update Product
  await prisma.$transaction([
    prisma.certificate.create({
      data: {
        id: certificateId,
        productId: product.id,
        sellerName: product.store.user.name,
        sellerStore: product.store.name,
        productName: product.name,
        material: product.material,
        dimensions: dims,
        weight: weightStr,
        origin: product.origin,
        productImageUrl: primaryImage,
        imageUrl,
        issuedAt,
      },
    }),
    prisma.product.update({
      where: { id },
      data: { certificateId, nftMintedAt: issuedAt },
    }),
  ]);

  // Notifikasi ke seller
  await createNotification({
    userId: product.store.userId,
    type: "system",
    title: "Sertifikat Phygital Terbit! 🎉",
    body: `Karya "${product.name}" kini memiliki Sertifikat Phygital dengan ID: ${certificateId}`,
    data: { productId: product.id, certificateId },
  });

  return ok({
    certificateId,
    imageUrl,
    message: `Sertifikat berhasil di-generate: ${certificateId}`,
  });
}
