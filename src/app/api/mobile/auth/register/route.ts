import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET  = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const JWT_EXPIRES = "7d";

/**
 * POST /api/mobile/auth/register
 * Flutter mobile app registration — returns JWT (7 days)
 *
 * Request:  { name: string, email: string, password: string }
 * Response: { token: string, user: { id, name, email, image, role } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.name || !body?.email || !body?.password) {
      return NextResponse.json({ error: "Name, email, dan password wajib diisi" }, { status: 400 });
    }

    const { name, email, password } = body;

    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const hash = await bcrypt.hash(String(password), 12);

    const user = await prisma.user.create({
      data: {
        name:   String(name).trim(),
        email:  String(email).toLowerCase().trim(),
        password: hash,
        role:   "BUYER",
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

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
    }, { status: 201 });
  } catch (err) {
    console.error("[mobile/auth/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
