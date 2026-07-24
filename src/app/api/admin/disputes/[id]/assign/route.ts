import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { notifyDisputeAssigned } from "@/lib/dispute-notifications";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/disputes/[id]/assign — assign admin to dispute
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Get user role from DB
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: { role: true, name: true },
  });

  if (user?.role !== "ADMIN") {
    return err("Unauthorized", 403);
  }

  const { id } = await params;

  const dispute = await prisma.dispute.update({
    where: { id },
    data: {
      assignedAdminId: session!.user!.id!,
    },
  });

  // Create timeline
  await prisma.disputeTimeline.create({
    data: {
      disputeId: id,
      action: "admin_assigned",
      description: `Admin ${session!.user!.name} ditugaskan sebagai mediator`,
      actorId: session!.user!.id!,
    },
  });

  // Create system message
  await prisma.disputeMessage.create({
    data: {
      disputeId: id,
      senderId: session!.user!.id!,
      senderRole: "ADMIN",
      message: `Halo, saya ${user.name} akan membantu menyelesaikan komplain ini. Silakan diskusikan masalah yang dialami dan solusi yang diinginkan.`,
      isSystemMsg: true,
    },
  });

  await notifyDisputeAssigned(id, user.name || "Admin");

  return ok(dispute);
}
