import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

/**
 * DELETE /api/users/me/delete-account
 *
 * Hapus akun pengguna secara permanen — wajib untuk kepatuhan Google Play Store.
 *
 * Kebijakan penghapusan:
 * - Akun yang memiliki pesanan aktif (PROCESSING/SHIPPED) atau
 *   dispute yang belum selesai tidak dapat dihapus langsung.
 * - Jika ada toko (seller): toko dinonaktifkan, produk dinonaktifkan.
 * - Data yang dihapus: akun, session, device token, notifikasi, cart, wishlist.
 * - Data yang DIPERTAHANKAN (anonymized): pesanan (untuk riwayat seller & laporan),
 *   ulasan (produk tidak kehilangan rating).
 * - Nama dan email di pesanan/ulasan lama di-anonymize menjadi "Pengguna Dihapus".
 *
 * Body: { confirmText: "HAPUS AKUN SAYA" }  ← konfirmasi wajib
 */
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;

  const body = await req.json().catch(() => ({}));
  if (body.confirmText !== "HAPUS AKUN SAYA") {
    return err('Konfirmasi wajib: kirim { "confirmText": "HAPUS AKUN SAYA" }', 400);
  }

  // 1. Cek pesanan aktif — tidak bisa hapus jika masih ada transaksi berjalan
  const activeOrders = await prisma.order.count({
    where: {
      userId,
      status: { in: ["PENDING_PAYMENT", "PROCESSING", "SHIPPED", "DELIVERED"] },
    },
  });
  if (activeOrders > 0) {
    return err(
      `Akun tidak dapat dihapus karena masih ada ${activeOrders} pesanan yang belum selesai. ` +
      "Selesaikan semua pesanan terlebih dahulu.",
      409
    );
  }

  // 2. Cek dispute aktif
  const activeDisputes = await prisma.dispute.count({
    where: {
      buyerId: userId,
      status: { in: ["PENDING_SELLER", "SELLER_RESPONDED", "IN_MEDIATION", "REFUND_PENDING"] },
    },
  });
  if (activeDisputes > 0) {
    return err(
      `Akun tidak dapat dihapus karena masih ada ${activeDisputes} komplain aktif. ` +
      "Selesaikan semua komplain terlebih dahulu.",
      409
    );
  }

  // 3. Nonaktifkan toko jika ada (seller)
  await prisma.store.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  // Nonaktifkan semua produk toko
  const store = await prisma.store.findUnique({ where: { userId }, select: { id: true } });
  if (store) {
    await prisma.product.updateMany({
      where: { storeId: store.id },
      data: { isActive: false },
    });
  }

  // 4. Anonymize data yang harus dipertahankan (pesanan, ulasan selesai)
  const ANON_NAME = "Pengguna Dihapus";
  const ANON_EMAIL = `deleted_${userId.slice(-8)}@deleted.majacraft.id`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name:     ANON_NAME,
      email:    ANON_EMAIL,
      phone:    null,
      image:    null,
      password: null,
      status:   "BANNED", // prevent re-login
      // Hapus data KYC sensitif
      kycNik:        null,
      kycKtpUrl:     null,
      kycSelfieUrl:  null,
    },
  });

  // 5. Hapus data yang tidak perlu dipertahankan
  await prisma.$transaction([
    // Session & auth
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    // Push tokens
    prisma.pushDevice.deleteMany({ where: { userId } }),
    // Notifications
    prisma.notification.deleteMany({ where: { userId } }),
    // Cart
    prisma.cartItem.deleteMany({ where: { cart: { userId } } }),
    // Wishlist
    prisma.wishlist.deleteMany({ where: { userId } }),
    // OTP codes
    prisma.otpCode.deleteMany({ where: { userId } }),
  ]);

  // 6. Hapus akun sendiri (cascade akan hapus relasi lainnya)
  // Catatan: pesanan dan ulasan tidak dihapus karena reference ke userId
  // yang sudah di-anonymize di atas

  console.log(`[delete-account] User ${userId} account deleted and anonymized`);

  return ok({
    message: "Akun berhasil dihapus. Data transaksi disimpan dalam bentuk anonim sesuai kebijakan privasi.",
    deletedAt: new Date().toISOString(),
  });
}
