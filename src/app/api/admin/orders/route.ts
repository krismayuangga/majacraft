import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 25;

  const where = status ? { status: status as never } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          take: 1,
          include: { product: { include: { store: { select: { name: true } } } } },
        },
        address: { select: { city: true, province: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return ok({ orders, total, page, pages: Math.ceil(total / limit) });
}
