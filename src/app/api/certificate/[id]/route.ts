import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

// GET /api/certificate/[id] — verifikasi publik (tanpa login)
// Diakses melalui QR code pada sertifikat fisik/digital
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Sanitasi input — hanya format MAJA-YYYY-XXXXXXXX yang valid
  if (!/^MAJA-\d{4}-[A-Z0-9]{12}$/.test(id)) {
    return err("Format ID sertifikat tidak valid", 400);
  }

  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      productName: true,
      material: true,
      dimensions: true,
      weight: true,
      origin: true,
      sellerName: true,
      sellerStore: true,
      buyerName: true,   // nama depan + inisial saja (privasi)
      imageUrl: true,
      nftTokenId: true,
      nftTxHash: true,
      nftMintedAt: true,
      transferredAt: true,
      issuedAt: true,
      product: {
        select: {
          id: true,
          slug: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          store: { select: { slug: true, isVerified: true } },
        },
      },
    },
  });

  if (!cert) return err("Sertifikat tidak ditemukan", 404);

  // Sembunyikan nama lengkap buyer — hanya tampilkan inisial untuk privasi
  let buyerDisplay: string | null = null;
  if (cert.buyerName) {
    const parts = cert.buyerName.trim().split(" ");
    buyerDisplay =
      parts.length > 1
        ? `${parts[0]} ${parts.slice(1).map((p) => p[0] + ".").join(" ")}`
        : parts[0];
  }

  return ok({
    certificate: {
      id: cert.id,
      productName: cert.productName,
      material: cert.material,
      dimensions: cert.dimensions,
      weight: cert.weight,
      origin: cert.origin,
      artisan: cert.sellerName,
      studio: cert.sellerStore,
      studioVerified: cert.product.store.isVerified,
      owner: buyerDisplay,
      imageUrl: cert.imageUrl,
      blockchain: {
        tokenId: cert.nftTokenId,
        txHash: cert.nftTxHash,
        mintedAt: cert.nftMintedAt,
        transferredAt: cert.transferredAt,
        network: cert.nftTokenId ? "BSC (BNB Smart Chain)" : null,
      },
      issuedAt: cert.issuedAt,
      productSlug: cert.product.slug,
      productImage: cert.product.images[0]?.url ?? null,
    },
    isValid: true,
  });
}
