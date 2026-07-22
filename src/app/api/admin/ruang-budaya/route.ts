import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// GET /api/admin/ruang-budaya — list semua post (termasuk draft)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const posts = await prisma.culturalPost.findMany({
    where: type ? { type: type as never } : {},
    include: {
      author:  { select: { name: true } },
      _count:  { select: { rsvps: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(posts);
}

// POST /api/admin/ruang-budaya — buat post baru
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { type, title, excerpt, content, coverImage, tags, productId,
          eventDate, eventLocation, eventMaxRsvp, contactUrl, isPublished } = body;

  if (!title || !content) return err("Judul dan konten wajib diisi");

  // Generate slug dari title
  const baseSlug = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  const count = await prisma.culturalPost.count({ where: { slug: { startsWith: baseSlug } } });
  const slug  = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

  const post = await prisma.culturalPost.create({
    data: {
      type:          type ?? "ARTIKEL",
      title,
      slug,
      excerpt:       excerpt ?? null,
      content,
      coverImage:    coverImage ?? null,
      tags:          Array.isArray(tags) ? tags : [],
      authorId:      session!.user!.id!,
      productId:     productId ?? null,
      isPublished:   !!isPublished,
      publishedAt:   isPublished ? new Date() : null,
      eventDate:     eventDate ? new Date(eventDate) : null,
      eventLocation: eventLocation ?? null,
      eventMaxRsvp:  eventMaxRsvp ? parseInt(eventMaxRsvp) : null,
      contactUrl:    contactUrl ?? null,
    },
  });

  return ok(post, 201);
}
