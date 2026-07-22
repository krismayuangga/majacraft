"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { FEATURED_BANNERS } from "@/lib/data";

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % FEATURED_BANNERS.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    startTimer();
  }, [startTimer]);

  const goNext = useCallback(() =>
    goTo((current + 1) % FEATURED_BANNERS.length), [current, goTo]);
  const goPrev = useCallback(() =>
    goTo((current - 1 + FEATURED_BANNERS.length) % FEATURED_BANNERS.length), [current, goTo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrev();
  };

  const banner = FEATURED_BANNERS[current];

  return (
    <section
      className="relative bg-[#1C1A14] overflow-hidden min-h-[300px] md:min-h-[520px] select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images */}
      {FEATURED_BANNERS.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={b.image}
            alt={b.title}
            fill
            priority={i === 0}
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Batik pattern overlay */}
      <div className="absolute inset-0 bg-batik-overlay opacity-10" />

      {/* Corner ornaments */}
      <div className="absolute top-4 left-4 w-16 h-16 opacity-30 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M0 0 L64 0 L64 8 L8 8 L8 64 L0 64 Z" fill="#C9A84C" />
          <path d="M16 16 L48 16 L48 20 L20 20 L20 48 L16 48 Z" fill="#C9A84C" />
        </svg>
      </div>
      <div className="absolute top-4 right-4 w-16 h-16 opacity-30 rotate-90 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M0 0 L64 0 L64 8 L8 8 L8 64 L0 64 Z" fill="#C9A84C" />
        </svg>
      </div>
      <div className="absolute bottom-8 right-4 w-16 h-16 opacity-30 rotate-180 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M0 0 L64 0 L64 8 L8 8 L8 64 L0 64 Z" fill="#C9A84C" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-24">
        <div className="max-w-2xl">
          {/* Accent badge */}
          <div className="inline-flex items-center gap-2 mb-2 md:mb-5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-sm bg-amber-900/50 border border-amber-600/50">
              <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
              <span className="text-[10px] md:text-xs font-semibold text-amber-300 tracking-widest uppercase">
                {banner.accent}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-6xl font-bold text-white mb-2 md:mb-4 leading-tight drop-shadow-lg">
            <span className="text-gold-gradient">{banner.title.split(" ")[0]}</span>{" "}
            <span className="text-amber-50">{banner.title.split(" ").slice(1).join(" ")}</span>
          </h1>

          {/* Subtitle — tampil di semua ukuran, line-clamp di mobile */}
          <p className="text-amber-200/80 text-xs sm:text-base md:text-lg mb-4 md:mb-8 leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-none">
            {banner.subtitle}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href={banner.href}
              className="inline-flex items-center justify-center btn-gold h-9 md:h-12 px-4 md:px-8 text-sm md:text-base font-semibold rounded-sm shadow-lg shadow-amber-900/40"
            >
              {banner.cta}
            </Link>
            <Link
              href={banner.href2 ?? "/studio"}
              className="inline-flex items-center justify-center h-9 md:h-12 px-3 md:px-6 text-sm md:text-base border border-amber-500/60 text-amber-200 hover:bg-amber-900/40 rounded-sm transition-all"
            >
              {banner.cta2 ?? "Jual Karya"}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide dots + swipe hint (mobile) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2.5">
          {FEATURED_BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-10 bg-amber-400" : "w-2.5 bg-amber-800/60 hover:bg-amber-600"
              }`}
            />
          ))}
        </div>
        {/* Swipe hint — hanya muncul di mobile, fade after first load */}
        <p className="md:hidden text-[9px] text-amber-500/50 tracking-widest">← geser →</p>
      </div>

      {/* Arrow controls — hanya desktop */}
      <button
        onClick={goPrev}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-amber-700/40 items-center justify-center text-amber-300 hover:bg-amber-900/60 hover:border-amber-500 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goNext}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-amber-700/40 items-center justify-center text-amber-300 hover:bg-amber-900/60 hover:border-amber-500 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </section>
  );
}

