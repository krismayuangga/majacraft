import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";

// GET /api/studio/products
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return ok(products);
}

// POST /api/studio/products — daftarkan karya baru
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Buka Studio terlebih dahulu", 403);

  const body = await req.json();
  const {
    name, description, categoryId, price, originalPrice,
    stock, material, dimensions, weight, length, width, height,
    origin, tags, kondisi, imageUrls,
  } = body;

  if (!name || !description || !categoryId || !price)
    return err("name, description, categoryId, price wajib diisi");

  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const count = await prisma.product.count({ where: { slug: { startsWith: baseSlug } } });
  const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

  const product = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId,
      name,
      slug,
      description,
      price: parseInt(price),
      originalPrice: originalPrice ? parseInt(originalPrice) : null,
      stock: parseInt(stock ?? 1),
      material: material ?? null,
      dimensions: dimensions ?? null,
      weight: weight ? parseInt(weight) : null,
      length: length ? parseInt(length) : null,
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      origin: origin ?? store.province,
      tags: Array.isArray(tags) ? tags : [],
      isActive: true,       // langsung publik agar bisa dibeli
      isModerated: false,    // belum dikurasi admin — akan muncul di antrian moderasi
      moderatedAt: null,
      hasCertificate: false, // diset admin secara manual via panel Sertifikat Digital
      // Auto flash sale jika ada diskon
      isFlashSale: !!(originalPrice && parseInt(originalPrice) > parseInt(price)),
    },
  });

  // Simpan foto produk
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    await prisma.productImage.createMany({
      data: imageUrls.map((url: string, i: number) => ({
        productId: product.id,
        url,
        sortOrder: i,
        isPrimary: i === 0,
      })),
    });
  }

  // Kirim notifikasi ke seller
  await createNotification({
    userId: session!.user!.id!,
    type: "product_published",
    title: "Produk Berhasil Dipublish! 🎉",
    body: `Produk "${product.name}" sudah aktif di marketplace dan dapat langsung dibeli pembeli.`,
    data: { productId: product.id, productSlug: product.slug },
  });

  return ok(product, 201);
}
