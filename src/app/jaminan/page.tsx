import Link from "next/link";
import { BadgeCheck, Fingerprint, Link2, ShieldCheck, Award, Eye, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Sidik Digital Unik",
    desc: "Setiap karya mendapatkan ID unik yang terdaftar di blockchain BSC (BNB Smart Chain). ID ini tidak dapat diubah, dipalsukan, atau dihapus oleh siapapun.",
  },
  {
    icon: Link2,
    title: "Rantai Kepemilikan",
    desc: "Setiap perpindahan kepemilikan dicatat otomatis. Anda dapat melihat riwayat lengkap siapa saja yang pernah memiliki karya tersebut sejak pertama kali dibuat.",
  },
  {
    icon: Eye,
    title: "Verifikasi Publik",
    desc: "Siapapun dapat memverifikasi keaslian karya hanya dengan scan QR code atau memasukkan ID sertifikat. Tidak perlu akun atau keahlian teknis.",
  },
  {
    icon: Award,
    title: "Nilai Investasi",
    desc: "Karya dengan sertifikat NFT memiliki nilai koleksi yang lebih tinggi. Kepemilikan terdokumentasi meningkatkan nilai jual kembali karya seni Anda.",
  },
];

const howItWorks = [
  { step: "1", title: "Seniman Upload Karya", desc: "Seniman mengunggah foto dan informasi karya lengkap ke MajaCraft." },
  { step: "2", title: "Verifikasi Tim Kurator", desc: "Tim kurator MajaCraft memverifikasi keaslian karya sebelum sertifikat diterbitkan." },
  { step: "3", title: "NFT Diterbitkan", desc: "Smart contract menerbitkan NFT berisi metadata karya, foto, dan identitas pembuat." },
  { step: "4", title: "Sertifikat Terhubung ke Produk", desc: "Pembeli menerima NFT sertifikat bersama produk fisik. Scan QR untuk verifikasi kapanpun." },
];

export default function JaminanKeaslian() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <BadgeCheck className="w-3 h-3" /> Phygital NFT
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Jaminan Keaslian MajaCraft</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          MajaCraft adalah marketplace pertama di Indonesia yang menggunakan teknologi blockchain untuk membuktikan keaslian setiap karya seni dan kerajinan tradisional.
        </p>
      </div>

      {/* What is Phygital */}
      <div className="p-6 rounded-2xl bg-amber-900/10 border border-amber-800/20 mb-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-foreground mb-2">Apa itu Phygital NFT?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Phygital</strong> adalah gabungan dari <em>physical</em> (fisik) dan <em>digital</em>. Setiap karya di MajaCraft dapat dilengkapi NFT (Non-Fungible Token) sebagai sertifikat keaslian digital yang terhubung ke produk fisik. Sertifikat ini tersimpan permanen di blockchain — tidak bisa dipalsukan, dihapus, atau diubah.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {features.map((f, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-900/30 border border-amber-800/30 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-5">Cara Kerja Sertifikasi</h2>
        <div className="space-y-3">
          {howItWorks.map((item, i) => (
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

      {/* Verify */}
      <div className="p-6 rounded-2xl border border-border bg-card mb-8">
        <h2 className="font-bold text-foreground mb-3">Cara Verifikasi Keaslian</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />Scan QR code pada kartu sertifikat yang disertakan bersama produk</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />Atau masukkan ID sertifikat di halaman verifikasi MajaCraft</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />Sistem akan menampilkan data lengkap karya langsung dari blockchain</li>
        </ol>
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-foreground font-semibold mb-2">Jelajahi karya bersertifikat</p>
        <p className="text-sm text-muted-foreground mb-4">Cari karya dengan badge &quot;Verified Phygital&quot; untuk jaminan keaslian tertinggi</p>
        <Link href="/produk" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
          Lihat Karya Terverifikasi <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
