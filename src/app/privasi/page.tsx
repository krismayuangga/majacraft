import Link from "next/link";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Informasi yang Kami Kumpulkan",
    content: `Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar atau menggunakan layanan MajaCraft, meliputi:
    
• Informasi identitas: nama lengkap, alamat email, nomor telepon
• Informasi akun: kata sandi terenkripsi, foto profil
• Informasi transaksi: alamat pengiriman, riwayat pembelian dan penjualan
• Informasi perangkat: alamat IP, jenis browser, sistem operasi
• Data penggunaan: halaman yang dikunjungi, fitur yang digunakan`,
  },
  {
    title: "2. Bagaimana Kami Menggunakan Informasi",
    content: `Informasi yang dikumpulkan digunakan untuk:

• Memproses pendaftaran dan mengelola akun Anda
• Memfasilitasi transaksi antara pembeli dan penjual
• Mengirimkan notifikasi pesanan, pembaruan layanan, dan penawaran
• Meningkatkan keamanan dan mencegah penipuan
• Memenuhi kewajiban hukum dan regulasi yang berlaku
• Menyajikan konten dan iklan yang relevan`,
  },
  {
    title: "3. Berbagi Informasi",
    content: `Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Informasi hanya dibagikan kepada:

• Penjual: nama dan alamat pengiriman untuk pemenuhan pesanan
• Mitra logistik: informasi pengiriman kepada kurir terpilih
• Penyedia pembayaran: data transaksi untuk pemrosesan pembayaran
• Pihak berwenang: jika diwajibkan oleh hukum atau peraturan`,
  },
  {
    title: "4. Keamanan Data",
    content: `Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data Anda:

• Enkripsi SSL/TLS untuk semua transmisi data
• Enkripsi bcrypt untuk kata sandi
• Audit keamanan reguler oleh tim internal
• Akses data terbatas hanya pada karyawan yang memerlukannya
• Pemantauan aktivitas mencurigakan 24/7`,
  },
  {
    title: "5. Hak Pengguna",
    content: `Sebagai pengguna MajaCraft, Anda memiliki hak untuk:

• Mengakses dan mendapatkan salinan data pribadi Anda
• Memperbaiki data yang tidak akurat
• Meminta penghapusan akun dan data terkait
• Menolak pemrosesan data untuk tujuan pemasaran
• Mengajukan pengaduan kepada otoritas perlindungan data

Untuk menggunakan hak-hak tersebut, hubungi kami di privasi@majacraft.id`,
  },
  {
    title: "6. Cookie dan Teknologi Pelacakan",
    content: `MajaCraft menggunakan cookie untuk:

• Menjaga sesi login Anda tetap aktif
• Mengingat preferensi dan pengaturan
• Menganalisis penggunaan platform untuk peningkatan layanan
• Menampilkan konten yang relevan

Anda dapat mengatur browser untuk menolak cookie, namun beberapa fitur mungkin tidak berfungsi optimal.`,
  },
  {
    title: "7. Data Blockchain",
    content: `Sertifikat keaslian NFT yang diterbitkan di blockchain bersifat publik dan permanen. Data yang tersimpan di blockchain meliputi ID karya, metadata karya, dan riwayat kepemilikan. Data ini tidak dapat dihapus karena sifat teknologi blockchain yang tidak dapat diubah (immutable).`,
  },
  {
    title: "8. Perubahan Kebijakan",
    content: `Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di platform setidaknya 30 hari sebelum berlaku. Penggunaan layanan setelah perubahan berlaku dianggap sebagai persetujuan Anda.`,
  },
];

export default function KebijakanPrivasi() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <Shield className="w-3 h-3" /> Legal
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Kebijakan Privasi</h1>
        <p className="text-muted-foreground">Terakhir diperbarui: 1 Januari 2026</p>
      </div>

      <div className="p-5 rounded-xl bg-amber-900/10 border border-amber-800/20 mb-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          MajaCraft berkomitmen melindungi privasi dan keamanan data pribadi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan layanan MajaCraft (majacraft.id).
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-foreground mb-3">{section.title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-xl border border-border bg-card text-center">
        <p className="text-sm text-muted-foreground">Pertanyaan tentang kebijakan privasi?</p>
        <Link href="/kontak" className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-500 text-sm font-medium mt-2">
          Hubungi tim kami →
        </Link>
      </div>
    </div>
  );
}
