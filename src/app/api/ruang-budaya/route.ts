import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api-helpers";

// GET /api/ruang-budaya — list konten publik (hanya published)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type    = searchParams.get("type");   // ARTIKEL | CERITA_KARYA | ACARA
  const limit   = parseInt(searchParams.get("limit") ?? "12");
  const cursor  = searchParams.get("cursor");

  const posts = await prisma.culturalPost.findMany({
    where: {
      isPublished: true,
      ...(type ? { type: type as never } : {}),
    },
    include: {
      author:  { select: { name: true, image: true } },
      product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
      _count:  { select: { rsvps: true } },
    },
    orderBy: { publishedAt: "desc" },
    take:    limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore   = posts.length > limit;
  const data      = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return ok({ posts: data, nextCursor });
}
