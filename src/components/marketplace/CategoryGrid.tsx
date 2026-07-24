"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  _count: { products: number };
};

// Fallback image jika DB belum punya imageUrl
const FALLBACK_IMAGES: Record<string, string> = {
  "kerajinan-batu":  "/images/cat-batu.jpg",
  "batik-kain":      "/images/cat-batik.jpg",
  "ukiran-kayu":     "/images/cat-kayu.jpg",
  "perhiasan-logam": "/images/cat-logam.jpg",
  "fotografi":       "/images/cat-fotografi.jpg",
  "wayang-topeng":   "/images/cat-wayang.jpg",
  "keramik-gerabah": "/images/cat-keramik.jpg",
  "tas-aksesoris":   "/images/cat-tas.jpg",
  "lukisan":         "/images/cat-lukisan.jpg",
  "lainnya":         "/images/cat-lainnya.jpg",
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-5 md:py-10">
      <div className="flex items-center justify-between mb-4 px-4 max-w-7xl md:mx-auto">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Kategori</h2>
          <div className="ornament-divider w-14 mt-1.5" />
        </div>
        <Link href="/produk" className="text-sm text-amber-600 hover:text-amber-500 transition-colors font-medium">
          Lihat Semua →
        </Link>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-gold px-4">
        <div className="grid grid-rows-2 grid-flow-col gap-3 w-max">
          {categories.map((cat) => {
            const image = cat.imageUrl || FALLBACK_IMAGES[cat.slug] || "/images/cat-lainnya.jpg";
            return (
              <Link
                key={cat.id}
                href={`/produk?kategori=${cat.slug}`}
                className="group flex flex-col items-center gap-1.5 w-20"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-md group-hover:shadow-amber-900/30">
                  <Image src={image} alt={cat.name} fill className="object-cover" />
                </div>
                <span className="text-[10px] text-center leading-tight text-muted-foreground group-hover:text-amber-600 font-medium w-full px-0.5">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop: grid 10 kolom */}
      <div className="hidden md:grid grid-cols-10 gap-3 px-4 max-w-7xl mx-auto">
        {categories.map((cat) => {
          const count = cat._count.products;
          const image = cat.imageUrl || FALLBACK_IMAGES[cat.slug] || "/images/cat-lainnya.jpg";
          return (
            <Link
              key={cat.id}
              href={`/produk?kategori=${cat.slug}`}
              className="group flex flex-col items-center gap-2"
            >
              <div className="relative w-full aspect-square rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-amber-900/30">
                <Image src={image} alt={cat.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-300 rounded-lg" />
                {count > 0 && (
                  <span className="absolute top-1 right-1 bg-black/60 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-center leading-tight text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-medium px-1">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
