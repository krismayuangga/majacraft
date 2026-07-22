import { PrismaClient } from "@prisma/client";
import { generateCertificateImage } from "../src/lib/certificate-generator";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const certs = await prisma.certificate.findMany({
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          store: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  for (const cert of certs) {
    console.log(`Regenerating: ${cert.id}`);
    const filePath = path.join(process.cwd(), "public", "uploads", "certificates", `${cert.id}.png`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const p = cert.product;
    const primaryImg = p.images[0]?.url ?? null;

    // Ambil data terbaru dari product
    const dims = p.length && p.width && p.height
      ? `${p.length} × ${p.width} × ${p.height} cm`
      : p.dimensions ?? null;

    const weightStr = p.weight
      ? p.weight >= 1000
        ? `${(p.weight / 1000).toFixed(1).replace(".0", "")} kg`
        : `${p.weight} gram`
      : null;

    const imageUrl = await generateCertificateImage({
      data: {
        certificateId: cert.id,
        productName: cert.productName,
        material: p.material ?? cert.material,
        dimensions: dims ?? cert.dimensions,
        weight: weightStr ?? cert.weight,
        origin: p.origin ?? cert.origin,
        sellerName: p.store.user.name,
        sellerStore: p.store.name,
        issuedAt: cert.issuedAt,
        buyerName: cert.buyerName,
      },
      productImagePath: primaryImg,
      verifyBaseUrl: "https://majacraft.id",
    });

    // Update certificate record dengan data terbaru
    await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        imageUrl,
        dimensions: dims ?? cert.dimensions,
        weight: weightStr ?? cert.weight,
        material: p.material ?? cert.material,
        origin: p.origin ?? cert.origin,
      },
    });

    console.log(`✓ Done: ${imageUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
