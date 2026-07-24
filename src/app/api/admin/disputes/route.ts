import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/admin/disputes — list all disputes
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Get user role from DB
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return err("Unauthorized", 403);
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (status && status !== "all") {
    where.status = status;
  }

  const disputes = await prisma.dispute.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentRef: true,
        },
      },
      buyer: { select: { id: true, name: true, email: true, image: true } },
      seller: { select: { id: true, name: true, email: true, image: true } },
      assignedAdmin: { select: { name: true } },
      _count: { select: { messages: true } },
    },
  });

  return ok({ disputes });
}
