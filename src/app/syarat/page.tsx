import Link from "next/link";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. DEFINISI",
    items: [
      { term: "Platform", def: 'Situs web majacraft.id, sistem aplikasi, dan seluruh fitur yang disediakan oleh Kami.' },
      { term: "Penjual", def: 'Seniman, perajin, atau pemilik brand lokal yang terverifikasi untuk menjual produk seni dan budaya di Platform.' },
      { term: "Pembeli", def: 'Pengguna yang melakukan pendaftaran dan pembelian produk di Platform.' },
      { term: "Sertifikat Digital (NFT)", def: 'Non-Fungible Token yang diterbitkan secara otomatis di jaringan blockchain oleh Platform sebagai bukti kepemilikan dan autentisitas digital atas produk fisik yang dibeli.' },
    ],
  },
  {
    title: "2. KETENTUAN TRANSAKSI & MATA UANG",
    bullets: [
      'Mata Uang Sah: Seluruh transaksi, harga produk, dan biaya layanan di dalam Platform wajib dan hanya menggunakan mata uang Rupiah (IDR).',
      'Metode Pembayaran: Kami memfasilitasi pembayaran melalui Transfer Bank, QRIS, E-Wallet, dan metode pembayaran legal lainnya yang terintegrasi resmi di Indonesia. Platform tidak menerima pembayaran menggunakan aset kripto atau token digital apa pun.',
    ],
  },
  {
    title: "3. FITUR SERTIFIKAT DIGITAL (NFT) BEHIND-THE-SCENES",
    bullets: [
      'Fungsi Utama: NFT yang diterbitkan oleh majacraft.id murni berfungsi sebagai Sertifikat Keaslian Digital (Certificate of Authenticity) atas produk fisik seni/budaya yang dibeli oleh Pengguna.',
      'Bukan Instrumen Investasi: Sertifikat Digital (NFT) ini BUKAN merupakan produk keuangan, efek/saham, komoditas perdagangan, maupun instrumen investasi yang menjanjikan keuntungan finansial (capital gain atau imbal hasil) di masa depan.',
      'Pembuatan Otomatis: Untuk kenyamanan Pengguna, proses pembuatan (minting) dan penyimpanan NFT dilakukan secara otomatis di belakang layar menggunakan sistem custodial wallet terintegrasi yang terikat pada akun email Pengguna di Platform.',
    ],
    highlight: true,
  },
  {
    title: "4. HAK KEKAYAAN INTELEKTUAL & PROVENANCE",
    bullets: [
      'Hak Cipta Karya Fisik: Pembelian produk fisik memberikan Hak Kepemilikan fisik kepada Pembeli, namun Hak Cipta atas karya seni tersebut tetap melekat pada Seniman/Penjual asli sesuai dengan Undang-Undang Hak Cipta yang berlaku di Indonesia.',
      'Kepatuhan Karya Original: Penjual menjamin bahwa seluruh produk seni dan budaya yang dijual di majacraft.id adalah karya original atau tiruan legal bermerek sendiri, bukan hasil plagiasi atau pelanggaran hak cipta pihak lain.',
    ],
  },
  {
    title: "5. PENDAFTARAN AKUN",
    bullets: [
      'Berusia minimal 17 tahun atau mendapat persetujuan wali yang sah.',
      'Memberikan informasi yang akurat, lengkap, dan terkini.',
      'Menjaga kerahasiaan kata sandi — segera laporkan penggunaan akun yang tidak sah.',
      'Bertanggung jawab penuh atas seluruh aktivitas yang dilakukan melalui akun Anda.',
      'MajaCraft berhak menangguhkan atau menghapus akun yang melanggar ketentuan tanpa pemberitahuan sebelumnya.',
    ],
  },
  {
    title: "6. ATURAN PENJUAL",
    bullets: [
      'Seluruh karya yang dijual adalah karya asli hasil sendiri atau memiliki hak jual yang sah.',
      'Memberikan deskripsi produk yang akurat, jujur, dan tidak menyesatkan.',
      'Merespons pertanyaan pembeli dalam waktu 24 jam kerja.',
      'Mengirim pesanan sesuai estimasi waktu yang tertera dan dalam kondisi aman.',
      'Dilarang keras menjual produk palsu, replika tanpa label, atau hasil pelanggaran hak cipta.',
      'Dilarang melakukan transaksi di luar Platform (bypass) untuk menghindari sistem escrow.',
    ],
  },
  {
    title: "7. ATURAN PEMBELI",
    bullets: [
      'Memberikan informasi pengiriman yang valid, lengkap, dan dapat dijangkau kurir.',
      'Melakukan pembayaran sesuai harga yang tertera pada saat checkout.',
      'Mengkonfirmasi penerimaan barang dalam 3 hari kerja setelah barang dinyatakan diterima.',
      'Tidak mengajukan klaim palsu, pengembalian yang tidak berdasar, atau penyalahgunaan sistem.',
      'Tidak menyalahgunakan sistem ulasan untuk kepentingan pribadi atau merugikan pihak lain.',
    ],
  },
  {
    title: "8. TRANSAKSI DAN PEMBAYARAN",
    bullets: [
      'Semua harga ditampilkan dalam Rupiah Indonesia (IDR) termasuk PPN bila berlaku.',
      'Pembayaran diproses oleh penyedia payment gateway tersertifikasi PCI DSS.',
      'Dana pembeli ditahan dalam sistem escrow hingga konfirmasi penerimaan barang.',
      'Komisi platform 5% dari nilai transaksi dibebankan kepada penjual per transaksi berhasil.',
      'Pencairan dana dilakukan 1-2 hari kerja setelah konfirmasi penerimaan dari pembeli.',
      'MajaCraft tidak bertanggung jawab atas kerugian akibat transaksi yang dilakukan di luar Platform.',
    ],
  },
  {
    title: "9. PENGEMBALIAN DAN REFUND",
    bullets: [
      'Pembeli dapat mengajukan pengembalian dalam 30 hari apabila produk tidak sesuai deskripsi.',
      'Pengembalian tidak berlaku untuk produk custom/pesanan khusus kecuali ada cacat produksi yang dapat dibuktikan.',
      'Proses refund dilakukan 3-7 hari kerja ke metode pembayaran asal setelah klaim disetujui.',
      'Biaya pengiriman pengembalian ditanggung pihak yang terbukti bersalah berdasarkan hasil mediasi.',
      'Sertifikat NFT yang sudah diterbitkan tidak dapat dibatalkan karena bersifat permanen di blockchain.',
    ],
  },
  {
    title: "10. BATASAN TANGGUNG JAWAB",
    bullets: [
      'Ketergantungan Teknologi: Platform memanfaatkan teknologi blockchain pihak ketiga untuk pencatatan Sertifikat Digital. Kami tidak bertanggung jawab atas gangguan teknis pada jaringan blockchain global yang berada di luar kendali sistem majacraft.id.',
      'Nilai Karya Seni: Pengguna memahami bahwa nilai dari sebuah karya seni bersifat subjektif dan ditentukan oleh pasar seni fisik. Platform tidak memberikan jaminan atas kenaikan nilai produk atau Sertifikat Digital yang menyertainya.',
      'Tanggung jawab maksimal MajaCraft dibatasi sebesar nilai transaksi yang terkait dengan sengketa.',
      'MajaCraft tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerugian konsekuensial lainnya.',
    ],
  },
  {
    title: "11. HUKUM YANG MENGATUR",
    content: 'Syarat & Ketentuan ini diatur dan ditafsirkan berdasarkan hukum yang berlaku di Republik Indonesia. Segala perselisihan yang timbul dari penggunaan Platform ini akan diselesaikan terlebih dahulu secara musyawarah mufakat, atau melalui jalur hukum di Pengadilan Negeri tempat kedudukan hukum PT BSE Group Teknologi terdaftar.',
  },
];

