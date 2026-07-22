import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, requireAdmin } from "@/lib/api-helpers";

// GET /api/admin/settings — ambil semua settings (public untuk baca fee)
export async function GET() {
  const settings = await prisma.platformSetting.findMany();
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return ok(map);
}

// POST /api/admin/settings — simpan settings (admin only)
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  // body: { fee_percent: "5", max_upload_mb: "10", ... }
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  return ok({ message: "Pengaturan berhasil disimpan" });
}
