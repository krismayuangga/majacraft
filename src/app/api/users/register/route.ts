import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

const registerSchema = z.object({
  name:          z.string().min(2, "Nama minimal 2 karakter"),
  email:         z.string().email("Format email tidak valid"),
  phone:         z.string().regex(/^(\+62|08)[0-9]{8,12}$/, "Format nomor HP tidak valid"),
  password:      z.string().min(8, "Password minimal 8 karakter"),
  role:          z.enum(["BUYER", "SELLER"]).default("BUYER"),
  // Seller fields
  storeName:     z.string().optional(),
  province:      z.string().optional(),
  bankName:      z.string().optional(),
  bankAccount:   z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return err(firstError.message);
  }

  const { name, email, phone, password, role, storeName, province, bankName, bankAccount } = parsed.data;

  // Cek email sudah terdaftar
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return err("Email sudah terdaftar", 409);

  // Validasi seller fields
  if (role === "SELLER") {
    if (!storeName) return err("Nama toko wajib diisi untuk Seniman");
    if (!province)  return err("Provinsi wajib diisi untuk Seniman");
    if (!bankName)  return err("Nama bank wajib diisi untuk Seniman");
    if (!bankAccount) return err("Nomor rekening wajib diisi untuk Seniman");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Buat user + store dalam satu transaksi
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        phone, // disimpan tapi tidak pernah ditampilkan ke pihak lain
        password: hashedPassword,
        role,
      },
    });

    // Jika seller, buat store sekaligus
    if (role === "SELLER" && storeName) {
      const storeSlug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Pastikan slug unik
      const slugCount = await tx.store.count({ where: { slug: { startsWith: storeSlug } } });
      const finalSlug = slugCount > 0 ? `${storeSlug}-${slugCount + 1}` : storeSlug;

      await tx.store.create({
        data: {
          userId:     newUser.id,
          name:       storeName,
          slug:       finalSlug,
          province:   province!,
          bankName:   bankName,
          bankAccount: bankAccount, // TODO: encrypt sebelum simpan di production
          bankHolder: name,
        },
      });
    }

    return newUser;
  });

  // Jangan return password
  return ok({
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  }, 201);
}
