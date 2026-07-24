"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bell, ShoppingBag, MessageCircle, Package,
  CheckCircle, XCircle, Megaphone, Loader2, RefreshCw,
  AlertCircle, ChevronRight, ShieldCheck,
} from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
};

const ICON_MAP: Record<string, React.ElementType> = {
  product_published:        Package,
  product_curated:          CheckCircle,
  product_moderated:        CheckCircle,
  product_rejected:         XCircle,
  new_order:                ShoppingBag,
  order_status:             ShoppingBag,
  new_chat:                 MessageCircle,
  dispute_created:          AlertCircle,
  dispute_seller_responded: AlertCircle,
  dispute_escalated:        ShieldCheck,
  dispute_admin_assigned:   ShieldCheck,
  dispute_resolved:         CheckCircle,
  dispute_cancelled:        XCircle,
  system:                   Megaphone,
};

const COLOR_MAP: Record<string, string> = {
  product_published:        "text-blue-400 bg-blue-900/20",
  product_curated:          "text-green-400 bg-green-900/20",
  product_moderated:        "text-green-400 bg-green-900/20",
  product_rejected:         "text-red-400 bg-red-900/20",
  new_order:                "text-amber-400 bg-amber-900/20",
  order_status:             "text-amber-400 bg-amber-900/20",
  new_chat:                 "text-purple-400 bg-purple-900/20",
  dispute_created:          "text-orange-400 bg-orange-900/20",
  dispute_seller_responded: "text-orange-400 bg-orange-900/20",
  dispute_escalated:        "text-violet-400 bg-violet-900/20",
  dispute_admin_assigned:   "text-violet-400 bg-violet-900/20",
  dispute_resolved:         "text-green-400 bg-green-900/20",
  dispute_cancelled:        "text-red-400 bg-red-900/20",
  system:                   "text-sky-400 bg-sky-900/20",
};

function getNotifUrl(type: string, data?: Record<string, unknown>): string | null {
  const orderId   = data?.orderId   as string | undefined;
  const disputeId = data?.disputeId as string | undefined;
  const slug      = data?.productSlug as string | undefined;
  const certId    = data?.certificateId as string | undefined;

  switch (type) {
    case "new_order":
      return "/studio";
    case "order_status":
      return orderId ? `/pesanan/${orderId}` : "/pesanan";
    case "dispute_created":
    case "dispute_seller_responded":
    case "dispute_escalated":
    case "dispute_admin_assigned":
    case "dispute_resolved":
    case "dispute_cancelled":
      if (orderId && disputeId) return `/pesanan/${orderId}/komplain/${disputeId}`;
      if (orderId) return `/pesanan/${orderId}`;
      return "/pesanan";
    case "product_published":
    case "product_curated":
    case "product_moderated":
      return slug ? `/produk/${slug}` : "/studio";
    case "product_rejected":
      return "/studio";
    case "new_chat":
      return "/chat";
    case "system":
      if (certId) return `/verifikasi/${certId}`;
      return "/studio";
    default:
      return null;
  }
}

function getLinkLabel(type: string): string {
  if (type.startsWith("dispute_")) return "Buka Mediasi \u2192";
  if (type === "new_order") return "Lihat di Studio \u2192";
  if (type === "order_status") return "Detail Pesanan \u2192";
  if (type === "new_chat") return "Buka Chat \u2192";
  if (type === "product_rejected") return "Perbaiki Karya \u2192";
  if (type.startsWith("product_")) return "Lihat Karya \u2192";
  return "Selengkapnya \u2192";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50", { credentials: "include" });
      const data = await res.json();
      setNotifications(data.data?.notifications ?? []);
      setUnreadCount(data.data?.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", credentials: "include" });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await fetch(`/api/notifications/${notif.id}`, { method: "PATCH", credentials: "include" });
      setNotifications(n => n.map(x => x.id === notif.id ? { ...x, isRead: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    const url = getNotifUrl(notif.type, notif.data);
    if (url) router.push(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/akun" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifikasi</h1>
            {unreadCount > 0 && <p className="text-xs text-amber-600">{unreadCount} belum dibaca</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchNotifications} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-amber-600 hover:text-amber-500 px-3 py-1.5 border border-amber-700/30 rounded-lg transition-colors"
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-14 h-14 text-amber-800/30 mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-1">Belum ada notifikasi</p>
          <p className="text-muted-foreground text-sm">
            Notifikasi pesanan, karya, dan pesan akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const Icon = ICON_MAP[notif.type] ?? Bell;
            const colors = COLOR_MAP[notif.type] ?? "text-gray-400 bg-gray-900/20";
            const [iconColor, bgColor] = colors.split(" ");
            const targetUrl = getNotifUrl(notif.type, notif.data);

            return (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`flex gap-3 p-4 rounded-xl border transition-all select-none ${
                  notif.isRead
                    ? "bg-card border-border opacity-70"
                    : "bg-amber-900/5 border-amber-700/20 hover:border-amber-600/30"
                } ${targetUrl ? "cursor-pointer hover:shadow-sm active:scale-[0.99]" : "cursor-default"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-tight ${notif.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                      {targetUrl && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground/60">{timeAgo(notif.createdAt)}</span>
                    {targetUrl && (
                      <span className={`text-[10px] font-medium ${notif.isRead ? "text-muted-foreground/50" : "text-amber-600"}`}>
                        {getLinkLabel(notif.type)}
                      </span>
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
