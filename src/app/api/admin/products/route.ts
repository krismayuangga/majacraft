import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// GET /api/admin/products — products for moderation review
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status"); // "pending" | "active" | "rejected" | "all"
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;

  // pending          = baru diupload, live, belum dikurasi admin
  // needs_fix        = admin sudah kirim masukan, seller perlu perbaiki (produk tetap publik)
  // active           = sudah dikurasi dan disetujui admin
  // inactive         = admin nonaktifkan secara manual (pelanggaran serius)
  const where = status === "pending"
    ? { isActive: true, isModerated: false, rejectionReason: null }
    : status === "needs_fix"
    ? { isModerated: false, rejectionReason: { not: null } }
    : status === "active"
    ? { isActive: true, isModerated: true }
    : status === "inactive"
    ? { isActive: false }
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
