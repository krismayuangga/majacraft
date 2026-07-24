"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Package, Truck, CheckCircle2, XCircle, Clock,
  MapPin, CreditCard, Loader2, MessageCircle, Star, AlertTriangle,
  AlertCircle, X, Upload,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";
import { useModernDialog } from "@/components/ui/modern-dialog";
import SubmitReviewModal from "@/components/marketplace/SubmitReviewModal";

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: "Belum Dibayar",    color: "text-yellow-500", bg: "bg-yellow-900/20 border-yellow-800/30", icon: Clock },
  PROCESSING:      { label: "Diproses Seniman", color: "text-blue-400",   bg: "bg-blue-900/20 border-blue-800/30",    icon: Package },
  SHIPPED:         { label: "Dalam Pengiriman", color: "text-amber-700", bg: "bg-amber-900/10 border-amber-700/30", icon: Truck },
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
  disputes?: { id: string; status: string; disputeNumber: string; createdAt: string }[];
  reviews?: { productId: string }[];
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
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [disputeImages, setDisputeImages] = useState<File[]>([]);
  const [disputePreviews, setDisputePreviews] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ productId: string; productName: string } | null>(null);
  const dialog = useModernDialog();

  function resetDisputeMedia() {
    setDisputeImages([]);
    setDisputePreviews([]);
  }

  function closeDisputeModal() {
    setShowDisputeModal(false);
    resetDisputeMedia();
  }

  async function handleDisputeImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const remaining = Math.max(0, 5 - disputeImages.length);
    if (remaining === 0) {
      await dialog.alert("Maksimal 5 foto bukti");
      return;
    }

    const accepted: File[] = [];
    for (const file of selected.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) {
        await dialog.alert(`File ${file.name} melebihi 10MB`);
        continue;
      }
      accepted.push(file);
    }

    if (!accepted.length) return;

    setDisputeImages((prev) => [...prev, ...accepted]);
    setDisputePreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);

    // reset input value so same file can be re-selected if needed
    e.currentTarget.value = "";
  }

  function removeDisputeImage(index: number) {
    setDisputeImages((prev) => prev.filter((_, i) => i !== index));
    setDisputePreviews((prev) => prev.filter((_, i) => i !== index));
  }

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
      else await dialog.alert(data.error ?? "Gagal membuat pembayaran");
    } finally { setActionLoading(false); }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) { router.replace("/pesanan"); }
      else await dialog.alert(data.error ?? "Gagal membatalkan pesanan");
    } finally { setActionLoading(false); setShowCancelConfirm(false); }
  }

  async function handleConfirmReceived() {
    setActionLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/confirm`, { method: "POST", credentials: "include" });
      fetchOrder();
      setShowCompleteConfirm(false);
    } finally { setActionLoading(false); }
  }

  async function handleSubmitDispute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const evidenceUrls: string[] = [];
      for (const file of disputeImages) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("folder", "disputes");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData?.data?.url) {
          throw new Error(uploadData?.error ?? "Gagal upload foto bukti");
        }
        evidenceUrls.push(uploadData.data.url as string);
      }
      
      const body = {
        orderId: order!.id,
        reason: formData.get("reason"),
        description: formData.get("description"),
        requestedAction: formData.get("requestedAction"),
        evidenceUrls,
      };

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        await dialog.alert(`Komplain berhasil diajukan!\nNomor: ${data.data.disputeNumber}`);
        router.push(`/pesanan/${orderId}/komplain/${data.data.dispute.id}`);
      } else {
        await dialog.alert(data.error ?? "Gagal mengajukan komplain");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengajukan komplain";
      await dialog.alert(message);
    } finally {
      setActionLoading(false);
    }
  }

  const existingDispute = order?.disputes?.find((d) => d.status !== "CANCELLED");
  const canDispute = (order?.status === "SHIPPED" || order?.status === "DELIVERED") && !existingDispute;

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
        <div className="p-4 rounded-2xl border border-amber-700/30 bg-amber-900/10 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-700" />
              <span className="font-semibold text-amber-700 text-sm">Info Pengiriman</span>
            </div>
            {tracking?.source === "live" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-700/30 bg-green-900/20 text-green-300">
                LIVE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><span className="text-muted-foreground">Kurir</span><p className="font-medium text-foreground mt-0.5">{order.courierName} {order.courierService}</p></div>
            <div><span className="text-muted-foreground">No. Resi</span><p className="font-mono font-medium text-amber-700 mt-0.5">{order.trackingNumber}</p></div>
            {tracking && <div><span className="text-muted-foreground">Status</span><p className="font-medium text-foreground mt-0.5">{trackingStatusLabel}</p></div>}
            {tracking?.lastUpdate && <div><span className="text-muted-foreground">Update Terakhir</span><p className="font-medium text-foreground mt-0.5">{formatDateTimeSafe(tracking.lastUpdate)}</p></div>}
            {order.estimatedArrival && <div><span className="text-muted-foreground">Estimasi</span><p className="font-medium text-foreground mt-0.5">{order.estimatedArrival}</p></div>}
          </div>

          {trackingLoading && (
            <div className="text-xs text-amber-700 flex items-center gap-2 mb-2">
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
            <p className="text-[11px] text-amber-700 mb-2">{tracking.warning}. Seller perlu memasukkan resi yang sudah aktif.</p>
          )}

          {order.trackingNumber.startsWith("TEST") && (
            <p className="text-[11px] text-amber-700 mb-2">
              Mode uji aktif: resi TEST dipakai untuk simulasi pengiriman, sehingga update posisi kurir live tidak ditampilkan.
            </p>
          )}

          {!!tracking?.events?.length && (
            <div className="mt-2 border-t border-amber-700/30 pt-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">Riwayat Tracking</p>
              <div className="space-y-2">
                {tracking.events.slice(0, 6).map((event, index) => (
                  <div key={`${event.datetime}-${event.description}-${index}`} className="flex gap-2.5 text-xs">
                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-700 flex-shrink-0" />
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
              <button type="button" onClick={fetchTracking} className="text-amber-700 underline hover:text-amber-600">Muat tracking</button>
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
        {existingDispute && (
          <Link
            href={`/pesanan/${order.id}/komplain/${existingDispute.id}`}
            className="w-full h-10 rounded-xl border border-sky-700/30 text-sky-600 hover:bg-sky-900/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Masuk Ruang Komplain
          </Link>
        )}
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
          <div className="space-y-2">
            <button onClick={() => setShowCompleteConfirm(true)} disabled={actionLoading}
              className="w-full h-11 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" /> Selesaikan Pesanan
            </button>
            {!existingDispute && (
              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                disabled={actionLoading}
                className="w-full h-10 rounded-xl border border-orange-700/30 text-orange-500 hover:bg-orange-900/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> Ajukan Komplain
              </button>
            )}
            <div className="text-[11px] text-muted-foreground px-1 space-y-0.5">
              <p>Jika Anda tidak melakukan aksi dalam 3 hari, transaksi akan otomatis selesai.</p>
              <p>Jika ada komplain, dana ditahan sampai mediasi selesai.</p>
            </div>
          </div>
        )}
        {order.status === "DELIVERED" && (
          <div className="space-y-2">
            <button onClick={() => setShowCompleteConfirm(true)} disabled={actionLoading}
              className="w-full h-11 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" /> Selesaikan Pesanan
            </button>
            {!existingDispute && canDispute ? (
              <button id="komplain" onClick={() => setShowDisputeModal(true)} disabled={actionLoading}
                className="w-full h-10 rounded-xl border border-orange-700/30 text-orange-400 hover:bg-orange-900/10 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> Ajukan Komplain
              </button>
            ) : null}
          </div>
        )}
        {order.status === "COMPLETED" && (
          <div className="space-y-2">
            {(() => {
              const reviewedIds = new Set((order.reviews ?? []).map(r => r.productId));
              const unreviewedItems = order.items.filter(item => item.product && !reviewedIds.has(item.product.id));
              const allReviewed = unreviewedItems.length === 0;
              return allReviewed ? (
                <div className="w-full h-10 rounded-xl border border-green-700/30 text-green-500 text-sm font-medium flex items-center justify-center gap-2 bg-green-900/10">
                  <Star className="w-4 h-4 fill-green-500" /> Ulasan Sudah Diberikan
                </div>
              ) : (
                <button
                  id="ulasan"
                  onClick={() => {
                    const first = unreviewedItems[0];
                    if (first?.product) {
                      setReviewItem({ productId: first.product.id, productName: first.productName });
                      setShowReviewModal(true);
                    }
                  }}
                  className="w-full h-10 rounded-xl border border-amber-700/30 text-amber-600 hover:bg-amber-900/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" /> Beri Ulasan
                  {unreviewedItems.length > 1 && ` (${unreviewedItems.length} produk)`}
                </button>
              );
            })()}
            {!existingDispute && (
              <button id="komplain" onClick={() => setShowDisputeModal(true)} disabled={actionLoading}
                className="w-full h-10 rounded-xl border border-orange-700/30 text-orange-400 hover:bg-orange-900/10 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> Ajukan Komplain
              </button>
            )}
          </div>
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

      {/* Confirm complete modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-foreground mb-2">
              {order.status === "SHIPPED" ? "Konfirmasi Barang Diterima?" : "Selesaikan Pesanan?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {order.status === "SHIPPED"
                ? "Transaksi akan difinalkan sekarang dan dana diteruskan ke penjual. Tindakan ini tidak dapat dibatalkan."
                : "Transaksi akan difinalkan dan dana diteruskan ke penjual."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm">Kembali</button>
              <button onClick={handleConfirmReceived} disabled={actionLoading}
                className="flex-1 h-10 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {order.status === "SHIPPED" ? "Ya, Selesaikan" : "Ya, Selesai"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">Ajukan Komplain</h3>
              <button onClick={closeDisputeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Alasan Komplain <span className="text-red-500">*</span>
                </label>
                <select name="reason" required
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-600">
                  <option value="">-- Pilih alasan --</option>
                  <option value="NOT_AS_DESCRIBED">Tidak sesuai deskripsi</option>
                  <option value="DAMAGED">Rusak/cacat</option>
                  <option value="INCOMPLETE">Tidak lengkap</option>
                  <option value="NOT_RECEIVED">Tidak diterima</option>
                  <option value="WRONG_ITEM">Barang salah</option>
                  <option value="FAKE_PRODUCT">Produk palsu</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Deskripsi Masalah <span className="text-red-500">*</span>
                </label>
                <textarea name="description" required rows={4}
                  placeholder="Jelaskan masalah yang Anda alami dengan detail..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none">
                </textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Solusi yang Diinginkan <span className="text-red-500">*</span>
                </label>
                <select name="requestedAction" required
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-600">
                  <option value="">-- Pilih solusi --</option>
                  <option value="REFUND_FULL">Refund penuh</option>
                  <option value="REFUND_PARTIAL">Refund sebagian</option>
                  <option value="REPLACEMENT">Ganti barang</option>
                  <option value="RETURN_REFUND">Retur + refund</option>
                  <option value="REPAIR">Perbaikan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Foto Bukti (Opsional)
                </label>
                <div className="space-y-3">
                  {disputePreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {disputePreviews.map((preview, idx) => (
                        <div key={`${preview}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeDisputeImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {disputeImages.length < 5 && (
                    <label className="border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground hover:border-amber-600/50 transition-colors cursor-pointer block">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Upload foto produk (maks 5 foto, masing-masing 10MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleDisputeImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-900/10 border border-blue-800/20 text-xs text-blue-300">
                <p className="font-medium mb-1">Proses Komplain:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] opacity-90">
                  <li>Penjual memiliki 2x24 jam untuk merespons</li>
                  <li>Jika tidak sepakat, akan dieskalasi ke admin</li>
                  <li>Admin akan memediasi melalui chat room</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeDisputeModal}
                  className="flex-1 h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm">
                  Batal
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex-1 h-10 rounded-xl bg-orange-700 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Ajukan Komplain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewItem && (
        <SubmitReviewModal
          isOpen={showReviewModal}
          onClose={() => { setShowReviewModal(false); setReviewItem(null); }}
          orderId={orderId}
          productId={reviewItem.productId}
          productName={reviewItem.productName}
          onSuccess={() => {
            setShowReviewModal(false);
            setReviewItem(null);
            fetchOrder();
          }}
        />
      )}
    </div>
  );
}
