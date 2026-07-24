"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, MapPin, ShieldCheck, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/data";

interface Product {
  id: number | string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  image: string;
  category: string;
  seller: { name: string; location: string; rating: number; sold: number; avatar: string };
  rating: number;
  reviews: number;
  sold: number;
  isPhygital: boolean;
  isVerified: boolean;
  hasCertificate: boolean;
  isCurated?: boolean;
  isSoldOffline?: boolean;
  stock: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice && product.originalPrice !== product.price
    ? Math.abs(Math.round(((product.originalPrice - product.price) / Math.max(product.originalPrice, product.price)) * 100))
    : 0;

  const [imgSrc, setImgSrc] = useState(product.image);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!session) { router.push("/masuk"); return; }
    setWishLoading(true);
    try {
      if (wishlisted) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE", credentials: "include" });
        setWishlisted(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId: String(product.id) }),
        });
        setWishlisted(true);
      }
    } finally {
      setWishLoading(false);
    }
  }

  return (
    <Link href={`/produk/${product.slug}`} className="group block">
      <div className={`card-maja rounded-xl bg-card h-full flex flex-col ${product.isSoldOffline ? "opacity-80" : ""}`}>
        {/* Image */}
        <div className="relative rounded-t-xl overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full aspect-square object-cover block"
            onError={() => setImgSrc(`/images/product-1.svg`)}
            loading="lazy"
          />

          {/* Badge TERJUAL overlay */}
          {product.isSoldOffline && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm font-bold tracking-widest border-2 border-white px-4 py-1.5 rounded-sm rotate-[-10deg]">
                TERJUAL
              </span>
            </div>
          )}

          {/* Badges overlay — hanya Phygital + diskon % di pojok kiri atas */}
          <div className="absolute top-2 left-2 flex flex-row gap-1 flex-wrap">
            {product.isPhygital && (
              <span className="badge-phygital flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                Phygital
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                -{discount}%
              </span>
            )}
          </div>

          {/* Wishlist button — tampil di kanan atas, aktif di desktop */}
          <button
            className={`hidden md:flex absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/60 ${wishlisted ? "text-red-400" : "text-white/60 hover:text-red-400"}`}
            onClick={handleWishlist}
            disabled={wishLoading}
            title={wishlisted ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-red-400" : ""}`} />
          </button>

          {/* Stock warning */}
          {product.stock <= 3 && product.stock > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-900/80 text-red-200 text-[10px] text-center py-1">
              Stok tersisa {product.stock}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 flex flex-col gap-1.5 flex-1">
          <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-snug md:group-hover:text-amber-700 dark:md:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {formatRupiah(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] line-through text-muted-foreground">
                {formatRupiah(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Rating & sold */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              {product.rating}
            </span>
            <span>·</span>
            <span>Terjual {product.sold}</span>
          </div>

          {/* Seller name */}
          {product.seller.name && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <svg className="w-2.5 h-2.5 flex-shrink-0 text-amber-600/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="truncate font-medium text-foreground/70">{product.seller.name}</span>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-auto pt-1.5 border-t border-border">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{product.seller.location}</span>
            {product.isVerified && (
              <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 border-amber-700/40 text-amber-600">
                ✓ Verified
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
