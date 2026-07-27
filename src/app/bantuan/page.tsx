import Link from "next/link";
import { Search, ShoppingCart, Store, Package, CreditCard, MessageCircle, Shield, HelpCircle, ChevronRight } from "lucide-react";

const categories = [
  { icon: ShoppingCart, title: "Cara Berbelanja", desc: "Panduan lengkap untuk pembeli — dari menemukan karya hingga menerima pesanan.", href: "/bantuan/belanja" },
  { icon: Store, title: "Cara Berjualan", desc: "Panduan untuk seniman — dari mendaftar toko hingga mencairkan penghasilan.", href: "/bantuan/jual" },
  { icon: CreditCard, title: "Pembayaran", desc: "Metode pembayaran, masalah gagal bayar, dan pencairan dana.", href: "/keamanan" },
  { icon: Package, title: "Pengiriman", desc: "Info kurir, estimasi waktu, dan cara melacak pesanan.", href: "/lacak-pesanan" },
  { icon: Shield, title: "Keamanan", desc: "Keamanan akun, penipuan, dan perlindungan transaksi.", href: "/keamanan" },
  { icon: MessageCircle, title: "Chat & Komunikasi", desc: "Cara berkomunikasi dengan penjual melalui platform.", href: "/chat" },
];

const faqs = [
  { q: "Bagaimana cara melacak pesanan saya?", a: "Buka menu 'Lacak Pesanan' di header atas atau halaman 'Pesanan Saya'. Masukkan nomor pesanan atau lihat langsung di dashboard akun Anda.", category: "Pengiriman" },
  { q: "Apa itu badge Phygital NFT?", a: "Badge Phygital NFT menandakan karya memiliki Sertifikat Phygital yang tersimpan di blockchain. Ini mencatat identitas karya dari seniman terverifikasi.", category: "Keaslian" },
  { q: "Bagaimana jika barang tidak sesuai deskripsi?", a: "Anda dapat mengajukan klaim pengembalian dalam 30 hari. Foto kondisi barang dan hubungi kami melalui menu 'Pesanan Saya' → 'Ajukan Klaim'.", category: "Pengembalian" },
  { q: "Berapa lama proses refund?", a: "Refund diproses 3–7 hari kerja ke metode pembayaran asal setelah klaim disetujui.", category: "Pembayaran" },
  { q: "Apakah bisa berbelanja tanpa daftar akun?", a: "Untuk checkout Anda perlu memiliki akun agar pesanan dapat dilacak dan dilindungi. Pendaftaran gratis dan hanya memerlukan email atau akun Google.", category: "Akun" },
  { q: "Bagaimana cara mendaftar sebagai penjual?", a: "Daftar akun MajaCraft, lalu buka menu 'Buka Toko' di header. Isi informasi toko dan verifikasi identitas. Proses verifikasi 1–3 hari kerja.", category: "Penjual" },
  { q: "Metode pembayaran apa saja yang tersedia?", a: "Tersedia transfer bank (BCA, Mandiri, BNI, BRI), QRIS (GoPay, OVO, Dana, dll.), dan kartu kredit/debit Visa & Mastercard.", category: "Pembayaran" },
  { q: "Bagaimana cara menghubungi penjual?", a: "Gunakan fitur Chat di halaman detail produk atau halaman toko. Semua komunikasi dijaga platform — nomor pribadi tidak dapat dibagikan.", category: "Komunikasi" },
];

export default function PusatBantuan() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <HelpCircle className="w-3 h-3" /> Bantuan
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Pusat Bantuan MajaCraft</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Temukan jawaban atas pertanyaan Anda. Jika tidak menemukan yang dicari, tim kami siap membantu.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari panduan atau pertanyaan..."
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {categories.map((cat, i) => (
          <Link key={i} href={cat.href} className="group p-5 rounded-xl border border-border bg-card hover:border-amber-700/40 hover:bg-amber-900/5 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-800/20 border border-amber-700/30 flex items-center justify-center group-hover:bg-amber-800/30 transition-colors">
                <cat.icon className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{cat.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-3 group-hover:gap-2 transition-all">
              Lihat panduan <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Pertanyaan yang Sering Diajukan</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1.5">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
                <span className="text-xs text-amber-700 border border-amber-800/30 bg-amber-900/10 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                  {faq.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-2">Tidak menemukan jawaban yang Anda cari?</p>
        <p className="text-sm text-muted-foreground mb-4">Tim support kami siap membantu Senin–Jumat, 09.00–17.00 WIB</p>
        <Link href="/kontak" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
          <MessageCircle className="w-4 h-4" /> Hubungi Support
        </Link>
      </div>
    </div>
  );
}
