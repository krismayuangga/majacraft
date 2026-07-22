"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, ShoppingBag, MessageCircle, Package, CheckCircle, XCircle, Megaphone, Loader2, RefreshCw } from "lucide-react";

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
  product_published: Package,
  product_curated: CheckCircle,
  product_rejected: XCircle,
  new_order: ShoppingBag,
  order_status: ShoppingBag,
  new_chat: MessageCircle,
  system: Megaphone,
};

const COLOR_MAP: Record<string, string> = {
  product_published: "text-blue-400 bg-blue-900/20",
  product_curated: "text-green-400 bg-green-900/20",
  product_rejected: "text-red-400 bg-red-900/20",
  new_order: "text-amber-400 bg-amber-900/20",
  order_status: "text-amber-400 bg-amber-900/20",
  new_chat: "text-purple-400 bg-purple-900/20",
  system: "text-gray-400 bg-gray-900/20",
};

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

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", credentials: "include" });
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/akun" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
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
            <button onClick={markAllRead} className="text-xs text-amber-600 hover:text-amber-500 px-3 py-1.5 border border-amber-700/30 rounded-lg transition-colors">
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-14 h-14 text-amber-800/30 mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-1">Belum ada notifikasi</p>
          <p className="text-muted-foreground text-sm">Notifikasi pesanan, karya, dan pesan akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const Icon = ICON_MAP[notif.type] ?? Bell;
            const colors = COLOR_MAP[notif.type] ?? "text-gray-400 bg-gray-900/20";
            const [iconColor, bgColor] = colors.split(" ");
            const productSlug = notif.data?.productSlug as string | undefined;
            return (
              <div
                key={notif.id}
                onClick={() => { if (!notif.isRead) markRead(notif.id); }}
                className={`flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${notif.isRead ? "bg-card border-border opacity-70" : "bg-amber-900/5 border-amber-700/20 hover:border-amber-600/30"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground/60">{timeAgo(notif.createdAt)}</span>
                    {productSlug && (
                      <Link href={`/produk/${productSlug}`} onClick={e => e.stopPropagation()}
                        className="text-[10px] text-amber-600 hover:text-amber-500">
                        Lihat Produk →
                      </Link>
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
