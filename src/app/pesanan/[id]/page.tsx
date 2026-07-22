"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Package, Truck, CheckCircle2, XCircle, Clock,
  MapPin, CreditCard, Loader2, MessageCircle, Star, AlertTriangle,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: "Belum Dibayar",    color: "text-yellow-500", bg: "bg-yellow-900/20 border-yellow-800/30", icon: Clock },
  PROCESSING:      { label: "Diproses Seniman", color: "text-blue-400",   bg: "bg-blue-900/20 border-blue-800/30",    icon: Package },
  SHIPPED:         { label: "Dalam Pengiriman", color: "text-purple-400", bg: "bg-purple-900/20 border-purple-800/30", icon: Truck },
  DELIVERED:       { label: "Diterima",         color: "text-teal-400",   bg: "bg-teal-900/20 border-teal-800/30",    icon: CheckCircle2 },
  COMPLETED:       { label: "Selesai",          color: "text-green-400",  bg: "bg-green-900/20 border-green-800/30",  icon: CheckCircle2 },
  CANCELLED:       { label: "Dibatalkan",       color: "text-red-400",    bg: "bg-red-900/20 border-red-800/30",      icon: XCircle },
  REFUNDED:        { label: "Direfund",         color: "text-red-400",    bg: "bg-red-900/20 border-red-800/30",      icon: XCircle },
} as const;

type OrderStatus = keyof typeof STATUS_CONFIG;

type OrderDetail = {
  id: string; orderNumber: string; status: OrderStatus; createdAt: string;
  subtotal: number; shippingCost: number; platformFee: number; total: number;
  paymentMethod?: string; courierName?: string; courierService?: string;
  trackingNumber?: string; estimatedArrival?: string; note?: string;
  paymentDeadline?: string | null;
  address?: { name: string; phone: string; address: string; city: string; province: string; zip: string } | null;
  items: {
    id: string; qty: number; price: number; productName: string;
    product: { id: string; name: string; slug: string; images: { url: string }[] } | null;
  }[];
};

type TrackingData = {
  source: "live" | "fallback";
  courierName?: string;
  courierService?: string;
  trackingNumber?: string;
  status: string;
  delivered: boolean;
  lastUpdate?: string;
  warning?: string;
  events: { datetime: string; description: string; city?: string }[];
};

