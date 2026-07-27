import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sendFCMToUser } from "@/lib/fcm";

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
      buyerId:         true,
      sellerId:        true,
      assignedAdminId: true,
      orderId:         true,
      status:          true,
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
  // Kirim notifikasi ke semua peserta kecuali pengirim (fire-and-forget)
  const notifyIds = [
    dispute.buyerId,
    dispute.sellerId,
    dispute.assignedAdminId,
  ].filter((uid): uid is string => !!uid && uid !== userId);

  const senderName = msg.sender.name ?? "Seseorang";
  const preview    = message.trim().slice(0, 80) + (message.length > 80 ? "…" : "");

  Promise.all(notifyIds.map(async (uid) => {
    // In-app notification
    await createNotification({
      userId: uid,
      type:   "dispute_update",
      title:  `Pesan baru di Komplain`,
      body:   `${senderName}: ${preview}`,
      data:   { disputeId: id, orderId: dispute.orderId ?? "" },
    }).catch(() => {});

    // FCM push notification ke Flutter app
    await sendFCMToUser(uid, `Pesan baru di Komplain`, `${senderName}: ${preview}`, {
      type:      "dispute_update",
      disputeId: id,
      orderId:   dispute.orderId ?? "",
    }).catch(() => {});
  })).catch(() => {});

  return ok(msg, 201);
}