export default function SyaratKetentuan() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <FileText className="w-3 h-3" /> Legal
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Syarat &amp; Ketentuan</h1>
        <p className="text-muted-foreground">Terakhir diperbarui: 10 Juli 2026</p>
      </div>

      {/* Intro */}
      <div className="p-5 rounded-xl bg-amber-900/10 border border-amber-800/20 mb-8 space-y-2">
        <p className="text-sm font-semibold text-foreground">Selamat datang di majacraft.id!</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Syarat &amp; Ketentuan ini mengatur penggunaan situs web <span className="text-amber-500">majacraft.id</span> yang dikelola oleh{" "}
          <strong className="text-foreground">PT BSE Group Teknologi</strong> (selanjutnya disebut &quot;Perusahaan&quot; atau &quot;Kami&quot;).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dengan mengakses, mendaftar, atau bertransaksi di Platform Kami, Anda dianggap telah membaca, memahami, dan menyetujui seluruh isi Syarat &amp; Ketentuan ini. Jika Anda tidak menyetujui bagian apa pun dari ketentuan ini, mohon untuk tidak menggunakan Platform Kami.
        </p>
        {/* Legalitas */}
        <div className="mt-3 pt-3 border-t border-amber-800/20 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "NIB · OSS BKPM", value: "0807240028155" },
            { label: "Tanda Daftar PSE Kominfo", value: "20260711-NE0SH" },
            { label: "SK Kemenkumham (AHU)", value: "AHU-000405.AH.01.30.2024" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-[10px] text-amber-700 uppercase tracking-wider">{item.label}</span>
              <span className="text-xs text-amber-500 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div
            key={i}
            className={`p-5 rounded-xl border bg-card ${
              section.highlight ? "border-amber-700/40 bg-amber-900/5" : "border-border"
            }`}
          >
            <h2 className="font-bold text-foreground mb-3 text-sm tracking-wide">{section.title}</h2>

            {/* Definition list */}
            {"items" in section && section.items && (
              <div className="space-y-2">
                {section.items.map((item, j) => (
                  <div key={j} className="flex gap-2 text-sm">
                    <span className="text-amber-500 font-semibold flex-shrink-0">{item.term}:</span>
                    <span className="text-muted-foreground leading-relaxed">{item.def}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bullet list */}
            {"bullets" in section && section.bullets && (
              <ul className="space-y-2">
                {section.bullets.map((bullet, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <span className="text-amber-600 flex-shrink-0 mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Plain text */}
            {"content" in section && section.content && (
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            )}

            {section.highlight && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 bg-amber-900/10 px-3 py-2 rounded-lg">
                ⚠️ NFT di MajaCraft adalah sertifikat keaslian, BUKAN instrumen investasi atau produk keuangan.
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-xl border border-border bg-card text-center">
        <p className="text-sm text-muted-foreground">Ada pertanyaan tentang syarat &amp; ketentuan?</p>
        <Link href="/kontak" className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-500 text-sm font-medium mt-2">
          Hubungi tim legal kami →
        </Link>
      </div>
    </div>
  );
}
