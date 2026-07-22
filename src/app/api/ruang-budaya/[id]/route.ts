import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

// GET /api/ruang-budaya/[id] — detail post (by id or slug)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const post = await prisma.culturalPost.findFirst({
    where: {
      isPublished: true,
      OR: [{ id }, { slug: id }],
    },
    include: {
      author:  { select: { name: true, image: true } },
      product: {
        select: {
          name: true, slug: true, price: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          store:  { select: { name: true } },
        },
      },
      _count: { select: { rsvps: true } },
    },
  });

  if (!post) return err("Post tidak ditemukan", 404);

  // Increment view count (fire and forget)
  prisma.culturalPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return ok(post);
}
