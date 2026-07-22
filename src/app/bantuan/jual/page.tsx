import Link from "next/link";
import { Store, Camera, Tag, TrendingUp, BadgeCheck, Wallet, ChevronRight, Shield } from "lucide-react";

const steps = [
  {
    icon: Store,
    title: "Daftarkan Toko",
    desc: "Buat akun MajaCraft dan daftarkan toko seni Anda. Lengkapi profil toko dengan foto, deskripsi, dan lokasi asal karya untuk membangun kepercayaan pembeli.",
    tips: ["Pilih nama toko yang unik dan mudah diingat", "Upload logo toko resolusi tinggi", "Isi deskripsi toko dengan jelas dan menarik"],
  },
  {
    icon: Camera,
    title: "Upload Karya",
    desc: "Unggah foto karya berkualitas tinggi dengan deskripsi lengkap. Semakin detail informasi karya (material, teknik, ukuran, asal daerah), semakin tinggi kepercayaan pembeli.",
    tips: ["Foto dari berbagai sudut (min. 3 foto)", "Cantumkan material, teknik pembuatan, dan dimensi", "Sertakan cerita di balik karya untuk nilai tambah"],
  },
  {
    icon: Tag,
    title: "Tentukan Harga",
    desc: "Tetapkan harga yang wajar berdasarkan biaya material, waktu pengerjaan, dan nilai seni. MajaCraft mengenakan komisi 5% per transaksi berhasil — tidak ada biaya listing.",
    tips: ["Riset harga karya sejenis di marketplace", "Pertimbangkan biaya pengiriman", "Bisa atur harga diskon untuk promosi"],
  },
  {
    icon: BadgeCheck,
    title: "Sertifikasi Keaslian (NFT)",
    desc: "Tingkatkan nilai jual karya dengan Sertifikat Keaslian digital. Setiap sertifikat tercatat permanen di blockchain sebagai bukti otentisitas yang tidak dapat dipalsukan.",
    tips: ["Sertifikat NFT meningkatkan kepercayaan pembeli", "Gratis untuk 10 karya pertama", "Karya bersertifikat tampil lebih menonjol di pencarian"],
  },
  {
    icon: TrendingUp,
    title: "Promosi & Penjualan",
    desc: "Optimalkan visibilitas toko dengan fitur promosi MajaCraft. Gunakan deskripsi yang kaya kata kunci, update stok rutin, dan respon cepat pesan pembeli.",
    tips: ["Aktifkan fitur 'Karya Unggulan' untuk tampil di beranda", "Ikut event koleksi musiman MajaCraft", "Respon chat pembeli dalam 1 jam untuk rating tinggi"],
  },
  {
    icon: Wallet,
    title: "Pencairan Dana",
    desc: "Dana dari penjualan masuk ke saldo MajaCraft Anda setelah pembeli konfirmasi penerimaan. Cairkan ke rekening bank kapan saja (minimal Rp 50.000).",
    tips: ["Pencairan ke semua bank besar Indonesia", "Proses 1–2 hari kerja", "Laporan penjualan lengkap di dashboard Studio"],
  },
];

const benefits = [
  { title: "0% Biaya Listing", desc: "Tidak ada biaya untuk mendaftarkan karya. Bayar hanya saat terjual." },
  { title: "Jangkauan Nasional", desc: "Pembeli dari seluruh Indonesia dapat menemukan karya Anda." },
  { title: "Sertifikat NFT", desc: "Buktikan keaslian karya dengan teknologi blockchain." },
  { title: "Dashboard Lengkap", desc: "Pantau penjualan, stok, dan pendapatan secara real-time." },
];

export default function CaraBerjualan() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Shield className="w-3 h-3" /> Panduan Penjual
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Cara Berjualan di MajaCraft</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Jadikan karya seni dan kerajinan tangan Anda dikenal seluruh Indonesia. Bergabunglah bersama ribuan seniman dan pengrajin.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        {benefits.map((b, i) => (
          <div key={i} className="p-4 rounded-xl border border-amber-800/20 bg-amber-900/10 text-center">
            <p className="text-sm font-bold text-amber-400 mb-1">{b.title}</p>
            <p className="text-xs text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-5 mb-12">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-5 p-5 rounded-2xl border border-border bg-card">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-900/20 px-2 py-0.5 rounded-full">Langkah {i + 1}</span>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{step.desc}</p>
              <ul className="space-y-1">
                {step.tips.map((tip, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-2">Mulai berjualan sekarang</p>
        <p className="text-sm text-muted-foreground mb-4">Daftar gratis dan upload karya pertama Anda dalam 5 menit</p>
        <Link href="/studio" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
          Buka Studio Seniman <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
