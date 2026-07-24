import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { notifyDisputeCancelled } from "@/lib/dispute-notifications";

type Params = { params: Promise<{ id: string }> };

// POST /api/disputes/[id]/cancel — cancel dispute (buyer only)
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: { buyerId: true, status: true },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);

  // Only buyer can cancel
  if (dispute.buyerId !== session!.user!.id!) {
    return err("Hanya pembeli yang dapat membatalkan komplain", 403);
  }

  // Cannot cancel if already resolved or in mediation
  if (dispute.status === "RESOLVED" || dispute.status === "IN_MEDIATION") {
    return err("Komplain tidak dapat dibatalkan", 400);
  }

  // Update status
  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      status: "CANCELLED",
      resolvedAt: new Date(),
      resolvedBy: session!.user!.id!,
    },
  });

  // Create timeline entry
  await prisma.disputeTimeline.create({
    data: {
      disputeId: id,
      action: "cancelled",
      description: `Komplain dibatalkan oleh pembeli`,
      actorId: session!.user!.id!,
    },
  });

  await notifyDisputeCancelled(id);

  return ok(updated);
}
