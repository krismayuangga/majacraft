"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Star,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  ChevronRight,
  Package,
  Award,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRupiah } from "@/lib/data";
import ProductCard from "@/components/marketplace/ProductCard";
import ReviewSection from "@/components/marketplace/ReviewSection";

export default function ProductDetailClient({ slug, serverProduct }: { slug: string; serverProduct?: unknown }) {
  // ─── ALL HOOKS MUST BE AT THE TOP (Rules of Hooks) ───────────────────────
  // Use server-fetched product only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialProduct = serverProduct as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = initialProduct as any;
  const related: unknown[] = [];
  const discount = product?.originalPrice ? Math.abs(Math.round(((product.originalPrice - product.price) / Math.max(product.originalPrice, product.price)) * 100)) : 0;

  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMsg, setCartMsg] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  // Cek status wishlist saat mount
  useEffect(() => {
    if (!session || !product?.id) return;
    fetch(`/api/wishlist/${product.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setWishlisted(d.data?.wishlisted ?? false))
      .catch(() => {});
  }, [session, product?.id]);

  async function toggleWishlist() {
    if (!session) { router.push("/masuk?callbackUrl=" + encodeURIComponent(window.location.href)); return; }
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE", credentials: "include" });
        setWishlisted(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });
        setWishlisted(true);
      }
    } finally {
      setWishlistLoading(false);
    }
  }

  async function shareProduct(method: "copy" | "wa" | "email" | "native") {
    const url = window.location.href;
    const title = `${product.name} - MajaCraft`;
    const text = `Lihat karya seni ini di MajaCraft: ${product.name} — ${formatRupiah(product.price)}`;
    if (method === "native" && navigator.share) {
      await navigator.share({ title, text, url }).catch(() => {});
    } else if (method === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (method === "wa") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
    } else if (method === "email") {
      window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + url)}`);
    }
    if (method !== "copy") setShowShare(false);
  }

  async function addToCart() {
    if (!session) { router.push("/masuk?callbackUrl=" + encodeURIComponent(window.location.href)); return; }
    setCartLoading(true); setCartMsg("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: product.id, qty }),
      });
      const data = await res.json();
      if (!res.ok) { setCartMsg(data.error ?? "Gagal menambahkan ke keranjang"); return; }
      setCartMsg("✓ Ditambahkan ke keranjang");
      setTimeout(() => setCartMsg(""), 3000);
    } finally {
      setCartLoading(false);
    }
  }

  async function buyNow() {
    if (!session) { router.push("/masuk?callbackUrl=" + encodeURIComponent(window.location.href)); return; }
    setCartLoading(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: product.id, qty }),
      });
      router.push("/checkout");
    } finally {
      setCartLoading(false);
    }
  }

  // ─── Conditional renders AFTER all hooks ─────────────────────────────────
  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <Package className="w-12 h-12 text-amber-800/40" />
      <h1 className="text-xl font-bold text-foreground">Produk Tidak Ditemukan</h1>
      <p className="text-muted-foreground text-sm">Produk mungkin sudah dihapus atau URL tidak valid.</p>
      <Link href="/produk" className="btn-gold inline-flex h-10 px-6 rounded-xl text-sm font-semibold items-center">Lihat Semua Produk</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-amber-600">Beranda</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/produk" className="hover:text-amber-600">Produk</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Images */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
            <Image
              src={product.images[selectedImg]}
              alt={product.name}
              fill
              className="object-cover"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.src = `https://placehold.co/600x600/2A2620/C9A84C?text=${encodeURIComponent(product.name.substring(0, 15))}`;
              }}
            />
            {product.isPhygital && (
              <div className="absolute top-3 left-3">
                <span className="badge-phygital flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Verified Phygital
                </span>
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded">
                -{discount}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === selectedImg ? "border-amber-500" : "border-border hover:border-amber-400"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/2A2620/C9A84C?text=${i+1}`; }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Sertifikat Phygital */}
          {product.hasCertificate && (
            <button
              onClick={() => setShowCertModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group"
              style={{
                background: "linear-gradient(135deg, #1A1610 0%, #0F0D0A 100%)",
                border: "1px solid #C9A84C55",
                boxShadow: "0 0 12px #C9A84C18, inset 0 1px 0 #C9A84C22",
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#C9A84C18", border: "1px solid #C9A84C44" }}
              >
                <FileCheck className="w-5 h-5" style={{ color: "#C9A84C" }} />
              </div>

              {/* Teks */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: "#C9A84C" }}>Sertifikat Phygital</p>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                    style={{ background: "#C9A84C22", color: "#C9A84C", border: "1px solid #C9A84C44" }}
                  >
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "#6B5E3E" }}>
                  ID: {product.certificateId}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight
                className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: "#8B6914" }}
              />
            </button>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="lg:col-span-4 space-y-4">
          {/* Title & badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.isVerified && (
                <Badge variant="outline" className="border-amber-700/40 text-amber-600 text-xs">
                  <Award className="w-3 h-3 mr-1" /> Terverifikasi
                </Badge>
              )}
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {product.category.replace("-", " ")}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-snug">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.floor(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted"
                  }`}
                />
              ))}
              <span className="text-sm font-medium text-amber-600 ml-1">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews} ulasan) · {product.sold} terjual
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              {formatRupiah(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-base line-through text-muted-foreground">
                  {formatRupiah(product.originalPrice)}
                </span>
                <Badge className="bg-red-600 text-white">-{discount}%</Badge>
              </>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* Specs */}
          <div className="space-y-2 text-sm">
            {[
              ["Material", product.material],
              ["Dimensi", product.length && product.width && product.height
                ? `${product.length} × ${product.width} × ${product.height} cm`
                : product.dimensions],
              ["Berat", (() => { const w = Number(product.weight); return (w > 0) ? `${w / 1000 % 1 === 0 ? w / 1000 : (w / 1000).toFixed(1)} kg` : null; })()],
              ["Asal Daerah", product.origin],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-muted-foreground w-24 flex-shrink-0">{label}</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>

          <Separator className="opacity-40" />

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Jumlah:</span>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-foreground"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-foreground"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 h-11 btn-gold font-semibold text-sm rounded-lg"
              onClick={addToCart}
              disabled={cartLoading || product.stock === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {cartLoading ? "Memproses..." : "Tambah ke Keranjang"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-11 w-11 border border-border rounded-lg ${wishlisted ? "text-red-500 border-red-300/40" : "text-muted-foreground"}`}
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              title={wishlisted ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500" : ""}`} />
            </Button>
            <div className="relative">
              <Button
                variant="ghost" size="icon"
                className="h-11 w-11 border border-border rounded-lg text-muted-foreground hover:text-amber-600"
                onClick={() => {
                  if (typeof navigator !== "undefined" && "share" in navigator) { shareProduct("native"); }
                  else setShowShare(s => !s);
                }}
                title="Bagikan"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {/* Share dropdown */}
              {showShare && (
                <div className="absolute right-0 top-12 z-20 bg-card border border-border rounded-xl shadow-xl p-2 w-48 space-y-1">
                  <button onClick={() => shareProduct("wa")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
                    <span className="text-lg">💬</span> WhatsApp
                  </button>
                  <button onClick={() => shareProduct("email")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
                    <span className="text-lg">📧</span> Email
                  </button>
                  <button onClick={() => shareProduct("copy")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
                    <span className="text-lg">{copied ? "✅" : "🔗"}</span> {copied ? "Tersalin!" : "Salin Link"}
                  </button>
                  <div className="h-px bg-border mx-1" />
                  <button onClick={() => setShowShare(false)} className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground text-center transition-colors">
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
          {cartMsg && (
            <p className="text-xs text-green-500 font-medium">{cartMsg}</p>
          )}
          <Button variant="outline" className="w-full h-11 border-amber-700/40 text-amber-700 hover:bg-amber-900/10 font-semibold rounded-lg" onClick={buyNow} disabled={cartLoading || product.stock === 0}>
            <Zap className="w-4 h-4 mr-2" />
            Beli Sekarang
          </Button>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { icon: ShieldCheck, text: "Keaslian Dijamin" },
              { icon: Truck, text: "Kirim Aman" },
              { icon: RotateCcw, text: "Retur 30 Hari" },
            ].map((g) => (
              <div key={g.text} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 text-center">
                <g.icon className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] text-muted-foreground leading-tight">{g.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Seller card */}
        <div className="lg:col-span-3 space-y-4">
          <div className="border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Info Penjual</h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-amber-700/30">
                <AvatarImage src={product.seller.avatar} />
                <AvatarFallback className="bg-amber-900/40 text-amber-300 font-bold">
                  {product.seller.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-foreground">{product.seller.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {product.seller.location}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {product.seller.rating} · {product.seller.sold} terjual
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/toko/${(product.seller as {slug?:string}).slug || product.seller.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center justify-center text-xs h-8 px-3 rounded-md border border-amber-700/30 text-amber-700 hover:bg-amber-900/10 transition-colors font-medium"
              >
                Kunjungi Toko
              </Link>
              <button
                onClick={async () => {
                  if (!session) { router.push("/masuk?callbackUrl=" + encodeURIComponent(window.location.href)); return; }
                  setChatLoading(true);
                  try {
                    // Ambil owner store dulu
                    const storeSlug = (product.seller as {slug?:string}).slug || product.seller.name.toLowerCase().replace(/\s+/g, '-');
                    const ownerRes = await fetch(`/api/stores/${storeSlug}/owner`);
                    const ownerData = await ownerRes.json();
                    const targetUserId = ownerData.data?.userId;
                    if (!targetUserId) return;
                    const res = await fetch("/api/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ targetUserId, productId: product.id }),
                    });
                    const data = await res.json();
                    const chatId = data.data?.id;
                    if (chatId) router.push(`/chat?id=${chatId}`);
                  } finally {
                    setChatLoading(false);
                  }
                }}
                disabled={chatLoading}
                className="inline-flex items-center justify-center text-xs h-8 px-3 rounded-md bg-amber-700 hover:bg-amber-600 text-white transition-colors font-medium gap-1 disabled:opacity-50"
              >
                {chatLoading ? "..." : "💬 Chat Seniman"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              🔒 Komunikasi dilindungi platform — nomor pribadi tidak dibagikan
            </p>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="mt-10">
        <Tabs defaultValue="deskripsi">
          <TabsList className="border-b border-border bg-transparent h-auto p-0 w-full justify-start rounded-none">
            {["Deskripsi", "Spesifikasi", "Ulasan"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:text-amber-600 px-6 py-3 text-sm bg-transparent"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="deskripsi" className="pt-6">
            {product.description?.startsWith("<") ? (
              // HTML dari TipTap rich text editor
              <div
                className="prose prose-sm max-w-2xl text-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              // Plain text fallback
              <p className="text-sm text-foreground leading-relaxed max-w-2xl">{product.description}</p>
            )}
          </TabsContent>

          <TabsContent value="spesifikasi" className="pt-6">
            <div className="max-w-md space-y-3">
              {[
                ["Nama Karya", product.name],
                ["Material", product.material],
                ["Dimensi", product.length && product.width && product.height
                  ? `${product.length} × ${product.width} × ${product.height} cm`
                  : product.dimensions],
                ["Berat", (() => { const w = Number(product.weight); return (w > 0) ? `${w / 1000 % 1 === 0 ? w / 1000 : (w / 1000).toFixed(1)} kg` : null; })()],
                ["Asal Daerah", product.origin],
                ["Kategori", product.category.replace("-", " ")],
                ["Sertifikat", product.hasCertificate ? `Ya (ID: ${product.certificateId})` : "Tidak"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start gap-4 py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground w-32 flex-shrink-0">{label}</span>
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ulasan" className="pt-6">
            <ReviewSection productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Karya Serupa</h2>
          <div className="ornament-divider w-16 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(related as any[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sertifikat Phygital Modal */}
      {showCertModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCertModal(false)}
        >
          <div
            className="rounded-2xl overflow-hidden w-full shadow-2xl flex flex-col"
            style={{
              background: "#0F0D0A",
              border: "1px solid #C9A84C44",
              maxWidth: 360,
              maxHeight: "88vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid #C9A84C22" }}
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" style={{ color: "#C9A84C" }} />
                <h3 className="text-sm font-semibold" style={{ color: "#C9A84C" }}>Sertifikat Phygital</h3>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                  style={{ background: "#C9A84C22", color: "#C9A84C", border: "1px solid #C9A84C44" }}
                >
                  VERIFIED
                </span>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-base leading-none transition-colors"
                style={{ color: "#6B5E3E" }}
              >
                ×
              </button>
            </div>

            {/* Gambar sertifikat — scrollable */}
            <div className="overflow-y-auto flex-1">
              {product.certificateImageUrl ? (
                <Image
                  src={product.certificateImageUrl}
                  alt={`Sertifikat Phygital ${product.name}`}
                  width={800}
                  height={1120}
                  className="w-full h-auto block"
                  priority
                />
              ) : (
                /* Fallback teks */
                <div className="p-5 space-y-3 text-sm">
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "#C9A84C0A", border: "1px solid #C9A84C22" }}>
                    {[
                      ["Nama Karya", product.name],
                      ["ID Sertifikat", product.certificateId],
                      ["Seniman", product.seller?.name ?? "-"],
                      ["Asal Daerah", product.origin],
                      ["Material", product.material],
                      ["Status", "✓ Terdaftar di MAJA"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span style={{ color: "#6B5E3E" }}>{label}</span>
                        <span className="font-medium text-right" style={{ color: "#D4C8A8" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs" style={{ color: "#6B5E3E" }}>
                    Sertifikat ini mencatat identitas dan asal-usul karya secara digital
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex gap-2 px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid #C9A84C22" }}
            >
              <Link
                href={`/verifikasi/${product.certificateId}`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px solid #C9A84C55", color: "#C9A84C" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Lihat Detail
              </Link>
              <Button
                variant="ghost"
                className="px-4 text-sm"
                style={{ color: "#6B5E3E" }}
                onClick={() => setShowCertModal(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
