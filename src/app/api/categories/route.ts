import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// GET /api/categories — public
export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return ok(categories);
}

// POST /api/categories — admin only
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, slug, icon, imageUrl, sortOrder } = body;

  if (!name || !slug) return err("name dan slug wajib diisi");

  const category = await prisma.category.create({
    data: { name, slug, icon, imageUrl, sortOrder: sortOrder ?? 0 },
  });
  return ok(category, 201);
}
