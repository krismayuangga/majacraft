import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/users/me — profil sendiri
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: {
      id: true, name: true, email: true,
      phone: true, // phone hanya untuk diri sendiri
      image: true, role: true, status: true,
      kycStatus: true, kycVerifiedAt: true,
      createdAt: true, lastLoginAt: true,
      store: {
        select: {
          id: true, name: true, slug: true,
          province: true, isVerified: true,
          rating: true, totalSold: true,
        },
      },
      _count: {
        select: {
          orders: true,
          reviews: true,
          wishlists: true,
        },
      },
    },
  });

  if (!user) return err("User tidak ditemukan", 404);
  return ok(user);
}

// PATCH /api/users/me — update profil sendiri
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  // Field yang boleh diupdate sendiri
  const allowed = ["name", "image", "phone"] as const;
  const updateData: Record<string, string> = {};

  for (const field of allowed) {
    if (body[field] !== undefined && body[field] !== null) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0)
    return err("Tidak ada data yang diupdate");

  const updated = await prisma.user.update({
    where: { id: session!.user!.id! },
    data: updateData,
    select: { id: true, name: true, email: true, image: true },
  });

  return ok(updated);
}
