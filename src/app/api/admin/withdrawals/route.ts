import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// GET /api/admin/withdrawals
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: "desc" },
    include: { store: { select: { name: true, user: { select: { email: true } } } } },
  });
  return ok(withdrawals);
}
