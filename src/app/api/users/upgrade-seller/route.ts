import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

const schema = z.object({
  storeName: z.string().min(3, "Nama toko minimal 3 karakter"),
  province:  z.string().min(1, "Provinsi wajib diisi"),
  bankName:  z.string().optional(),
  bankAccount: z.string().optional(),
});

// POST /api/users/upgrade-seller — upgrade role BUYER → SELLER
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return err("User tidak ditemukan", 404);
  // Jika sudah seller, return success (idempotent)
  if (user.role === "SELLER") {
    const store = await prisma.store.findUnique({ where: { userId } });
    return ok({ message: "Akun sudah terdaftar sebagai Seniman", store });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { storeName, province, bankName, bankAccount } = parsed.data;

  // Cek nama toko belum dipakai
  const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = await prisma.store.findFirst({ where: { OR: [{ userId }, { slug: { startsWith: storeSlug } }] } });
  if (existing?.userId === userId) return err("Anda sudah memiliki toko");

  const slugCount = await prisma.store.count({ where: { slug: { startsWith: storeSlug } } });
  const finalSlug = slugCount > 0 ? `${storeSlug}-${slugCount + 1}` : storeSlug;

  // Upgrade role + buat store dalam transaksi
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: "SELLER" } }),
    prisma.store.create({
      data: { userId, name: storeName, slug: finalSlug, province, bankName: bankName ?? null, bankAccount: bankAccount ?? null, bankHolder: user.name },
    }),
  ]);

  return ok({ message: "Akun berhasil diupgrade ke Seniman" }, 201);
}
