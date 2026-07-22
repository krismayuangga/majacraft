import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

// POST /api/ruang-budaya/[id]/rsvp — daftar event (publik, tidak perlu login)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, email, phone, message } = await req.json();

  if (!name || !email) return err("Nama dan email wajib diisi");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Format email tidak valid");

  const post = await prisma.culturalPost.findFirst({
    where: { id, isPublished: true, type: "ACARA" },
    include: { _count: { select: { rsvps: true } } },
  });
  if (!post) return err("Event tidak ditemukan", 404);

  // Cek kuota
  if (post.eventMaxRsvp && post._count.rsvps >= post.eventMaxRsvp) {
    return err("Kuota pendaftaran sudah penuh");
  }

  // Cek duplikat email
  const existing = await prisma.culturalRsvp.findUnique({ where: { postId_email: { postId: id, email } } });
  if (existing) return err("Email ini sudah terdaftar untuk event ini");

  const rsvp = await prisma.culturalRsvp.create({
    data: { postId: id, name, email, phone: phone ?? null, message: message ?? null },
  });

  return ok({ id: rsvp.id, message: "Pendaftaran berhasil! Kami akan menghubungi Anda via email." }, 201);
}
