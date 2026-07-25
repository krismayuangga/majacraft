import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET  = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const JWT_EXPIRES = "7d";

/**
 * POST /api/mobile/auth/login
 * Flutter mobile app authentication — returns JWT (7 days)
 *
 * Request:  { email: string, password: string }
 * Response: { token: string, user: { id, name, email, image, role } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.email || !body?.password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      select: {
        id: true, name: true, email: true, image: true,
        password: true, role: true, status: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    if (user.status === "BANNED") {
      return NextResponse.json({ error: "Akun telah diblokir" }, { status: 403 });
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.toLowerCase() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES },
    );

    return NextResponse.json({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        image: user.image ?? null,
        role:  user.role.toLowerCase(),
      },
    });
  } catch (err) {
    console.error("[mobile/auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
