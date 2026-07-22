import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/orders — list pesanan user
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const userId = session!.user!.id!;

  // Auto-cancel pesanan PENDING_PAYMENT yang sudah melewati deadline
  await prisma.order.updateMany({
    where: {
      userId,
      status: "PENDING_PAYMENT",
      paymentDeadline: { lt: new Date() },
    },
    data: { status: "CANCELLED", escrowStatus: "WAITING" },
  });
  // Kembalikan stok untuk pesanan yang di-cancel
  const cancelledOrders = await prisma.order.findMany({
    where: { userId, status: "CANCELLED", escrowStatus: "WAITING" },
    include: { items: true },
  });
  for (const order of cancelledOrders) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      }).catch(() => {});
    }
  }

  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(status && { status: status as never }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      address: {
        select: { city: true, province: true },
      },
    },
  });

  return ok(orders);
}

// POST /api/orders — buat pesanan baru
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { addressId, courierName, courierService, shippingCost, paymentMethod, note, items } = body;

  if (!addressId || !courierName || !shippingCost || !paymentMethod || !items?.length)
    return err("Data pesanan tidak lengkap");

  const userId = session!.user!.id!;

  // Validasi alamat milik user
  const address = await prisma.address.findUnique({ where: { id: addressId, userId } });
  if (!address) return err("Alamat tidak ditemukan", 404);

  // Validasi dan hitung harga produk (ambil dari DB, bukan dari client)
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== items.length) return err("Beberapa produk tidak tersedia");

  // Cek stok semua produk
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return err(`Produk tidak ditemukan`);
    if (product.stock < item.qty) return err(`Stok "${product.name}" tidak mencukupi`);
  }

  const subtotal = products.reduce((sum, p) => {
    const qty = items.find((i: { productId: string; qty: number }) => i.productId === p.id)?.qty ?? 0;
    return sum + p.price * qty;
  }, 0);

  // Baca fee dari settings (default 5% jika gagal)
  let feePercent = 5;
  try {
    const setting = await prisma.platformSetting.findUnique({ where: { key: "fee_percent" } });
    if (setting) feePercent = Number(setting.value);
  } catch {}

  // Fee dicatat untuk keperluan internal, TIDAK ditambahkan ke total pembeli
  // Total buyer = subtotal + ongkir saja; fee dipotong dari seller saat pencairan
  const platformFee = Math.round(subtotal * feePercent / 100);
  const total = subtotal + shippingCost; // buyer hanya bayar produk + ongkir

  // Buat order dalam transaksi
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId, addressId, note,
        subtotal, shippingCost: parseInt(shippingCost),
        platformFee, total,
        paymentMethod, courierName, courierService,
        status: "PENDING_PAYMENT",
        escrowStatus: "WAITING",
        paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 menit
        items: {
          create: items.map((item: { productId: string; qty: number }) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: item.productId,
              qty: item.qty,
              price: product.price,
              productName: product.name,
            };
          }),
        },
      },
      include: { items: true },
    });

    // Kurangi stok
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }

    // Hapus item dari keranjang
    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) {
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id, productId: { in: productIds } },
      });
    }

    return newOrder;
  });

  return ok(order, 201);
}
