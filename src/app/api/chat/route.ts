import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/chat — inbox semua percakapan user
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;

  const chats = await prisma.chat.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      order: {
        include: {
          items: { take: 1, include: { product: { select: { name: true } } } },
        },
      },
      // Sertakan info produk untuk chat yang dimulai dari halaman produk
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
  });

  // Hitung unread per chat dengan query terpisah
  const unreadCounts = await prisma.message.groupBy({
    by: ["chatId"],
    where: {
      chat: { participants: { some: { userId } } },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { id: true },
  });
  const unreadMap = Object.fromEntries(unreadCounts.map(r => [r.chatId, r._count.id]));

  const result = chats.map(chat => ({
    id: chat.id,
    orderId:     chat.orderId,
    productId:   chat.productId,
    productName: chat.product?.name ?? chat.order?.items?.[0]?.product?.name ?? null,
    // Product snippet untuk tampil di chat list dan header chat
    product: chat.product ? {
      id:    chat.product.id,
      name:  chat.product.name,
      slug:  chat.product.slug,
      price: chat.product.price,
      image: chat.product.images[0]?.url ?? null,
    } : null,
    otherUser:   chat.participants.find(p => p.userId !== userId)?.user ?? null,
    lastMessage: chat.messages[0] ?? null,
    unreadCount: unreadMap[chat.id] ?? 0,
    createdAt:   chat.createdAt,
  }));

  return ok(result);
}

// POST /api/chat — buat atau temukan chat dengan user lain
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { targetUserId, orderId, productId } = await req.json();
  if (!targetUserId) return err("targetUserId wajib diisi");

  const userId = session!.user!.id!;
  if (userId === targetUserId) return err("Tidak bisa chat dengan diri sendiri");

  // Cek chat sudah ada (berdasarkan kedua peserta + produk yang sama)
  const existing = await prisma.chat.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } },
        { productId: productId ?? null },
        { orderId: orderId ?? null },
      ],
    },
  });

  if (existing) return ok({ id: existing.id });

  // Buat chat baru dengan konteks produk
  const chat = await prisma.chat.create({
    data: {
      orderId:   orderId   ?? null,
      productId: productId ?? null,
      participants: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
  });

  return ok({ id: chat.id }, 201);
}
