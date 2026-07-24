"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3, Settings,
  Plus, TrendingUp, Eye, Edit, Trash2, Upload, X, Star,
  DollarSign, FileCheck, Truck, CheckCircle2, Clock, ChevronRight,
  Loader2, AlertCircle, Building2, CreditCard,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";
import AddressForm, { type AddressValue } from "@/components/AddressForm";
import { useModernDialog } from "@/components/ui/modern-dialog";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
type Store = { id: string; name: string; description?: string; province: string; city?: string; district?: string; village?: string; address?: string; postalCode?: string; phone?: string; bankName?: string; bankAccount?: string; bankHolder?: string; logoUrl?: string; bannerUrl?: string; isVerified: boolean; rating: number; totalSold: number };
type Product = { id: string; name: string; slug: string; price: number; originalPrice?: number | null; stock: number; soldCount: number; viewCount: number; isActive: boolean; hasCertificate: boolean; isFeatured: boolean; isFlashSale: boolean; isSoldOffline: boolean; images: { url: string; isPrimary: boolean }[]; category: { id: string; name: string; slug: string } | null; weight?: number | null; length?: number | null; width?: number | null; height?: number | null; origin?: string | null; description?: string; material?: string | null; tags?: string[]; kondisi?: string | null; };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  trackingNumber?: string;
  courierName?: string;
  courierService?: string;
  disputes?: {
    id: string;
    disputeNumber: string;
    status: string;
    createdAt: string;
  }[];
  items: {
    productName: string;
    qty: number;
    price: number;
    product: { images: { url: string }[] };
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700 border-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-300",
  SHIPPED: "bg-purple-100 text-purple-700 border-purple-300",
  DELIVERED: "bg-green-100 text-green-700 border-green-300",
  COMPLETED: "bg-green-100 text-green-700 border-green-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Bayar", PROCESSING: "Diproses", SHIPPED: "Dikirim",
  DELIVERED: "Diterima", COMPLETED: "Selesai", CANCELLED: "Dibatalkan",
};

const BANKS: string[] = []; // diganti oleh BankSelect component
const MENU = [
  { id: "ringkasan", label: "Ringkasan", icon: LayoutDashboard },
  { id: "karya", label: "Karya Saya", icon: Package },
  { id: "pesanan", label: "Pesanan", icon: ShoppingBag },
  { id: "statistik", label: "Statistik", icon: BarChart3 },
  { id: "saldo", label: "Saldo & Pencairan", icon: DollarSign },
  { id: "pengaturan", label: "Pengaturan Toko", icon: Settings },
];

const EMPTY_PRODUCT = {
  name: "", categoryId: "", description: "", price: "", originalPrice: "",
  stock: "1", material: "", panjang: "", lebar: "", tinggi: "", weightKg: "", origin: "",
  kondisi: "Baru", tags: "", imageUrls: [] as string[],
};

function OtpBankVerify({ storeForm, onSaved }: { storeForm: {bankName?:string;bankAccount?:string;bankHolder?:string}; onSaved: () => void }) {
  const [step, setStep] = useState<"idle"|"sent"|"done">("idle");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true); setMsg("");
    const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "bank_change" }) });
    const d = await res.json();
    if (res.ok) { setStep("sent"); setMsg(d.data?.message ?? "Kode OTP terkirim"); }
    else setMsg(d.error ?? "Gagal kirim OTP");
    setLoading(false);
  };

  const verify = async () => {
    if (!otp || otp.length !== 6) { setMsg("Masukkan 6 digit OTP"); return; }
    setLoading(true); setMsg("");
    // Update rekening via API store
    const res = await fetch("/api/studio/store", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ bankName: storeForm.bankName, bankAccount: storeForm.bankAccount, bankHolder: storeForm.bankHolder, otp, otpType: "bank_change" }),
    });
    const d = await res.json();
    if (res.ok) { setStep("done"); setMsg("✓ Rekening bank berhasil diperbarui"); onSaved(); }
    else setMsg(d.error ?? "Verifikasi gagal");
    setLoading(false);
  };

  if (step === "done") return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-900/10 border border-green-800/20">
      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      <p className="text-sm text-green-400 font-medium">Rekening bank berhasil diperbarui</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {step === "idle" ? (
        <button type="button" onClick={sendOtp} disabled={loading || !storeForm.bankName || !storeForm.bankAccount || !storeForm.bankHolder}
          className="w-full h-11 px-4 rounded-xl btn-gold font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Simpan Rekening & Verifikasi OTP
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-900/10 border border-blue-800/20 text-xs text-blue-400">
            📬 Kode OTP terkirim ke email Anda. Masukkan kode 6 digit di bawah ini. Berlaku 10 menit.
          </div>
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" maxLength={6} placeholder="Masukkan 6 digit OTP"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="flex-1 h-11 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-amber-500 tracking-[0.4em] text-center font-mono" />
            <button type="button" onClick={verify} disabled={loading || otp.length !== 6}
              className="h-11 px-5 rounded-lg btn-gold text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Verifikasi
            </button>
          </div>
          <button type="button" onClick={sendOtp} disabled={loading} className="text-xs text-muted-foreground hover:text-amber-500 transition-colors">
            Belum menerima? Kirim ulang OTP
          </button>
        </div>
      )}
      {msg && <p className={`text-xs ${msg.startsWith("✓") ? "text-green-500" : "text-red-400"}`}>{msg}</p>}
    </div>
  );
}

function BankSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [banks, setBanks] = useState<{code:string;name:string}[]>([]);
  useEffect(() => { import("@/lib/banks").then(m => setBanks(m.INDONESIAN_BANKS)); }, []);
  const filtered = query.length >= 1
    ? banks.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || b.code.includes(query))
    : banks;
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Cari nama bank..."
        value={open ? query : value}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-11 left-0 right-0 bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map(b => (
            <button key={b.code} type="button"
              onMouseDown={() => { onChange(b.name); setOpen(false); setQuery(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left">
              <span className="text-[10px] text-muted-foreground font-mono w-8 flex-shrink-0">{b.code}</span>
              <span className="text-sm text-foreground">{b.name}</span>
            </button>
          ))}
          {filtered.length > 20 && <p className="text-xs text-muted-foreground text-center py-2">+{filtered.length - 20} bank lainnya. Ketik lebih spesifik.</p>}
        </div>
      )}
    </div>
  );
}

