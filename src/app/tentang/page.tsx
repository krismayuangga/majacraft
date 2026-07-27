import Link from "next/link";
import { Heart, Globe, Leaf, Users, Award, ChevronRight, ShieldCheck, Zap } from "lucide-react";

const values = [
  { icon: Heart, title: "Cinta Budaya", desc: "Kami berkomitmen melestarikan kekayaan warisan budaya Nusantara — dari Sabang sampai Merauke." },
  { icon: Zap, title: "Zero Barrier", desc: "Menghilangkan hambatan teknis agar setiap pengrajin tradisional bisa berjualan semudah membuka toko biasa." },
  { icon: ShieldCheck, title: "Sertifikat Phygital", desc: "Setiap karya dilindungi Sertifikat Phygital otomatis — identitas digital yang tidak bisa dipalsukan." },
  { icon: Globe, title: "Jangkauan Nasional", desc: "Membawa karya seniman lokal ke pembeli di seluruh Indonesia, dan kelak ke kolektor internasional." },
  { icon: Leaf, title: "Ekosistem Adil", desc: "Mendukung penghidupan pengrajin UMKM dengan sistem yang transparan, fee rendah, dan dana ekosistem budaya." },
  { icon: Users, title: "Komunitas Pertama", desc: "Membangun komunitas saling mendukung antara pembeli, seniman, kurator, dan pecinta budaya Nusantara." },
];

const roadmap = [
  { phase: "Q1–Q2 2026", title: "Fondasi", done: true, items: ["Peluncuran Platform", "Digital Museum Nusantara", "Pembangunan Komunitas", "Kemitraan Seniman Pertama"] },
  { phase: "Q3–Q4 2026", title: "Marketplace", done: false, current: true, items: ["MAJA Marketplace Beta", "Sertifikat Phygital Fisik-Digital", "Sistem Escrow Aman", "Onboarding 500+ Seniman"] },
  { phase: "Q1–Q2 2027", title: "Ekspansi", done: false, items: ["Full Marketplace Launch", "Ekspor ke Kolektor Internasional", "Pameran Virtual Skala Besar", "Integrasi Logistik Nasional"] },
  { phase: "H2 2027+", title: "Ekosistem", done: false, items: ["Galeri Imersif Digital", "Standar Sertifikasi Seni Nasional", "Mitra Institusi Budaya", "Pelestarian Warisan Permanen"] },
];

