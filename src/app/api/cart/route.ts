import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

const CART_TIMER_MINUTES = 20;

// GET /api/cart
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return ok({ items: [] });

  // Auto-hapus item yang expired (>20 menit) atau produk terjual offline
  const expiredBefore = new Date(Date.now() - CART_TIMER_MINUTES * 60 * 1000);
  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      OR: [
        { addedAt: { lt: expiredBefore } },          // timer habis
        { product: { isSoldOffline: true } },         // terjual offline
        { product: { isActive: false } },             // produk dinonaktifkan
      ],
    },
  });

  const freshCart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              store: { select: { name: true, province: true } },
            },
          },
        },
      },
    },
  });

  // Tambahkan field addedAt ke setiap item untuk timer di client
  return ok(freshCart ?? { items: [] });
}

// POST /api/cart — tambah item
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { productId, qty = 1 } = await req.json();
  if (!productId) return err("productId wajib diisi");

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) return err("Produk tidak ditemukan atau tidak aktif", 404);
  if (product.stock < qty) return err(`Stok tidak mencukupi (tersisa ${product.stock})`);

  const userId = session!.user!.id!;

  // Buat cart jika belum ada
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // Upsert cart item
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const newQty = Math.min(product.stock, (existing?.qty ?? 0) + qty);

  const item = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, qty: newQty },
    update: { qty: newQty },
  });

  return ok(item, 201);
}

// PATCH /api/cart — update qty atau selected
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { productId, qty, selected } = await req.json();
  if (!productId) return err("productId wajib diisi");

  const cart = await prisma.cart.findUnique({ where: { userId: session!.user!.id! } });
  if (!cart) return err("Keranjang tidak ditemukan", 404);

  if (qty !== undefined && qty < 1) {
    // Hapus item jika qty 0
    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    return ok({ deleted: true });
  }

  const updated = await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId } },
    data: {
      ...(qty !== undefined && { qty }),
      ...(selected !== undefined && { selected }),
    },
  });

  return ok(updated);
}

// DELETE /api/cart — hapus item
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { productId } = await req.json();
  const cart = await prisma.cart.findUnique({ where: { userId: session!.user!.id! } });
  if (!cart) return err("Keranjang tidak ditemukan", 404);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      ...(productId ? { productId } : {}),
    },
  });

  return ok({ deleted: true });
}