function BalancePanel({ onGoToSettings }: { onGoToSettings: () => void }) {
  type BalanceData = {grossRevenue:number;shippingTotal:number;feePercent:number;feeAmount:number;netRevenue:number;totalWithdrawn:number;availableBalance:number;bankName?:string;bankAccount?:string;bankHolder?:string;withdrawals:{id:string;amount:number;netAmount:number;status:string;bankName:string;bankAccount:string;createdAt:string;adminNote?:string}[]};
  const [data, setData] = useState<BalanceData|null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const fetch_ = async () => {
    setLoading(true);
    const [balRes, storeRes, pinRes] = await Promise.all([
      fetch("/api/studio/balance", { credentials: "include" }),
      fetch("/api/studio/store", { credentials: "include" }),
      fetch("/api/auth/pin/set", { credentials: "include" }),
    ]);
    const bal = await balRes.json();
    const storeData = await storeRes.json();
    const pinData = await pinRes.json();
    setData({
      ...(bal.data ?? {}),
      bankName: storeData.data?.bankName ?? "",
      bankAccount: storeData.data?.bankAccount ?? "",
      bankHolder: storeData.data?.bankHolder ?? "",
    });
    setHasPin(pinData.data?.hasPin ?? false);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setMsg("");
    const res = await fetch("/api/studio/balance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: parseInt(amount.replace(/\./g, "")), pin }),
    });
    const d = await res.json();
    if (res.ok) { setMsg("✓ Pengajuan pencairan berhasil dikirim!"); setShowForm(false); setAmount(""); setPin(""); fetch_(); }
    else setMsg(d.error ?? "Gagal mengajukan");
    setSubmitting(false);
  };

  const STATUS_LABEL: Record<string,string> = { PENDING:"Menunggu", APPROVED:"Disetujui", REJECTED:"Ditolak", TRANSFERRED:"Sudah Ditransfer" };
  const STATUS_COLOR: Record<string,string> = { PENDING:"text-yellow-600 bg-yellow-50 border-yellow-200", APPROVED:"text-blue-600 bg-blue-50 border-blue-200", REJECTED:"text-red-600 bg-red-50 border-red-200", TRANSFERRED:"text-green-600 bg-green-50 border-green-200" };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  if (!data) return null;

  const hasBankInfo = data.bankName && data.bankAccount && data.bankHolder;

  return (
    <div className="space-y-6">
      {/* Kartu saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pendapatan Kotor", value: data.grossRevenue, note: `fee ${data.feePercent}% = Rp ${data.feeAmount.toLocaleString("id-ID")} | ongkir Rp ${(data.shippingTotal??0).toLocaleString("id-ID")}` },
          { label: "Sudah Dicairkan", value: data.totalWithdrawn, note: "total semua pencairan" },
          { label: "Saldo Tersedia", value: data.availableBalance, note: "siap dicairkan", highlight: true },
        ].map(s => (
          <div key={s.label} className={`p-5 rounded-2xl border ${s.highlight ? "border-amber-700/30 bg-amber-900/10" : "border-border bg-card"}`}>
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.highlight ? "text-amber-500" : "text-foreground"}`}>Rp {s.value.toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Info rekening tersimpan */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Rekening Pencairan
          </p>
          <button type="button" onClick={onGoToSettings} className="text-xs text-amber-600 hover:text-amber-500">Ubah →</button>
        </div>
        {hasBankInfo ? (
          <div className="text-sm">
            <p className="font-medium text-foreground">{data.bankName}</p>
            <p className="text-muted-foreground">{data.bankAccount} · a.n. {data.bankHolder}</p>
          </div>
        ) : (
          <p className="text-sm text-red-400">Rekening belum diset. <button type="button" onClick={onGoToSettings} className="underline">Set di Pengaturan Toko →</button></p>
        )}
      </div>

      {/* Tombol ajukan */}
      {!showForm && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowForm(true)} disabled={data.availableBalance < 50000 || !hasBankInfo}
            className="btn-gold h-10 px-6 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Ajukan Pencairan
          </button>
          <button onClick={() => setShowPinSetup(true)}
            className="h-10 px-4 rounded-xl border border-amber-700/40 text-amber-600 hover:bg-amber-900/10 text-sm font-medium transition-colors flex items-center gap-2">
            🔐 {hasPin ? "Ubah PIN" : "Set PIN Pencairan"}
          </button>
        </div>
      )}
      {data.availableBalance < 50000 && !showForm && (
        <p className="text-xs text-muted-foreground">Minimal pencairan Rp 50.000</p>
      )}

      {/* Form pencairan — hanya input jumlah */}
      {showForm && (
        <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <h3 className="font-bold text-foreground">Ajukan Pencairan</h3>
          <div className="p-3 rounded-lg bg-muted/30 border border-border text-sm">
            <p className="text-xs text-muted-foreground mb-1">Dana akan ditransfer ke:</p>
            <p className="font-medium text-foreground">{data.bankName} · {data.bankAccount}</p>
            <p className="text-xs text-muted-foreground">a.n. {data.bankHolder}</p>
          </div>
          <div>
            <label className="text-xs text-amber-600 font-medium block mb-1">Jumlah Pencairan (Rp) *</label>
            <input type="text" inputMode="numeric" placeholder="cth: 1.000.000"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "."))}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-amber-500" />
            <p className="text-[10px] text-muted-foreground mt-0.5">Saldo tersedia: Rp {data.availableBalance.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <label className="text-xs text-amber-600 font-medium block mb-1">PIN Pencairan (6 digit) *</label>
            <input type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-amber-500 tracking-widest text-center" />
            {!hasPin && <p className="text-[10px] text-red-400 mt-0.5">PIN belum diset. Klik "Set PIN Pencairan" terlebih dahulu.</p>}
          </div>
          {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-green-500" : "text-red-400"}`}>{msg}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setPin(""); }} className="flex-1 h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm">Batal</button>
            <button type="submit" disabled={submitting || !amount || !pin || pin.length !== 6 || !hasPin} className="flex-1 h-10 rounded-xl btn-gold font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Kirim Pengajuan
            </button>
          </div>
        </form>
      )}

      {/* Riwayat pencairan */}
      {data.withdrawals.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">Riwayat Pencairan</h3>
          <div className="space-y-2">
            {data.withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">Rp {w.netAmount.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground">{w.bankName} · {w.bankAccount} · {new Date(w.createdAt).toLocaleDateString("id-ID")}</p>
                  {w.adminNote && <p className="text-xs text-muted-foreground mt-0.5">Catatan: {w.adminNote}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[w.status] ?? ""}`}>{STATUS_LABEL[w.status] ?? w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal Set PIN */}
      {showPinSetup && (
        <PinSetupModal hasPin={hasPin} onClose={() => { setShowPinSetup(false); fetch_(); }} />
      )}
    </div>
  );
}

function PinSetupModal({ hasPin, onClose }: { hasPin?: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetch("/api/users/me", { credentials: "include" }).then(r => r.json()).then(d => setUserEmail(d.data?.email ?? ""));
  }, []);

  const sendOtp = async () => {
    setLoading(true); setMsg("");
    const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "pin_reset" }) });
    const d = await res.json();
    if (res.ok) setStep(2);
    else setMsg(d.error ?? "Gagal mengirim OTP");
    setLoading(false);
  };

  const savePin = async () => {
    if (newPin.length !== 6) { setMsg("PIN harus 6 digit"); return; }
    if (newPin !== confirmPin) { setMsg("Konfirmasi PIN tidak cocok"); return; }
    setLoading(true); setMsg("");
    const res = await fetch("/api/auth/pin/set", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ pin: newPin, otp }) });
    const d = await res.json();
    if (res.ok) { setMsg("✓ PIN berhasil disimpan!"); setTimeout(onClose, 1500); }
    else { setMsg(d.error ?? "Gagal menyimpan PIN"); if ((d.error ?? "").toLowerCase().includes("otp")) setStep(2); }
    setLoading(false);
  };

  const STEPS = ["Verifikasi Email", "Kode OTP", "Buat PIN"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-card border border-border rounded-2xl max-w-sm w-full shadow-xl p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-bold text-foreground">🔐 {hasPin ? "Ubah PIN Pencairan" : "Set PIN Pencairan"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">PIN 6 digit untuk keamanan pencairan dana</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-start mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === i + 1 ? "bg-amber-600 text-white ring-2 ring-amber-600/30" :
                  step > i + 1 ? "bg-green-500 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] whitespace-nowrap font-medium ${
                  step === i + 1 ? "text-amber-500" : "text-muted-foreground"
                }`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 mb-4 transition-colors ${step > i + 1 ? "bg-green-500" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Kirim OTP */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Kode OTP akan dikirim ke:</p>
              <p className="text-sm font-medium text-foreground">{userEmail || "—"}</p>
            </div>
            <button onClick={sendOtp} disabled={loading}
              className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "📧"} Kirim Kode OTP
            </button>
          </div>
        )}

        {/* Step 2 — Masukkan OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="text-3xl mb-2">📬</div>
              <p className="text-sm font-medium text-foreground">Cek email Anda</p>
              <p className="text-xs text-muted-foreground mt-1">Kode 6 digit dikirim ke <span className="text-amber-500 font-medium">{userEmail}</span></p>
            </div>
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="_ _ _ _ _ _"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full h-14 px-4 rounded-xl bg-background border-2 border-border text-foreground text-2xl text-center font-mono focus:outline-none focus:border-amber-500 tracking-[0.6em]"
              autoFocus
            />
            <button
              onClick={() => { if (otp.length === 6) { setStep(3); setMsg(""); } else setMsg("Masukkan 6 digit OTP terlebih dahulu"); }}
              disabled={loading}
              className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              Lanjut ke Buat PIN →
            </button>
            <button type="button" onClick={sendOtp} disabled={loading} className="w-full text-xs text-muted-foreground hover:text-amber-500 transition-colors py-1">
              Belum menerima? Kirim ulang kode
            </button>
          </div>
        )}

        {/* Step 3 — Buat PIN */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-amber-600 font-medium block mb-1.5">PIN Baru (6 digit angka)</label>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
                value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full h-12 px-4 rounded-xl bg-background border-2 border-border text-foreground text-xl text-center font-mono focus:outline-none focus:border-amber-500 tracking-[0.5em]"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-amber-600 font-medium block mb-1.5">Konfirmasi PIN</label>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
                value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`w-full h-12 px-4 rounded-xl bg-background border-2 text-foreground text-xl text-center font-mono focus:outline-none tracking-[0.5em] transition-colors ${
                  confirmPin.length === 6 && newPin !== confirmPin ? "border-red-500" :
                  confirmPin.length === 6 && newPin === confirmPin ? "border-green-500" :
                  "border-border focus:border-amber-500"
                }`}
              />
              {confirmPin.length === 6 && newPin !== confirmPin && <p className="text-xs text-red-400 mt-1">PIN tidak cocok</p>}
              {confirmPin.length === 6 && newPin === confirmPin && <p className="text-xs text-green-500 mt-1">✓ PIN cocok</p>}
            </div>
            <button onClick={savePin} disabled={loading || newPin.length !== 6 || newPin !== confirmPin}
              className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔐"} Simpan PIN
            </button>
          </div>
        )}

        {msg && <p className={`text-xs mt-3 text-center font-medium ${msg.startsWith("✓") ? "text-green-500" : "text-red-400"}`}>{msg}</p>}

        {step > 1 && !msg.startsWith("✓") && (
          <button onClick={() => { setStep(s => (s - 1) as 1 | 2 | 3); setMsg(""); }} className="w-full text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors py-1">
            ← Kembali
          </button>
        )}
      </div>
    </div>
  );
}

