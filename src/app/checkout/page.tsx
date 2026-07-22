"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Plus, Truck, ShieldCheck,
  ChevronRight, ArrowLeft,
  Loader2, AlertCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";

type Address = {
  id: string; label: string; name: string; phone: string;
  address: string; city: string; province: string; zip: string; isDefault: boolean;
};
type CartItem = {
  id: string; productId: string; qty: number;
  product: { id: string; name: string; price: number; stock: number; images: {url:string}[]; store: {name:string;province:string} };
};
type ShippingOption = {
  id: string;            // "jne-REG"
  courier_code: string;
  courier_name: string;
  service_code: string;
  service_name: string;
  etd: string;
  price: number;
};

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [feePercent, setFeePercent] = useState(5);

  // Load real addresses + cart from API
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [addrRes, cartRes] = await Promise.all([
        fetch("/api/addresses", { credentials: "include" }),
        fetch("/api/cart", { credentials: "include" }),
      ]);
      const addrData = await addrRes.json();
      const cartData = await cartRes.json();
      const addrs: Address[] = addrData.data ?? [];
      const items: CartItem[] = cartData.data?.items ?? [];
      setAddresses(addrs);
      setCartItems(items);
      const def = addrs.find(a => a.isDefault) ?? addrs[0];
      if (def) setSelectedAddress(def.id);
      setLoading(false);
    }
    loadData();
    // Baca fee platform dari settings
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.data?.feePercent) setFeePercent(d.data.feePercent);
    });
  }, []);

  // Load ongkir dari RajaOngkir saat alamat dipilih/berubah
  useEffect(() => {
    if (!selectedAddress) return;
    setShippingLoading(true);
    setShippingError("");
    setShippingOptions([]);
    setSelectedCourier("");
    fetch("/api/shipping/cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ addressId: selectedAddress }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.data?.couriers?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const opts: ShippingOption[] = d.data.couriers.map((c: any) => ({
            id: `${c.courier_code}-${c.service_code}`,
            courier_code: c.courier_code,
            courier_name: c.courier_name,
            service_code: c.service_code,
            service_name: c.service_name,
            etd:   c.etd,
            price: c.price,
          }));
          setShippingOptions(opts);
          setSelectedCourier(opts[0].id);
        } else {
          setShippingError(d.error ?? "Tidak ada layanan kurir tersedia");
        }
      })
      .catch(() => setShippingError("Gagal memuat ongkir. Pastikan API Key RajaOngkir sudah diset."))
      .finally(() => setShippingLoading(false));
  }, [selectedAddress]);

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const platformFee = Math.round(subtotal * feePercent / 100);
  const courier = shippingOptions.find((c) => c.id === selectedCourier);
  const shippingCost = courier?.price ?? 0;
  const total = subtotal + shippingCost;

  const handleOrder = async () => {
    setIsProcessing(true);
    setPaymentError("");
    if (!courier) { setPaymentError("Pilih metode pengiriman terlebih dahulu"); setIsProcessing(false); return; }
    try {
      // 1. Buat pesanan di DB
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          addressId: String(selectedAddress),
          courierName: courier.courier_name,
          courierService: courier.service_code ?? "",
          shippingCost: shippingCost,
          paymentMethod: "ipaymu-redirect",
          note,
          items: cartItems.map((i) => ({
            productId: i.productId,
            qty: i.qty,
          })),
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setPaymentError(orderData.error ?? "Gagal membuat pesanan");
        return;
      }

      const orderId = orderData.data?.id;
      if (!orderId) { setPaymentError("Gagal mendapatkan ID pesanan"); return; }

      // 2. Buat pembayaran iPaymu → dapat redirect URL
      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.data?.url) {
        setPaymentError(payData.error ?? "Gagal menghubungi payment gateway");
        return;
      }

      // 3. Redirect ke halaman pembayaran iPaymu
      window.location.href = payData.data.url;

    } catch {
      setPaymentError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/keranjang" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Checkout</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="mb-4">Keranjang belanja Anda kosong.</p>
          <Link href="/produk" className="text-amber-600 hover:underline text-sm">Jelajahi Karya →</Link>
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Kiri: Form ── */}
        <div className="flex-1 space-y-4">

          {/* 1. Alamat Pengiriman */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" /> Alamat Pengiriman
              </h2>
              <Link href="/akun/alamat" className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Tambah Alamat
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Belum ada alamat. <Link href="/akun/alamat" className="text-amber-600 hover:underline">Tambah alamat</Link>
                </div>
              ) : addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAddress === addr.id
                      ? "border-amber-500 bg-amber-900/10"
                      : "border-border hover:border-amber-700/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="accent-amber-600 mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{addr.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-600 border border-amber-800/30">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/20 text-green-600 border border-green-800/30">
                          Utama
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{addr.phone}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {addr.address}, {addr.city}, {addr.province} {addr.zip}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Ringkasan Produk */}
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Produk Dipesan</h2>
            </div>
            <div className="divide-y divide-border">
              {cartItems.map((item) => (
                <div key={item.id} className="p-4 flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {item.product.images[0]?.url ? (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.store.name} · {item.product.store.province}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">x{item.qty}</span>
                      <span className="text-sm font-bold text-amber-700">{formatRupiah(item.product.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Catatan untuk seller */}
            <div className="p-4 border-t border-border">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider block mb-2">
                Catatan untuk Seniman (opsional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="cth: Tolong dikemas dengan bubble wrap ekstra..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* 3. Pilih Kurir — data real dari RajaOngkir */}
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" /> Pilih Pengiriman
              </h2>
            </div>
            <div className="p-4">
              {shippingLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat ongkir...
                </div>
              ) : shippingError ? (
                <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                  <AlertCircle className="w-4 h-4" /> {shippingError}
                </div>
              ) : shippingOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Pilih alamat terlebih dahulu</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shippingOptions.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedCourier === c.id
                          ? "border-amber-500 bg-amber-900/10"
                          : "border-border hover:border-amber-700/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="courier"
                        value={c.id}
                        checked={selectedCourier === c.id}
                        onChange={() => setSelectedCourier(c.id)}
                        className="accent-amber-600 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {c.courier_name} {c.service_code}
                          </span>
                          <span className="text-sm font-bold text-amber-700">{formatRupiah(c.price)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Estimasi {c.etd}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Info pembayaran — iPaymu menangani pilihan metode */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Pembayaran via iPaymu</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Setelah menekan tombol Bayar, Anda akan diarahkan ke halaman iPaymu untuk memilih metode pembayaran:
                  Transfer Bank (BCA/BNI/BRI/Mandiri), QRIS, GoPay, OVO, Dana, ShopeePay, dan lainnya.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kanan: Summary ── */}
        <div className="lg:w-80">
          <div className="sticky top-20 space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <h3 className="font-semibold text-foreground">Ringkasan Pembayaran</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Subtotal produk", formatRupiah(subtotal)],
                  ["Ongkos kirim", shippingCost ? formatRupiah(shippingCost) : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-muted-foreground">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-foreground">Total Bayar</span>
                  <span className="text-amber-700 dark:text-amber-400">{formatRupiah(total)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70">*Fee platform {feePercent}% dikenakan kepada penjual saat pencairan, tidak ditambahkan ke tagihan Anda.</p>
              </div>

              {/* Escrow info */}
              <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-800/20 text-xs text-amber-700 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-500 mb-0.5">Jaminan Keamanan MAJA</p>
                  <p>Dana dikunci hingga Anda konfirmasi penerimaan karya. Uang kembali jika karya tidak sesuai.</p>
                </div>
              </div>

              {paymentError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-xs">
                  {paymentError}
                </div>
              )}

              <button
                onClick={handleOrder}
                disabled={isProcessing}
                className="w-full h-12 rounded-xl btn-gold font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menghubungi Payment Gateway...
                  </>
                ) : (
                  <>Bayar {formatRupiah(total)} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-[10px] text-center text-muted-foreground">
                Dengan menekan bayar, Anda menyetujui{" "}
                <Link href="/syarat" className="text-amber-600 hover:underline">Syarat & Ketentuan</Link> MAJA
              </p>
            </div>
          </div>
        </div>
      </div>
      )} {/* end cartItems.length > 0 */}
    </div>
  );
}
