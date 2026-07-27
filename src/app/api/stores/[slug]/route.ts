import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

/**
 * GET /api/stores/[slug]
 * Public endpoint — detail lengkap toko berdasarkan slug
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug, isActive: true },
    select: {
      id:          true,
      name:        true,
      slug:        true,
      description: true,
      logoUrl:     true,
      bannerUrl:   true,
      province:    true,
      city:        true,
      district:    true,
      address:     true,
      phone:       true,
      rating:      true,
      totalSold:   true,
      isVerified:  true,
      isActive:    true,
      createdAt:   true,
      user: {
        select: { id: true, name: true, kycStatus: true },
      },
      _count: {
        select: {
          products: { where: { isActive: true, isModerated: true, isSoldOffline: false } },
        },
      },
    },
  });

  if (!store) return err("Toko tidak ditemukan", 404);
  return ok(store);
}
