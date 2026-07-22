import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://majacraft.id'

  // Static pages with priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/produk`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kategori`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/toko`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ruang-budaya`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/program-seniman`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tentang`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/kontak`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/bantuan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privasi`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/syarat`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Fetch categories
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    })

    const categoryPages = categories.map(cat => ({
      url: `${baseUrl}/kategori/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

    // Fetch featured products (high priority)
    const featuredProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isCurated: true,
      },
      select: { slug: true, updatedAt: true },
      take: 500, // Limit to avoid huge sitemap
      orderBy: { soldCount: 'desc' },
    })

    const featuredProductPages = featuredProducts.map(prod => ({
      url: `${baseUrl}/produk/${prod.slug}`,
      lastModified: prod.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

    // Fetch all products
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000, // Google recommends max 50k URLs per sitemap
    })

    const productPages = allProducts.map(prod => ({
      url: `${baseUrl}/produk/${prod.slug}`,
      lastModified: prod.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Fetch verified stores (seller profiles)
    const stores = await prisma.store.findMany({
      where: { isActive: true, isVerified: true },
      select: { slug: true, updatedAt: true },
      take: 1000,
    })

    const storePages = stores.map(store => ({
      url: `${baseUrl}/toko/${store.slug}`,
      lastModified: store.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const productMap = new Map<string, MetadataRoute.Sitemap[number]>()

    for (const page of productPages) {
      productMap.set(page.url, page)
    }

    for (const page of featuredProductPages) {
      productMap.set(page.url, page)
    }

    return [
      ...staticPages,
      ...categoryPages,
      ...Array.from(productMap.values()),
      ...storePages,
    ]
  } catch (error) {
    console.error('Sitemap generation error:', error)
    // Return only static pages if database fails
    return staticPages
  }
}
