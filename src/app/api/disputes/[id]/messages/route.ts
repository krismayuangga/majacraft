import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// POST /api/disputes/[id]/messages — send chat message
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { message, attachments } = body;

  if (!message?.trim()) return err("Pesan tidak boleh kosong", 400);

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      buyerId: true,
      sellerId: true,
      assignedAdminId: true,
      status: true,
    },
  });

  if (!dispute) return err("Komplain tidak ditemukan", 404);

  const userId = session!.user!.id!;
  
  // Get user role from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const userRole = user?.role || "BUYER";

  // Verify user is participant
  const isParticipant =
    dispute.buyerId === userId ||
    dispute.sellerId === userId ||
    dispute.assignedAdminId === userId ||
    userRole === "ADMIN";

  if (!isParticipant) {
    return err("Anda tidak memiliki akses ke chat ini", 403);
  }

  // Determine sender role
  let senderRole: "BUYER" | "SELLER" | "ADMIN" = "BUYER";
  if (dispute.sellerId === userId) senderRole = "SELLER";
  else if (userRole === "ADMIN") senderRole = "ADMIN";

  // Create message
  const msg = await prisma.disputeMessage.create({
    data: {
      disputeId: id,
      senderId: userId,
      senderRole,
      message: message.trim(),
      attachments: attachments || [],
    },
    include: {
      sender: { select: { name: true, image: true } },
    },
  });

  // TODO: Send real-time notification to other participants

  return ok(msg, 201);
}
