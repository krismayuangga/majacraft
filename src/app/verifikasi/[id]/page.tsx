import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { DownloadPdfButton } from "./DownloadPdfButton";

// ─── METADATA ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: { productName: true, sellerStore: true },
  });
  if (!cert) return { title: "Sertifikat Tidak Ditemukan" };
  return {
    title: `Sertifikat Phygital — ${cert.productName} | MajaCraft`,
    description: `Verifikasi identitas digital karya "${cert.productName}" dari studio ${cert.sellerStore}. Terdaftar permanen di blockchain BSC oleh MajaCraft.`,
  };
}

// ─── PAGE ─────────────────────────────────────────────────────────────────

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^MAJA-\d{4}-[A-Z0-9]{12}$/.test(id)) notFound();

  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      productName: true,
      material: true,
      dimensions: true,
      weight: true,
      origin: true,
      sellerName: true,
      sellerStore: true,
      buyerName: true,
      imageUrl: true,
      nftTokenId: true,
      nftTxHash: true,
      nftMintedAt: true,
      issuedAt: true,
      product: {
        select: {
          slug: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          store: { select: { slug: true, isVerified: true } },
        },
      },
    },
  });

  if (!cert) notFound();

  let buyerDisplay: string | null = null;
  if (cert.buyerName) {
    const parts = cert.buyerName.trim().split(" ");
    buyerDisplay =
      parts.length > 1
        ? `${parts[0]} ${parts.slice(1).map((p) => p[0] + ".").join(" ")}`
        : parts[0];
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  const bscTxUrl = cert.nftTxHash ? `https://bscscan.com/tx/${cert.nftTxHash}` : null;

  const details: Array<[string, string | null | undefined]> = [
    ["Nama Karya",    cert.productName],
    ["Material",      cert.material],
    ["Dimensi",       cert.dimensions],
    ["Berat",         cert.weight],
    ["Asal Daerah",   cert.origin],
    ["Seniman",       cert.sellerName],
    ["Studio",        cert.sellerStore],
    ...(buyerDisplay ? [["Pemilik", buyerDisplay] as [string, string]] : []),
    ["Tanggal Terbit",issuedDate],
    ["ID Sertifikat", cert.id],
  ];

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 16mm 18mm 14mm 18mm;
        }
        @media print {
          /* Sembunyikan semua elemen global (navbar, mobile nav, dll) */
          body { visibility: hidden !important; background: white !important; }
          /* Hanya tampilkan print wrapper */
          .cert-print-wrapper { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; }
          .cert-print-wrapper * { visibility: visible !important; }
          /* Hide tombol/UI dalam print wrapper */
          .no-print { display: none !important; visibility: hidden !important; }
        }
        @media screen {
          .cert-print-wrapper { display: none; }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          PRINT-ONLY AREA — dokumen sertifikat A4
          ══════════════════════════════════════════ */}
      <div className="cert-print-wrapper" style={{fontFamily:"'Arial',sans-serif",color:"#1a0a00",background:"#fff"}}>

        {/* Header dokumen */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"2.5px solid #C8920C",paddingBottom:"10px",marginBottom:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{fontFamily:"Georgia,serif",fontWeight:"bold",fontSize:"22px",color:"#8A5A00",letterSpacing:"1px"}}>
              MAJA<span style={{fontSize:"14px",verticalAlign:"middle",letterSpacing:"3px",margin:"0 2px"}}>◆</span>CRAFT
            </div>
            <div style={{width:"1px",height:"36px",background:"#C8920C",opacity:"0.4"}}/>
            <div>
              <div style={{fontSize:"13px",fontWeight:"800",letterSpacing:"3px",color:"#4A2800",textTransform:"uppercase"}}>Sertifikat Phygital</div>
              <div style={{fontSize:"10px",color:"#8A6020",letterSpacing:"1px"}}>Karya Seni &amp; Kerajinan Indonesia Terverifikasi</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"flex-end"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#16a34a"}}/>
              <span style={{fontSize:"11px",fontWeight:"700",color:"#15803d",letterSpacing:"1px"}}>TERVERIFIKASI</span>
            </div>
            <div style={{fontSize:"9px",color:"#8A6020",marginTop:"3px"}}>majacraft.id</div>
          </div>
        </div>

        {/* Judul karya */}
        <div style={{marginBottom:"12px",paddingBottom:"10px",borderBottom:"1px solid #e5d5b0"}}>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:"#8A6020",textTransform:"uppercase",marginBottom:"3px"}}>Sertifikat Phygital Terverifikasi untuk Karya</div>
          <div style={{fontSize:"17px",fontWeight:"800",color:"#2A1000",lineHeight:"1.2"}}>{cert.productName}</div>
          <div style={{fontSize:"11px",color:"#6B4010",marginTop:"3px"}}>{cert.sellerStore} · Diterbitkan {issuedDate}</div>
        </div>

        {/* Gambar sertifikat + detail karya */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:"16px",marginBottom:"14px",alignItems:"start"}}>

          {/* Gambar sertifikat */}
          <div>
            {cert.imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={cert.imageUrl}
                alt={`Sertifikat ${cert.productName}`}
                style={{width:"100%",borderRadius:"6px",border:"1px solid #d4b87a",display:"block"}}
              />
            )}
            <div style={{textAlign:"center",marginTop:"5px",fontSize:"9px",color:"#8A6020",letterSpacing:"1px"}}>
              ID: {cert.id}
            </div>
          </div>

          {/* Detail karya */}
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#8A5A00",textTransform:"uppercase",marginBottom:"8px",borderBottom:"1px solid #e5d5b0",paddingBottom:"5px"}}>
              Detail Karya
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
              <tbody>
                {details.filter(([,v])=>v).map(([label,value])=>(
                  <tr key={label} style={{borderBottom:"1px solid #f0e4c8"}}>
                    <td style={{padding:"4px 8px 4px 0",color:"#8A6020",fontWeight:"600",whiteSpace:"nowrap",width:"42%",fontSize:"10px",letterSpacing:"0.5px",textTransform:"uppercase",verticalAlign:"top"}}>
                      {label}
                    </td>
                    <td style={{padding:"4px 0",color:"#1a0a00",fontWeight:"500",wordBreak:"break-all",verticalAlign:"top"}}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Status blockchain */}
            <div style={{marginTop:"12px",padding:"8px 10px",background:"#fffbf0",border:"1px solid #e5d5b0",borderRadius:"6px"}}>
              <div style={{fontSize:"10px",fontWeight:"700",letterSpacing:"2px",color:"#8A5A00",textTransform:"uppercase",marginBottom:"5px"}}>
                Status Blockchain
              </div>
              {cert.nftTokenId ? (
                <table style={{width:"100%",fontSize:"10px",borderCollapse:"collapse"}}>
                  <tbody>
                    {([
                      ["Network", "BSC (BNB Smart Chain)"],
                      ["Token ID", `#${cert.nftTokenId}`],
                      ...(cert.nftTxHash ? [["Tx Hash", `${cert.nftTxHash.slice(0,12)}…${cert.nftTxHash.slice(-8)}`]] : []),
                    ] as [string,string][]).map(([k,v])=>(
                      <tr key={k}>
                        <td style={{color:"#8A6020",paddingRight:"8px",paddingBottom:"3px",whiteSpace:"nowrap",width:"35%"}}>{k}</td>
                        <td style={{color:"#1a0a00",fontFamily:"monospace",paddingBottom:"3px"}}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{fontSize:"10px",color:"#92400e"}}>
                  Terdaftar di sistem MajaCraft. Pencatatan ke blockchain BSC dijadwalkan secara berkala.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{borderTop:"1px solid #e5d5b0",marginBottom:"10px"}}/>

        {/* Footer dokumen */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"16px"}}>
          <div style={{fontSize:"9px",color:"#8A6020",lineHeight:"1.6"}}>
            <div style={{fontWeight:"700",marginBottom:"2px",letterSpacing:"1px",textTransform:"uppercase"}}>Verifikasi Online</div>
            <div>Scan QR di sertifikat atau kunjungi:</div>
            <div style={{fontFamily:"monospace",color:"#4A2800",fontSize:"10px"}}>majacraft.id/verifikasi/{cert.id}</div>
          </div>
          <div style={{textAlign:"center",fontSize:"9px",color:"#8A6020"}}>
            <div style={{fontSize:"22px",fontFamily:"Georgia,serif",fontWeight:"bold",color:"#C8920C",letterSpacing:"2px",lineHeight:"1"}}>✦</div>
            <div style={{fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginTop:"2px"}}>MajaCraft</div>
            <div style={{fontSize:"8px",color:"#b07a30"}}>Platform Karya Seni Indonesia</div>
          </div>
          <div style={{textAlign:"right",fontSize:"9px",color:"#8A6020",lineHeight:"1.6"}}>
            <div style={{fontWeight:"700",marginBottom:"2px",letterSpacing:"1px",textTransform:"uppercase"}}>Disclaimer</div>
            <div>Dokumen ini bukan instrumen investasi.</div>
            <div>Sertifikat Non-Transferable (Soulbound).</div>
            <div style={{marginTop:"2px",color:"#b07a30"}}>© {new Date().getFullYear()} MajaCraft · majacraft.id</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SCREEN VERSION
          ══════════════════════════════════════════ */}
      <div className="min-h-screen bg-background text-foreground">

        {/* ── NAVBAR ── */}
        <header className="no-print border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-13 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-primary">MajaCraft</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">/ Sertifikat Phygital</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Terverifikasi
            </div>
          </div>
        </header>

        {/* ── PRINT HEADER (only in PDF) ── */}
        <div className="print-header px-6 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif font-bold text-lg">MajaCraft</p>
              <p className="text-xs text-gray-500">Sertifikat Phygital Terverifikasi · majacraft.id</p>
            </div>
            <p className="text-xs text-gray-400">majacraft.id/verifikasi/{cert.id}</p>
          </div>
        </div>

        {/* ── MAIN ── */}
        <main className="print-page max-w-5xl mx-auto px-4 py-5">

          {/* Top bar: verified badge + download */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex-1">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm leading-tight">Sertifikat Phygital Terverifikasi</p>
                <p className="text-emerald-700 text-xs mt-0.5">{cert.sellerStore} · Diterbitkan {issuedDate}</p>
              </div>
            </div>
            <DownloadPdfButton certId={cert.id} />
          </div>

          {/* ── GRID: Cert image + Details ── */}
          <div className="print-grid grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

            {/* Kolom kiri: gambar sertifikat */}
            <div className="lg:col-span-2 print-cert-img">
              {cert.imageUrl ? (
                <div className="print-card rounded-xl overflow-hidden border border-border shadow-sm">
                  <Image
                    src={cert.imageUrl}
                    alt={`Sertifikat ${cert.productName}`}
                    width={768}
                    height={512}
                    className="w-full h-auto"
                    priority
                  />
                  <div className="no-print flex items-center justify-between px-3 py-2 bg-muted/50 border-t border-border">
                    <span className="text-xs text-muted-foreground">PNG · Resolusi Tinggi</span>
                    <a href={cert.imageUrl} download={`${cert.id}.png`}
                      className="text-xs font-medium text-primary hover:underline">
                      Unduh PNG ↓
                    </a>
                  </div>
                </div>
              ) : (
                <div className="print-card rounded-xl border border-dashed border-border p-10 text-center">
                  <p className="text-muted-foreground text-sm">Gambar sertifikat sedang diproses</p>
                </div>
              )}
            </div>

            {/* Kolom kanan: detail */}
            <div className="lg:col-span-3 space-y-4">

              {/* Detail Karya */}
              <div className="print-card rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-sm mb-3 pb-2 border-b border-border flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"/>
                  Detail Karya
                </h3>
                <dl className="grid grid-cols-1 gap-y-2">
                  {details.filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex gap-3">
                      <dt className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5 uppercase tracking-wide">{label}</dt>
                      <dd className="text-sm text-foreground font-medium break-all leading-snug">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Status Blockchain */}
              <div className="print-card rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-sm mb-3 pb-2 border-b border-border flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"/>
                  Status Blockchain
                </h3>
                {cert.nftTokenId ? (
                  <div className="space-y-2 text-sm">
                    {([
                      ["Network",  "BSC (BNB Smart Chain)"],
                      ["Token ID", `#${cert.nftTokenId}`],
                      ...(cert.nftTxHash ? [["Tx Hash", cert.nftTxHash]] : []),
                      ...(cert.nftMintedAt ? [["Minted", new Date(cert.nftMintedAt).toLocaleDateString("id-ID")]] : []),
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-1 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide w-24 shrink-0">{k}</span>
                        {k === "Tx Hash" ? (
                          <a href={bscTxUrl!} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-xs text-primary hover:underline truncate">
                            {v.slice(0, 10)}…{v.slice(-8)}
                          </a>
                        ) : (
                          <span className="text-foreground text-sm font-medium text-right">{v}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <span className="text-amber-800 leading-relaxed">
                      Sertifikat terdaftar di sistem MajaCraft. Pencatatan ke blockchain BSC dijadwalkan secara berkala.
                    </span>
                  </div>
                )}
              </div>

              {/* Link produk */}
              {cert.product?.slug && (
                <Link href={`/produk/${cert.product.slug}`}
                  className="no-print flex items-center justify-between w-full p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                  <div>
                    <p className="text-xs text-muted-foreground">Lihat halaman produk</p>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cert.productName}</p>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>

          {/* ── ROW 2: Info Panels (no-print) ── */}
          <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

            {/* Panel Teknologi Blockchain */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground text-sm">Dibangun di Atas Blockchain</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Sertifikat Phygital MajaCraft menggunakan teknologi <strong className="text-foreground">NFT</strong> di jaringan
                {" "}<strong className="text-foreground">BSC (BNB Smart Chain)</strong>. Setiap sertifikat direkam sebagai token unik yang tidak dapat digandakan.
              </p>
              <div className="space-y-3">
                {[
                  ["Tidak Dapat Dipalsukan", "Data tersimpan di ribuan node blockchain — tidak ada satu pihak yang dapat mengubah atau menghapusnya."],
                  ["Transparan & Terbuka",   "Siapapun dapat memverifikasi keaslian sertifikat ini kapan pun dan di mana pun, tanpa perlu akun."],
                  ["Permanen Selamanya",     "Selama blockchain BSC beroperasi, catatan sertifikat ini akan tetap ada tanpa batas waktu."],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"/>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Disclaimer */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground text-sm">Penting Untuk Dipahami</h3>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                <p className="text-xs font-semibold text-amber-900 mb-1">Bukan Instrumen Investasi</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Sertifikat Phygital MajaCraft <strong>bukan</strong> produk investasi atau instrumen keuangan.
                  Nilainya tidak dijamin dan tidak dimaksudkan untuk diperjualbelikan sebagai aset digital.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  ["Dokumen Identitas Digital",    "Berfungsi sebagai bukti pendaftaran dan identitas karya fisik — bukan jaminan kondisi fisik produk."],
                  ["Non-Transferable (Soulbound)",  "Melekat pada karya dan tidak dapat dipindahtangankan secara independen dari karya fisiknya."],
                  ["Privasi Pemilik Terlindungi",  "Data pembeli tidak dipublikasikan penuh. Hanya nama depan dan inisial yang ditampilkan."],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0"/>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel About MajaCraft (no-print) */}
          <div className="no-print rounded-xl border border-border bg-card p-5 mb-5">
            <h3 className="font-semibold text-foreground text-sm mb-2">Tentang Sertifikat Phygital MajaCraft</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              MajaCraft adalah platform marketplace karya seni dan kerajinan budaya Indonesia yang menghubungkan karya fisik dengan identitas digital melalui teknologi{" "}
              <em>phygital</em> (physical + digital). Setiap karya yang disetujui mendapatkan Sertifikat Phygital — dokumen digital yang mencatat identitas, asal-usul,
              material, dan seniman pembuat secara permanen di blockchain BSC. Program ini bertujuan melindungi kekayaan intelektual seniman tradisional Indonesia dan
              memberikan kepercayaan lebih kepada kolektor global.
            </p>
          </div>

          {/* ── Footer ── */}
          <div className="no-print pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Beranda</Link>
              <Link href="/jaminan" className="hover:text-foreground">Sertifikat Phygital</Link>
              <Link href="/bantuan" className="hover:text-foreground">Bantuan</Link>
              <Link href="/syarat" className="hover:text-foreground">Syarat & Ketentuan</Link>
              <Link href="/privasi" className="hover:text-foreground">Privasi</Link>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MajaCraft</p>
          </div>

          {/* PDF footer (only in print) */}
          <div className="print-header mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between">
            <span>Dokumen ini dapat diverifikasi di: majacraft.id/verifikasi/{cert.id}</span>
            <span>© {new Date().getFullYear()} MajaCraft · majacraft.id</span>
          </div>
        </main>
      </div>
    </>
  );
}


