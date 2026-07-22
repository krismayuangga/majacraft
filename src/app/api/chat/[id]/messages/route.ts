import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// Kata yang dilarang (privasi)
const BLOCKED_PATTERNS = [/\b08[0-9]{8,11}\b/, /wa\.me/, /whatsapp/i, /telegram/i, /@gmail/, /@yahoo/];
function containsPrivateContact(text: string) {
  return BLOCKED_PATTERNS.some(p => p.test(text));
}

type Params = { params: Promise<{ id: string }> };

// GET /api/chat/[id]/messages
export async function GET(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id: chatId } = await params;
  const userId = session!.user!.id!;

  // Pastikan user adalah peserta
  const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId } });
  if (!participant) return err("Forbidden", 403);

  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  // Mark as read
  await prisma.message.updateMany({
    where: { chatId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  return ok(messages);
}

// POST /api/chat/[id]/messages — kirim pesan
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id: chatId } = await params;
  const userId = session!.user!.id!;

  // Pastikan user adalah peserta
  const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId } });
  if (!participant) return err("Forbidden", 403);

  const { content } = await req.json();
  if (!content?.trim()) return err("Pesan tidak boleh kosong");

  // Cek kontak pribadi
  if (containsPrivateContact(content)) {
    const blocked = await prisma.message.create({
      data: { chatId, senderId: userId, content, isBlocked: true },
    });
    return ok({ ...blocked, blocked: true, warning: "Pesan diblokir: tidak boleh membagikan kontak pribadi" });
  }

  const message = await prisma.message.create({
    data: { chatId, senderId: userId, content },
  });

  return ok(message, 201);
}
