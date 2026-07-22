import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

// GET /api/stores/[slug]/owner — ambil userId pemilik toko (untuk inisiasi chat)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { userId: true, name: true },
  });
  if (!store) return err("Toko tidak ditemukan", 404);
  return ok({ userId: store.userId, storeName: store.name });
}
