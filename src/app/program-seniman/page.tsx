import Link from "next/link";
import { Star, Users, Palette, TrendingUp, Award, BookOpen, ChevronRight } from "lucide-react";

const benefits = [
  { icon: Star, title: "Tampil di Beranda", desc: "Karya Anda ditampilkan di halaman utama MajaCraft dengan jangkauan jutaan pengunjung." },
  { icon: Award, title: "Sertifikasi Prioritas", desc: "Anggota program mendapat kuota sertifikasi NFT lebih banyak dan proses verifikasi dipercepat." },
  { icon: TrendingUp, title: "Komisi Lebih Rendah", desc: "Nikmati tarif komisi khusus mulai 3% (vs 5% reguler) untuk anggota aktif program." },
  { icon: BookOpen, title: "Workshop & Pelatihan", desc: "Akses eksklusif ke workshop fotografi produk, teknik deskripsi, dan strategi pemasaran digital." },
  { icon: Users, title: "Komunitas Seniman", desc: "Bergabung dengan jaringan ratusan seniman dan pengrajin dari seluruh Nusantara." },
  { icon: Palette, title: "Kolaborasi & Pameran", desc: "Kesempatan ikut pameran virtual, kolaborasi lintas seniman, dan program ekspor internasional." },
];

const tiers = [
  {
    name: "Seniman Muda",
    color: "text-amber-600 border-amber-700/40 bg-amber-900/10",
    requirements: "Baru bergabung, belum ada penjualan",
    perks: ["Upload karya tanpa batas", "Sertifikat NFT gratis 5 karya/bulan", "Akses forum komunitas"],
  },
  {
    name: "Seniman Aktif",
    color: "text-amber-400 border-amber-600/40 bg-amber-800/10",
    requirements: "Min. 10 transaksi berhasil atau revenue Rp 5 juta",
    perks: ["Semua benefit Seniman Muda", "Badge terverifikasi di profil", "Sertifikat NFT gratis 15 karya/bulan", "Komisi 4%", "Prioritas tampil di hasil pencarian"],
  },
  {
    name: "Maestro Craft",
    color: "text-yellow-300 border-yellow-600/40 bg-yellow-900/10",
    requirements: "Min. 50 transaksi atau revenue Rp 30 juta",
    perks: ["Semua benefit Seniman Aktif", "Halaman profil premium", "Sertifikat NFT tidak terbatas", "Komisi 3%", "Undangan pameran virtual eksklusif", "Manajer akun dedikasi"],
  },
];

export default function ProgramSeniman() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Palette className="w-3 h-3" /> Program Eksklusif
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Program Seniman MajaCraft</h1>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Kami percaya setiap pengrajin dan seniman Indonesia layak mendapat panggung yang lebih besar. Program Seniman hadir untuk mendukung perjalanan Anda.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
        {benefits.map((b, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center mb-3">
              <b.icon className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1.5">{b.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Tiers */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Tingkatan Program</h2>
        <div className="space-y-4">
          {tiers.map((tier, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${tier.color}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold ${tier.color.split(" ")[0]}`}>{tier.name}</h3>
                <span className="text-xs text-muted-foreground">{tier.requirements}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {tier.perks.map((perk, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-2">Siap bergabung?</p>
        <p className="text-sm text-muted-foreground mb-4">Buka Studio Seniman dan mulai perjalanan Anda bersama MajaCraft</p>
        <Link href="/studio" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
          Mulai Sekarang <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