export default function TentangMajaCraft() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Award className="w-3 h-3" /> Tentang Kami
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Tentang MajaCraft</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-base">
          MajaCraft adalah jembatan antara warisan budaya fisik Nusantara dengan dunia digital — marketplace kerajinan tradisional Indonesia yang memastikan setiap karya asli terdokumentasi, terlindungi, dan mudah dijangkau.
        </p>
      </div>

      {/* Filosofi */}
      <div className="relative p-7 rounded-2xl overflow-hidden mb-8 border border-amber-700/30">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/60 via-[#1a1409] to-amber-900/20" />
        <div className="relative">
          <p className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.2em] mb-4">✦ Filosofi</p>
          <blockquote className="text-xl md:text-2xl text-amber-100 font-semibold leading-relaxed mb-4 italic">
            &ldquo;Jika Gajah Mada menyatukan Nusantara secara politik,<br />
            <span className="text-amber-400">MajaCraft menyatukan Nusantara melalui ekonomi kreatif.</span>&rdquo;
          </blockquote>
          <p className="text-sm text-amber-200/60 leading-relaxed max-w-2xl">
            MajaCraft berperan sebagai jembatan <em className="text-amber-400 not-italic font-medium">Phygital</em> — menghubungkan produk fisik dengan identitas digital. Setiap karya yang masuk platform otomatis mendapat Sertifikat Phygital sebagai identitas digital permanen yang tidak dapat dipalsukan.
          </p>
        </div>
      </div>

      {/* Visi & Misi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="p-6 rounded-2xl border border-amber-700/20 bg-gradient-to-br from-amber-900/20 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/30 flex items-center justify-center">
              <span className="text-amber-400 text-xs">◈</span>
            </div>
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.15em]">Visi</p>
          </div>
          <p className="text-base text-foreground font-semibold leading-relaxed">
            Menjadi standar sertifikasi seni nasional dan pusat pelestarian budaya digital Nusantara yang diakui secara global.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/30 flex items-center justify-center">
              <span className="text-amber-400 text-xs">◈</span>
            </div>
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.15em]">Misi</p>
          </div>
          <ul className="space-y-2.5">
            {[
              "Menghilangkan hambatan teknis agar pengrajin UMKM bisa berjualan langsung",
              "Mendigitalisasi warisan budaya melalui Sertifikat Phygital otomatis",
              "Mendukung ekosistem seni yang adil dan berkelanjutan bagi seniman lokal",
            ].map((m, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1 w-4 h-4 rounded-full bg-amber-700/30 border border-amber-600/30 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-amber-400">{i+1}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Values */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-1">Nilai-Nilai Kami</h2>
        <p className="text-sm text-muted-foreground mb-6">Prinsip yang mendasari setiap keputusan dan langkah MajaCraft.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {values.map((v, i) => (
            <div key={i} className="group p-5 rounded-2xl border border-border bg-card hover:border-amber-700/40 hover:bg-amber-900/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center mb-3 group-hover:bg-amber-900/50 transition-colors">
                <v.icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1.5">{v.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-1">Perjalanan Kami</h2>
        <p className="text-sm text-muted-foreground mb-6">Roadmap pembangunan ekosistem MajaCraft dari fondasi hingga ekspansi global.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmap.map((phase, i) => (
            <div key={i} className={`relative p-5 rounded-2xl border overflow-hidden ${
              phase.current
                ? "border-amber-600/50 bg-gradient-to-br from-amber-900/20 to-transparent"
                : phase.done
                ? "border-green-800/30 bg-green-900/5"
                : "border-border bg-card"
            }`}>
              {phase.current && (
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 text-[10px] text-green-400 border border-green-700/30 bg-green-900/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Sekarang
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  phase.current ? "bg-amber-700/40 text-amber-300" :
                  phase.done ? "bg-green-900/30 text-green-400" :
                  "bg-muted text-muted-foreground"
                }`}>{phase.phase}</span>
                <span className="text-sm font-bold text-foreground">{phase.title}</span>
              </div>
              <ul className="space-y-2">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] ${
                      phase.done ? "bg-green-900/30 text-green-500" :
                      phase.current ? "bg-amber-700/30 text-amber-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{phase.done ? "✓" : (j + 1)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative text-center p-10 rounded-2xl overflow-hidden mb-10 border border-amber-700/30">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-[#1a1409] to-amber-900/30" />
        <div className="relative">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">✦ Bergabunglah</p>
          <p className="text-xl font-bold text-foreground mb-2">Lestarikan Warisan Budaya Nusantara</p>
          <p className="text-sm text-amber-200/60 mb-6 max-w-md mx-auto">Bersama-sama kita jaga dan wariskan kekayaan budaya Indonesia untuk generasi mendatang.</p>
          <div className="flex justify-center gap-3">
            <Link href="/produk" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
              Jelajahi Karya <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/kontak" className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-600/40 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-900/20 transition-colors">
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>

      {/* Legalitas */}
      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-900/30 border border-amber-800/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm">Legalitas Perusahaan</h2>
            <p className="text-xs text-muted-foreground">PT BSE Group Teknologi — Beroperasi sah berdasarkan hukum Republik Indonesia</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Nomor Induk Berusaha (NIB)", sub: "OSS · BKPM", value: "0807240028155" },
            { label: "Tanda Daftar PSE", sub: "Kementerian Kominfo", value: "20260711-NE0SH" },
            { label: "SK Badan Hukum (AHU)", sub: "Kemenkumham RI", value: "AHU-000405.AH.01.30.2024" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-muted/20 border border-border">
              <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mb-1.5">{item.sub}</p>
              <p className="text-sm text-amber-400 font-mono font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
