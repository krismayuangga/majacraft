import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      store: {
        select: {
          id: true, name: true, slug: true, province: true,
          isVerified: true, rating: true, totalSold: true, logoUrl: true,
        },
      },
      category: { select: { name: true, slug: true } },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!product) return err("Produk tidak ditemukan", 404);

  // Increment view count (fire and forget)
  prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return ok(product);
}

// PATCH /api/products/[id] — owner seller atau admin
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id }, include: { store: true },
  });
  if (!product) return err("Produk tidak ditemukan", 404);

  const userId = session!.user!.id!;
  const role = (session!.user as { role?: string }).role;
  const isOwner = product.store.userId === userId;
  const isAdmin = role === "ADMIN";

  if (!isOwner && !isAdmin) return err("Forbidden", 403);

  const body = await req.json();
  const updated = await prisma.product.update({ where: { id }, data: body });
  return ok(updated);
}

// DELETE /api/products/[id] — owner atau admin
export async function DELETE(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id }, include: { store: true },
  });
  if (!product) return err("Produk tidak ditemukan", 404);

  const userId = session!.user!.id!;
  const role = (session!.user as { role?: string }).role;
  const isOwner = product.store.userId === userId;

  if (!isOwner && role !== "ADMIN") return err("Forbidden", 403);

  await prisma.product.delete({ where: { id } });
  return ok({ deleted: true });
}
