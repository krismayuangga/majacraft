import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().regex(/^(\+62|08)[0-9]{8,12}$/, "Format nomor HP tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  // Seller fields (optional)
  storeName: z.string().optional(),
  province: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
});

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = "30d";

/**
 * POST /api/auth/mobile/register
 * Register khusus untuk mobile app - return JWT token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError.message, 400);
    }

    const { name, email, phone, password, role, storeName, province, bankName, bankAccount } = parsed.data;

    // Cek email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return err("Email sudah terdaftar", 409);
    }

    // Validasi seller fields
    if (role === "SELLER") {
      if (!storeName) return err("Nama toko wajib diisi untuk Seniman", 400);
      if (!province) return err("Provinsi wajib diisi untuk Seniman", 400);
      if (!bankName) return err("Nama bank wajib diisi untuk Seniman", 400);
      if (!bankAccount) return err("Nomor rekening wajib diisi untuk Seniman", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat user + store dalam satu transaksi
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          status: true,
          kycStatus: true,
        },
      });

      // Jika seller, buat store sekaligus
      if (role === "SELLER" && storeName) {
        const storeSlug = storeName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Pastikan slug unik
        const slugCount = await tx.store.count({
          where: { slug: { startsWith: storeSlug } },
        });
        const finalSlug = slugCount > 0 ? `${storeSlug}-${slugCount + 1}` : storeSlug;

        await tx.store.create({
          data: {
            userId: newUser.id,
            name: storeName,
            slug: finalSlug,
            province: province!,
            bankName,
            bankAccount,
            bankHolder: name,
          },
        });
      }

      return newUser;
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Fetch user dengan store info
    const userWithStore = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        status: true,
        kycStatus: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            province: true,
            isVerified: true,
          },
        },
      },
    });

    return ok(
      {
        token,
        user: userWithStore,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return err("Terjadi kesalahan saat registrasi", 500);
  }
}
