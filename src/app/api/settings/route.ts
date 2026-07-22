import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api-helpers";

// GET /api/settings — settings publik (fee, dll) untuk diakses seller/client
export async function GET() {
  const settings = await prisma.platformSetting.findMany();
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return ok({
    feePercent: Number(map.fee_percent ?? 5),
    maxUploadMb: Number(map.max_upload_mb ?? 10),
    maxPhotosPerProduct: Number(map.max_photos_per_product ?? 5),
  });
}
