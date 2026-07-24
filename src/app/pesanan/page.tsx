"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package, Truck, CheckCircle2, XCircle, Clock,
  ChevronRight, Star, MessageCircle, Search, Loader2, RefreshCw, AlertCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";
import { useModernDialog } from "@/components/ui/modern-dialog";

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: "Belum Dibayar",      color: "text-yellow-500", bg: "bg-yellow-900/20 border-yellow-800/30",  icon: Clock        },
  PROCESSING:      { label: "Diproses Seniman",   color: "text-blue-400",   bg: "bg-blue-900/20 border-blue-800/30",      icon: Package      },
  SHIPPED:         { label: "Dalam Pengiriman",   color: "text-amber-700", bg: "bg-amber-900/10 border-amber-700/30",    icon: Truck        },
  DELIVERED:       { label: "Diterima",           color: "text-teal-400",   bg: "bg-teal-900/20 border-teal-800/30",      icon: CheckCircle2 },
  COMPLETED:       { label: "Selesai",            color: "text-green-400",  bg: "bg-green-900/20 border-green-800/30",    icon: CheckCircle2 },
  CANCELLED:       { label: "Dibatalkan",         color: "text-red-400",    bg: "bg-red-900/20 border-red-800/30",        icon: XCircle      },
  REFUNDED:        { label: "Direfund",           color: "text-red-400",    bg: "bg-red-900/20 border-red-800/30",        icon: XCircle      },
} as const;

type OrderStatus = keyof typeof STATUS_CONFIG;

type OrderItem = {
  id: string; qty: number; price: number; productName: string;
  product: { id: string; name: string; images: { url: string }[] } | null;
};

type Order = {
  id: string; orderNumber: string; status: OrderStatus; createdAt: string;
  total: number; courierName?: string; courierService?: string;
  trackingNumber?: string; estimatedArrival?: string;
  paymentDeadline?: string | null;
  disputes?: { id: string; status: string; disputeNumber: string; createdAt: string }[];
  items: OrderItem[];
};

