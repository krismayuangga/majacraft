"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { formatRupiah } from "@/lib/data";

type FlashProduct = {
  id: string; name: string; slug: string; price: number;
  flashSalePrice?: number | null; originalPrice?: number | null;
  image: string; stock: number;
};

function useCountdown(targetHour: number) {
  const [seconds, setSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const getSeconds = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      return Math.floor((target.getTime() - now.getTime()) / 1000);
    };
    setSeconds(getSeconds());
    const t = setInterval(() => setSeconds(getSeconds()), 1000);
    return () => clearInterval(t);
  }, [targetHour]);
  if (!mounted) return { h: "--", m: "--", s: "--" };
  return {
    h: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    m: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    s: String(seconds % 60).padStart(2, "0"),
  };
}

export default function FlashSale() {
  const { h, m, s } = useCountdown(22);
  const [products, setProducts] = useState<FlashProduct[]>([]);

  useEffect(() => {
    // Flash sale dengan daily rotation — berganti setiap hari
    fetch("/api/products?flashSale=1&dailyRotation=1&limit=10")
      .then(r => r.json())
      .then(d => {
        const items = d.data?.items ?? [];
        if (items.length > 0) {
          setProducts(items.map((p: Record<string, unknown>) => ({
            id: String(p.id), name: String(p.name), slug: String(p.slug),
            price: Number(p.price),
            flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
            originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
            image: ((p.images as {url:string}[])?.[0]?.url) ?? "",
            stock: Number(p.stock ?? 1),
          })));
        }
      })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
      <div className="rounded-2xl bg-gradient-to-br from-red-950 via-[#1C1A14] to-amber-950 border border-red-900/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-900/20">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-red-400 fill-red-400" />
            <span className="font-bold text-base text-red-300 tracking-widest uppercase">Flash Sale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-400/70 text-xs font-medium">Berakhir dalam</span>
            {[h, m, s].map((unit, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-red-600 text-white text-sm font-bold px-2 py-1 rounded min-w-[32px] text-center tabular-nums">{unit}</span>
                {i < 2 && <span className="text-red-400 font-bold">:</span>}
              </span>
            ))}
          </div>
          <Link href="/produk?flashSale=1" className="text-xs text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            Lihat Semua →
          </Link>
        </div>

        {/* Products — mobile: scroll, desktop: grid */}
        <div className="px-5 py-4">
          {/* Mobile horizontal scroll */}
          <div className="flex md:hidden gap-3 overflow-x-auto scrollbar-gold pb-1">
            {products.map((p) => {
              const displayPrice = p.flashSalePrice ?? p.price;
              const origPrice = p.originalPrice ?? p.price;
              const higherPrice = Math.max(origPrice, displayPrice); const lowerPrice = Math.min(origPrice, displayPrice); const disc = higherPrice > lowerPrice ? Math.round(((higherPrice - lowerPrice) / higherPrice) * 100) : 0; const hasDiscount = p.originalPrice != null && p.originalPrice !== p.price;
              return (
                <Link key={p.id} href={`/produk/${p.slug}`} className="flex-shrink-0 w-32 group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black/20 mb-2 border border-red-900/20">
                    {p.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                    }
                    {disc > 0 && <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">-{disc}%</span>}
                  </div>
                  <p className="text-xs font-semibold text-amber-100 line-clamp-2 mb-1.5 leading-tight">{p.name}</p>
                  <p className="text-sm font-bold text-red-400">{formatRupiah(displayPrice)}</p>
                  {hasDiscount && (
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] line-through text-amber-200/50">{formatRupiah(origPrice)}</p>
                      <span className="text-[9px] font-bold text-white bg-red-600 px-1 py-0.5 rounded-sm">-{disc}%</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {products.map((p) => {
              const displayPrice = p.flashSalePrice ?? p.price;
              const origPrice = p.originalPrice ?? p.price;
              const higherPrice = Math.max(origPrice, displayPrice); const lowerPrice = Math.min(origPrice, displayPrice); const disc = higherPrice > lowerPrice ? Math.round(((higherPrice - lowerPrice) / higherPrice) * 100) : 0; const hasDiscount = p.originalPrice != null && p.originalPrice !== p.price;
              return (
                <Link key={p.id} href={`/produk/${p.slug}`} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black/20 mb-2.5 border border-red-900/20 group-hover:border-red-700/40 transition-colors">
                    {p.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>
                    }
                    {disc > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow">
                        -{disc}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-amber-100 line-clamp-2 mb-1.5 leading-snug group-hover:text-amber-300 transition-colors">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-red-400">{formatRupiah(displayPrice)}</p>
                  {hasDiscount && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] line-through text-amber-200/50">{formatRupiah(origPrice)}</p>
                      <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-sm">-{disc}%</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
