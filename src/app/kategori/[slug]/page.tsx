import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/marketplace/ProductCard";
import { notFound } from "next/navigation";

async function getCategory(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true } },
        },
      },
    },
  });

  if (!category) return null;

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    include: {
      images: { take: 1 },
      store: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          rating: true,
        },
      },
    },
    orderBy: { soldCount: "desc" },
    take: 20,
  });

  return { category, products };
}

// ✅ DYNAMIC METADATA FOR CATEGORIES
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategory(slug);

  if (!data) {
    return {
      title: "Kategori Tidak Ditemukan",
      description: "Kategori yang Anda cari tidak tersedia",
    };
  }

  const { category, products } = data;

  return {
    title: `${category.name} - Jual Beli Seni & Kerajinan | MajaCraft`,
    description: `Temukan koleksi ${category.name} terlengkap dan terpercaya di MajaCraft. ${products.length} produk pilihan dari seniman lokal terbaik Indonesia.`,
    keywords: [
      category.name,
      `${category.name} Indonesia`,
      `beli ${category.name}`,
      `jual ${category.name}`,
      "kerajinan seni",
      "MajaCraft",
    ],
    openGraph: {
      title: `${category.name} - MajaCraft`,
      description: `Jelajahi koleksi ${category.name} dari seniman Indonesia terbaik`,
      url: `https://majacraft.id/kategori/${category.slug}`,
      type: "website",
    },
    alternates: {
      canonical: `https://majacraft.id/kategori/${category.slug}`,
    },
  };
}

// ✅ CATEGORY SCHEMA MARKUP
function CategorySchema({ category, productCount }: any) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    "name": category.name,
    "description": `Koleksi ${category.name} di MajaCraft`,
    "url": `https://majacraft.id/kategori/${category.slug}`,
    "numberOfItems": productCount,
    "mainEntity": {
      "@type": "Thing",
      "name": category.name,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCategory(slug);

  if (!data) {
    notFound();
  }

  const { category, products } = data;

  return (
    <>
      <CategorySchema category={category} productCount={products.length} />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            Beranda
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/kategori" className="text-blue-600 hover:underline">
            Kategori
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
          <p className="text-lg text-muted-foreground">
            {products.length} produk terpilih dari seniman lokal terbaik
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Belum ada produk di kategori ini
            </p>
          </div>
        )}
      </div>
    </>
  );
}
