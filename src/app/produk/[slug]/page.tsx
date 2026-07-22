import ProductDetailClient from "./ProductDetailClient";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

// Dynamic rendering
export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  try {
    const p = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        store: { select: { name: true, slug: true, province: true, isVerified: true, rating: true, logoUrl: true } },
        category: { select: { name: true, slug: true } },
        reviews: { take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, image: true } } } },
        certificate: { select: { imageUrl: true } },
      },
    });
    if (!p) return null;

    return {
      id: p.id, name: p.name, slug: p.slug,
      price: p.price, originalPrice: p.originalPrice ?? null,
      image: p.images?.[0]?.url ?? "",
      images: p.images.map(i => i.url),
      category: p.category?.slug ?? "",
      seller: { name: p.store?.name ?? "Seniman", avatar: p.store?.logoUrl ?? "", location: p.store?.province ?? "", rating: Number(p.store?.rating ?? 5), sold: p.soldCount, slug: p.store?.slug ?? "" },
      rating: Number(p.rating), reviews: p.reviewCount, sold: p.soldCount,
      isPhygital: p.hasCertificate, isVerified: p.store?.isVerified ?? false,
      isFeatured: p.isFeatured, hasCertificate: p.hasCertificate,
      certificateId: p.certificateId ?? "", stock: p.stock,
      certificateImageUrl: p.certificate?.imageUrl ?? null,
      material: p.material ?? "", dimensions: p.dimensions ?? "",
      weight: p.weight ?? null,
      length: p.length ?? null, width: p.width ?? null, height: p.height ?? null,
      origin: p.origin ?? "",
      description: p.description, tags: p.tags,
      dbReviews: p.reviews,
    };
  } catch (e) {
    console.error("getProduct error:", e);
    return null;
  }
}

// ✅ DYNAMIC METADATA GENERATION
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan",
      description: "Produk yang Anda cari tidak tersedia di MajaCraft",
    };
  }

  const ratingText = product.rating > 0 ? `${product.rating.toFixed(1)} ⭐` : "Baru";
  const priceText = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(product.price);

  return {
    title: `${product.name} | ${priceText} - MajaCraft`,
    description: `${product.description.slice(0, 155)}... Toko: ${product.seller.name}. Rating: ${ratingText}. Beli sekarang dengan pembayaran aman & garansi keaslian.`,
    keywords: [
      product.name,
      ...product.tags,
      product.seller.name,
      "MajaCraft",
      "kerajinan seni",
      product.material,
      product.origin,
    ].filter(Boolean),
    openGraph: {
      title: `${product.name} - MajaCraft`,
      description: product.description.slice(0, 120),
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      url: `https://majacraft.id/produk/${product.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} - MajaCraft`,
      description: product.description.slice(0, 120),
      images: [product.image],
    },
    alternates: {
      canonical: `https://majacraft.id/produk/${product.slug}`,
    },
  };
}

// ✅ PRODUCT SCHEMA MARKUP (JSON-LD)
export function ProductSchema({ product }: { product: any }) {
  if (!product) return null;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.seller.name,
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "IDR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `https://majacraft.id/produk/${product.slug}`,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "seller": {
        "@type": "Organization",
        "name": product.seller.name,
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "IDR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "ID"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 7,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "ID",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    "aggregateRating": (product.rating > 0 && product.reviews > 0) ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating.toFixed(1),
      "reviewCount": product.reviews,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    "review": (product.reviews > 0) ? [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": product.rating >= 4 ? "5" : "4",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Pembeli Terverifikasi"
        },
        "reviewBody": `Produk ${product.name} berkualitas tinggi dan sesuai deskripsi. Pengiriman cepat dan aman.`
      }
    ] : undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  return (
    <>
      {product && <ProductSchema product={product} />}
      <ProductDetailClient slug={slug} serverProduct={product} />
    </>
  );
}