function FeeInfoPanel() {
  const [open, setOpen] = useState(true);
  const [fee, setFee] = useState(5);
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { if (d.data?.feePercent) setFee(d.data.feePercent); });
  }, []);
  const received = Math.round(1000000 * (1 - fee / 100));
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-900/30 border border-amber-800/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground text-sm">Sistem Fee MajaCraft</p>
            <p className="text-xs text-muted-foreground">Transparansi biaya platform</p>
          </div>
        </div>
        <span className="text-muted-foreground text-lg">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { label: "Upload & Publish", value: "Gratis", desc: "Mendaftarkan karya tidak dikenakan biaya apapun." },
              { label: "Fee Transaksi", value: `${fee}%`, desc: "Dipotong otomatis saat Anda melakukan pencairan saldo ke rekening bank." },
              { label: "Sertifikat Digital", value: "Gratis", desc: "Biaya minting & gas fee BSC ditanggung penuh MajaCraft." },
            ].map((item) => (
              <div key={item.label} className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-amber-500 mb-1">{item.value}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-muted/20 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Contoh:</span> Karya terjual Rp 1.000.000 → saat dicairkan, diterima{" "}
              <span className="font-semibold text-amber-500">Rp {received.toLocaleString("id-ID")}</span>{" "}
              (fee {fee}% = Rp {(1000000 - received).toLocaleString("id-ID")} dipotong saat pencairan).
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function StudioPage() {
  const { data: session } = useSession();
  const [roleCheck, setRoleCheck] = useState<"loading" | "ok" | "forbidden">("loading");
  const [activeTab, setActiveTab] = useState("ringkasan");

  // Data state
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState({ store: true, products: true, orders: true });

  // Form states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [storeForm, setStoreForm] = useState<Partial<Store>>({});
  const [savingStore, setSavingStore] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);
  // Ref untuk menyimpan nilai alamat terbaru dari AddressForm
  const addressRef = useRef<Partial<AddressValue>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Role check
  useEffect(() => {
    fetch("/api/users/me").then(r => r.json()).then(d => {
      setRoleCheck(d.data?.role === "SELLER" || d.data?.role === "ADMIN" ? "ok" : "forbidden");
    }).catch(() => setRoleCheck("forbidden"));
  }, []);

  // Load data
  useEffect(() => {
    if (roleCheck !== "ok") return;
    Promise.all([
      fetch("/api/studio/store").then(r => r.json()).then(d => {
        setStore(d.data);
        setStoreForm(d.data ?? {});
        // Seed addressRef dengan data dari DB
        if (d.data) {
          addressRef.current = {
            province: d.data.province ?? "", city: d.data.city ?? "",
            district: d.data.district ?? "", village: d.data.village ?? "",
            address: d.data.address ?? "", postalCode: d.data.postalCode ?? "",
            phone: d.data.phone ?? "",
          };
        }
        setLoading(l => ({ ...l, store: false }));
      }).catch(() => setLoading(l => ({ ...l, store: false }))),
      fetch("/api/studio/products").then(r => r.json()).then(d => { setProducts(d.data ?? []); setLoading(l => ({ ...l, products: false })); }).catch(() => setLoading(l => ({ ...l, products: false }))),
      fetch("/api/studio/orders").then(r => r.json()).then(d => { setOrders(d.data ?? []); setLoading(l => ({ ...l, orders: false })); }).catch(() => setLoading(l => ({ ...l, orders: false }))),
      fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data ?? [])).catch(() => {}),
    ]);
  }, [roleCheck]);

  // Submit karya baru
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.categoryId || !productForm.price || !productForm.description)
      return setProductError("Nama, kategori, harga, dan deskripsi wajib diisi.");
    setSavingProduct(true); setProductError("");
    const url = editingProduct ? `/api/studio/products/${editingProduct.id}` : "/api/studio/products";
    const method = editingProduct ? "PATCH" : "POST";

    // Konversi kg → gram (min 100g), build dimensions string
    const weightGram = productForm.weightKg
      ? Math.max(100, Math.round(parseFloat(productForm.weightKg) * 1000))
      : null;
    const p = parseInt(productForm.panjang) || null;
    const l = parseInt(productForm.lebar) || null;
    const t = parseInt(productForm.tinggi) || null;
    const dimensionsStr = (p && l && t) ? `${p}x${l}x${t}` : null;

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...productForm,
        weight: weightGram,
        dimensions: dimensionsStr,
        length: p,
        width: l,
        height: t,
        tags: productForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      const updated = await fetch("/api/studio/products").then(r => r.json());
      setProducts(updated.data ?? []);
      setShowAddProduct(false); setEditingProduct(null); setProductForm(EMPTY_PRODUCT);
    } else {
      const d = await res.json(); setProductError(d.error ?? "Gagal menyimpan karya.");
    }
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!(await dialog.confirm("Hapus karya ini?"))) return;
    await fetch(`/api/studio/products/${id}`, { method: "DELETE" });
    setProducts(products.filter(p => p.id !== id));
  };

  const [soldOfflineModal, setSoldOfflineModal] = useState<Product | null>(null);
  const [soldOfflineLoading, setSoldOfflineLoading] = useState(false);
  const [shipModal, setShipModal] = useState<Order | null>(null);
  const [shipForm, setShipForm] = useState({ trackingNumber: "", courierName: "", courierService: "" });
  const [isCourierOverride, setIsCourierOverride] = useState(false);
  const [shipError, setShipError] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const dialog = useModernDialog();

  const openShipModal = (order: Order) => {
    setShipModal(order);
    setIsCourierOverride(false);
    setShipError("");
    setShipForm({
      trackingNumber: "",
      courierName: order.courierName ?? "",
      courierService: order.courierService ?? "",
    });
  };

  const toggleSoldOffline = async (p: Product) => {
    if (p.isSoldOffline) {
      if (!(await dialog.confirm("Batalkan status terjual offline? Produk akan aktif kembali."))) return;
      await fetch(`/api/studio/products/${p.id}/sold-offline`, { method: "DELETE" });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, isSoldOffline: false } : x));
    } else {
      setSoldOfflineModal(p);
    }
  };

  const confirmSoldOffline = async () => {
    if (!soldOfflineModal) return;
    setSoldOfflineLoading(true);
    await fetch(`/api/studio/products/${soldOfflineModal.id}/sold-offline`, { method: "POST" });
    setProducts(prev => prev.map(x => x.id === soldOfflineModal.id ? { ...x, isSoldOffline: true, stock: 0 } : x));
    setSoldOfflineLoading(false);
    setSoldOfflineModal(null);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      categoryId: p.category?.id ?? "",
      description: p.description ?? "",
      price: String(p.price),
      originalPrice: String(p.originalPrice ?? ""),
      stock: String(p.stock),
      material: p.material ?? "",
      panjang: p.length ? String(p.length) : "",
      lebar: p.width ? String(p.width) : "",
      tinggi: p.height ? String(p.height) : "",
      weightKg: p.weight ? String(p.weight / 1000) : "",
      origin: p.origin ?? "",
      kondisi: p.kondisi ?? "Baru",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      imageUrls: p.images.map(i => i.url),
    });
    setShowAddProduct(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    // Gabungkan storeForm dengan nilai terbaru dari AddressForm
    // Exclude bank fields — disimpan terpisah via OTP flow
    const { bankName: _bn, bankAccount: _ba, bankHolder: _bh, ...storeFormWithoutBank } = storeForm;
    const payload = {
      ...storeFormWithoutBank,
      ...addressRef.current,
    };
    const res = await fetch("/api/studio/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      setStore(d.data);
      setStoreSaved(true);
      setTimeout(() => setStoreSaved(false), 3000);
    }
    setSavingStore(false);
  };

  if (roleCheck === "loading") return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (roleCheck === "forbidden") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-5xl">🎨</div>
      <h1 className="text-2xl font-bold text-foreground">Studio Seniman</h1>
      <p className="text-muted-foreground max-w-sm">Upgrade akun ke Seniman untuk mulai berjualan.</p>
      <Link href="/akun" className="btn-gold inline-flex h-11 px-6 rounded-xl font-semibold text-sm items-center">Upgrade ke Seniman</Link>
    </div>
  );

  const stats = [
    { label: "Total Pendapatan", value: formatRupiah(orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.subtotal, 0)), icon: DollarSign, trend: "nilai karya terjual" },
    { label: "Pesanan Aktif", value: String(orders.filter(o => ["PROCESSING","SHIPPED"].includes(o.status)).length), icon: ShoppingBag, trend: "aktif" },
    { label: "Karya Terdaftar", value: String(products.length), icon: Package, trend: `${products.filter(p => p.isActive).length} aktif` },
    { label: "Rating Toko", value: store?.rating ? String(store.rating) : "—", icon: Star, trend: "keseluruhan" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Studio Seniman</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Halo, <span className="text-amber-600 font-medium">{store?.name ?? session?.user?.name}</span> · Kelola karya dan pesanan Anda
            </p>
          </div>
          <button onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setProductError(""); setShowAddProduct(true); }}
            className={`btn-gold h-10 px-4 font-semibold text-sm rounded-lg flex items-center gap-1.5 flex-shrink-0 ${activeTab === "karya" ? "hidden" : ""}`}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Daftarkan Karya</span>
            <span className="sm:hidden">Daftarkan</span>
          </button>
        </div>

        {/* Mobile Tab Navigation — horizontal scroll */}
        <div className="md:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-gold">
          <div className="flex gap-2 pb-1 w-max">
            {MENU.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  activeTab === item.id
                    ? "bg-amber-700 text-white shadow-md shadow-amber-900/30"
                    : "bg-card border border-border text-muted-foreground"
                }`}>
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile status bar */}
        <div className="md:hidden flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-amber-900/10 border border-amber-800/20 text-xs">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${store?.isVerified ? "bg-green-400" : "bg-yellow-400"}`} />
          <span className={store?.isVerified ? "text-green-500" : "text-yellow-500"}>
            {store?.isVerified ? "Toko Aktif & Terverifikasi" : "Toko Belum Terverifikasi"}
          </span>
          {!store?.isVerified && (
            <Link href="/akun/kyc" className="ml-auto text-amber-600 underline text-[11px]">Verifikasi →</Link>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop only */}
          <aside className="hidden md:block w-52 flex-shrink-0 space-y-1">
            {MENU.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === item.id ? "bg-amber-900/20 text-amber-600 font-medium border border-amber-700/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon className="w-4 h-4" />{item.label}
              </button>
            ))}
            <div className="p-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-xs space-y-1 mt-4">
              <p className="font-semibold text-amber-400">Status Toko</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${store?.isVerified ? "bg-green-400" : "bg-yellow-400"}`} />
                <span className={store?.isVerified ? "text-green-500" : "text-yellow-500"}>{store?.isVerified ? "Aktif & Terverifikasi" : "Belum Terverifikasi"}</span>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── RINGKASAN ── */}
            {activeTab === "ringkasan" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{s.label}</p><s.icon className="w-4 h-4 text-amber-600" /></div>
                      <p className="text-xl font-bold text-foreground">{loading.orders && loading.store ? "..." : s.value}</p>
                      <p className="text-xs text-green-600">{s.trend}</p>
                    </div>
                  ))}
                </div>

                {/* Recent orders */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground">Pesanan Terbaru</h2>
                    <button onClick={() => setActiveTab("pesanan")} className="text-xs text-amber-600">Lihat Semua →</button>
                  </div>
                  {loading.orders ? <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div> : orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Belum ada pesanan</div>
                  ) : (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 text-left">ID</th>
                            <th className="px-4 py-3 text-left">Produk</th>
                            <th className="px-4 py-3 text-left">Total</th>
                            <th className="px-4 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((o, i) => (
                            <tr key={o.id} className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                              <td className="px-4 py-3 font-mono text-xs text-amber-600">{o.orderNumber.slice(-8)}</td>
                              <td className="px-4 py-3 max-w-[180px]"><span className="line-clamp-1">{o.items[0]?.productName}</span></td>
                              <td className="px-4 py-3 font-medium text-amber-700">{formatRupiah(o.total)}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{STATUS_LABELS[o.status] ?? o.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recent products */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground">Karya Terdaftar</h2>
                    <button onClick={() => setActiveTab("karya")} className="text-xs text-amber-600">Kelola Karya →</button>
                  </div>
                  {loading.products ? <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div> : products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Belum ada karya — <button onClick={() => setShowAddProduct(true)} className="text-amber-600 underline">Daftarkan sekarang</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {products.slice(0, 4).map(p => (
                        <div key={p.id} className="rounded-xl border border-border overflow-hidden group cursor-pointer" onClick={() => openEdit(p)}>
                          <div className="relative aspect-square bg-muted">
                            {p.images[0] ? <Image src={p.images[0].url} alt={p.name} fill className="object-cover" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/200x200/2A2620/C9A84C?text=K`; }} /> : <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                              <span className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-amber-700"><Edit className="w-3.5 h-3.5" /></span>
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-amber-600 font-semibold">{formatRupiah(p.price)}</span>
                              <span className={`text-[10px] px-1.5 rounded-full ${p.isActive ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>{p.isActive ? "aktif" : "review"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── KARYA SAYA ── */}
            {activeTab === "karya" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Karya Saya ({products.length})</h2>
                  <button onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setShowAddProduct(true); }}
                    className="btn-gold h-9 px-4 text-sm rounded-lg font-semibold flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Daftarkan Karya
                  </button>
                </div>
                {loading.products ? <div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div> : products.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Belum ada karya terdaftar
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Karya</th>
                          <th className="px-4 py-3 text-left">Harga</th>
                          <th className="px-4 py-3 text-left">Stok</th>
                          <th className="px-4 py-3 text-left">Terjual</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left min-w-[220px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={p.id} className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  {p.images[0] ? <Image src={p.images[0].url} alt="" fill className="object-cover" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/2A2620/C9A84C?text=K`; }} /> : <span className="w-full h-full flex items-center justify-center text-sm">🎨</span>}
                                </div>
                                <div>
                                  <p className="font-medium line-clamp-1 max-w-[160px]">{p.name}</p>
                                  {p.hasCertificate && <span className="text-[10px] text-amber-600 flex items-center gap-1"><FileCheck className="w-2.5 h-2.5" /> Bersertifikat</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-amber-700 whitespace-nowrap">{formatRupiah(p.price)}</td>
                            <td className="px-4 py-3">{p.stock}</td>
                            <td className="px-4 py-3">{p.soldCount}</td>
                            <td className="px-4 py-3">
                              {p.isSoldOffline
                                ? <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 font-semibold whitespace-nowrap">🏷 Terjual Offline</span>
                                : <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${p.isActive ? "bg-green-100 text-green-600 border border-green-200" : "bg-yellow-100 text-yellow-600 border border-yellow-200"}`}>{p.isActive ? "aktif" : "menunggu review"}</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link href={`/produk/${p.slug}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Lihat"><Eye className="w-3.5 h-3.5" /></Link>
                                {!p.isSoldOffline && (
                                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-amber-600" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                )}
                                <button
                                  onClick={() => toggleSoldOffline(p)}
                                  className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                                    p.isSoldOffline
                                      ? "border-amber-500/40 text-amber-500 hover:bg-amber-900/10"
                                      : "border-orange-500/40 text-orange-500 hover:bg-orange-900/10"
                                  }`}
                                >
                                  {p.isSoldOffline ? "↩ Batalkan" : "🏷 Jual Offline"}
                                </button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── PESANAN ── */}
            {activeTab === "pesanan" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-foreground">Pesanan Masuk</h2>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Menunggu", status: "PENDING_PAYMENT", icon: Clock, color: "text-yellow-600" },
                    { label: "Dikemas", status: "PROCESSING", icon: Package, color: "text-blue-600" },
                    { label: "Dikirim", status: "SHIPPED", icon: Truck, color: "text-purple-600" },
                    { label: "Selesai", status: "COMPLETED", icon: CheckCircle2, color: "text-green-600" },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl border border-border bg-card text-center">
                      <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                      <p className={`text-xl font-bold ${s.color}`}>{orders.filter(o => o.status === s.status).length}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                {loading.orders ? <div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div> : orders.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">Belum ada pesanan masuk</div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <div key={order.id} className="p-4 rounded-xl border border-border bg-card">
                        {(() => {
                          const activeDispute = order.disputes?.find((d) =>
                            ["PENDING_SELLER", "SELLER_RESPONDED", "IN_MEDIATION", "REFUND_PENDING", "REFUND_FAILED"].includes(d.status)
                          );
                          const latestDispute = order.disputes?.find((d) => d.status !== "CANCELLED");
                          const disputeForRoom = activeDispute ?? latestDispute;

                          return (
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-amber-600">{order.orderNumber.slice(-8)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
                              {activeDispute && (
                                <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-orange-100 text-orange-700 border-orange-300">
                                  Komplain Aktif
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-sm text-foreground">{order.items[0]?.productName} {order.items.length > 1 ? `+${order.items.length - 1} lainnya` : ""}</p>
                            {order.trackingNumber && <p className="text-xs text-amber-600">{order.courierName}: {order.trackingNumber}</p>}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-bold text-amber-700">{formatRupiah(order.total)}</p>
                            {disputeForRoom && (
                              <Link
                                href={`/pesanan/${order.id}/komplain/${disputeForRoom.id}`}
                                className="inline-flex h-7 items-center rounded-lg border border-orange-300 bg-orange-50 px-3 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
                              >
                                {activeDispute ? "Buka Room Komplain" : "Lihat Riwayat Komplain"}
                              </Link>
                            )}
                            {order.status === "PENDING_PAYMENT" && (
                              <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-lg">⏳ Menunggu pembayaran buyer</p>
                            )}
                            {order.status === "PROCESSING" && (
                              <button
                                onClick={() => openShipModal(order)}
                                className="h-7 text-xs px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                                📦 Input No. Resi & Kirim
                              </button>
                            )}
                            {order.status === "SHIPPED" && (
                              <p className="text-xs text-purple-600">🚚 Sedang dikirim</p>
                            )}
                          </div>
                        </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STATISTIK ── */}
            {activeTab === "statistik" && (
              <div className="space-y-6">
                <h2 className="font-semibold text-foreground">Statistik Toko</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Karya", value: products.length },
                    { label: "Karya Aktif", value: products.filter(p => p.isActive).length },
                    { label: "Total Terjual", value: products.reduce((s, p) => s + p.soldCount, 0) },
                    { label: "Total Dilihat", value: products.reduce((s, p) => s + p.viewCount, 0) },
                  ].map(s => (
                    <div key={s.label} className="p-5 rounded-xl border border-border bg-card">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-3xl font-bold text-amber-600 mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SALDO & PENCAIRAN ── */}
            {activeTab === "saldo" && <BalancePanel onGoToSettings={() => setActiveTab("pengaturan")} />}

            {/* ── PENGATURAN TOKO ── */}
            {activeTab === "pengaturan" && (
              <div className="space-y-6">
                {/* Info Fee */}
                <FeeInfoPanel />

              <form onSubmit={handleSaveStore} className="space-y-5">
                <h2 className="font-semibold text-foreground">Pengaturan Toko</h2>

                {/* Logo */}
                <div>
                  <label className="text-xs font-medium text-amber-500 uppercase tracking-wider block mb-2">Logo Toko</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                      {/* Pakai <img> biasa agar bisa tampilkan data: dan /uploads/ URL */}
                      {(logoPreview || storeForm.logoUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview ?? storeForm.logoUrl} alt="logo" className="w-full h-full object-cover" />
                      ) : <span className="text-2xl">🏪</span>}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      // Preview langsung dengan FileReader
                      const reader = new FileReader();
                      reader.onload = ev => setLogoPreview(ev.target?.result as string);
                      reader.readAsDataURL(f);
                      // Upload ke server
                      setUploadingLogo(true);
                      const form = new FormData();
                      form.append("file", f);
                      form.append("folder", "logos");
                      const res = await fetch("/api/upload", { method: "POST", body: form });
                      if (res.ok) {
                        const d = await res.json();
                        setStoreForm(s => ({ ...s, logoUrl: d.data.url }));
                      }
                      setUploadingLogo(false);
                    }} />
                    <div className="flex flex-col gap-1.5">
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}
                        className="h-9 px-4 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50">
                        {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadingLogo ? "Mengupload..." : "Upload Logo"}
                      </button>
                      {(logoPreview || storeForm.logoUrl) && (
                        <button type="button" onClick={() => { setLogoPreview(null); setStoreForm(s => ({ ...s, logoUrl: "" })); }} className="text-xs text-red-400 hover:text-red-300">Hapus logo</button>
                      )}
                    </div>
                  </div>
                </div>

                {[
                  { key: "name", label: "Nama Toko *", placeholder: "Nama studio/toko Anda" },
                  { key: "description", label: "Deskripsi Toko", placeholder: "Ceritakan tentang toko dan karya Anda..." },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">{f.label}</label>
                    {f.key === "description" ? (
                      <textarea placeholder={f.placeholder} value={(storeForm as Record<string, string>)[f.key] ?? ""} onChange={e => setStoreForm(s => ({ ...s, [f.key]: e.target.value }))} rows={3}
                        className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm mt-1 resize-none" />
                    ) : (
                      <input type="text" placeholder={f.placeholder} value={(storeForm as Record<string, string>)[f.key] ?? ""} onChange={e => setStoreForm(s => ({ ...s, [f.key]: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm mt-1" />
                    )}
                  </div>
                ))}

                {/* Alamat toko — cascading wilayah + peta */}
                <div>
                  <label className="text-xs font-medium text-amber-500 uppercase tracking-wider block mb-1">Alamat Pickup Kurir</label>
                  <p className="text-xs text-muted-foreground mb-3">Digunakan kurir untuk pickup. <span className="text-amber-600">Tidak ditampilkan ke pembeli.</span></p>
                  <AddressForm
                    value={{
                      province: storeForm.province ?? "", provinceId: "",
                      city: storeForm.city ?? "", cityId: "",
                      district: storeForm.district ?? "", districtId: "",
                      village: storeForm.village ?? "",
                      address: storeForm.address ?? "",
                      postalCode: storeForm.postalCode ?? "",
                      phone: storeForm.phone ?? "",
                      lat: -6.2088, lng: 106.8456,
                    }}
                    onChange={(v: AddressValue) => {
                      // Simpan ke ref (selalu up-to-date, tidak trigger re-render)
                      addressRef.current = {
                        province: v.province, city: v.city,
                        district: v.district, village: v.village,
                        address: v.address, postalCode: v.postalCode,
                        phone: v.phone,
                      };
                    }}
                    showPhone={true}
                    showMap={true}
                  />
                </div>

                {storeSaved && <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Pengaturan toko tersimpan!</div>}

                <button type="submit" disabled={savingStore}
                  className="btn-gold h-11 px-6 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60">
                  {savingStore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingStore ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </form>

              {/* ── Rekening Pencairan Dana — disimpan TERPISAH via OTP ── */}
              <div className="p-5 rounded-2xl bg-amber-900/10 border border-amber-800/20 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-500" /> Rekening Pencairan Dana
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-amber-700 bg-amber-900/20 border border-amber-800/20 px-2 py-0.5 rounded-full font-medium">🔒 OTP</span>
                </div>
                <div>
                  <label className="text-xs text-amber-600 font-medium block mb-1">Bank</label>
                  <BankSelect value={storeForm.bankName ?? ""} onChange={v => setStoreForm(s => ({ ...s, bankName: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-amber-600 font-medium block mb-1">Nomor Rekening</label>
                    <input type="text" placeholder="1234567890" value={storeForm.bankAccount ?? ""} onChange={e => setStoreForm(s => ({ ...s, bankAccount: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 placeholder:text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-amber-600 font-medium block mb-1">Atas Nama</label>
                    <input type="text" placeholder="Nama sesuai rekening" value={storeForm.bankHolder ?? ""} onChange={e => setStoreForm(s => ({ ...s, bankHolder: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 placeholder:text-muted-foreground" />
                  </div>
                </div>
                <OtpBankVerify
                  storeForm={{ bankName: storeForm.bankName, bankAccount: storeForm.bankAccount, bankHolder: storeForm.bankHolder }}
                  onSaved={() => { setStoreSaved(true); setTimeout(() => setStoreSaved(false), 3000); }}
                />
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Daftarkan Karya ── */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editingProduct ? "Edit Karya" : "Daftarkan Karya Baru"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Semua karya akan mendapat Sertifikat Digital otomatis</p>
              </div>
              <button onClick={() => { setShowAddProduct(false); setEditingProduct(null); setProductError(""); }}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {/* Foto */}
              <div>
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider block mb-2">
                  Foto Karya (maks. 5 foto) · {productForm.imageUrls.length}/5
                </label>
                {/* Preview foto yang sudah diupload */}
                {productForm.imageUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {productForm.imageUrls.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-amber-600 text-white text-[9px] text-center py-0.5">Cover</span>}
                        <button
                          type="button"
                          onClick={() => setProductForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, j) => j !== i) }))}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full text-white text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                {productForm.imageUrls.length < 5 && (
                  <label className="border-2 border-dashed border-amber-700/30 rounded-xl p-5 flex flex-col items-center cursor-pointer hover:border-amber-500/60 transition-colors bg-amber-900/5 hover:bg-amber-900/10">
                    <Upload className="w-6 h-6 text-amber-600/60 mb-1.5" />
                    <p className="text-sm text-muted-foreground">Klik untuk pilih foto</p>
                    <p className="text-xs text-amber-700 mt-0.5">JPG, PNG maks. 10MB · Foto pertama jadi cover</p>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                      const files = Array.from(e.target.files ?? []).slice(0, 5 - productForm.imageUrls.length);
                      for (const f of files) {
                        const form = new FormData();
                        form.append("file", f);
                        form.append("folder", "products");
                        const res = await fetch("/api/upload", { method: "POST", body: form });
                        if (res.ok) {
                          const d = await res.json();
                          setProductForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, d.data.url] }));
                        }
                      }
                      // Reset input agar bisa pilih file yang sama lagi
                      e.target.value = "";
                    }} />
                  </label>
                )}
              </div>

              {/* Nama & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nama Karya *</label>
                  <input type="text" placeholder="cth: Patung Ganesha Batu Andesit" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Kategori *</label>
                  <select value={productForm.categoryId} onChange={e => setProductForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm mt-1 focus:outline-none focus:border-amber-500 appearance-none">
                    <option value="">Pilih kategori...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Deskripsi dengan rich text editor */}
              <div>
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider block mb-1.5">Deskripsi Karya *</label>
                <RichTextEditor
                  key={editingProduct?.id ?? "new"}
                  value={productForm.description}
                  onChange={(html) => setProductForm(f => ({ ...f, description: html }))}
                  placeholder="Ceritakan tentang karya Anda: teknik pembuatan, keunikan, bahan, dan sejarahnya. Gunakan toolbar untuk format teks (bold, list, heading)..."
                />
              </div>

              {/* Harga & Stok */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {/* Field 1: Harga utama — WAJIB */}
                  <div>
                    <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Harga (Rp) *</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <input
                        type="text" inputMode="numeric" placeholder="cth: 11.500.000"
                        value={productForm.price ? Number(productForm.price).toLocaleString("id-ID") : ""}
                        onChange={e => {
                          const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                          setProductForm(f => ({ ...f, price: raw }));
                        }}
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500 text-sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Harga yang dibayar pembeli</p>
                  </div>
                  {/* Field 2: Harga coret — OPSIONAL (hanya jika ada diskon) */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Harga Coret (Rp)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <input
                        type="text" inputMode="numeric" placeholder="cth: 15.000.000"
                        value={productForm.originalPrice ? Number(productForm.originalPrice).toLocaleString("id-ID") : ""}
                        onChange={e => {
                          const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                          setProductForm(f => ({ ...f, originalPrice: raw }));
                        }}
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500 text-sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Opsional — isi jika ada diskon (akan tampil dicoret)</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Stok</label>
                    <input type="number" placeholder="1" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm mt-1" />
                  </div>
                </div>
                {/* Kalkulasi diskon otomatis */}
                {productForm.originalPrice && productForm.price && Number(productForm.originalPrice) > Number(productForm.price) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-900/10 border border-green-800/20 text-xs">
                    <span className="text-muted-foreground">Diskon:</span>
                    <span className="font-bold text-green-500">
                      {Math.round(((Number(productForm.originalPrice) - Number(productForm.price)) / Number(productForm.originalPrice)) * 100)}%
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">Hemat Rp {(Number(productForm.originalPrice) - Number(productForm.price)).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {productForm.originalPrice && productForm.price && Number(productForm.originalPrice) <= Number(productForm.price) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-900/10 border border-red-800/20 text-xs text-red-400">
                    ⚠️ Harga Coret harus lebih <strong>tinggi</strong> dari Harga agar diskon tampil. Contoh: Harga Rp 10.000.000 → Harga Coret Rp 15.000.000
                  </div>
                )}
              </div>

              {/* Spesifikasi Fisik (untuk NFT metadata) */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5" /> Spesifikasi Fisik (untuk Sertifikat Digital)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-amber-600">Material / Bahan *</label>
                    <input type="text" placeholder="cth: Batu Andesit, Kayu Jati, Kain Sutra" value={productForm.material} onChange={e => setProductForm(f => ({ ...f, material: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500 placeholder:text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-amber-600">Berat (kg)</label>
                    <div className="relative mt-0.5">
                      <input type="number" step="0.1" min="0.1" placeholder="cth: 1.2" value={productForm.weightKg} onChange={e => setProductForm(f => ({ ...f, weightKg: e.target.value }))}
                        className="w-full h-9 pl-3 pr-8 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 placeholder:text-muted-foreground" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Min. 0.1 kg · dibulatkan ke atas saat hitung ongkir</p>
                  </div>
                  <div>
                    <label className="text-xs text-amber-600">Asal Daerah</label>
                    <select value={productForm.origin} onChange={e => setProductForm(f => ({ ...f, origin: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-0.5 focus:outline-none focus:border-amber-500 appearance-none">
                      <option value="">Pilih provinsi...</option>
                      {["DKI Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur","DI Yogyakarta","Banten","Bali","Sumatera Utara","Sumatera Barat","Sumatera Selatan","Kalimantan Timur","Sulawesi Selatan","NTB","NTT","Aceh","Lainnya"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                {/* Dimensi terpisah — full width */}
                <div>
                  <label className="text-xs text-amber-600 mb-1 block">Dimensi (cm) — Panjang × Lebar × Tinggi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "panjang", label: "Panjang", placeholder: "30" },
                      { key: "lebar",   label: "Lebar",   placeholder: "20" },
                      { key: "tinggi",  label: "Tinggi",  placeholder: "45" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-[10px] text-muted-foreground">{label}</label>
                        <div className="relative mt-0.5">
                          <input type="number" min="1" placeholder={placeholder}
                            value={(productForm as unknown as Record<string, string>)[key]}
                            onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full h-9 pl-3 pr-7 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 placeholder:text-muted-foreground" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {productForm.panjang && productForm.lebar && productForm.tinggi && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Volumetrik: {Math.ceil((parseInt(productForm.panjang) * parseInt(productForm.lebar) * parseInt(productForm.tinggi)) / 6000 * 10) / 10} kg
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-amber-600">Kondisi</label>
                  <div className="flex gap-2 mt-1">
                    {["Baru", "Bekas - Sangat Baik", "Bekas - Baik"].map(k => (
                      <button key={k} type="button" onClick={() => setProductForm(f => ({ ...f, kondisi: k }))}
                        className={`text-xs px-3 h-7 rounded-lg border transition-colors ${productForm.kondisi === k ? "border-amber-500 bg-amber-900/20 text-amber-400" : "border-border text-muted-foreground hover:border-amber-700"}`}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Tag (pisahkan dengan koma)</label>
                <input type="text" placeholder="cth: batik, cirebon, motif mega mendung, kain sutra" value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm mt-1" />
              </div>

              {/* NFT Certificate Info */}
              <div className="p-4 rounded-xl border border-amber-900/30 bg-amber-900/5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-900/20">
                  <FileCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-foreground">Sertifikat Digital (NFT) — Difasilitasi Gratis oleh MajaCraft</p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5 flex-shrink-0">◆</span>
                    <p><span className="text-foreground font-medium">Berbasis BSC (Binance Smart Chain)</span> — Dicatat permanen di blockchain, tidak bisa dipalsukan atau dihapus.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5 flex-shrink-0">◆</span>
                    <p><span className="text-foreground font-medium">Hak Milik Sah Anda</span> — NFT diterbitkan atas nama Anda sebagai pencipta original dan bukti kepemilikan yang sah.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5 flex-shrink-0">◆</span>
                    <p><span className="text-foreground font-medium">Otomatis Berpindah ke Buyer</span> — Saat karya terjual, NFT dipindahkan ke pembeli sebagai sertifikat kepemilikan baru.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5 flex-shrink-0">◆</span>
                    <p><span className="text-foreground font-medium">Sepenuhnya Gratis</span> — Gas fee BSC dan minting ditanggung penuh MajaCraft. Tidak ada biaya tambahan dari Anda.</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-900/20">Sertifikat dibuat otomatis setelah karya disetujui admin · Proses 1×24 jam</p>
              </div>

              {productError && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{productError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} className="flex-1 h-11 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted">Batal</button>
                <button type="submit" disabled={savingProduct}
                  className="flex-1 h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {savingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingProduct ? "Menyimpan..." : editingProduct ? "Update Karya" : "Daftarkan Karya"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Input No. Resi ── */}
      {shipModal && (() => {
        const buyerCourierName = shipModal.courierName?.trim() ?? "";
        const buyerCourierService = shipModal.courierService?.trim() ?? "";
        const buyerCourier = [buyerCourierName, buyerCourierService].filter(Boolean).join(" · ");
        const selectedCourierName = (shipForm.courierName || buyerCourierName).trim();
        const selectedCourierService = (shipForm.courierService || (isCourierOverride ? "" : buyerCourierService)).trim();
        const selectedCourier = [selectedCourierName, selectedCourierService].filter(Boolean).join(" · ");
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-xl p-6">
              <h3 className="font-bold text-foreground mb-1">📦 Input Nomor Resi</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Pesanan: <span className="text-amber-600 font-mono">{shipModal.orderNumber.slice(-8)}</span>
              </p>

              {/* Kurir dari buyer — ditampilkan, tidak perlu diketik ulang */}
              <div className="mb-4 p-3 rounded-xl bg-blue-900/10 border border-blue-800/25">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-blue-400 uppercase tracking-wide font-semibold mb-1">Kurir dipilih buyer</p>
                    <p className="text-sm font-bold text-foreground">{buyerCourier || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Gunakan kurir ini saat mengirim paket</p>
                  </div>
                  {!isCourierOverride && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCourierOverride(true);
                        setShipForm(f => ({
                          ...f,
                          courierName: f.courierName || buyerCourierName,
                          courierService: f.courierService || buyerCourierService,
                        }));
                      }}
                      className="text-[10px] text-amber-600 hover:text-amber-400 whitespace-nowrap underline"
                    >
                      Ganti kurir?
                    </button>
                  )}
                </div>

                {/* Override field — hanya tampil jika seller klik "Ganti kurir?" */}
                {isCourierOverride && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-900/10 border border-amber-700/30">
                      <span className="text-amber-400 text-xs">⚠</span>
                      <p className="text-xs text-amber-300">Ganti kurir hanya jika ada perubahan dari buyer. Pastikan konfirmasi dengan buyer terlebih dahulu.</p>
                    </div>
                    <label className="text-xs text-amber-600 font-medium block">Nama Kurir Pengganti *</label>
                    <input
                      type="text"
                      placeholder="cth: JNE, J&T, SiCepat, Anteraja"
                      value={shipForm.courierName}
                      onChange={e => setShipForm(f => ({ ...f, courierName: e.target.value.toUpperCase() }))}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-amber-700/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                    <div>
                      <label className="text-xs text-amber-600 font-medium block mb-1">Layanan Kurir (opsional)</label>
                      <input
                        type="text"
                        placeholder="cth: REG, YES, ECO"
                        value={shipForm.courierService}
                        onChange={e => setShipForm(f => ({ ...f, courierService: e.target.value.toUpperCase() }))}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-amber-700/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCourierOverride(false);
                        setShipForm(f => ({ ...f, courierName: buyerCourierName, courierService: buyerCourierService }));
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      ← Kembali pakai kurir buyer ({buyerCourier})
                    </button>
                  </div>
                )}
              </div>

              {/* Input nomor resi */}
              <div className="mb-5">
                <label className="text-xs text-amber-600 font-medium block mb-1.5">
                  Nomor Resi *
                  {selectedCourier && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({selectedCourierName})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={`cth: ${(selectedCourierName || "JNE").split("·")[0].trim()}12345678910`}
                  value={shipForm.trackingNumber}
                  onChange={e => setShipForm(f => ({ ...f, trackingNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))}
                  className="w-full h-11 px-3 rounded-lg bg-background border border-border text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                  autoFocus={!isCourierOverride}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Buyer akan mendapat notifikasi + email dengan nomor resi ini.
                </p>
              </div>

              {shipError && (
                <div className="mb-4 p-2.5 rounded-lg border border-red-800/30 bg-red-900/10 text-xs text-red-300">
                  {shipError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShipModal(null);
                    setIsCourierOverride(false);
                    setShipError("");
                    setShipForm({ trackingNumber: "", courierName: "", courierService: "" });
                  }}
                  className="flex-1 h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm"
                >
                  Batal
                </button>
                <button
                  disabled={!shipForm.trackingNumber.trim() || !selectedCourierName || shippingLoading}
                  onClick={async () => {
                    if (shippingLoading) return;
                    setShippingLoading(true);
                    setShipError("");
                    const finalCourierName = selectedCourierName;
                    const finalCourierService = selectedCourierService;
                    const cleanTrackingNumber = shipForm.trackingNumber.trim().toUpperCase();
                    const res = await fetch(`/api/studio/orders/${shipModal.id}/ship`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        trackingNumber: cleanTrackingNumber,
                        courierName: finalCourierName,
                        courierService: finalCourierService,
                      }),
                    });
                    if (res.ok) {
                      setOrders(prev => prev.map(o => o.id === shipModal.id
                        ? {
                            ...o,
                            status: "SHIPPED",
                            trackingNumber: cleanTrackingNumber,
                            courierName: finalCourierName,
                            courierService: finalCourierService,
                          }
                        : o));
                      setShipModal(null);
                      setIsCourierOverride(false);
                      setShipForm({ trackingNumber: "", courierName: "", courierService: "" });
                    } else {
                      const d = await res.json().catch(() => ({}));
                      setShipError(d.error ?? "Gagal menyimpan resi. Coba lagi.");
                    }
                    setShippingLoading(false);
                  }}
                  className="flex-1 h-10 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {shippingLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  🚚 Tandai Sudah Dikirim
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal Tandai Terjual Offline ── */}
      {soldOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-amber-900/20 border-b border-amber-800/30 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-900/30 border border-orange-700/30 flex items-center justify-center flex-shrink-0 text-2xl">
                  🏷️
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Tandai Terjual di Luar Platform</h3>
                  <p className="text-amber-600 text-sm font-medium mt-0.5">{soldOfflineModal.name}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Apa yang terjadi */}
              <div className="space-y-2.5">
                {[
                  {
                    icon: "🖼️",
                    title: "Karya tetap tampil sebagai portofolio",
                    desc: "Produk masih bisa dilihat oleh pengunjung dengan badge TERJUAL sebagai bukti nilai dan reputasi karya Anda.",
                  },
                  {
                    icon: "💰",
                    title: "Harga referensi tetap tercatat",
                    desc: `Harga ${soldOfflineModal.price ? (soldOfflineModal.price / 1000000).toFixed(1) + " juta" : ""} tersimpan sebagai catatan nilai historis karya di platform MajaCraft.`,
                  },
                  {
                    icon: "🔐",
                    title: "Sertifikat Digital (NFT) tetap di platform",
                    desc: "Sertifikat keaslian digital yang diterbitkan MajaCraft tetap tercatat di blockchain sebagai bukti provenance. Pembeli offline dapat melakukan klaim sertifikat melalui MajaCraft.",
                  },
                  {
                    icon: "📵",
                    title: "Tidak bisa ditambah ke keranjang",
                    desc: "Pembeli online tidak bisa membeli karya ini. Stok otomatis menjadi 0.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                    <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-900/10 border border-amber-800/20">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">ℹ️</span>
                <p className="text-xs text-amber-400 leading-relaxed">
                  Status ini dapat dibatalkan melalui tombol <strong>↩ Batalkan</strong> jika terjadi kesalahan.
                  Namun disarankan untuk segera mengupdate agar data tetap akurat.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button
                onClick={() => setSoldOfflineModal(null)}
                className="flex-1 h-11 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmSoldOffline}
                disabled={soldOfflineLoading}
                className="flex-1 h-11 rounded-xl bg-orange-700 hover:bg-orange-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {soldOfflineLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>
                ) : (
                  <>🏷️ Ya, Tandai Terjual Offline</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
