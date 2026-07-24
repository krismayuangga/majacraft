"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Loader2, AlertCircle, User, ShieldCheck,
  CheckCircle2, XCircle, Clock, Package,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";
import { useModernDialog } from "@/components/ui/modern-dialog";

type DisputeStatus =
  | "PENDING_SELLER"
  | "SELLER_RESPONDED"
  | "IN_MEDIATION"
  | "REFUND_PENDING"
  | "REFUND_FAILED"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

type Message = {
  id: string;
  message: string;
  senderRole: "BUYER" | "SELLER" | "ADMIN";
  isSystemMsg: boolean;
  createdAt: string;
  sender: { name: string; image?: string };
};

type TimelineEvent = {
  id: string;
  action: string;
  description: string;
  createdAt: string;
};

type DisputeDetail = {
  id: string;
  disputeNumber: string;
  status: DisputeStatus;
  reason: string;
  description: string;
  evidenceUrls: string[];
  requestedAction: string;
  sellerResponse?: string;
  sellerAgreed?: boolean;
  resolution?: string;
  resolutionNotes?: string;
  refundAmount?: number;
  returnCourier?: string;
  returnTrackingNumber?: string;
  returnShippingPayer?: "BUYER" | "SELLER";
  returnShippedAt?: string;
  returnReceivedAt?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    status: "PENDING_PAYMENT" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED";
    items: {
      productName: string;
      price: number;
      qty: number;
      product: { images: { url: string }[] };
    }[];
  };
  buyer: { id: string; name: string; image?: string };
  seller: { id: string; name: string; image?: string };
  assignedAdmin?: { id: string; name: string; image?: string };
  messages: Message[];
  timeline: TimelineEvent[];
};

const STATUS_CONFIG = {
  PENDING_SELLER: {
    label: "Menunggu Penjual",
    color: "text-yellow-900",
    bg: "bg-yellow-100 border-yellow-300",
  },
  SELLER_RESPONDED: {
    label: "Penjual Merespons",
    color: "text-blue-400",
    bg: "bg-blue-900/20 border-blue-800/30",
  },
  IN_MEDIATION: {
    label: "Mediasi Admin",
    color: "text-purple-400",
    bg: "bg-purple-900/20 border-purple-800/30",
  },
  REFUND_PENDING: {
    label: "Refund Diproses",
    color: "text-sky-800",
    bg: "bg-sky-100 border-sky-300",
  },
  REFUND_FAILED: {
    label: "Refund Gagal",
    color: "text-red-800",
    bg: "bg-red-100 border-red-300",
  },
  RESOLVED: {
    label: "Selesai",
    color: "text-green-400",
    bg: "bg-green-900/20 border-green-800/30",
  },
  CLOSED: {
    label: "Ditutup",
    color: "text-gray-400",
    bg: "bg-gray-900/20 border-gray-800/30",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-red-400",
    bg: "bg-red-900/20 border-red-800/30",
  },
};

const REASON_LABELS: Record<string, string> = {
  NOT_AS_DESCRIBED: "Tidak sesuai deskripsi",
  DAMAGED: "Rusak/cacat",
  INCOMPLETE: "Tidak lengkap",
  NOT_RECEIVED: "Tidak diterima",
  WRONG_ITEM: "Barang salah",
  FAKE_PRODUCT: "Produk palsu",
  OTHER: "Lainnya",
};

