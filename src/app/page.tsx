"use client";

import HeroBanner from "@/components/marketplace/HeroBanner";
import CategoryGrid from "@/components/marketplace/CategoryGrid";
import ProductGrid from "@/components/marketplace/ProductGrid";
import PromoSection from "@/components/marketplace/PromoSection";
import FlashSale from "@/components/marketplace/FlashSale";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div>
      {/* Hero Banner Slider */}
      <HeroBanner />

      {/* Category Grid */}
      <CategoryGrid />

      <Separator className="max-w-7xl mx-auto opacity-30" />

      {/* Flash Sale — mobile only */}
      <FlashSale />

      {/* Karya Pilihan — dari DB */}
      <ProductGrid
        title="Karya Pilihan"
        subtitle="Mahakarya terpilih dari seniman terbaik Nusantara"
        apiUrl="/api/products?featured=1&limit=5"
        filter={(p) => Boolean(p.isFeatured)}
        href="/produk?featured=1"
        limit={5}
      />

      {/* Perks & Studio CTA */}
      <PromoSection />

      {/* Baru Ditambahkan — dari DB */}
      <ProductGrid
        title="Baru Ditambahkan"
        subtitle="Karya seni terbaru yang baru saja didaftarkan"
        apiUrl="/api/products?sort=terbaru&limit=8"
        href="/produk?sort=terbaru"
        limit={8}
      />

      <Separator className="max-w-7xl mx-auto opacity-30 my-2" />

      {/* Koleksi Bersertifikat — dari DB */}
      <ProductGrid
        title="Koleksi Bersertifikat"
        subtitle="Setiap karya dilengkapi dokumen keaslian resmi"
        apiUrl="/api/products?sertifikat=1&limit=5"
        filter={(p) => Boolean(p.hasCertificate)}
        href="/produk?sertifikat=1"
        limit={5}
      />

      <div className="h-4" />
    </div>
  );
}
