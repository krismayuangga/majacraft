import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const verified = req.nextUrl.searchParams.get("verified");
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(verified === "true" ? { isVerified: true } : verified === "false" ? { isVerified: false } : {}),
  };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, kycStatus: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.store.count({ where }),
  ]);

  return ok({ stores, total, page, pages: Math.ceil(total / limit) });
}
