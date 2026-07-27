import Link from "next/link";
import { Users, Palette, TrendingUp, Award, BookOpen, ChevronRight, CheckCircle2, Shield } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getFeePercent(): Promise<number> {
  try {
    const s = await prisma.platformSetting.findUnique({ where: { key: "fee_percent" } });
    return s ? Number(s.value) : 5;
  } catch {
    return 5;
  }
}

export default async function ProgramSeniman() {
  const feePercent = await getFeePercent();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Upload Karya Tanpa Batas",
      desc: "Daftarkan sebanyak apapun karya Anda. Tidak ada biaya listing, tidak ada batas jumlah produk.",
    },
    {
      icon: Award,
      title: "Sertifikat Kepemilikan Digital",
      desc: "Karya eksklusif dan unik berpotensi mendapatkan Sertifikat Kepemilikan berbasis blockchain dari tim MajaCraft.",
    },
    {
      icon: Users,
      title: "Komunitas Seniman",
      desc: "Bergabung dengan jaringan seniman dan pengrajin dari seluruh Nusantara.",
    },
    {
      icon: BookOpen,
      title: "Dashboard Studio Lengkap",
      desc: "Kelola produk, pantau pesanan, dan lihat laporan penjualan dalam satu dashboard yang mudah digunakan.",
    },
    {
      icon: Palette,
      title: "Jangkauan Nasional",
      desc: "Karya Anda dapat ditemukan oleh pembeli dari seluruh Indonesia melalui platform MajaCraft.",
    },
    {
      icon: Shield,
      title: "Transaksi Aman & Terpercaya",
      desc: "Setiap transaksi dilindungi sistem escrow MajaCraft. Dana dirilis ke Anda setelah pembeli mengkonfirmasi penerimaan.",
    },
  ];

  const howToJoin = [
    { step: "1", title: "Daftar Akun", desc: "Buat akun MajaCraft secara gratis menggunakan email atau Google." },
    { step: "2", title: "Upgrade ke Seniman", desc: "Isi nama studio dan pilih provinsi asal untuk membuka akses Studio Seniman." },
    { step: "3", title: "Upload Karya", desc: "Unggah foto dan informasi karya. Karya akan ditinjau tim MajaCraft sebelum aktif di marketplace." },
    { step: "4", title: "Mulai Berjualan", desc: "Terima pesanan, kemas barang, dan cairkan saldo setelah penjualan berhasil." },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Palette className="w-3 h-3" /> Untuk Seniman & Pengrajin
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Jual Karya Anda di MajaCraft
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          MajaCraft terbuka untuk semua seniman dan pengrajin Indonesia.
          Semua penjual mendapatkan akses dan fasilitas yang sama — tidak ada tier, tidak ada syarat minimum penjualan.
        </p>
      </div>

      {/* Fee info strip */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { label: "Biaya Daftar", value: "Gratis" },
          { label: "Biaya Listing", value: "Gratis" },
          { label: "Komisi per Transaksi", value: `${feePercent}%` },
        ].map((item) => (
          <div key={item.label} className="p-4 rounded-xl border border-amber-800/20 bg-amber-900/10 text-center">
            <p className="text-base font-bold text-amber-400">{item.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Yang Anda Dapatkan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="w-9 h-9 rounded-lg bg-amber-900/30 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">{b.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to join */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Cara Bergabung</h2>
        <div className="space-y-3">
          {howToJoin.map((item) => (
            <div key={item.step} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-amber-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commitment */}
      <div className="p-5 rounded-2xl border border-border bg-card mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Komitmen MajaCraft kepada Seniman</h3>
        <ul className="space-y-2">
          {[
            `Komisi hanya ${feePercent}% — dipotong saat transaksi berhasil, tidak ada biaya tersembunyi`,
            "Dana masuk ke saldo toko setelah pembeli mengkonfirmasi penerimaan",
            "Pencairan ke rekening bank proses 1–2 hari kerja",
            "Tim MajaCraft siap membantu melalui pusat bantuan",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700/70 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-1">Siap mulai berjualan?</p>
        <p className="text-xs text-muted-foreground mb-5">
          Daftar gratis dan buka Studio Seniman dalam beberapa menit
        </p>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Buka Studio Seniman <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
