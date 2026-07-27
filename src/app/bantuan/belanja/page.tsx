import Link from "next/link";
import { ShoppingCart, Search, CreditCard, Package, Star, Shield, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Temukan Karya",
    desc: "Jelajahi ribuan karya seni dan kerajinan tangan dari seluruh Nusantara. Gunakan fitur pencarian atau telusuri kategori seperti batik, keramik, ukiran, tenun, dan lainnya.",
    tips: ["Filter berdasarkan kategori, harga, atau asal daerah", "Lihat badge 'Terverifikasi' untuk penjual terpercaya", "Cek ulasan pembeli sebelumnya"],
  },
  {
    icon: ShoppingCart,
    title: "Tambah ke Keranjang",
    desc: "Klik tombol 'Tambah ke Keranjang' pada produk yang diminati. Anda dapat menambahkan beberapa produk dari toko berbeda sekaligus sebelum checkout.",
    tips: ["Perhatikan stok tersedia", "Pilih jumlah sesuai kebutuhan", "Gunakan fitur Wishlist untuk simpan untuk nanti"],
  },
  {
    icon: CreditCard,
    title: "Pembayaran",
    desc: "Lanjutkan ke checkout dan pilih metode pembayaran yang tersedia. Semua transaksi diproses dengan aman melalui sistem payment gateway terenkripsi.",
    tips: ["Transfer Bank (BCA, Mandiri, BNI, BRI)", "QRIS (semua aplikasi e-wallet)", "Kartu Kredit / Debit Visa & Mastercard"],
  },
  {
    icon: Package,
    title: "Pengiriman",
    desc: "Setelah pembayaran dikonfirmasi, penjual akan memproses dan mengemas pesanan Anda. Lacak status pengiriman secara real-time melalui halaman 'Lacak Pesanan'.",
    tips: ["Estimasi pengiriman 1–7 hari kerja", "Tersedia JNE, J&T, SiCepat, dan kurir lainnya", "Notifikasi otomatis via email dan aplikasi"],
  },
  {
    icon: Star,
    title: "Terima & Ulasan",
    desc: "Konfirmasi penerimaan barang dan berikan ulasan untuk membantu pembeli lain. Foto produk asli Anda sangat membantu komunitas MajaCraft.",
    tips: ["Konfirmasi penerimaan dalam 3 hari", "Foto kondisi barang saat diterima", "Ulasan jujur Anda membantu seniman berkembang"],
  },
];

const faqs = [
  { q: "Apa itu Phygital NFT?", a: "Setiap karya di MajaCraft dapat dilengkapi Sertifikat Phygital (NFT) yang mencatat identitas dan asal-usul karya secara permanen di blockchain. Bukan sebagai penilaian kondisi fisik atau instrumen investasi." },
  { q: "Bagaimana jika barang tidak sesuai?", a: "MajaCraft menyediakan jaminan pengembalian barang dalam 30 hari jika kondisi tidak sesuai deskripsi. Hubungi tim support kami." },
  { q: "Apakah aman berbelanja di MajaCraft?", a: "Ya. Dana Anda ditahan di rekening escrow sampai Anda konfirmasi penerimaan barang. Penjual hanya menerima dana setelah Anda puas." },
  { q: "Bisakah saya membatalkan pesanan?", a: "Pembatalan dapat dilakukan sebelum penjual memproses pesanan. Setelah diproses, hubungi dukungan kami untuk bantuan." },
];

export default function CaraBerbelanja() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Shield className="w-3 h-3" /> Panduan Pembeli
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Cara Berbelanja di MajaCraft</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Belanja karya seni dan kerajinan autentik Nusantara dengan mudah, aman, dan terjamin keasliannya.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-14">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-5 p-5 rounded-2xl border border-border bg-card">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-amber-800/20 border border-amber-700/30 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-amber-700" />
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

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Pertanyaan Umum</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card">
              <p className="text-sm font-semibold text-foreground mb-1">{faq.q}</p>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-2">Siap mulai berbelanja?</p>
        <p className="text-sm text-muted-foreground mb-4">Temukan ribuan karya seni dan kerajinan autentik Nusantara</p>
        <Link href="/produk" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
          Jelajahi Karya <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
