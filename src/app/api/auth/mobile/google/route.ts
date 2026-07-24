import { NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = "30d";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/mobile/google
 * Login via Google untuk mobile app — verifikasi idToken dari Google Sign-In native.
 *
 * Body: { idToken: string }
 * Return: { success: true, data: { token: string (JWT), user: User } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return err("idToken wajib diisi", 400);
    }

    // 1. Verifikasi Google ID Token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch {
      return err("Google token tidak valid atau sudah kadaluarsa", 401);
    }

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return err("Tidak dapat membaca data dari Google token", 400);
    }

    const { email, name, picture, sub: googleId } = payload;

    // 2. Cari user berdasarkan email ATAU google account ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { accounts: { some: { provider: "google", providerAccountId: googleId } } },
        ],
      },
      select: {
        id: true, name: true, email: true, phone: true, image: true,
        role: true, status: true, kycStatus: true,
        store: { select: { id: true, name: true, slug: true, province: true, isVerified: true } },
      },
    });

    // 3. Buat user baru jika belum ada
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email,
          name:  name ?? email.split("@")[0],
          image: picture ?? null,
          role:  "BUYER",
          emailVerified: new Date(),
          accounts: {
            create: {
              type: "oauth",
              provider: "google",
              providerAccountId: googleId,
            },
          },
        },
        select: {
          id: true, name: true, email: true, phone: true, image: true,
          role: true, status: true, kycStatus: true,
          store: { select: { id: true, name: true, slug: true, province: true, isVerified: true } },
        },
      });
      user = newUser;
    } else if (!user.image && picture) {
      // Update foto jika belum ada
      await prisma.user.update({ where: { id: user.id }, data: { image: picture } });
      user = { ...user, image: picture };
    }

    // 4. Cek status akun
    if (user.status === "BANNED")    return err("Akun Anda telah diblokir", 403);
    if (user.status === "SUSPENDED") return err("Akun sedang ditangguhkan", 403);

    // 5. Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // 6. Generate JWT — format sama dengan /api/auth/mobile/login
    const token = jwt.sign(
      {
        sub:      user.id,
        email:    user.email,
        name:     user.name,
        role:     user.role,
        provider: "google",
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const { ...userWithoutSensitive } = user;

    return ok({ token, user: userWithoutSensitive });
  } catch (error) {
    console.error("[google-auth]", error);
    return err("Terjadi kesalahan server", 500);
  }
}