const ACTION_LABELS: Record<string, string> = {
  REFUND_FULL: "Refund penuh",
  REFUND_PARTIAL: "Refund sebagian",
  REPLACEMENT: "Ganti barang",
  RETURN_REFUND: "Retur + refund",
  REPAIR: "Perbaikan",
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const disputeId = params.disputeId as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [returnActionLoading, setReturnActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [returnCourier, setReturnCourier] = useState("");
  const [returnTrackingNumber, setReturnTrackingNumber] = useState("");
  const [returnShippingPayer, setReturnShippingPayer] = useState<"BUYER" | "SELLER">("BUYER");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<"BUYER" | "SELLER" | "ADMIN" | "">("");
  const dialog = useModernDialog();

  const fetchDispute = useCallback(async () => {
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        router.replace(`/pesanan/${orderId}`);
        return;
      }
      const data = await res.json();
      setDispute(data.data);
    } finally {
      setLoading(false);
    }
  }, [disputeId, orderId, router]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data?.id) {
        setCurrentUserId(data.data.id as string);
        setCurrentUserRole((data.data.role as "BUYER" | "SELLER" | "ADMIN") ?? "");
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute?.messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: message.trim() }),
      });

      if (res.ok) {
        setMessage("");
        fetchDispute(); // Refresh messages
      } else {
        const data = await res.json();
        await dialog.alert(data.error ?? "Gagal mengirim pesan");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleEscalate() {
    if (!(await dialog.confirm("Eskalasi komplain ke admin untuk mediasi?"))) return;

    try {
      const res = await fetch(`/api/disputes/${disputeId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Tidak sepakat dengan penjual" }),
      });

      if (res.ok) {
        fetchDispute();
      } else {
        const data = await res.json();
        await dialog.alert(data.error ?? "Gagal eskalasi");
      }
    } catch {
      await dialog.alert("Terjadi kesalahan");
    }
  }

  async function handleCompleteOrder() {
    if (!(await dialog.confirm("Selesaikan pesanan sekarang? Tindakan ini akan melanjutkan pelepasan dana ke penjual."))) return;

    setSettlementLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        await dialog.alert(data.error ?? "Gagal menyelesaikan pesanan");
        return;
      }
      await fetchDispute();
      await dialog.alert("Pesanan berhasil diselesaikan.");
    } catch {
      await dialog.alert("Terjadi kesalahan saat menyelesaikan pesanan");
    } finally {
      setSettlementLoading(false);
    }
  }

  async function handleAdminRefund() {
    if (!(await dialog.confirm("Proses refund untuk pesanan ini sekarang?"))) return;

    const defaultAmount = String(dispute?.order.total ?? 0);
    const amountInput = await dialog.prompt({
      title: "Nominal Refund",
      message: "Masukkan nominal refund (angka, tanpa titik). Kosongkan untuk refund penuh:",
      defaultValue: defaultAmount,
      placeholder: "contoh: 500000",
    });

    if (amountInput === null) return;

    const normalized = amountInput.trim().replace(/\D/g, "");
    const refundAmount = normalized ? Number(normalized) : undefined;

    const resolutionNotes =
      (await dialog.prompt({
        title: "Catatan Mediasi",
        message: "Catatan keputusan refund (opsional):",
        defaultValue: "Kesepakatan di ruang mediasi",
        placeholder: "Tulis catatan mediasi...",
      })) ?? "";

    setSettlementLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          resolution: "REFUND_APPROVED",
          refundAmount,
          resolutionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        await dialog.alert(data.error ?? "Gagal memproses refund");
        return;
      }

      await fetchDispute();
      if (data?.data?.refundMode === "manual") {
        await dialog.alert(data?.data?.message ?? "Refund disetujui dan masuk antrean proses manual.");
      } else {
        await dialog.alert("Refund berhasil diajukan ke gateway. Komplain tetap terbuka sampai refund terkonfirmasi.");
      }
    } catch {
      await dialog.alert("Terjadi kesalahan saat memproses refund");
    } finally {
      setSettlementLoading(false);
    }
  }

  async function handleConfirmManualTransfer() {
    if (!(await dialog.confirm(`Konfirmasi bahwa transfer refund manual sebesar ${formatRupiah(dispute?.refundAmount ?? dispute?.order.total ?? 0)} sudah dilakukan ke pembeli?\n\nTindakan ini tidak dapat dibatalkan.`))) return;

    setSettlementLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/confirm-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminNote: "Transfer manual dikonfirmasi via halaman dispute" }),
      });
      const data = await res.json();
      if (!res.ok) {
        await dialog.alert(data.error ?? "Gagal mengkonfirmasi transfer");
        return;
      }
      await fetchDispute();
      await dialog.alert("✅ Transfer dikonfirmasi. Dispute selesai.");
    } catch {
      await dialog.alert("Terjadi kesalahan saat konfirmasi transfer");
    } finally {
      setSettlementLoading(false);
    }
  }

  async function handleSubmitReturnTracking() {
    if (!returnCourier.trim() || !returnTrackingNumber.trim()) {
      await dialog.alert("Kurir dan nomor resi wajib diisi.");
      return;
    }

    setReturnActionLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "submit_return_tracking",
          courier: returnCourier.trim(),
          trackingNumber: returnTrackingNumber.trim(),
          shippingPayer: returnShippingPayer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await dialog.alert(data.error ?? "Gagal mengirim data retur");
        return;
      }
      await fetchDispute();
      setReturnCourier("");
      setReturnTrackingNumber("");
      await dialog.alert("Data retur berhasil dikirim.");
    } catch {
      await dialog.alert("Terjadi kesalahan saat mengirim data retur");
    } finally {
      setReturnActionLoading(false);
    }
  }

  async function handleConfirmReturnReceived() {
    if (!(await dialog.confirm("Konfirmasi bahwa barang retur sudah diterima penjual?"))) return;

    setReturnActionLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "confirm_return_received" }),
      });
      const data = await res.json();
      if (!res.ok) {
        await dialog.alert(data.error ?? "Gagal konfirmasi penerimaan retur");
        return;
      }
      await fetchDispute();
      await dialog.alert("Penerimaan barang retur berhasil dikonfirmasi.");
    } catch {
      await dialog.alert("Terjadi kesalahan saat konfirmasi penerimaan retur");
    } finally {
      setReturnActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!dispute) return null;

  const cfg = STATUS_CONFIG[dispute.status];
  const isBuyer = currentUserId === dispute.buyer.id;
  const isSeller = currentUserId === dispute.seller.id;
  const isAdminUser = currentUserRole === "ADMIN";
  const canEscalate =
    dispute.status === "SELLER_RESPONDED" &&
    !dispute.sellerAgreed &&
    (isBuyer || isSeller);
  const needsReturnBeforeRefund =
    dispute.requestedAction === "RETURN_REFUND" ||
    dispute.reason !== "NOT_RECEIVED";
  const hasReturnTracking = Boolean(dispute.returnTrackingNumber);
  const hasReturnReceived = Boolean(dispute.returnReceivedAt);
  const canBuyerSubmitReturnTracking =
    isBuyer &&
    needsReturnBeforeRefund &&
    !hasReturnTracking &&
    !["CLOSED", "CANCELLED"].includes(dispute.status) &&
    dispute.order.status !== "REFUNDED";
  const canSellerConfirmReturnReceived =
    (isSeller || isAdminUser) &&
    needsReturnBeforeRefund &&
    hasReturnTracking &&
    !hasReturnReceived &&
    dispute.order.status !== "REFUNDED";
  const canBuyerComplete =
    isBuyer &&
    ["SHIPPED", "DELIVERED"].includes(dispute.order.status) &&
    !["RESOLVED", "CLOSED", "CANCELLED"].includes(dispute.status);
  const canAdminRefund =
    isAdminUser &&
    dispute.order.status !== "REFUNDED" &&
    (!needsReturnBeforeRefund || hasReturnReceived) &&
    ["PENDING_SELLER", "SELLER_RESPONDED", "IN_MEDIATION", "REFUND_FAILED", "RESOLVED"].includes(dispute.status);
  const canAdminConfirmManualTransfer =
    isAdminUser &&
    dispute.status === "REFUND_PENDING" &&
    dispute.resolution === "REFUND_APPROVED" &&
    dispute.order.status !== "REFUNDED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/pesanan/${orderId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Komplain</h1>
          <p className="text-xs font-mono text-amber-600">
            {dispute.disputeNumber}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Left: Info & Timeline */}
        <div className="md:col-span-1 space-y-4">
          {/* Dispute Info */}
          <div className="p-4 rounded-2xl border border-border bg-card">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              Info Komplain
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Alasan:</span>
                <p className="font-medium text-foreground mt-0.5">
                  {REASON_LABELS[dispute.reason] || dispute.reason}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Solusi diminta:</span>
                <p className="font-medium text-foreground mt-0.5">
                  {ACTION_LABELS[dispute.requestedAction] || dispute.requestedAction}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Deskripsi:</span>
                <p className="text-foreground mt-0.5 leading-relaxed">
                  {dispute.description}
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="p-4 rounded-2xl border border-border bg-card">
            <h3 className="font-semibold text-sm text-foreground mb-3">
              Pihak Terlibat
            </h3>
            <div className="space-y-2">
              {[
                { label: "Pembeli", user: dispute.buyer, icon: User },
                { label: "Penjual", user: dispute.seller, icon: Package },
                dispute.assignedAdmin && {
                  label: "Mediator",
                  user: dispute.assignedAdmin,
                  icon: ShieldCheck,
                },
              ]
                .filter(Boolean)
                .map((item: any) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {item.label}:
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {item.user.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4 rounded-2xl border border-border bg-card">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Timeline
            </h3>
            <div className="space-y-3">
              {dispute.timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        idx === dispute.timeline.length - 1
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {idx < dispute.timeline.length - 1 && (
                      <div className="w-px h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-xs text-foreground">
                      {event.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(event.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-border bg-card flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Chat Mediasi</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Diskusikan penyelesaian komplain di sini
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {dispute.messages.map((msg) => {
                const isOwn =
                  (msg.senderRole === "BUYER" && isBuyer) ||
                  (msg.senderRole === "SELLER" && isSeller);
                const isSystem = msg.isSystemMsg;
                const isAdmin = msg.senderRole === "ADMIN";

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="flex justify-center text-center"
                    >
                      <div className="px-4 py-2 rounded-full bg-sky-100 border border-sky-300 text-xs text-sky-900 max-w-md font-medium">
                        {msg.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwn
                          ? "bg-amber-700 text-amber-50"
                          : isAdmin
                          ? "bg-violet-100 border border-violet-300 text-violet-950"
                          : "bg-stone-100 border border-stone-300 text-stone-900"
                      } rounded-2xl px-4 py-2.5`}
                    >
                      {!isOwn && (
                        <p className="text-[10px] font-semibold mb-1 text-black/70">
                          {msg.sender.name}{" "}
                          {isAdmin && "• Mediator"}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <p className="text-[10px] mt-1 text-black/55">
                        {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions */}
            {needsReturnBeforeRefund && (
              <div className="px-4 py-3 border-t border-border bg-sky-50/70 space-y-2">
                <p className="text-[11px] text-sky-900 font-medium">
                  Alur retur: buyer kirim barang + input resi, seller konfirmasi terima, lalu admin memproses refund.
                </p>

                {hasReturnTracking ? (
                  <div className="text-xs text-sky-950 bg-white/80 border border-sky-200 rounded-xl p-3 space-y-1">
                    <p>
                      Resi retur: <span className="font-semibold">{dispute.returnCourier} / {dispute.returnTrackingNumber}</span>
                    </p>
                    <p>
                      Ongkir retur: <span className="font-semibold">{dispute.returnShippingPayer === "SELLER" ? "Ditanggung Penjual" : "Ditanggung Pembeli"}</span>
                    </p>
                    {dispute.returnShippedAt && (
                      <p>
                        Dikirim: <span className="font-semibold">{new Date(dispute.returnShippedAt).toLocaleString("id-ID")}</span>
                      </p>
                    )}
                    {dispute.returnTrackingNumber && (
                      <p className="pt-1">
                        Cek kiriman retur: <a href={`https://cekresi.com/?noresi=${encodeURIComponent(dispute.returnTrackingNumber)}`} target="_blank" rel="noreferrer" className="text-sky-700 underline">Lihat status pengiriman</a>
                      </p>
                    )}
                    {dispute.returnReceivedAt && (
                      <p>
                        Diterima seller: <span className="font-semibold">{new Date(dispute.returnReceivedAt).toLocaleString("id-ID")}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-sky-800">Belum ada data resi retur dari pembeli.</p>
                )}

                {canBuyerSubmitReturnTracking && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={returnCourier}
                      onChange={(e) => setReturnCourier(e.target.value)}
                      placeholder="Kurir retur (JNE/J&T/Sicepat)"
                      className="h-9 px-3 rounded-xl border border-sky-300 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <input
                      value={returnTrackingNumber}
                      onChange={(e) => setReturnTrackingNumber(e.target.value.toUpperCase())}
                      placeholder="Nomor resi"
                      className="h-9 px-3 rounded-xl border border-sky-300 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <select
                      value={returnShippingPayer}
                      onChange={(e) => setReturnShippingPayer(e.target.value as "BUYER" | "SELLER")}
                      className="h-9 px-3 rounded-xl border border-sky-300 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="BUYER">Ongkir Ditanggung Pembeli</option>
                      <option value="SELLER">Ongkir Ditanggung Penjual</option>
                    </select>
                    <button
                      onClick={handleSubmitReturnTracking}
                      disabled={returnActionLoading}
                      className="sm:col-span-3 h-9 px-3 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {returnActionLoading ? "Mengirim..." : "Kirim Data Resi Retur"}
                    </button>
                  </div>
                )}

                {canSellerConfirmReturnReceived && (
                  <button
                    onClick={handleConfirmReturnReceived}
                    disabled={returnActionLoading}
                    className="h-9 px-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {returnActionLoading ? "Memproses..." : "Konfirmasi Barang Retur Diterima"}
                  </button>
                )}

                {isAdminUser && needsReturnBeforeRefund && !hasReturnReceived && (
                  <p className="text-[11px] text-sky-800">
                    Tombol refund admin akan aktif setelah seller mengonfirmasi barang retur diterima.
                  </p>
                )}
              </div>
            )}

            {(canBuyerComplete || canAdminRefund) && (
              <div className="px-4 py-2 border-t border-border bg-amber-50/50 space-y-2">
                <p className="text-[11px] text-amber-800">
                  Keputusan akhir mediasi: buyer bisa menyelesaikan pesanan jika deal lanjut, atau admin mengeksekusi refund jika deal pengembalian dana.
                </p>
                <div className="flex flex-wrap gap-2">
                  {canBuyerComplete && (
                    <button
                      onClick={handleCompleteOrder}
                      disabled={settlementLoading}
                      className="h-9 px-3 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {settlementLoading ? "Memproses..." : "Selesaikan Pesanan"}
                    </button>
                  )}
                  {canAdminRefund && (
                    <button
                      onClick={handleAdminRefund}
                      disabled={settlementLoading}
                      className="h-9 px-3 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {settlementLoading ? "Memproses..." : "Proses Refund"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {canAdminConfirmManualTransfer && (
              <div className="px-4 py-3 border-t border-border bg-green-50/60 space-y-1.5">
                <p className="text-[11px] text-green-800 font-medium">
                  Refund disetujui. Setelah transfer manual ke pembeli selesai, klik tombol di bawah.
                </p>
                <p className="text-[11px] text-green-700">
                  Nominal: <span className="font-bold">{formatRupiah(dispute.refundAmount ?? dispute.order.total)}</span>
                  {" · "}Pembeli: <span className="font-bold">{dispute.buyer.name}</span>
                </p>
                <button
                  onClick={handleConfirmManualTransfer}
                  disabled={settlementLoading}
                  className="h-9 px-4 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {settlementLoading ? "Memproses..." : "✓ Konfirmasi Transfer Manual Selesai"}
                </button>
              </div>
            )}

            {canEscalate && (
              <div className="px-4 py-2 bg-orange-900/10 border-t border-orange-800/30">
                <button
                  onClick={handleEscalate}
                  className="w-full h-9 rounded-xl bg-orange-700 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                >
                  Eskalasi ke Admin
                </button>
              </div>
            )}

            {/* Input */}
            {dispute.status !== "RESOLVED" &&
              dispute.status !== "CLOSED" &&
              dispute.status !== "CANCELLED" && (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-border flex gap-2"
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    disabled={sending}
                    className="flex-1 h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="h-10 w-10 rounded-xl bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
