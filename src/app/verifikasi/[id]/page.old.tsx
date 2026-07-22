import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

// ─── METADATA DINAMIS ─────────────────────────────────────────────────────

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
    title: `Sertifikat Phygital — ${cert.productName} | MAJA`,
    description: `Verifikasi identitas digital karya "${cert.productName}" dari studio ${cert.sellerStore}. Sertifikat Phygital terdaftar permanen di MAJA Marketplace.`,
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validasi format ID
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
      transferredAt: true,
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

  // Sembunyikan nama lengkap buyer (privasi)
  let buyerDisplay: string | null = null;
  if (cert.buyerName) {
    const parts = cert.buyerName.trim().split(" ");
    buyerDisplay =
      parts.length > 1
        ? `${parts[0]} ${parts.slice(1).map((p) => p[0] + ".").join(" ")}`
        : parts[0];
  }

  const productImage = cert.product.images[0]?.url;
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const meta: Array<[string, string | null | undefined]> = [
    ["Nama Karya", cert.productName],
    ["Material", cert.material],
    ["Dimensi", cert.dimensions],
    ["Berat", cert.weight],
    ["Asal Daerah", cert.origin],
    ["Seniman", cert.sellerName],
    ["Studio", cert.sellerStore],
    ["Pemilik", buyerDisplay],
    ["Tanggal Terbit", issuedDate],
    ["ID Sertifikat", cert.id],
  ];

  const bscTxUrl = cert.nftTxHash
    ? `https://bscscan.com/tx/${cert.nftTxHash}`
    : null;

  return (
    <main className="min-h-screen" style={{ background: "#0D0B08", color: "#F5F0E8" }}>
      {/* ── Header ── */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#2A2416" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-lg font-serif tracking-widest"
            style={{ color: "#C9A84C" }}
          >
            MAJA
          </span>
          <span className="text-sm opacity-50">/ Sertifikat Phygital</span>
        </Link>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm border"
          style={{ borderColor: "#C9A84C44", color: "#C9A84C", background: "#C9A84C11" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Sertifikat Terdaftar
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Gambar sertifikat (jika sudah digenerate) ── */}
        {cert.imageUrl && (
          <section className="rounded-xl overflow-hidden border" style={{ borderColor: "#2A2416" }}>
            <Image
              src={cert.imageUrl}
              alt={`Sertifikat Phygital ${cert.productName}`}
              width={800}
              height={1120}
              className="w-full h-auto"
              style={{ maxHeight: 640, objectFit: "contain", background: "#0A0806" }}
              priority
            />
            <div
              className="flex justify-end px-4 py-2"
              style={{ background: "#0F0D0A" }}
            >
              <a
                href={cert.imageUrl}
                download={`${cert.id}.png`}
                className="text-sm hover:underline"
                style={{ color: "#C9A84C" }}
              >
                Unduh Sertifikat ↓
              </a>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── Info Produk ── */}
          <section
            className="rounded-xl border p-6 space-y-4"
            style={{ borderColor: "#2A2416", background: "#0F0D0A" }}
          >
            <h2
              className="font-serif text-xl mb-4"
              style={{ color: "#C9A84C" }}
            >
              Detail Karya
            </h2>

            {productImage && (
              <div className="rounded-lg overflow-hidden mb-4" style={{ maxWidth: 200 }}>
                <Image
                  src={productImage}
                  alt={cert.productName}
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <dl className="space-y-3">
              {meta
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt
                      className="text-xs tracking-widest uppercase w-28 shrink-0 pt-0.5"
                      style={{ color: "#6B5E3E" }}
                    >
                      {label}
                    </dt>
                    <dd className="text-sm break-all" style={{ color: "#D4C8A8" }}>
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>

          {/* ── Status Blockchain ── */}
          <section className="space-y-4">
            {/* Badge Valid */}
            <div
              className="rounded-xl border p-6"
              style={{ borderColor: "#C9A84C44", background: "#C9A84C08" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#C9A84C22", border: "1px solid #C9A84C66" }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    style={{ color: "#C9A84C" }}
                  >
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#C9A84C" }}>
                    Sertifikat Phygital Terdaftar
                  </p>
                  <p className="text-sm" style={{ color: "#9A8F7A" }}>
                    Karya ini telah melalui kurasi tim MAJA dan terdaftar secara digital.
                    Sertifikat Phygital mencatat identitas dan asal-usul karya — bukan penilaian
                    kondisi fisik atau jaminan investasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Status blockchain */}
            <div
              className="rounded-xl border p-6 space-y-4"
              style={{ borderColor: "#2A2416", background: "#0F0D0A" }}
            >
              <h3
                className="font-serif text-base mb-3"
                style={{ color: "#C9A84C" }}
              >
                Status Blockchain
              </h3>

              {cert.nftTokenId ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span style={{ color: "#6B5E3E" }}>Network</span>
                    <span style={{ color: "#D4C8A8" }}>BSC (BNB Smart Chain)</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span style={{ color: "#6B5E3E" }}>Token ID</span>
                    <span className="font-mono text-xs" style={{ color: "#C9A84C" }}>
                      #{cert.nftTokenId}
                    </span>
                  </div>
                  {cert.nftTxHash && (
                    <div className="flex justify-between gap-2 items-start">
                      <span style={{ color: "#6B5E3E" }}>Tx Hash</span>
                      <a
                        href={bscTxUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs truncate max-w-[200px] hover:underline"
                        style={{ color: "#C9A84C" }}
                      >
                        {cert.nftTxHash.slice(0, 10)}…{cert.nftTxHash.slice(-8)}
                      </a>
                    </div>
                  )}
                  {cert.nftMintedAt && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#6B5E3E" }}>Minted</span>
                      <span style={{ color: "#D4C8A8" }}>
                        {new Date(cert.nftMintedAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 p-3 rounded-lg text-sm"
                  style={{ background: "#C9A84C11", border: "1px solid #C9A84C22" }}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  <span style={{ color: "#9A8F7A" }}>
                    Sertifikat terdaftar di sistem MAJA. Pencatatan ke blockchain BSC akan
                    dilakukan secara berkala.
                  </span>
                </div>
              )}
            </div>

            {/* Link produk */}
            {cert.product.slug && (
              <Link
                href={`/produk/${cert.product.slug}`}
                className="flex items-center justify-between w-full p-4 rounded-xl border text-sm hover:border-[#C9A84C] transition-colors"
                style={{ borderColor: "#2A2416", background: "#0F0D0A" }}
              >
                <span style={{ color: "#9A8F7A" }}>Lihat halaman produk →</span>
                <span style={{ color: "#C9A84C" }}>{cert.productName}</span>
              </Link>
            )}
          </section>
        </div>

        {/* ── Footer disclaimer ── */}
        <p
          className="text-center text-xs pb-8"
          style={{ color: "#4A3A28" }}
        >
          Halaman ini dapat diakses siapapun tanpa login. Sertifikat Phygital adalah
          dokumen identitas digital karya — mencatat pendaftaran, asal-usul, dan kepemilikan.
          Bukan jaminan kondisi fisik karya dan bukan instrumen investasi.
        </p>
      </div>
    </main>
  );
}
