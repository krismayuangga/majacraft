"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus, Plus, Trash2, ShoppingCart,
  ShieldCheck, Truck, Tag, ChevronRight, ArrowLeft, Loader2,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";

type CartItem = {
  id: string;
  qty: number;
  selected: boolean;
  addedAt: string;
  product: {
    id: string; name: string; slug: string; price: number;
    originalPrice?: number | null; stock: number;
    hasCertificate: boolean; isSoldOffline: boolean;
    images: { url: string }[];
    store: { name: string; province: string };
  };
};

const PLATFORM_FEE_PCT = 0.05;

export default function KeranjangPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      const data = await res.json();
      setItems(data.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const CART_EXPIRE_MS = 20 * 60 * 1000; // 20 menit

  function CartTimer({ addedAt, itemId, onExpire }: { addedAt: string; itemId: string; onExpire: (id: string) => void }) {
    const [remaining, setRemaining] = useState(() => {
      const ms = CART_EXPIRE_MS - (Date.now() - new Date(addedAt).getTime());
      return Math.max(0, Math.floor(ms / 1000));
    });
    const called = useRef(false);
    useEffect(() => {
      if (remaining <= 0) { if (!called.current) { called.current = true; onExpire(itemId); } return; }
      const t = setInterval(() => setRemaining(r => { if (r <= 1) { clearInterval(t); if (!called.current) { called.current = true; onExpire(itemId); } return 0; } return r - 1; }), 1000);
      return () => clearInterval(t);
    }, [remaining, itemId, onExpire]);
    if (remaining <= 0) return <span className="text-[10px] text-red-400 font-medium">Kedaluwarsa</span>;
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    const isUrgent = remaining < 5 * 60;
    return (
      <span className={`text-[10px] font-mono font-semibold ${isUrgent ? "text-red-500" : "text-amber-600"}`}>
        ⏱ {m}:{s}
      </span>
    );
  }

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemId, qty }),
    });
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty } : i));
    setUpdatingId(null);
  };

  const removeItem = async (itemId: string) => {
    setUpdatingId(itemId);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemId }),
    });
    setItems(prev => prev.filter(i => i.id !== itemId));
    setUpdatingId(null);
  };

  const toggleSelect = async (itemId: string, selected: boolean) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, selected } : i));
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemId, selected }),
    });
  };

  const toggleAll = async (val: boolean) => {
    setItems(prev => prev.map(i => ({ ...i, selected: val })));
    await Promise.all(items.map(i =>
      fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemId: i.id, selected: val }),
      })
    ));
  };

  const selectedItems = items.filter(i => i.selected);
  const subtotal = selectedItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PCT);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + platformFee - discount;
  const allSelected = items.length > 0 && items.every(i => i.selected);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <ShoppingCart className="w-16 h-16 text-amber-800/30 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Keranjang Kosong</h2>
      <p className="text-muted-foreground text-sm mb-6">Belum ada karya yang ditambahkan</p>
      <Link href="/produk" className="btn-gold inline-flex items-center h-11 px-6 rounded-xl font-semibold text-sm">
        Jelajahi Karya <ChevronRight className="w-4 h-4 ml-1" />
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Keranjang ({items.length})</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Kiri: Item List */}
        <div className="flex-1 space-y-3">
          {/* Pilih semua */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={e => toggleAll(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded" />
              <span className="text-sm font-medium text-foreground">Pilih Semua</span>
            </label>
            {selectedItems.length > 0 && (
              <button onClick={async () => {
                for (const i of selectedItems) await removeItem(i.id);
              }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Hapus Dipilih
              </button>
            )}
          </div>

          {/* Items */}
          {items.map(item => {
            const imgUrl = item.product.images?.[0]?.url ?? "";
            const disc = item.product.originalPrice
              ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100) : 0;
            return (
              <div key={item.id} className={`rounded-xl border bg-card p-4 transition-colors ${item.selected ? "border-amber-700/40" : "border-border"}`}>
                <div className="flex gap-3">
                  <input type="checkbox" checked={item.selected} onChange={e => toggleSelect(item.id, e.target.checked)}
                    className="w-4 h-4 accent-amber-600 mt-1 flex-shrink-0 rounded" />
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {disc > 0 && <span className="absolute top-1 left-1 z-10 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm">-{disc}%</span>}
                    {imgUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={imgUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/produk/${item.product.slug}`} className="text-sm font-medium text-foreground line-clamp-2 hover:text-amber-600">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.store.name} · {item.product.store.province}</p>
                    {/* Timer untuk produk stok terbatas */}
                    {item.product.stock <= 3 && (
                      <div className="flex items-center gap-1 mt-1">
                        <CartTimer
                          addedAt={item.addedAt}
                          itemId={item.id}
                          onExpire={(id) => {
                            setItems(prev => prev.filter(i => i.id !== id));
                            fetchCart(); // sync dengan server
                          }}
                        />
                        {item.product.stock === 1 && <span className="text-[10px] text-amber-600">· Stok hanya 1</span>}
                      </div>
                    )}
                    {item.product.hasCertificate && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 border border-amber-700/30 px-1.5 py-0.5 rounded-full mt-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Bersertifikat
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-base font-bold text-amber-700">{formatRupiah(item.product.price)}</span>
                        {item.product.originalPrice && (
                          <span className="text-xs line-through text-muted-foreground ml-1.5">{formatRupiah(item.product.originalPrice)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeItem(item.id)} disabled={updatingId === item.id}
                          className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-1 border border-border rounded-lg">
                          <button onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.qty <= 1 || updatingId === item.id}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium text-foreground">
                            {updatingId === item.id ? "…" : item.qty}
                          </span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} disabled={item.qty >= item.product.stock || updatingId === item.id}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {item.selected && (
                  <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                    <span>Subtotal ({item.qty} item)</span>
                    <span className="font-semibold text-amber-700">{formatRupiah(item.product.price * item.qty)}</span>
                  </div>
                )}
              </div>
            );
          })}
          <Link href="/produk" className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1">
            + Tambah karya lainnya
          </Link>
        </div>

        {/* Kanan: Ringkasan */}
        <div className="lg:w-80 space-y-3">
          {/* Kupon */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Tag className="w-4 h-4 text-amber-600" /> Kode Kupon
            </label>
            <div className="flex gap-2">
              <input type="text" placeholder="Masukkan kode kupon" value={coupon}
                onChange={e => setCoupon(e.target.value.toUpperCase())}
                className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
              />
              <button onClick={() => { if (coupon === "MAJA10") setCouponApplied(true); }}
                className="h-9 px-3 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors">
                Pakai
              </button>
            </div>
            {couponApplied && <p className="text-xs text-green-500 mt-1.5">✓ Kupon MAJA10 berhasil diterapkan (diskon 10%)</p>}
            {!couponApplied && <p className="text-xs text-muted-foreground mt-1.5">Coba kode: MAJA10</p>}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="font-semibold text-foreground">Ringkasan Belanja</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({selectedItems.length} item)</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  Biaya Platform (5%) <span className="cursor-help text-muted-foreground/50" title="Biaya layanan MajaCraft">ⓘ</span>
                </span>
                <span>{formatRupiah(platformFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Diskon Kupon</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Ongkos Kirim</span>
                <span className="text-amber-600">Dihitung saat checkout</span>
              </div>
            </div>
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-xl text-amber-700">{formatRupiah(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">*Belum termasuk ongkos kirim</p>
            <Link
              href={selectedItems.length > 0 ? "/checkout" : "#"}
              className={`btn-gold w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${selectedItems.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center justify-around text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-amber-600" /> Transaksi Aman</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-amber-600" /> Pengiriman Terlacak</span>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">Pembayaran aman — dana dikunci hingga karya diterima</p>
          </div>
        </div>
      </div>

      {/* Mobile checkout bar */}
      {selectedItems.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-background border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{selectedItems.length} item dipilih</p>
              <p className="font-bold text-amber-700">{formatRupiah(total)}</p>
            </div>
            <Link href="/checkout"
              className="btn-gold h-11 px-6 rounded-xl font-bold text-sm flex items-center gap-1">
              Checkout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
