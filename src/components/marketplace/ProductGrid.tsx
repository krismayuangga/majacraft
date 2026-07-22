"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  title: string;
  subtitle?: string;
  filter?: (p: Record<string, unknown>) => boolean;
  href?: string;
  limit?: number;
  apiUrl?: string;
}

export default function ProductGrid({ title, subtitle, filter, href = "/produk", limit = 8, apiUrl }: ProductGridProps) {
  const [dbProducts, setDbProducts] = useState<Record<string, unknown>[]>([]);
  const [loadedFromDb, setLoadedFromDb] = useState(false);
  const [loading, setLoading] = useState(!!apiUrl); // show loading only for API mode

  useEffect(() => {
    if (!apiUrl) return;
    fetch(apiUrl)
      .then(r => r.json())
      .then(d => {
        const items = d.data?.items ?? [];
        const normalized = items.map((p: Record<string, unknown>) => ({
          id: String(p.id), name: String(p.name), slug: String(p.slug),
          price: Number(p.price), originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          image: ((p.images as {url:string}[])?.[0]?.url) ?? "",
          images: [(((p.images as {url:string}[])?.[0]?.url) ?? "")],
          category: ((p.category as {slug:string})?.slug) ?? "",
          seller: { name: ((p.store as {name:string})?.name) ?? "", avatar: "", location: ((p.store as {province:string})?.province) ?? "", rating: 5, sold: Number(p.soldCount ?? 0) },
          rating: Number(p.rating ?? 5), reviews: Number(p.reviewCount ?? 0), sold: Number(p.soldCount ?? 0),
          isPhygital: Boolean(p.hasCertificate), isVerified: Boolean((p.store as {isVerified:boolean})?.isVerified),
          isFeatured: Boolean(p.isFeatured), hasCertificate: Boolean(p.hasCertificate),
          isCurated: Boolean(p.isCurated), isSoldOffline: Boolean(p.isSoldOffline),
          certificateId: String(p.certificateId ?? ""), stock: Number(p.stock ?? 1),
          material: String(p.material ?? ""), dimensions: String(p.dimensions ?? ""),
          weight: p.weight ? `${p.weight} gram` : "", origin: String(p.origin ?? ""),
          description: String(p.description ?? ""), tags: (p.tags as string[]) ?? [],
        }));
        setDbProducts(normalized);
        setLoadedFromDb(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  // Hanya tampilkan data dari DB (apiUrl wajib)
  const products = loadedFromDb ? dbProducts.slice(0, limit) : [];

  // Skeleton placeholders saat loading — tanpa animate-pulse (menghindari GPU layer issues di Android)
  if (loading && apiUrl) return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div><div className="h-7 w-40 bg-muted rounded" /><div className="ornament-divider w-16 mt-2" /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
        {Array.from({length: limit > 6 ? 6 : limit}).map((_,i) => (
          <div key={i} className="rounded-xl bg-muted">
            <div className="aspect-square rounded-t-xl bg-muted-foreground/10" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-3 bg-muted-foreground/15 rounded" />
              <div className="h-3 bg-muted-foreground/15 rounded" />
              <div className="h-4 w-2/3 bg-muted-foreground/15 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          <div className="ornament-divider w-16 mt-2" />
        </div>
        <Link href={href} className="text-sm text-amber-600 hover:text-amber-500 transition-colors font-medium mt-1">
          Lihat Semua →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
        {products.map((product: Record<string, unknown>) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ProductCard key={String(product.id)} product={product as unknown as Parameters<typeof ProductCard>[0]['product']} />
        ))}
      </div>
    </section>
  );
}
