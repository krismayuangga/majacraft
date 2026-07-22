/**
 * Script: update imageUrl untuk sertifikat yang sudah ada di DB
 * Jalankan: npx tsx scripts/update-cert-images.ts
 */
import { PrismaClient } from "@prisma/client";
import { generateCertificateImage } from "../src/lib/certificate-generator";

const prisma = new PrismaClient();

async function main() {
  // Ambil semua certificate yang belum punya imageUrl
  const certs = await prisma.certificate.findMany({
    where: { imageUrl: null },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });

  if (certs.length === 0) {
    console.log("Tidak ada sertifikat yang perlu di-update.");
    return;
  }

  console.log(`Found ${certs.length} certificate(s) to update...`);

  for (const cert of certs) {
    console.log(`\nGenerating image for: ${cert.id}`);

    try {
      const dims =
        cert.product.length && cert.product.width && cert.product.height
          ? `${cert.product.length} × ${cert.product.width} × ${cert.product.height} cm`
          : cert.dimensions ?? null;

      const imageUrl = await generateCertificateImage({
        data: {
          certificateId: cert.id,
          productName: cert.productName,
          material: cert.material,
          dimensions: dims,
          weight: cert.weight,
          origin: cert.origin,
          sellerName: cert.sellerName,
          sellerStore: cert.sellerStore,
          issuedAt: cert.issuedAt,
          buyerName: cert.buyerName,
        },
        productImagePath: cert.product.images[0]?.url ?? null,
        verifyBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      });

      await prisma.certificate.update({
        where: { id: cert.id },
        data: { imageUrl },
      });

      console.log(`  ✓ Saved: ${imageUrl}`);
    } catch (e) {
      console.error(`  ✗ Failed: ${cert.id}`, e);
    }
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
