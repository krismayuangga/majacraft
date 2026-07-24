import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { notifyDisputeEscalated } from "@/lib/dispute-notifications";

type Params = { params: Promise<{ id: string }> };

// POST /api/disputes/[id]/escalate — escalate to admin mediation
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { reason } = body;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      buyerId: true,
      sellerId: true,
      status: true,
      sellerResponse: true,
    },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);

  const userId = session!.user!.id!;

  // Only buyer or seller can escalate
  if (dispute.buyerId !== userId && dispute.sellerId !== userId) {
    return err("Anda tidak berhak melakukan eskalasi", 403);
  }

  // Can only escalate if seller has responded and parties didn't agree
  if (dispute.status !== "SELLER_RESPONDED") {
    return err("Eskalasi hanya bisa dilakukan setelah penjual merespons", 400);
  }

  // Update status
  const updated = await prisma.dispute.update({
    where: { id },
    data: { status: "IN_MEDIATION" },
  });

  // Create timeline entry
  await prisma.disputeTimeline.create({
    data: {
      disputeId: id,
      action: "escalated",
      description: `Komplain dieskalasi ke mediasi admin`,
      actorId: userId,
      metadata: { reason },
    },
  });

  // Create system message
  await prisma.disputeMessage.create({
    data: {
      disputeId: id,
      senderId: userId,
      senderRole: dispute.buyerId === userId ? "BUYER" : "SELLER",
      message: `Komplain dieskalasi ke admin. Mediator akan segera bergabung untuk membantu menyelesaikan sengketa ini.`,
      isSystemMsg: true,
    },
  });

  await notifyDisputeEscalated(id);

  return ok(updated);
}
