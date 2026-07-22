"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/data";

type WishlistItem = {
  id: string;
  productId: string;
  product: {
    id: string; name: string; slug: string; price: number; originalPrice?: number | null;
    stock: number; isSoldOffline: boolean;
    images: { url: string }[];
    store: { name: string; province: string };
    category: { slug: string } | null;
  };
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingCart, setAddingCart] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/wishlist", { credentials: "include" });
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const removeItem = async (productId: string) => {
    setRemovingId(productId);
    await fetch(`/api/wishlist/${productId}`, { method: "DELETE", credentials: "include" });
    setItems(prev => prev.filter(i => i.productId !== productId));
    setRemovingId(null);
  };

  const addToCart = async (productId: string) => {
    setAddingCart(productId);
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, qty: 1 }),
    });
    setAddingCart(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        <h1 className="text-xl font-bold text-foreground">Wishlist Saya</h1>
        {items.length > 0 && <span className="text-sm text-muted-foreground">({items.length} karya)</span>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-amber-800/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Wishlist Kosong</h2>
          <p className="text-muted-foreground text-sm mb-6">Simpan karya favorit dengan menekan ikon ❤️ di halaman produk</p>
          <Link href="/produk" className="btn-gold inline-flex h-11 px-6 rounded-xl font-semibold text-sm items-center gap-2">
            Jelajahi Karya
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => {
            const p = item.product;
            const img = p.images?.[0]?.url ?? "";
            const disc = p.originalPrice && p.originalPrice !== p.price
              ? Math.abs(Math.round(((p.originalPrice - p.price) / Math.max(p.originalPrice, p.price)) * 100))
              : 0;
            return (
              <div key={item.id} className={`rounded-xl border border-border bg-card overflow-hidden ${p.isSoldOffline ? "opacity-70" : ""}`}>
                {/* Image */}
                <div className="relative">
                  <Link href={`/produk/${p.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img || "/images/product-1.svg"} alt={p.name} className="w-full aspect-square object-cover" />
                  </Link>
                  {p.isSoldOffline && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-bold tracking-widest border-2 border-white px-3 py-1 rounded-sm rotate-[-10deg]">TERJUAL</span>
                    </div>
                  )}
                  {disc > 0 && !p.isSoldOffline && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">-{disc}%</span>
                  )}
                  <button onClick={() => removeItem(p.id)} disabled={removingId === p.id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black/70 transition-all">
                    {removingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {/* Info */}
                <div className="p-3">
                  <Link href={`/produk/${p.slug}`} className="text-sm font-medium text-foreground line-clamp-2 hover:text-amber-600 block">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.store.name} · {p.store.province}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-base font-bold text-amber-700">{formatRupiah(p.price)}</p>
                      {p.originalPrice && p.originalPrice !== p.price && (
                        <p className="text-xs line-through text-muted-foreground">{formatRupiah(p.originalPrice)}</p>
                      )}
                    </div>
                    {!p.isSoldOffline && p.stock > 0 && (
                      <button onClick={() => addToCart(p.id)} disabled={addingCart === p.id}
                        className="h-9 px-3 rounded-lg btn-gold text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
                        {addingCart === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                        Keranjang
                      </button>
                    )}
                    {p.stock === 0 && !p.isSoldOffline && (
                      <span className="text-xs text-red-400">Stok habis</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
