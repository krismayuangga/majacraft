import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// GET /api/admin/users — list semua user
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const role = req.nextUrl.searchParams.get("role") ?? undefined;
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const kycStatus = req.nextUrl.searchParams.get("kycStatus") ?? undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");

  const where = {
    ...(search && { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }),
    ...(role && { role: role as never }),
    ...(status && { status: status as never }),
    ...(kycStatus && { kycStatus: kycStatus as never }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        kycStatus: true, kycKtpUrl: true, kycSelfieUrl: true, kycNik: true,
        createdAt: true, lastLoginAt: true, image: true,
        store: { select: { name: true, isVerified: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return ok({ users, total, page, pages: Math.ceil(total / limit) });
}
