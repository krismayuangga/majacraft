import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-[#0F0E0A] border-t border-amber-900/30 text-amber-200/70 pb-20 md:pb-0">
      {/* Ornament divider */}
      <div className="ornament-divider" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand — full width di mobile */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/new-logo-majacraft.png"
                alt="MajaCraft"
                width={150}
                height={46}
                className="object-contain h-11 w-auto"
              />
            </Link>
            <p className="text-sm leading-relaxed text-amber-300/60">
              Gerbang kerajinan seni Nusantara terpercaya. Menghubungkan seniman lokal dengan kolektor di seluruh dunia.
            </p>
            <div className="flex gap-3">
              {[
                { src: "/images/social-instagram.png", alt: "Instagram", href: "https://www.instagram.com/majacraft.id/" },
                { src: "/images/social-tiktok.png",    alt: "TikTok",    href: "https://www.tiktok.com/@majacraft.id" },
                { src: "/images/social-facebook.png",  alt: "Facebook",  href: "https://www.facebook.com/profile.php?id=61591981286814" },
                { src: "/images/social-youtube.png",   alt: "YouTube",   href: "https://www.youtube.com/@MajaCraft" },
              ].map((s) => (
                <a key={s.alt} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.alt} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Kategori</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 7).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/produk?kategori=${cat.slug}`} className="text-sm hover:text-amber-300 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Layanan</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["Cara Berbelanja", "/bantuan/belanja"],
                ["Cara Berjualan", "/bantuan/jual"],
                ["Sertifikat Phygital", "/jaminan"],
                ["Ruang Budaya", "/ruang-budaya"],
                ["Program Seniman", "/program-seniman"],
                ["Pusat Bantuan", "/bantuan"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-amber-300 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Informasi</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["Tentang MajaCraft", "/tentang"],
                ["Kebijakan Privasi", "/privasi"],
                ["Syarat & Ketentuan", "/syarat"],
                ["Keamanan Transaksi", "/keamanan"],
                ["Karir", "/karir"],
                ["Hubungi Kami", "/kontak"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-amber-300 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment & Legal */}
        <div className="mt-8 pt-6 border-t border-amber-900/30">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Metode Pembayaran */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Metode Pembayaran</p>
              <Image
                src="/images/metode-pembayaran.png"
                alt="Metode Pembayaran"
                width={500}
                height={160}
                className="object-contain w-full max-w-xs md:max-w-sm"
              />
            </div>

            {/* Legalitas */}
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Legalitas &amp; Perizinan</p>
              <div className="flex gap-5 md:gap-8 items-end flex-wrap">
                <a href="https://pse.kominfo.go.id" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 group">
                  <Image src="/images/logo-komdigi-pse.png" alt="PSE Komdigi" width={155} height={48} className="opacity-90 group-hover:opacity-100 transition-opacity max-h-10 md:max-h-12 w-auto" />
                  <p className="text-[9px] md:text-[10px] text-amber-500 font-mono text-center">20260711-NE0SH</p>
                </a>
                <a href="https://oss.go.id" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 group">
                  <Image src="/images/logo-oss.svg" alt="OSS BKPM" width={164} height={48} className="opacity-90 group-hover:opacity-100 transition-opacity max-h-10 md:max-h-12 w-auto" />
                  <p className="text-[9px] md:text-[10px] text-amber-500 font-mono text-center">0807240028155</p>
                </a>
                <a href="https://ahu.go.id" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 group">
                  <Image src="/images/logo-ahu.png" alt="Kemenkumham" width={95} height={48} className="opacity-90 group-hover:opacity-100 transition-opacity max-h-10 md:max-h-12 w-auto" />
                  <p className="text-[9px] md:text-[10px] text-amber-500 font-mono text-center">AHU-000405.AH.01.30.2024</p>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-5 border-t border-amber-900/30 flex flex-col md:grid md:grid-cols-3 items-center gap-3">
          <p className="text-xs text-amber-500 text-center md:text-left">© 2026 MajaCraft by <span className="text-amber-400 font-medium">PT BSE Group Teknologi</span>.<br className="md:hidden" /> Melestarikan Warisan Nusantara.</p>
          <div className="flex justify-center">
            <Image src="/images/ssl-secure.png" alt="SSL Secure" width={140} height={48} className="object-contain opacity-80" />
          </div>
          <p className="text-xs text-amber-600 text-center md:text-right">Platform Kerajinan Seni Indonesia Terpercaya</p>
        </div>
      </div>
    </footer>
  );
}
