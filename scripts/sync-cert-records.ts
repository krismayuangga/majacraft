import { PrismaClient } from "@prisma/client";
import { generateCertificateImage } from "../src/lib/certificate-generator";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  // Cari produk yang punya certificateId tapi belum ada di tabel certificates
  const products = await prisma.product.findMany({
    where: {
      certificateId: { not: null },
    },
    include: {
      store: { include: { user: { select: { name: true } } } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  console.log(`Produk dengan certificateId: ${products.length}`);

  for (const p of products) {
    console.log(`\nProduct: ${p.name}`);
    console.log(`  certificateId: ${p.certificateId}`);

    // Cek apakah sudah ada di tabel certificates
    const existing = await prisma.certificate.findUnique({
      where: { id: p.certificateId! },
    });

    if (existing && existing.imageUrl) {
      console.log(`  ✓ Already has certificate with image: ${existing.imageUrl}`);
      continue;
    }

    const dims =
      p.length && p.width && p.height
        ? `${p.length} × ${p.width} × ${p.height} cm`
        : p.dimensions ?? null;

    const weightStr = p.weight ? `${p.weight} gram` : null;
    const primaryImage = p.images[0]?.url ?? null;

    // Generate gambar
    console.log(`  Generating image...`);
    let imageUrl: string | null = null;
    try {
      imageUrl = await generateCertificateImage({
        data: {
          certificateId: p.certificateId!,
          productName: p.name,
          material: p.material,
          dimensions: dims,
          weight: weightStr,
          origin: p.origin,
          sellerName: p.store.user.name,
          sellerStore: p.store.name,
          issuedAt: p.nftMintedAt ?? p.createdAt,
        },
        productImagePath: primaryImage,
        verifyBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      });
      console.log(`  ✓ Image: ${imageUrl}`);
    } catch (e) {
      console.error(`  ✗ Image generation failed:`, e);
    }

    // Upsert Certificate record
    if (existing) {
      await prisma.certificate.update({
        where: { id: p.certificateId! },
        data: { imageUrl },
      });
      console.log(`  ✓ Updated existing certificate record`);
    } else {
      await prisma.certificate.create({
        data: {
          id: p.certificateId!,
          productId: p.id,
          sellerName: p.store.user.name,
          sellerStore: p.store.name,
          productName: p.name,
          material: p.material,
          dimensions: dims,
          weight: weightStr,
          origin: p.origin,
          productImageUrl: primaryImage,
          imageUrl,
          issuedAt: p.nftMintedAt ?? p.createdAt,
        },
      });
      console.log(`  ✓ Created new certificate record`);
    }
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
