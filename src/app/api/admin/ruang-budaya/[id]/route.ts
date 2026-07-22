import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// PUT /api/admin/ruang-budaya/[id] — update post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body   = await req.json();
  const { title, excerpt, content, coverImage, tags, productId, type,
          eventDate, eventLocation, eventMaxRsvp, contactUrl, isPublished } = body;

  const existing = await prisma.culturalPost.findUnique({ where: { id } });
  if (!existing) return err("Post tidak ditemukan", 404);

  // Regenerate slug jika title berubah
  let slug = existing.slug;
  if (title && title !== existing.title) {
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
    const count = await prisma.culturalPost.count({
      where: { slug: { startsWith: baseSlug }, id: { not: id } },
    });
    slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;
  }

  const updated = await prisma.culturalPost.update({
    where: { id },
    data: {
      ...(title        !== undefined && { title, slug }),
      ...(type         !== undefined && { type }),
      ...(excerpt      !== undefined && { excerpt }),
      ...(content      !== undefined && { content }),
      ...(coverImage   !== undefined && { coverImage }),
      ...(tags         !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(productId    !== undefined && { productId }),
      ...(eventDate    !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
      ...(eventLocation!== undefined && { eventLocation }),
      ...(eventMaxRsvp !== undefined && { eventMaxRsvp: eventMaxRsvp ? parseInt(eventMaxRsvp) : null }),
      ...(contactUrl   !== undefined && { contactUrl }),
      ...(isPublished  !== undefined && {
        isPublished,
        publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      }),
    },
  });

  return ok(updated);
}

// DELETE /api/admin/ruang-budaya/[id] — hapus post
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.culturalPost.delete({ where: { id } });
  return ok({ message: "Post dihapus" });
}

// GET /api/admin/ruang-budaya/[id] — detail post (untuk edit)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const post = await prisma.culturalPost.findUnique({
    where: { id },
    include: {
      author:  { select: { name: true } },
      _count:  { select: { rsvps: true } },
      rsvps:   { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!post) return err("Post tidak ditemukan", 404);
  return ok(post);
}