const TABS: { key: OrderStatus | "semua"; label: string }[] = [
  { key: "semua",           label: "Semua"        },
  { key: "PENDING_PAYMENT", label: "Belum Bayar"  },
  { key: "PROCESSING",      label: "Diproses"     },
  { key: "SHIPPED",         label: "Dikirim"      },
  { key: "DELIVERED",       label: "Diterima"     },
  { key: "COMPLETED",       label: "Selesai"      },
  { key: "CANCELLED",       label: "Dibatalkan"   },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "semua">("semua");
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const dialog = useModernDialog();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { credentials: "include" });
      const data = await res.json();
      setOrders(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function resumePayment(orderId: string) {
    setPayingId(orderId);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        await dialog.alert(data.error ?? "Gagal membuat pembayaran. Silakan coba lagi.");
      }
    } finally {
      setPayingId(null);
    }
  }

  function CountdownTimer({ deadline }: { deadline: string }) {
    const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
    useEffect(() => {
      if (remaining <= 0) return;
      const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
      return () => clearInterval(t);
    }, [remaining]);
    if (remaining <= 0) return <span className="text-red-400 text-xs font-medium">Waktu habis</span>;
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    return <span className="text-yellow-400 text-xs font-mono font-bold">{m}:{s}</span>;
  }

  const filtered = orders.filter((o) => {
    const matchTab = activeTab === "semua" || o.status === activeTab;
    const matchSearch = !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => (i.product?.name ?? i.productName).toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Pesanan Saya</h1>
        <button onClick={fetchOrders} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" placeholder="Cari nama produk atau no. pesanan..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-gold pb-1 mb-4">
        {TABS.map((tab) => {
          const count = tab.key === "semua"
            ? orders.length
            : orders.filter((o) => o.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-amber-600 text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-amber-700/40"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-muted"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-amber-800 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan ditemukan"}
          </p>
          {orders.length === 0 && (
            <Link href="/produk" className="inline-block mt-4 text-sm text-amber-600 hover:text-amber-500">
              Mulai Berbelanja →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.CANCELLED;
            const StatusIcon = cfg.icon;
            const existingDispute = order.disputes?.find((d) => d.status !== "CANCELLED");
            return (
              <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-amber-600 truncate">{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">· {formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ml-2 ${cfg.color} ${cfg.bg}`}>
                    <StatusIcon className="w-3 h-3" />{cfg.label}
                  </span>
                </div>

                {/* Items */}
                {order.items.map((item) => {
                  const imgUrl = item.product?.images?.[0]?.url ?? "";
                  const name = item.product?.name ?? item.productName;
                  return (
                    <div key={item.id} className="p-4 flex gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        {imgUrl ? (
                          <Image src={imgUrl} alt={name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">x{item.qty}</span>
                          <span className="text-sm font-bold text-amber-700">{formatRupiah(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Tracking */}
                {order.status === "SHIPPED" && order.trackingNumber && (
                  <div className="mx-4 mb-3 p-3 rounded-lg bg-amber-900/10 border border-amber-700/20 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-amber-700">{order.courierName} {order.courierService} · {order.trackingNumber}</span>
                    </div>
                    {order.estimatedArrival && (
                      <span className="text-amber-700 flex-shrink-0">Est. {order.estimatedArrival}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Total: </span>
                    <span className="font-bold text-amber-700 text-sm">{formatRupiah(order.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {existingDispute && (
                      <Link href={`/pesanan/${order.id}/komplain/${existingDispute.id}`}
                        className="text-xs h-8 px-3 rounded-lg border border-sky-700/30 text-sky-600 hover:bg-sky-900/10 font-medium inline-flex items-center gap-1 transition-colors">
                        <MessageCircle className="w-3 h-3" /> Masuk Ruang Komplain
                      </Link>
                    )}
                    {order.status === "PENDING_PAYMENT" && (
                      <div className="flex items-center gap-2">
                        {order.paymentDeadline && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <CountdownTimer deadline={order.paymentDeadline} />
                          </div>
                        )}
                        <button
                          onClick={() => resumePayment(order.id)}
                          disabled={payingId === order.id}
                          className="text-xs h-8 px-3 rounded-lg btn-gold font-semibold inline-flex items-center gap-1 disabled:opacity-50">
                          {payingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Bayar Sekarang
                        </button>
                        <button
                          onClick={async () => {
                            if (!(await dialog.confirm("Batalkan pesanan ini? Stok akan dikembalikan ke penjual."))) return;
                            await fetch(`/api/orders/${order.id}/cancel`, { method: "POST", credentials: "include" });
                            fetchOrders();
                          }}
                          className="text-xs h-8 px-2 rounded-lg border border-red-700/30 text-red-400 hover:bg-red-900/10 transition-colors">
                          Batalkan
                        </button>
                      </div>
                    )}
                    {order.status === "SHIPPED" && (
                      <>
                        <button
                          onClick={async () => {
                            await fetch(`/api/orders/${order.id}/confirm`, { method: "POST", credentials: "include" });
                            fetchOrders();
                          }}
                          className="text-xs h-8 px-3 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold inline-flex items-center gap-1 transition-colors">
                          <CheckCircle2 className="w-3 h-3" /> Selesaikan Pesanan
                        </button>
                        {!existingDispute && (
                          <Link href={`/pesanan/${order.id}#komplain`}
                            className="text-xs h-8 px-3 rounded-lg border border-orange-700/30 text-orange-500 hover:bg-orange-900/10 font-medium inline-flex items-center gap-1 transition-colors">
                            <AlertCircle className="w-3 h-3" /> Ajukan Komplain
                          </Link>
                        )}
                      </>
                    )}
                    {order.status === "DELIVERED" && (
                      <>
                        <button
                          onClick={async () => {
                            await fetch(`/api/orders/${order.id}/confirm`, { method: "POST", credentials: "include" });
                            fetchOrders();
                          }}
                          className="text-xs h-8 px-3 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold inline-flex items-center gap-1 transition-colors">
                          <CheckCircle2 className="w-3 h-3" /> Selesaikan Pesanan
                        </button>
                        {!existingDispute && (
                          <Link href={`/pesanan/${order.id}#komplain`}
                            className="text-xs h-8 px-3 rounded-lg border border-orange-700/30 text-orange-500 hover:bg-orange-900/10 font-medium inline-flex items-center gap-1 transition-colors">
                            <AlertCircle className="w-3 h-3" /> Ajukan Komplain
                          </Link>
                        )}
                      </>
                    )}
                    {order.status === "COMPLETED" && (
                      <>
                        <Link href={`/pesanan/${order.id}#ulasan`}
                          className="text-xs h-8 px-3 rounded-lg border border-amber-700/30 text-amber-600 hover:bg-amber-900/10 font-medium inline-flex items-center gap-1 transition-colors">
                          <Star className="w-3 h-3" /> Beri Ulasan
                        </Link>
                        {!existingDispute && (
                          <Link href={`/pesanan/${order.id}#komplain`}
                            className="text-xs h-8 px-3 rounded-lg border border-orange-700/30 text-orange-500 hover:bg-orange-900/10 font-medium inline-flex items-center gap-1 transition-colors">
                            <AlertCircle className="w-3 h-3" /> Ajukan Komplain
                          </Link>
                        )}
                      </>
                    )}
                    <Link href={`/chat?order=${order.id}`}
                      className="text-xs h-8 px-3 rounded-lg border border-border text-muted-foreground hover:border-amber-700/40 hover:text-amber-600 inline-flex items-center gap-1 transition-colors">
                      <MessageCircle className="w-3 h-3" /> Chat
                    </Link>
                    <Link href={`/pesanan/${order.id}`}
                      className="h-8 px-3 rounded-lg border border-border inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:border-amber-700/40 hover:text-amber-600 transition-colors">
                      Detail <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
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