function CountdownTimer({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);
  if (remaining <= 0) return <span className="text-red-400 font-medium">Waktu habis — pesanan akan segera dibatalkan</span>;
  const h = Math.floor(remaining / 3600);
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  return (
    <span className="font-mono font-bold text-yellow-400">
      {h > 0 ? `${h}:` : ""}{m}:{s}
    </span>
  );
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateTimeSafe(str?: string) {
  if (!str) return "-";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { credentials: "include" });
      if (!res.ok) { router.replace("/pesanan"); return; }
      const data = await res.json();
      setOrder(data.data);
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const fetchTracking = useCallback(async () => {
    if (!order?.trackingNumber || !order?.courierName) return;
    setTrackingLoading(true);
    setTrackingError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setTrackingError(data?.error ?? "Tracking live belum tersedia");
        setTracking(null);
        return;
      }
      setTracking(data.data as TrackingData);
    } catch {
      setTrackingError("Gagal mengambil status tracking live");
      setTracking(null);
    } finally {
      setTrackingLoading(false);
    }
  }, [order?.trackingNumber, order?.courierName, orderId]);

  useEffect(() => {
    if (order?.status === "SHIPPED" && order?.trackingNumber && order?.courierName) {
      fetchTracking();
      return;
    }
    setTracking(null);
    setTrackingError("");
  }, [order?.status, order?.trackingNumber, order?.courierName, fetchTracking]);

  async function handlePay() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.data?.url) window.location.href = data.data.url;
      else alert(data.error ?? "Gagal membuat pembayaran");
    } finally { setActionLoading(false); }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) { router.replace("/pesanan"); }
      else alert(data.error ?? "Gagal membatalkan pesanan");
    } finally { setActionLoading(false); setShowCancelConfirm(false); }
  }

  async function handleConfirmReceived() {
    setActionLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/confirm`, { method: "POST", credentials: "include" });
      fetchOrder();
    } finally { setActionLoading(false); }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
    </div>
  );

  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.CANCELLED;
  const StatusIcon = cfg.icon;
  const trackingStatusLabel = tracking
    ? (tracking.source === "fallback" && tracking.events.length === 0
        ? "Resi belum terverifikasi kurir"
        : tracking.status)
    : "-";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pesanan" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Detail Pesanan</h1>
          <p className="text-xs font-mono text-amber-600">{order.orderNumber}</p>
        </div>
      </div>

      {/* Status */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border mb-4 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
          <div>
            <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        {order.status === "PENDING_PAYMENT" && order.paymentDeadline && (
          <div className="text-right text-xs">
            <p className="text-muted-foreground mb-0.5">Bayar sebelum</p>
            <CountdownTimer deadline={order.paymentDeadline} />
          </div>
        )}
      </div>

      {/* Payment deadline warning */}
      {order.status === "PENDING_PAYMENT" && (
        <div className="p-3 rounded-xl bg-yellow-900/10 border border-yellow-800/20 flex items-start gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400">
            Segera selesaikan pembayaran. Pesanan akan otomatis dibatalkan dan stok dikembalikan jika waktu habis.
          </p>
        </div>
      )}

      {/* Items */}
      <div className="rounded-2xl border border-border bg-card mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">Produk Dipesan</h2>
        </div>
        {order.items.map(item => {
          const imgUrl = item.product?.images?.[0]?.url ?? "";
          const name = item.product?.name ?? item.productName;
          return (
            <div key={item.id} className="p-4 flex gap-3 border-b border-border/50 last:border-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {imgUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-2">{name}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">x{item.qty}</span>
                  <span className="text-sm font-bold text-amber-700">{formatRupiah(item.price * item.qty)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tracking */}
      {order.status === "SHIPPED" && order.trackingNumber && (
        <div className="p-4 rounded-2xl border border-purple-800/30 bg-purple-900/10 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-purple-300 text-sm">Info Pengiriman</span>
            </div>
            {tracking?.source === "live" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-700/30 bg-green-900/20 text-green-300">
                LIVE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><span className="text-muted-foreground">Kurir</span><p className="font-medium text-foreground mt-0.5">{order.courierName} {order.courierService}</p></div>
            <div><span className="text-muted-foreground">No. Resi</span><p className="font-mono font-medium text-purple-300 mt-0.5">{order.trackingNumber}</p></div>
            {tracking && <div><span className="text-muted-foreground">Status</span><p className="font-medium text-foreground mt-0.5">{trackingStatusLabel}</p></div>}
            {tracking?.lastUpdate && <div><span className="text-muted-foreground">Update Terakhir</span><p className="font-medium text-foreground mt-0.5">{formatDateTimeSafe(tracking.lastUpdate)}</p></div>}
            {order.estimatedArrival && <div><span className="text-muted-foreground">Estimasi</span><p className="font-medium text-foreground mt-0.5">{order.estimatedArrival}</p></div>}
          </div>

          {trackingLoading && (
            <div className="text-xs text-purple-300 flex items-center gap-2 mb-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Mengambil tracking live...
            </div>
          )}

          {trackingError && (
            <div className="text-xs text-amber-300 mb-2 flex items-center justify-between gap-2 p-2 rounded-lg border border-amber-700/30 bg-amber-900/10">
              <span>{trackingError}</span>
              <button
                type="button"
                onClick={fetchTracking}
                className="text-[10px] underline hover:text-amber-100"
              >
                Coba lagi
              </button>
            </div>
          )}

          {tracking?.warning && (
            <p className="text-[11px] text-amber-300 mb-2">{tracking.warning}. Seller perlu memasukkan resi yang sudah aktif.</p>
          )}

          {!!tracking?.events?.length && (
            <div className="mt-2 border-t border-purple-800/30 pt-3">
              <p className="text-xs font-semibold text-purple-300 mb-2">Riwayat Tracking</p>
              <div className="space-y-2">
                {tracking.events.slice(0, 6).map((event, index) => (
                  <div key={`${event.datetime}-${event.description}-${index}`} className="flex gap-2.5 text-xs">
                    <div className="mt-1 w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground">{event.description}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {[event.datetime, event.city].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!trackingLoading && tracking && tracking.events.length === 0 && (
            <p className="text-xs text-muted-foreground">Riwayat tracking belum tersedia dari kurir.</p>
          )}

          {!trackingLoading && !tracking && !trackingError && (
            <div className="text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span>Tracking live belum tersedia.</span>
              <button type="button" onClick={fetchTracking} className="text-purple-300 underline hover:text-purple-200">Muat tracking</button>
            </div>
          )}
        </div>
      )}

      {/* Alamat */}
      {order.address && (
        <div className="p-4 rounded-2xl border border-border bg-card mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-foreground text-sm">Alamat Pengiriman</span>
          </div>
          <p className="text-sm font-medium text-foreground">{order.address.name} · {order.address.phone}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{order.address.address}, {order.address.city}, {order.address.province} {order.address.zip}</p>
        </div>
      )}

      {/* Ringkasan pembayaran */}
      <div className="p-4 rounded-2xl border border-border bg-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-foreground text-sm">Ringkasan Pembayaran</span>
        </div>
        <div className="space-y-1.5 text-sm">
          {[
            { label: "Subtotal produk", value: formatRupiah(order.subtotal) },
            { label: "Ongkos kirim", value: formatRupiah(order.shippingCost) },
            { label: "Biaya platform (5%)", value: formatRupiah(order.platformFee) },
          ].map(r => (
            <div key={r.label} className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 border-t border-border">
            <span className="text-foreground">Total</span>
            <span className="text-amber-700">{formatRupiah(order.total)}</span>
          </div>
          {order.paymentMethod && (
            <p className="text-xs text-muted-foreground pt-1">Metode: {order.paymentMethod.replace("-", " ").toUpperCase()}</p>
          )}
        </div>
      </div>

      {/* Catatan */}
      {order.note && (
        <div className="p-3 rounded-xl border border-border bg-card mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Catatan: </span>{order.note}
        </div>
      )}

      {/* Aksi */}
      <div className="space-y-2">
        {order.status === "PENDING_PAYMENT" && (
          <>
            <button onClick={handlePay} disabled={actionLoading}
              className="w-full h-11 btn-gold rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Bayar Sekarang
            </button>
            <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading}
              className="w-full h-10 rounded-xl border border-red-700/30 text-red-400 hover:bg-red-900/10 text-sm font-medium transition-colors">
              Batalkan Pesanan
            </button>
          </>
        )}
        {order.status === "SHIPPED" && (
          <button onClick={handleConfirmReceived} disabled={actionLoading}
            className="w-full h-11 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <CheckCircle2 className="w-4 h-4" /> Konfirmasi Barang Diterima
          </button>
        )}
        {order.status === "COMPLETED" && (
          <button className="w-full h-10 rounded-xl border border-amber-700/30 text-amber-600 hover:bg-amber-900/10 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Star className="w-4 h-4" /> Beri Ulasan
          </button>
        )}
        <Link href={`/chat?order=${order.id}`}
          className="w-full h-10 rounded-xl border border-border text-muted-foreground hover:border-amber-700/40 hover:text-amber-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" /> Chat dengan Penjual
        </Link>
      </div>

      {/* Confirm cancel modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-foreground mb-2">Batalkan Pesanan?</h3>
            <p className="text-sm text-muted-foreground mb-4">Stok produk akan dikembalikan ke penjual. Tindakan ini tidak dapat diurungkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm">Kembali</button>
              <button onClick={handleCancel} disabled={actionLoading}
                className="flex-1 h-10 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
