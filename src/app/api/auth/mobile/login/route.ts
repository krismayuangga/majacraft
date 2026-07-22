import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = "30d"; // Token valid 30 hari

/**
 * POST /api/auth/mobile/login
 * Login khusus untuk mobile app - return JWT token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return err(firstError.message, 400);
    }

    const { email, password } = parsed.data;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        password: true,
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

    // User tidak ditemukan atau tidak punya password (login via Google)
    if (!user || !user.password) {
      return err("Email atau password salah", 401);
    }

    // Cek status akun
    if (user.status === "BANNED") {
      return err("Akun Anda telah diblokir", 403);
    }
    if (user.status === "SUSPENDED") {
      return err("Akun sedang ditangguhkan", 403);
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return err("Email atau password salah", 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
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

    // Return user data + token (jangan return password)
    const { password: _, ...userData } = user;

    return ok({
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return err("Terjadi kesalahan saat login", 500);
  }
}
