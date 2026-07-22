/**
 * Script test untuk generate sertifikat
 * Jalankan: npx ts-node --project tsconfig.json scripts/test-cert.ts
 */
import { generateCertificateImage } from "../src/lib/certificate-generator";

async function main() {
  console.log("Generating certificate...");

  const result = await generateCertificateImage({
    data: {
      certificateId: "MAJA-2026-Y0TI983D1645",
      productName: "Patung Batu Budha Tertawa",
      material: "Batu Andesit",
      dimensions: "20 × 15 × 30 cm",
      weight: "4500 gram",
      origin: "Yogyakarta",
      sellerName: "Bambang Kinerja",
      sellerStore: "Kinerja Craft",
      issuedAt: new Date("2026-07-15"),
    },
    verifyBaseUrl: "http://localhost:3000",
  });

  console.log("Generated:", result);
  console.log("File path:", `${process.cwd()}/public${result}`);
}

main().catch(console.error);
