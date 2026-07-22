import Link from "next/link";
import { Lock, CreditCard, ShieldCheck, Eye, AlertTriangle, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Enkripsi SSL 256-bit",
    desc: "Seluruh komunikasi antara browser Anda dan server MajaCraft dienkripsi menggunakan TLS 1.3. Data tidak dapat disadap atau dimanipulasi selama transmisi.",
  },
  {
    icon: CreditCard,
    title: "Sistem Escrow",
    desc: "Dana Anda tidak langsung diterima penjual. Uang ditahan aman di rekening escrow hingga Anda mengkonfirmasi penerimaan barang dalam kondisi baik.",
  },
  {
    icon: ShieldCheck,
    title: "Payment Gateway Tersertifikasi",
    desc: "Seluruh transaksi diproses melalui Midtrans yang tersertifikasi PCI DSS Level 1 — standar keamanan tertinggi industri pembayaran global.",
  },
  {
    icon: Eye,
    title: "Monitoring Penipuan 24/7",
    desc: "Sistem AI kami memantau setiap transaksi secara real-time untuk mendeteksi pola mencurigakan dan mencegah penipuan sebelum terjadi.",
  },
];

const tips = [
  {
    title: "Jangan Transaksi di Luar Platform",
    desc: "Penjual yang meminta bayar via transfer langsung (WhatsApp, dll.) adalah tanda penipuan. Semua transaksi resmi hanya melalui checkout MajaCraft.",
    type: "warning",
  },
  {
    title: "Verifikasi Identitas Penjual",
    desc: "Cari toko dengan badge 'Terverifikasi' (centang hijau). Penjual terverifikasi telah melalui proses KYC (Know Your Customer) oleh tim kami.",
    type: "info",
  },
  {
    title: "Jaga Kerahasiaan Akun",
    desc: "MajaCraft tidak pernah meminta kata sandi, OTP, atau kode verifikasi melalui chat, telepon, atau email. Jangan bagikan kode tersebut kepada siapapun.",
    type: "warning",
  },
  {
    title: "Cek Ulasan Sebelum Beli",
    desc: "Baca ulasan pembeli sebelumnya untuk memastikan reputasi penjual. Perhatikan rating keseluruhan dan konsistensi ulasan.",
    type: "info",
  },
  {
    title: "Dokumentasi Penerimaan Barang",
    desc: "Foto atau video unboxing saat menerima paket. Dokumentasi ini diperlukan jika Anda mengajukan klaim ketidaksesuaian produk.",
    type: "info",
  },
  {
    title: "Laporkan Aktivitas Mencurigakan",
    desc: "Jika menemukan penjual atau aktivitas mencurigakan, segera laporkan melalui tombol 'Laporkan' atau hubungi tim kami.",
    type: "warning",
  },
];

export default function KeamananTransaksi() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <ShieldCheck className="w-3 h-3" /> Keamanan
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Keamanan Transaksi</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          MajaCraft menerapkan standar keamanan berlapis untuk memastikan setiap transaksi Anda aman, terlindungi, dan terpercaya.
        </p>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {features.map((f, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How escrow works */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Cara Kerja Escrow MajaCraft</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Pembeli Melakukan Pembayaran", desc: "Dana masuk ke rekening escrow MajaCraft, bukan langsung ke penjual." },
            { step: "2", title: "Penjual Mengirim Barang", desc: "Notifikasi dikirim ke penjual untuk memproses dan mengirim pesanan." },
            { step: "3", title: "Pembeli Konfirmasi Penerimaan", desc: "Pembeli mengkonfirmasi barang diterima sesuai kondisi dalam 3 hari kerja." },
            { step: "4", title: "Dana Diteruskan ke Penjual", desc: "Setelah konfirmasi, dana dikurangi komisi platform dikirim ke saldo penjual." },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-amber-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Tips Transaksi Aman</h2>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className={`p-4 rounded-xl border ${tip.type === "warning" ? "border-red-800/30 bg-red-900/10" : "border-border bg-card"}`}>
              <div className="flex items-start gap-3">
                {tip.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-semibold mb-1 ${tip.type === "warning" ? "text-red-400" : "text-foreground"}`}>{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report */}
      <div className="p-6 rounded-2xl bg-amber-900/10 border border-amber-800/20 text-center">
        <p className="text-foreground font-semibold mb-2">Menemukan aktivitas mencurigakan?</p>
        <p className="text-sm text-muted-foreground mb-4">Tim keamanan kami siap membantu 24/7. Laporkan segera untuk perlindungan semua pengguna.</p>
        <Link href="/kontak" className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
          Laporkan Sekarang <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
