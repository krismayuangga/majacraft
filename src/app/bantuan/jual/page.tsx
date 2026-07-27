import Link from "next/link";
import { Store, Camera, Tag, TrendingUp, Award, Wallet, ChevronRight, Shield, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getFeePercent(): Promise<number> {
  try {
    const setting = await prisma.platformSetting.findUnique({ where: { key: "fee_percent" } });
    return setting ? Number(setting.value) : 5;
  } catch {
    return 5;
  }
}

export default async function CaraBerjualan() {
  const feePercent = await getFeePercent();

  const steps = [
    {
      icon: Store,
      title: "Daftarkan Toko",
      desc: "Buat akun MajaCraft dan daftarkan studio/toko Anda. Lengkapi profil dengan logo, deskripsi, dan lokasi asal karya untuk membangun kepercayaan pembeli.",
      tips: [
        "Pilih nama toko yang unik dan mudah diingat",
        "Upload logo toko dengan kualitas tinggi",
        "Isi deskripsi toko secara detail dan menarik",
      ],
    },
    {
      icon: Camera,
      title: "Upload Karya",
      desc: "Unggah foto karya berkualitas tinggi dengan deskripsi lengkap. Semakin detail informasi — material, teknik, ukuran, dan asal daerah — semakin tinggi kepercayaan pembeli.",
      tips: [
        "Foto dari berbagai sudut, minimal 3 foto per karya",
        "Cantumkan material, teknik pembuatan, dan dimensi",
        "Ceritakan proses dan inspirasi di balik karya",
      ],
    },
    {
      icon: Tag,
      title: "Tentukan Harga",
      desc: `Tetapkan harga yang wajar berdasarkan biaya material, waktu pengerjaan, dan nilai seni. MajaCraft mengenakan komisi ${feePercent}% per transaksi berhasil — tidak ada biaya listing, tidak ada biaya mendaftar.`,
      tips: [
        "Riset harga karya sejenis sebagai referensi",
        "Pertimbangkan biaya pengiriman dalam penetapan harga",
        "Aktifkan harga diskon untuk periode promosi",
      ],
    },
    {
      icon: Award,
      title: "Sertifikat Kepemilikan Digital",
      desc: "Karya eksklusif dan unik berpotensi mendapatkan Sertifikat Kepemilikan digital dari MajaCraft. Sertifikat ini tercatat permanen di blockchain dan berpindah ke pembeli saat karya terjual — membuktikan kepemilikan sah secara digital.",
      tips: [
        "Diberikan khusus untuk karya unik dan tidak diproduksi massal",
        "Contoh: lukisan, patung, wayang, batik tulis, dan karya satu-of-a-kind",
        "Karya bersertifikat mendapat kepercayaan lebih tinggi dari pembeli",
        "Penilaian dan pemberian sertifikat dilakukan oleh tim MajaCraft",
      ],
    },
    {
      icon: TrendingUp,
      title: "Promosi & Penjualan",
      desc: "Optimalkan visibilitas toko dengan fitur promosi MajaCraft. Gunakan deskripsi yang kaya kata kunci, perbarui stok secara rutin, dan respons pesan pembeli dengan cepat.",
      tips: [
        "Aktifkan fitur Karya Unggulan untuk tampil di beranda",
        "Ikut event dan koleksi musiman MajaCraft",
        "Respons chat pembeli dalam 1 jam untuk menjaga rating toko",
      ],
    },
    {
      icon: Wallet,
      title: "Pencairan Dana",
      desc: "Dana dari penjualan masuk ke saldo toko Anda setelah pembeli mengkonfirmasi penerimaan. Cairkan ke rekening bank kapan saja dengan nominal minimal Rp 50.000.",
      tips: [
        "Pencairan ke semua bank besar Indonesia",
        "Proses transfer 1-2 hari kerja setelah disetujui",
        "Pantau laporan penjualan lengkap di dashboard Studio",
      ],
    },
  ];

  const benefits = [
    { title: "Listing Gratis", desc: "Tidak ada biaya daftar atau listing karya." },
    { title: `Komisi ${feePercent}%`, desc: "Dipotong hanya saat transaksi berhasil." },
    { title: "Jangkauan Nasional", desc: "Pembeli dari seluruh Indonesia." },
    { title: "Sertifikat Digital", desc: "Untuk karya unik dan eksklusif." },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Shield className="w-3 h-3" /> Panduan Penjual
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Cara Berjualan di MajaCraft
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Jadikan karya seni dan kerajinan tangan Anda dikenal seluruh Indonesia.
          Bergabunglah bersama ribuan seniman dan pengrajin terpercaya.
        </p>
      </div>

      {/* Benefits strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {benefits.map((b, i) => (
          <div key={i} className="p-4 rounded-xl border border-amber-800/20 bg-amber-900/10 text-center">
            <p className="text-sm font-semibold text-amber-700 mb-1">{b.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-10">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4 p-5 rounded-2xl border border-border bg-card hover:border-amber-800/40 transition-colors">
            <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-800/20 border border-amber-700/30 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-[10px] font-bold text-amber-700/70">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm mb-1.5">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
              <ul className="space-y-1.5">
                {step.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-amber-700/60 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-1">Mulai berjualan sekarang</p>
        <p className="text-xs text-muted-foreground mb-5">
          Daftar gratis dan upload karya pertama Anda dalam 5 menit
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
