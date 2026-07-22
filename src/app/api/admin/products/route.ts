import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// GET /api/admin/products — produk pending kurasi
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status"); // "pending" | "active" | "all"
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;

  // pending = belum dikurasi DAN (baru pertama kali ATAU sudah diperbarui seller)
  // Tidak termasuk: rejected yang masih menunggu seller fix (isActive: false + rejectionReason != null)
  const where = status === "pending"
    ? { isCurated: false, OR: [{ rejectionReason: null }, { isActive: true }] }
    : status === "active"
    ? { isActive: true, isCurated: true }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        store: { select: { name: true, isVerified: true, user: { select: { email: true } } } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return ok({ products, total, page, pages: Math.ceil(total / limit) });
}
