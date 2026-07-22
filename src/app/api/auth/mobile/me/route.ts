import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production";

/**
 * GET /api/auth/mobile/me
 * Get current user from JWT token
 */
export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return err("Token tidak ditemukan", 401);
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return err("Token tidak valid atau sudah expired", 401);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        status: true,
        kycStatus: true,
        kycVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            province: true,
            isVerified: true,
            rating: true,
            totalSold: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlists: true,
          },
        },
      },
    });

    if (!user) {
      return err("User tidak ditemukan", 404);
    }

    // Check if account is banned/suspended
    if (user.status === "BANNED") {
      return err("Akun Anda telah diblokir", 403);
    }
    if (user.status === "SUSPENDED") {
      return err("Akun sedang ditangguhkan", 403);
    }

    return ok(user);
  } catch (error) {
    console.error("Get user error:", error);
    return err("Terjadi kesalahan saat mengambil data user", 500);
  }
}
