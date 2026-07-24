"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, Users, Package, ShoppingBag, Store,
  Settings, Shield, CheckCircle2, XCircle, Search, Ban,
  DollarSign, Loader2, UserCheck, AlertCircle, RefreshCw, BadgeCheck, Trash2,
  BookOpen, Plus, Edit, Eye, Calendar, ChevronDown,
} from "lucide-react";
import { formatRupiah } from "@/lib/data";
import { useModernDialog } from "@/components/ui/modern-dialog";

type Stats = { totalUsers:number; totalSellers:number; totalProducts:number; totalOrders:number; platformFeeCollected:number; rejectedProducts:number; pendingKyc:number; categories:{id:string;name:string;icon?:string;_count:{products:number}}[]; ordersByStatus:{status:string;_count:{id:number}}[] };
type User = { id:string; name:string; email:string; role:string; status:string; kycStatus:string; kycKtpUrl?:string|null; kycSelfieUrl?:string|null; kycNik?:string|null; createdAt:string; image?:string; store?:{name:string;isVerified:boolean}|null; _count:{orders:number} };
type Product = { id:string; name:string; slug:string; price:number; createdAt:string; isActive:boolean; isFeatured:boolean; isFlashSale:boolean; isModerated:boolean; hasCertificate:boolean; certificateId?:string|null; rejectionReason?:string|null; images:{url:string}[]; store:{name:string}; category:{name:string} };
type Order = { id:string; orderNumber:string; status:string; total:number; createdAt:string; user:{name:string; email:string}; items:{productName:string; product:{store:{name:string}}}[]; address:{city:string;province:string}|null };
type StoreItem = { id:string; name:string; slug:string; province:string; city?:string; isVerified:boolean; isActive:boolean; createdAt:string; user:{name:string;email:string;kycStatus:string}; _count:{products:number} };
type DisputeItem = {
  id:string;
  disputeNumber:string;
  reason:string;
  requestedAction:string;
  status:string;
  resolution?:string|null;
  refundAmount?:number|null;
  createdAt:string;
  assignedAdminId?:string|null;
  assignedAdmin?:{name:string}|null;
  order:{id:string;orderNumber:string;total:number;paymentRef?:string|null};
  buyer:{id:string;name:string;email:string;image?:string|null};
  seller:{id:string;name:string;email:string;image?:string|null};
  _count:{messages:number};
};

const ORDER_LABEL:Record<string,string> = { PENDING_PAYMENT:"Menunggu Bayar", PROCESSING:"Diproses", SHIPPED:"Dikirim", DELIVERED:"Diterima", COMPLETED:"Selesai", CANCELLED:"Dibatalkan", REFUNDED:"Refund" };
const ORDER_COLOR:Record<string,string> = { PENDING_PAYMENT:"bg-yellow-100 text-yellow-700 border-yellow-200", PROCESSING:"bg-blue-100 text-blue-700 border-blue-200", SHIPPED:"bg-purple-100 text-purple-700 border-purple-200", DELIVERED:"bg-teal-100 text-teal-700 border-teal-200", COMPLETED:"bg-green-100 text-green-700 border-green-200", CANCELLED:"bg-red-100 text-red-700 border-red-200" };
const KYC_COLOR:Record<string,string> = { UNVERIFIED:"text-muted-foreground", PENDING:"text-yellow-500", VERIFIED:"text-green-500", REJECTED:"text-red-500" };
const DISPUTE_STATUS_LABEL:Record<string,string> = {
  PENDING_SELLER:"Menunggu Penjual",
  SELLER_RESPONDED:"Penjual Merespons",
  IN_MEDIATION:"Dalam Mediasi",
  REFUND_PENDING:"Refund Diproses",
  REFUND_FAILED:"Refund Gagal",
  RESOLVED:"Selesai",
  CANCELLED:"Dibatalkan",
  CLOSED:"Ditutup",
};
const DISPUTE_STATUS_COLOR:Record<string,string> = {
  PENDING_SELLER:"bg-yellow-100 text-yellow-700 border-yellow-200",
  SELLER_RESPONDED:"bg-blue-100 text-blue-700 border-blue-200",
  IN_MEDIATION:"bg-purple-100 text-purple-700 border-purple-200",
  REFUND_PENDING:"bg-sky-100 text-sky-700 border-sky-200",
  REFUND_FAILED:"bg-red-100 text-red-700 border-red-200",
  RESOLVED:"bg-green-100 text-green-700 border-green-200",
  CANCELLED:"bg-red-100 text-red-700 border-red-200",
  CLOSED:"bg-gray-100 text-gray-700 border-gray-200",
};
const DISPUTE_REASON_LABEL:Record<string,string> = {
  NOT_RECEIVED:"Barang tidak diterima",
  WRONG_ITEM:"Barang tidak sesuai",
  DAMAGED:"Barang rusak/cacat",
  INCOMPLETE:"Barang kurang",
  COUNTERFEIT:"Produk palsu/tidak autentik",
  NOT_AS_DESCRIBED:"Tidak sesuai deskripsi",
  OTHER:"Lainnya",
};

const MENU = [
  { id:"ringkasan", label:"Ringkasan", icon:LayoutDashboard },
  { id:"pengguna", label:"Pengguna", icon:Users },
  { id:"kyc", label:"Verifikasi KYC", icon:UserCheck, badge:true },
  { id:"kurasi", label:"Moderasi Produk", icon:Package, badge:true },
  { id:"sertifikat", label:"Sertifikat Digital", icon:BadgeCheck, badge:true },
  { id:"komplain", label:"Komplain & Sengketa", icon:AlertCircle, badge:true },
  { id:"pesanan", label:"Pesanan", icon:ShoppingBag },
  { id:"toko", label:"Toko", icon:Store },
  { id:"keuangan", label:"Keuangan", icon:DollarSign },
  { id:"ruang-budaya", label:"Ruang Budaya", icon:BookOpen },
  { id:"pengaturan", label:"Pengaturan", icon:Settings },
];

async function apiFetch(url: string) {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();
  return json.data ?? null;
}

function AdminWithdrawals() {
  type WD = {id:string;amount:number;netAmount:number;fee:number;status:string;bankName:string;bankAccount:string;bankHolder:string;adminNote?:string;createdAt:string;store:{name:string;user:{email:string}}};
  const [items, setItems] = React.useState<WD[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [note, setNote] = React.useState<Record<string,string>>({});
  const STATUS_LABEL: Record<string,string> = { PENDING:"Menunggu",APPROVED:"Disetujui",REJECTED:"Ditolak",TRANSFERRED:"Ditransfer" };
  const STATUS_COLOR: Record<string,string> = { PENDING:"bg-yellow-100 text-yellow-700 border-yellow-200",APPROVED:"bg-blue-100 text-blue-700 border-blue-200",REJECTED:"bg-red-100 text-red-700 border-red-200",TRANSFERRED:"bg-green-100 text-green-700 border-green-200" };
  React.useEffect(() => {
    fetch("/api/admin/withdrawals", { credentials:"include" }).then(r=>r.json()).then(d=>{setItems(d.data??[]);setLoading(false);});
  }, []);
  const update = async (id:string, status:string) => {
    await fetch(`/api/admin/withdrawals/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify({ status, adminNote: note[id] ?? "" }) });
    setItems(prev=>prev.map(w=>w.id===id?{...w,status}:w));
  };
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div>;
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">Pengajuan Pencairan</h3>
      {items.length===0 ? <p className="text-muted-foreground text-sm">Belum ada pengajuan</p> : (
        <div className="space-y-3">
          {items.map(w=>(
            <div key={w.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-foreground">{w.store.name} <span className="text-xs text-muted-foreground">{w.store.user.email}</span></p>
                  <p className="text-sm text-amber-700 font-bold">Rp {w.netAmount.toLocaleString("id-ID")} <span className="text-xs text-muted-foreground font-normal">(dari Rp {w.amount.toLocaleString("id-ID")}, fee Rp {w.fee.toLocaleString("id-ID")})</span></p>
                  <p className="text-xs text-muted-foreground">{w.bankName} · {w.bankAccount} · a.n. {w.bankHolder}</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString("id-ID", {day:"2-digit",month:"long",year:"numeric"})}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLOR[w.status]??""}`}>{STATUS_LABEL[w.status]??w.status}</span>
              </div>
              {w.status==="PENDING"&&(
                <div className="space-y-2">
                  <input type="text" placeholder="Catatan admin (opsional)" value={note[w.id]??""} onChange={e=>setNote(n=>({...n,[w.id]:e.target.value}))}
                    className="w-full h-8 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-amber-500"/>
                  <div className="flex gap-2">
                    <button onClick={()=>update(w.id,"APPROVED")} className="h-8 px-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors">✓ Setujui</button>
                    <button onClick={()=>update(w.id,"REJECTED")} className="h-8 px-3 rounded-lg border border-red-300/50 text-red-500 hover:bg-red-900/10 text-xs transition-colors">✗ Tolak</button>
                  </div>
                </div>
              )}
              {w.status==="APPROVED"&&(
                <button onClick={()=>update(w.id,"TRANSFERRED")} className="h-8 px-4 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition-colors">💰 Tandai Sudah Ditransfer</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSettings() {
  const [values, setValues] = React.useState({ fee_percent: "5", max_upload_mb: "10", max_photos_per_product: "5" });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" }).then(r => r.json()).then(d => {
      if (d.data) setValues(v => ({ ...v, ...d.data }));
    });
  }, []);
  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(values) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };
  const fields = [
    { key: "fee_percent", label: "Fee Platform (%)", desc: "Persentase fee dipotong saat pencairan" },
    { key: "max_upload_mb", label: "Max Upload Foto (MB)", desc: "Batas ukuran gambar per file" },
    { key: "max_photos_per_product", label: "Max Foto per Produk", desc: "Jumlah foto maksimal per karya" },
  ];
  return (
    <div className="space-y-4">
      {fields.map(f => (
        <div key={f.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div><p className="text-sm font-medium text-foreground">{f.label}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
          <input type="number" value={values[f.key as keyof typeof values]}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
            className="w-20 h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm text-center focus:outline-none focus:border-amber-500" />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-gold h-10 px-6 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
          {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
        {saved && <span className="text-green-500 text-sm">✓ Tersimpan</span>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState("ringkasan");
  const [roleCheck, setRoleCheck] = useState<"loading"|"ok"|"forbidden">("loading");
  const [stats, setStats] = useState<Stats|null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [nftProducts, setNftProducts] = useState<Product[]>([]);
  const [nftGenerating, setNftGenerating] = useState<string|null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [busy, setBusy] = useState(false);
  // filters
  const [uSearch, setUSearch] = useState("");
  const [uRole, setURole] = useState("");
  const [pFilter, setPFilter] = useState("pending");
  const [oStatus, setOStatus] = useState("");
  const [sSearch, setSSearch] = useState("");
  const [sVerified, setSVerified] = useState("");
  const [disputeStatus, setDisputeStatus] = useState("all");
  const dialog = useModernDialog();

  // Role check
  useEffect(() => {
    apiFetch("/api/users/me").then(d => setRoleCheck(d?.role === "ADMIN" ? "ok" : "forbidden")).catch(() => setRoleCheck("forbidden"));
  }, []);

  // Stats on load
  useEffect(() => {
    if (roleCheck !== "ok") return;
    apiFetch("/api/admin/stats").then(d => setStats(d)).catch(() => {});
  }, [roleCheck]);

  // Load per tab
  useEffect(() => {
    if (roleCheck !== "ok") return;
    const load = async () => {
      setBusy(true);
      try {
        if (tab === "pengguna") {
          const q = new URLSearchParams({...(uSearch && {search:uSearch}), ...(uRole && {role:uRole})});
          const d = await apiFetch(`/api/admin/users?${q}`);
          setUsers(d?.users ?? []);
        } else if (tab === "kyc") {
          const d = await apiFetch(`/api/admin/users?kycStatus=PENDING&limit=50`);
          setUsers(d?.users ?? []);
        } else if (tab === "kurasi") {
          const d = await apiFetch(`/api/admin/products?status=${pFilter}`);
          setProducts(d?.products ?? []);
        } else if (tab === "sertifikat") {
          const d = await apiFetch(`/api/admin/products?status=all&limit=100`);
          setNftProducts(d?.products ?? []);
        } else if (tab === "pesanan") {
          const q = new URLSearchParams({...(oStatus && {status:oStatus})});
          const d = await apiFetch(`/api/admin/orders?${q}`);
          setOrders(d?.orders ?? []);
        } else if (tab === "toko") {
          const q = new URLSearchParams({...(sSearch && {search:sSearch}), ...(sVerified && {verified:sVerified})});
          const d = await apiFetch(`/api/admin/stores?${q}`);
          setStores(d?.stores ?? []);
        } else if (tab === "komplain") {
          const q = new URLSearchParams({ ...(disputeStatus && { status: disputeStatus }), limit: "100" });
          const d = await apiFetch(`/api/admin/disputes?${q}`);
          setDisputes(d?.disputes ?? []);
        }
      } catch(e) { console.error(e); } finally { setBusy(false); }
    };
    load();
  }, [tab, roleCheck, pFilter, disputeStatus]); // eslint-disable-line

  const reloadCurrent = async () => {
    setBusy(true);
    try {
      if (tab === "pengguna") { const q = new URLSearchParams({...(uSearch&&{search:uSearch}), ...(uRole&&{role:uRole})}); const d = await apiFetch(`/api/admin/users?${q}`); setUsers(d?.users??[]); }
      else if (tab === "kyc") { const d = await apiFetch(`/api/admin/users?kycStatus=PENDING&limit=50`); setUsers(d?.users??[]); }
      else if (tab === "kurasi") { const d = await apiFetch(`/api/admin/products?status=${pFilter}`); setProducts(d?.products??[]); }
      else if (tab === "sertifikat") { const d = await apiFetch(`/api/admin/products?status=all&limit=100`); setNftProducts(d?.products??[]); }
      else if (tab === "pesanan") { const q = new URLSearchParams({...(oStatus&&{status:oStatus})}); const d = await apiFetch(`/api/admin/orders?${q}`); setOrders(d?.orders??[]); }
      else if (tab === "toko") { const q = new URLSearchParams({...(sSearch&&{search:sSearch}), ...(sVerified&&{verified:sVerified})}); const d = await apiFetch(`/api/admin/stores?${q}`); setStores(d?.stores??[]); }
      else if (tab === "komplain") { const q = new URLSearchParams({ ...(disputeStatus&&{status:disputeStatus}), limit:"100" }); const d = await apiFetch(`/api/admin/disputes?${q}`); setDisputes(d?.disputes??[]); }
    } catch(e) { console.error(e); } finally { setBusy(false); }
  };

  const assignDispute = async (id: string) => {
    const res = await fetch(`/api/admin/disputes/${id}/assign`, { method: "POST", credentials: "include" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      await dialog.alert(d.error ?? "Gagal assign mediator");
      return;
    }
    reloadCurrent();
  };

  const checkRefundStatusNow = async (dispute: DisputeItem) => {
    const res = await fetch(`/api/payment/check/${dispute.order.id}`, {
      method: "GET",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      await dialog.alert(json.error ?? "Gagal cek status refund");
      return;
    }

    const latestStatus = json?.data?.status ?? "UNKNOWN";
    await dialog.alert(
      `Status pesanan terbaru: ${latestStatus}${
        latestStatus === "REFUNDED"
          ? "\nRefund sudah terkonfirmasi dan sengketa akan disinkronkan otomatis."
          : ""
      }`
    );
    await reloadCurrent();
  };

  const confirmManualRefund = async (dispute: DisputeItem) => {
    const amount = dispute.refundAmount ?? dispute.order.total;
    const confirm = await dialog.confirm(
      `Konfirmasi transfer refund manual sebesar Rp ${amount.toLocaleString("id-ID")} ke pembeli "${dispute.buyer.name}" (${dispute.buyer.email})?\n\nPastikan transfer sudah dilakukan sebelum mengkonfirmasi.`
    );
    if (!confirm) return;

    const note = await dialog.prompt({
      title: "Catatan Transfer",
      message: "Catatan bukti transfer (opsional, misal: No. ref transfer bank):",
      defaultValue: "",
      placeholder: "contoh: Ref 20260723-001",
    });
    if (note === null) return;

    const res = await fetch(`/api/admin/disputes/${dispute.id}/confirm-refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ adminNote: note || "Transfer manual dikonfirmasi admin" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      await dialog.alert(json.error ?? "Gagal mengkonfirmasi transfer");
      return;
    }
    await dialog.alert("✅ Transfer berhasil dikonfirmasi. Dispute selesai.");
    reloadCurrent();
  };

  const approveProduct = async (id:string) => { await fetch(`/api/admin/products/${id}/approve`,{method:"POST",credentials:"include"}); setProducts(p=>p.filter(x=>x.id!==id)); setStats(s=>s?{...s,rejectedProducts:Math.max(0,s.rejectedProducts-1)}:s); };
  const rejectProduct = async (id:string, reason:string) => {
    const res = await fetch(`/api/admin/products/${id}/reject`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      await dialog.alert(d.error ?? "Gagal menolak produk. Coba lagi.");
      return;
    }
    // Reload list dari DB — reflect state terbaru
    reloadCurrent();
  };
  const curateProduct = async (id:string) => { await fetch(`/api/admin/products/${id}/moderate`,{method:"POST",credentials:"include"}); setProducts(p=>p.map(x=>x.id===id?{...x,isModerated:true}:x)); };
  const markPhygital = async (id:string, current:boolean) => {
    const res = await fetch(`/api/admin/products/${id}/mark-phygital`,{method:"POST",credentials:"include"});
    if (res.ok) setProducts(p=>p.map(x=>x.id===id?{...x,hasCertificate:!current}:x));
  };
  const generateNFT = async (id:string) => {
    setNftGenerating(id);
    const res = await fetch(`/api/admin/nft/${id}/generate`,{method:"POST",credentials:"include"});
    const d = await res.json();
    if (res.ok) {
      setNftProducts(p=>p.map(x=>x.id===id?{...x,certificateId:d.data?.certificateId}:x));
      await dialog.alert(`✅ NFT berhasil diterbitkan!\nCertificate ID: ${d.data?.certificateId}`);
    } else { await dialog.alert(d.error ?? "Gagal generate NFT"); }
    setNftGenerating(null);
  };
  const deleteProduct = async (id:string, name:string) => {
    if (!(await dialog.confirm(`Hapus produk "${name}" secara permanen? Tindakan ini tidak bisa dibatalkan.`))) return;
    const res = await fetch(`/api/admin/products/${id}`,{method:"DELETE",credentials:"include"});
    if (res.ok) { setProducts(p=>p.filter(x=>x.id!==id)); }
    else { const d = await res.json(); await dialog.alert(d.error ?? "Gagal menghapus produk"); }
  };
  const [rejectModal, setRejectModal] = React.useState<{id:string;name:string}|null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejecting, setRejecting] = React.useState(false);
  const [rejectDone, setRejectDone] = React.useState(false);
  const Star = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
  const toggleFeatured = async (id:string, current:boolean) => {
    await fetch(`/api/admin/products/${id}/feature`,{method:"POST",credentials:"include"});
    setProducts(p=>p.map(x=>x.id===id?{...x,isFeatured:!current}:x));
  };
  const toggleFlashSale = async (id:string, current:boolean) => {
    await fetch(`/api/admin/products/${id}/flashsale`,{method:"POST",credentials:"include"});
    setProducts(p=>p.map(x=>x.id===id?{...x,isFlashSale:!current}:x));
  };
  const patchUser = async (id:string, data:object) => { await fetch(`/api/admin/users/${id}`,{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); setUsers(u=>u.map(x=>x.id===id?{...x,...data}:x)); };
  const patchStore = async (id:string, data:object) => { await fetch(`/api/admin/stores/${id}`,{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); setStores(s=>s.map(x=>x.id===id?{...x,...data}:x)); };

  if (roleCheck==="loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  if (roleCheck==="forbidden") return <div className="min-h-screen flex items-center justify-center text-center px-4"><div><Shield className="w-12 h-12 text-red-500 mx-auto mb-3"/><h1 className="text-xl font-bold">Akses Ditolak</h1><p className="text-muted-foreground text-sm mt-2">Halaman ini hanya untuk Admin</p><Link href="/" className="text-amber-600 text-sm mt-4 inline-block">← Beranda</Link></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/20 border border-red-800/30 flex items-center justify-center"><Shield className="w-5 h-5 text-red-400"/></div>
            <div><h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1><p className="text-xs text-muted-foreground">Panel manajemen MajaCraft</p></div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-red-900/20 border border-red-800/30 text-red-400 font-semibold">Admin Access</span>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-gold">
          <div className="flex gap-2 pb-1 w-max">
            {MENU.map(m=>(
              <button key={m.id} onClick={()=>setTab(m.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${tab===m.id?"bg-red-700 text-white":"bg-card border border-border text-muted-foreground"}`}>
                <m.icon className="w-3.5 h-3.5"/>{m.label}
                {m.id==="kyc"&&(stats?.pendingKyc??0)>0&&<span className="bg-yellow-500 text-white text-[9px] px-1.5 rounded-full">{stats?.pendingKyc}</span>}
                {m.id==="kurasi"&&(stats?.rejectedProducts??0)>0&&<span className="bg-yellow-500 text-white text-[9px] px-1.5 rounded-full">{stats?.rejectedProducts}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden md:block w-52 flex-shrink-0 space-y-1">
            {MENU.map(m=>(
              <button key={m.id} onClick={()=>setTab(m.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${tab===m.id?"bg-red-900/20 text-red-400 font-medium border border-red-800/30":"text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <m.icon className="w-4 h-4"/>{m.label}
                {m.id==="kyc"&&(stats?.pendingKyc??0)>0&&<span className="ml-auto bg-yellow-500 text-white text-[9px] px-1.5 rounded-full">{stats?.pendingKyc}</span>}
                {m.id==="kurasi"&&(stats?.rejectedProducts??0)>0&&<span className="ml-auto bg-yellow-500 text-white text-[9px] px-1.5 rounded-full">{stats?.rejectedProducts}</span>}
              </button>
            ))}
          </aside>

          <div className="flex-1 min-w-0">

            {/* RINGKASAN */}
            {tab==="ringkasan"&&(
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{l:"Total Pengguna",v:stats?.totalUsers??0,sub:`${stats?.totalSellers??0} Seniman`,i:Users},{l:"Fee Platform",v:formatRupiah(stats?.platformFeeCollected??0),sub:"Terkumpul",i:DollarSign},{l:"Produk Aktif",v:stats?.totalProducts??0,sub:`${stats?.rejectedProducts??0} ditolak`,i:Package},{l:"Total Pesanan",v:stats?.totalOrders??0,sub:"Semua waktu",i:ShoppingBag},{l:"KYC Pending",v:stats?.pendingKyc??0,sub:"Menunggu verif",i:UserCheck},{l:"Produk Ditolak",v:stats?.rejectedProducts??0,sub:"Perlu perbaikan",i:AlertCircle}].map(s=>(
                    <div key={s.l} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">{s.l}</p><s.i className="w-4 h-4 text-amber-600"/></div>
                      <p className="text-xl font-bold text-foreground">{!stats?"...":s.v}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>
                {stats?.ordersByStatus&&stats.ordersByStatus.length>0&&(
                  <div><h2 className="font-semibold text-foreground mb-3">Status Pesanan</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {stats.ordersByStatus.map(s=>(
                        <div key={s.status} className={`p-3 rounded-xl border text-center ${ORDER_COLOR[s.status]??"bg-gray-100 border-gray-200 text-gray-600"}`}>
                          <p className="text-2xl font-bold">{s._count.id}</p>
                          <p className="text-xs mt-0.5">{ORDER_LABEL[s.status]??s.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {stats?.categories&&(
                  <div><h2 className="font-semibold text-foreground mb-3">Produk per Kategori</h2>
                    <div className="space-y-2">
                      {stats.categories.map(c=>{
                        const pct=(stats.totalProducts??1)>0?Math.round((c._count.products/stats.totalProducts)*100):0;
                        return(<div key={c.id} className="flex items-center gap-3"><span className="text-base w-7">{c.icon??"🎨"}</span><div className="flex-1"><div className="flex justify-between mb-0.5 text-xs"><span>{c.name}</span><span className="text-muted-foreground">{c._count.products}</span></div><div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" style={{width:`${pct}%`}}/></div></div></div>);
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PENGGUNA */}
            {tab==="pengguna"&&(
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-foreground">Manajemen Pengguna</h2>
                  <div className="flex gap-2 ml-auto flex-wrap">
                    <div className="relative"><Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground"/><input type="text" placeholder="Cari..." value={uSearch} onChange={e=>setUSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&reloadCurrent()} className="pl-8 h-8 w-40 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none"/></div>
                    <select value={uRole} onChange={e=>setURole(e.target.value)} className="h-8 px-2 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none appearance-none"><option value="">Semua</option><option value="BUYER">Pembeli</option><option value="SELLER">Seniman</option><option value="ADMIN">Admin</option></select>
                    <button onClick={reloadCurrent} className="h-8 px-3 rounded-lg bg-amber-700 text-white text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Cari</button>
                  </div>
                </div>
                {busy?<div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div>:(
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm"><thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr><th className="px-4 py-3 text-left">Pengguna</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">KYC</th><th className="px-4 py-3 text-left">Toko</th><th className="px-4 py-3 text-left">Bergabung</th><th className="px-4 py-3 text-left">Aksi</th></tr></thead>
                    <tbody>
                      {users.length===0?<tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Tidak ada data</td></tr>:users.map((u,i)=>(
                        <tr key={u.id} className={`border-t border-border ${i%2?"bg-muted/20":""}`}>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-amber-900/30 overflow-hidden flex-shrink-0 flex items-center justify-center">{u.image?<Image src={u.image} alt="" width={28} height={28} className="object-cover" referrerPolicy="no-referrer"/>:<span className="text-xs font-bold text-amber-400">{u.name?.[0]?.toUpperCase()}</span>}</div><div><p className="text-xs font-medium line-clamp-1 max-w-[120px]">{u.name}</p><p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{u.email}</p></div></div></td>
                          <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.role==="ADMIN"?"border-red-700/40 text-red-400":u.role==="SELLER"?"border-amber-700/40 text-amber-600":"border-border text-muted-foreground"}`}>{u.role==="BUYER"?"Pembeli":u.role==="SELLER"?"Seniman":"Admin"}</span></td>
                          <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${u.status==="ACTIVE"?"bg-green-100 text-green-700 border-green-200":u.status==="BANNED"?"bg-red-100 text-red-700 border-red-200":"bg-yellow-100 text-yellow-700 border-yellow-200"}`}>{u.status.toLowerCase()}</span></td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-semibold ${KYC_COLOR[u.kycStatus]}`}>{u.kycStatus.toLowerCase()}</span></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{u.store?.name??"—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"2-digit"})}</td>
                          <td className="px-4 py-3"><div className="flex gap-0.5">
                            {u.status!=="BANNED"?<button onClick={()=>patchUser(u.id,{status:"BANNED"})} title="Ban" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-red-400"><Ban className="w-3.5 h-3.5"/></button>:<button onClick={()=>patchUser(u.id,{status:"ACTIVE"})} title="Unban" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-green-400"><CheckCircle2 className="w-3.5 h-3.5"/></button>}
                            {u.kycStatus==="PENDING"&&<><button onClick={()=>patchUser(u.id,{kycStatus:"VERIFIED"})} title="Verif KYC" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-amber-500"><UserCheck className="w-3.5 h-3.5"/></button><button onClick={()=>patchUser(u.id,{kycStatus:"REJECTED"})} title="Tolak KYC" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-red-400"><XCircle className="w-3.5 h-3.5"/></button></>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
              </div>
            )}

            {/* KYC */}
            {tab==="kyc"&&(
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Verifikasi KYC</h2>
                  <span className="text-xs text-muted-foreground">{users.filter(u=>u.kycStatus==="PENDING").length} menunggu verifikasi</span>
                </div>
                {busy ? <div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div> : (
                  <div className="space-y-4">
                    {users.filter(u=>u.kycStatus==="PENDING").length===0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm"><UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30"/>Tidak ada permohonan KYC</div>
                    ) : users.filter(u=>u.kycStatus==="PENDING").map(u=>(
                      <div key={u.id} className="p-5 rounded-xl border border-yellow-700/30 bg-yellow-900/5 space-y-4">
                        {/* User info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {u.image ? <img src={u.image} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-400 font-bold">{u.name?.[0]?.toUpperCase()}</div>}
                            <div>
                              <p className="font-semibold text-foreground text-sm">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                              {u.kycNik && <p className="text-xs text-amber-600 font-mono mt-0.5">NIK: {u.kycNik}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">Pending KYC</span>
                        </div>
                        {/* Foto dokumen */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Foto KTP</p>
                            {u.kycKtpUrl ? (
                              <a href={u.kycKtpUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={u.kycKtpUrl} alt="KTP" width={300} height={190} className="w-full h-36 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity" />
                                <p className="text-[10px] text-amber-600 mt-1 text-center">Klik untuk perbesar →</p>
                              </a>
                            ) : <div className="w-full h-36 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">Foto tidak tersedia</div>}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Selfie + KTP</p>
                            {u.kycSelfieUrl ? (
                              <a href={u.kycSelfieUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={u.kycSelfieUrl} alt="Selfie" width={300} height={190} className="w-full h-36 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity" />
                                <p className="text-[10px] text-amber-600 mt-1 text-center">Klik untuk perbesar →</p>
                              </a>
                            ) : <div className="w-full h-36 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">Foto tidak tersedia</div>}
                          </div>
                        </div>
                        {/* Aksi */}
                        <div className="flex gap-2 pt-1">
                          <button onClick={async ()=>{ if (await dialog.confirm("Setujui KYC dan jadikan seniman?")) { patchUser(u.id,{kycStatus:"VERIFIED",role:"SELLER"}); } }} 
                            className="flex-1 h-9 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                            <UserCheck className="w-3.5 h-3.5"/> Setujui & Jadikan Seniman
                          </button>
                          <button onClick={()=>patchUser(u.id,{kycStatus:"REJECTED"})}
                            className="h-9 px-4 rounded-lg border border-red-700/30 text-red-400 hover:bg-red-900/10 text-xs font-medium flex items-center gap-1.5 transition-colors">
                            <XCircle className="w-3.5 h-3.5"/> Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Riwayat KYC terverifikasi */}
                    {users.filter(u=>u.kycStatus==="VERIFIED"||u.kycStatus==="REJECTED").length > 0 && (
                      <details className="mt-4">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Riwayat ({users.filter(u=>u.kycStatus==="VERIFIED"||u.kycStatus==="REJECTED").length} pengguna)</summary>
                        <div className="mt-3 space-y-2">
                          {users.filter(u=>u.kycStatus==="VERIFIED"||u.kycStatus==="REJECTED").map(u=>(
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm">
                              <div>
                                <span className="font-medium text-foreground">{u.name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                              </div>
                              <span className={`text-xs font-semibold ${KYC_COLOR[u.kycStatus]}`}>{u.kycStatus}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODERATION */}
            {tab==="kurasi"&&(
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-semibold text-foreground">Moderasi Produk</h2>
                  <div className="flex gap-2 ml-auto">
                    {[{v:"pending",l:"Perlu Review"},{v:"needs_fix",l:"Perlu Perbaikan"},{v:"active",l:"Disetujui"},{v:"inactive",l:"Nonaktif"},{v:"all",l:"Semua"}].map(f=>(
                      <button key={f.v} onClick={()=>setPFilter(f.v)} className={`text-xs px-3 h-7 rounded-full border ${pFilter===f.v?"bg-amber-700 text-white border-amber-600":"border-border text-muted-foreground"}`}>{f.l}</button>
                    ))}
                    <button onClick={reloadCurrent} className="p-1.5 text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4"/></button>
                  </div>
                </div>
                {busy?<div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div>:products.length===0?<div className="text-center py-12 text-muted-foreground text-sm"><Package className="w-8 h-8 mx-auto mb-2 opacity-30"/>Tidak ada produk</div>:(
                  <div className="space-y-3">
                    {products.map(p=>(
                      <div key={p.id} className={`p-4 rounded-xl border bg-card ${!p.isActive?"border-yellow-300/40":"border-border"}`}>
                        <div className="flex items-start gap-4">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {p.images[0]
                              ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).src=`/images/product-1.svg`;}}/>
                              : <span className="w-full h-full flex items-center justify-center text-xl">🎨</span>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm text-foreground line-clamp-1">{p.name}</h3>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {p.isModerated&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">✓ Disetujui</span>}
                                {p.hasCertificate && !p.certificateId && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300">🎥 Phygital Pending</span>}
                                {p.certificateId && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-700 text-white border border-purple-600">✨ NFT Terbit</span>}
                                {p.isModerated && p.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">✓ Disetujui</span>}
                                {!p.isModerated && !p.rejectionReason && p.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">⏳ Perlu Review</span>}
                                {p.rejectionReason && !p.isModerated && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">📝 Perlu Perbaikan</span>}
                                {!p.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">❌ Nonaktif</span>}
                                {p.isFeatured&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">⭐ Pilihan</span>}
                              </div>
                            </div>
                            <p className="text-xs text-amber-600 font-semibold mt-0.5">{formatRupiah(p.price)}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5"><span>🏪 {p.store.name}</span><span>📂 {p.category.name}</span><span>📅 {new Date(p.createdAt).toLocaleDateString("id-ID")}</span></div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {!p.isModerated&&<>
                            <button onClick={()=>curateProduct(p.id)} className="flex-1 h-8 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/>Setujui</button>
                            <button onClick={()=>{setRejectModal({id:p.id,name:p.name});setRejectReason("");}} className="h-8 px-4 rounded-lg border border-orange-400/50 text-orange-500 hover:bg-orange-900/10 text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5"/>Kirim Masukan ke Seller</button>
                          </>
                          }
                          {p.isActive && (
                            <button
                              onClick={async()=>{ if(await dialog.confirm(`Nonaktifkan produk "${p.name}"? Produk tidak akan muncul di marketplace.`)) { await fetch(`/api/admin/products/${p.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({isActive:false})}); reloadCurrent(); } }}
                              className="h-8 px-3 rounded-lg border border-red-400/40 text-red-500 hover:bg-red-900/10 text-xs flex items-center gap-1"
                              title="Nonaktifkan produk"
                            >
                              Nonaktifkan
                            </button>
                          )}
                          {!p.isActive && (
                            <button
                              onClick={async()=>{ await fetch(`/api/admin/products/${p.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({isActive:true})}); reloadCurrent(); }}
                              className="h-8 px-3 rounded-lg border border-green-400/40 text-green-500 hover:bg-green-900/10 text-xs flex items-center gap-1"
                              title="Aktifkan kembali"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                          <button
                            onClick={()=>toggleFeatured(p.id, p.isFeatured)}
                            title={p.isFeatured?"Hapus dari Karya Pilihan":"Jadikan Karya Pilihan"}
                            className={`h-8 px-3 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${p.isFeatured?"border-amber-500 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40":"border-border text-muted-foreground hover:border-amber-500 hover:text-amber-400"}`}
                          >
                            <Star filled={p.isFeatured}/>{p.isFeatured?"Hapus Pilihan":"Jadikan Pilihan"}
                          </button>
                          <button
                            onClick={()=>toggleFlashSale(p.id, p.isFlashSale)}
                            title={p.isFlashSale?"Hapus dari Flash Sale":"Masukkan ke Flash Sale"}
                            className={`h-8 px-3 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${p.isFlashSale?"border-red-500 bg-red-900/20 text-red-400 hover:bg-red-900/40":"border-border text-muted-foreground hover:border-red-500 hover:text-red-400"}`}
                          >
                            ⚡{p.isFlashSale?"Hapus Flash Sale":"Flash Sale"}
                          </button>
                          <Link href={`/produk/${p.slug}`} target="_blank" className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs flex items-center">👁</Link>
                          <button
                            onClick={()=>markPhygital(p.id, p.hasCertificate)}
                            title={p.hasCertificate?"Cabut Phygital":"Tandai sebagai Phygital"}
                            disabled={!!p.certificateId}
                            className={`h-8 px-3 rounded-lg border text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
                              p.hasCertificate?"border-purple-500 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40":"border-border text-muted-foreground hover:border-purple-500 hover:text-purple-400"}`}>
                            🎥{p.hasCertificate?"Phygital":"Tandai Phygital"}
                          </button>
                          <button
                            onClick={()=>deleteProduct(p.id, p.name)}
                            className="h-8 px-3 rounded-lg border border-red-300/40 text-red-500 hover:bg-red-900/10 text-xs flex items-center gap-1.5 transition-colors"
                            title="Hapus permanen">
                            <Trash2 className="w-3.5 h-3.5"/>Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SERTIFIKAT DIGITAL ── */}
            {tab==="sertifikat"&&(
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Sertifikat Digital (NFT)</h2>
                  <button onClick={reloadCurrent} className="p-1.5 text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4"/></button>
                </div>

                {/* Pending Mint */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block"/>
                    Menunggu Generate NFT ({nftProducts.filter(p=>p.hasCertificate&&!p.certificateId).length})
                  </h3>
                  {nftProducts.filter(p=>p.hasCertificate&&!p.certificateId).length===0
                    ? <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">Tidak ada produk yang menunggu NFT. Tandai produk sebagai Phygital di tab Moderasi Produk.</p>
                    : (
                      <div className="space-y-3">
                        {nftProducts.filter(p=>p.hasCertificate&&!p.certificateId).map(p=>(
                          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-purple-800/30 bg-purple-900/10">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {p.images[0]?<img src={p.images[0].url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).src="/images/product-1.svg";}}/>:<span className="w-full h-full flex items-center justify-center text-xl">🎨</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">🏪 {p.store.name} · 📂 {p.category.name}</p>
                              <p className="text-xs text-purple-400 mt-0.5">Ditandai Phygital · Menunggu NFT</p>
                            </div>
                            <button
                              onClick={()=>generateNFT(p.id)}
                              disabled={nftGenerating===p.id}
                              className="h-9 px-4 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 flex-shrink-0">
                              {nftGenerating===p.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:"✨"}
                              {nftGenerating===p.id?"Generating...":"Generate NFT"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Sudah Terbit */}
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>
                    NFT Sudah Terbit ({nftProducts.filter(p=>!!p.certificateId).length})
                  </h3>
                  {nftProducts.filter(p=>!!p.certificateId).length===0
                    ? <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">Belum ada NFT yang diterbitkan.</p>
                    : (
                      <div className="space-y-3">
                        {nftProducts.filter(p=>!!p.certificateId).map(p=>(
                          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-green-800/20 bg-green-900/5">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {p.images[0]?<img src={p.images[0].url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).src="/images/product-1.svg";}}/>:<span className="w-full h-full flex items-center justify-center text-xl">🎨</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">🏪 {p.store.name}</p>
                              <p className="text-xs text-green-400 font-mono mt-0.5">🎫 {p.certificateId}</p>
                            </div>
                            <Link href={`/verifikasi/${p.certificateId}`} target="_blank" className="h-9 px-3 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs flex items-center gap-1.5 flex-shrink-0">
                              👁 Lihat Sertifikat
                            </Link>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              </div>
            )}

            {/* KOMPLAIN & SENGKETA */}
            {tab==="komplain"&&(
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-semibold text-foreground">Komplain & Sengketa</h2>
                  <div className="flex gap-2 ml-auto">
                    <select value={disputeStatus} onChange={e=>setDisputeStatus(e.target.value)} className="h-8 px-2 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none appearance-none">
                      <option value="all">Semua Status</option>
                      <option value="PENDING_SELLER">Menunggu Penjual</option>
                      <option value="SELLER_RESPONDED">Penjual Merespons</option>
                      <option value="IN_MEDIATION">Dalam Mediasi</option>
                      <option value="REFUND_PENDING">Refund Diproses</option>
                      <option value="REFUND_FAILED">Refund Gagal</option>
                      <option value="RESOLVED">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </select>
                    <button onClick={reloadCurrent} className="h-8 px-3 rounded-lg bg-amber-700 text-white text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Filter</button>
                  </div>
                </div>

                {busy?<div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div>:disputes.length===0?<div className="text-center py-12 text-muted-foreground text-sm"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30"/>Belum ada komplain</div>:(
                  <div className="space-y-3">
                    {disputes.map(d=>{
                      const chatUrl = `/pesanan/${d.order.id}/komplain/${d.id}`;
                      return (
                        <div key={d.id} className="p-4 rounded-xl border border-border bg-card">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{d.disputeNumber}</p>
                              <p className="font-semibold text-foreground text-sm">Order #{d.order.orderNumber}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${DISPUTE_STATUS_COLOR[d.status]??"bg-gray-100 text-gray-700 border-gray-200"}`}>{DISPUTE_STATUS_LABEL[d.status]??d.status}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-3">
                            <p className="text-muted-foreground">Pembeli: <span className="text-foreground font-medium">{d.buyer.name}</span></p>
                            <p className="text-muted-foreground">Penjual: <span className="text-foreground font-medium">{d.seller.name}</span></p>
                            <p className="text-muted-foreground">Pesan: <span className="text-foreground font-medium">{d._count.messages}</span></p>
                          </div>

                          <div className="text-xs text-muted-foreground mb-3 space-y-1">
                            <p>Alasan: <span className="text-foreground">{DISPUTE_REASON_LABEL[d.reason]??d.reason}</span></p>
                            <p>Aksi diminta: <span className="text-foreground">{d.requestedAction}</span></p>
                            <p>Dibuat: <span className="text-foreground">{new Date(d.createdAt).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</span></p>
                            <p>Mediator: <span className="text-foreground">{d.assignedAdmin?.name ?? "Belum ditugaskan"}</span></p>
                            {d.status === "REFUND_PENDING" && (
                              <p className="font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg">
                                💰 Nominal refund: {formatRupiah(d.refundAmount ?? d.order.total)}
                                {d.order.paymentRef && <span className="font-normal text-muted-foreground ml-2">· Ref iPaymu: {d.order.paymentRef}</span>}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {!d.assignedAdminId && d.status === "IN_MEDIATION" && (
                              <button onClick={()=>assignDispute(d.id)} className="h-8 px-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold">Assign ke Saya</button>
                            )}
                            {d.status === "REFUND_PENDING" && d.resolution === "REFUND_APPROVED" && (
                              <button
                                onClick={() => confirmManualRefund(d)}
                                className="h-8 px-3 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold flex items-center gap-1.5"
                              >
                                ✓ Konfirmasi Transfer Manual Selesai
                              </button>
                            )}
                            {["REFUND_PENDING", "REFUND_FAILED", "IN_MEDIATION", "RESOLVED"].includes(d.status) && (
                              <button
                                onClick={() => checkRefundStatusNow(d)}
                                className="h-8 px-3 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold"
                              >
                                Cek Status Refund Sekarang
                              </button>
                            )}
                            <Link href={chatUrl} className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5"/>Buka Chat
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PESANAN */}
            {tab==="pesanan"&&(
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-semibold text-foreground">Semua Pesanan</h2>
                  <div className="flex gap-2 ml-auto">
                    <select value={oStatus} onChange={e=>setOStatus(e.target.value)} className="h-8 px-2 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none appearance-none"><option value="">Semua Status</option>{Object.entries(ORDER_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
                    <button onClick={reloadCurrent} className="h-8 px-3 rounded-lg bg-amber-700 text-white text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Filter</button>
                  </div>
                </div>
                {busy?<div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div>:(
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm"><thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Pembeli</th><th className="px-4 py-3 text-left">Produk</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Tgl</th></tr></thead>
                    <tbody>
                      {orders.length===0?<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">Tidak ada pesanan</td></tr>:orders.map((o,i)=>(
                        <tr key={o.id} className={`border-t border-border ${i%2?"bg-muted/20":""}`}>
                          <td className="px-4 py-3 font-mono text-xs text-amber-600">{o.orderNumber.slice(-8)}</td>
                          <td className="px-4 py-3"><p className="text-xs font-medium line-clamp-1 max-w-[120px]">{o.user.name}</p><p className="text-[10px] text-muted-foreground">{o.address?.city}</p></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px]"><p className="line-clamp-1">{o.items[0]?.productName}</p><p className="text-[10px]">{o.items[0]?.product?.store?.name}</p></td>
                          <td className="px-4 py-3 text-xs font-bold text-amber-700">{formatRupiah(o.total)}</td>
                          <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ORDER_COLOR[o.status]??""}`}>{ORDER_LABEL[o.status]??o.status}</span></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
              </div>
            )}

            {/* TOKO */}
            {tab==="toko"&&(
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-semibold text-foreground">Manajemen Toko</h2>
                  <div className="flex gap-2 ml-auto flex-wrap">
                    <div className="relative"><Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground"/><input type="text" placeholder="Cari toko..." value={sSearch} onChange={e=>setSSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&reloadCurrent()} className="pl-8 h-8 w-36 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none"/></div>
                    <select value={sVerified} onChange={e=>setSVerified(e.target.value)} className="h-8 px-2 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none appearance-none"><option value="">Semua</option><option value="true">Terverifikasi</option><option value="false">Belum</option></select>
                    <button onClick={reloadCurrent} className="h-8 px-3 rounded-lg bg-amber-700 text-white text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Cari</button>
                  </div>
                </div>
                {busy?<div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600"/></div>:(
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-sm"><thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr><th className="px-4 py-3 text-left">Toko</th><th className="px-4 py-3 text-left">Pemilik</th><th className="px-4 py-3 text-left">Lokasi</th><th className="px-4 py-3 text-left">Produk</th><th className="px-4 py-3 text-left">KYC</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Aksi</th></tr></thead>
                    <tbody>
                      {stores.length===0?<tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Tidak ada toko</td></tr>:stores.map((s,i)=>(
                        <tr key={s.id} className={`border-t border-border ${i%2?"bg-muted/20":""}`}>
                          <td className="px-4 py-3"><p className="text-xs font-semibold">{s.name}</p><p className="text-[10px] text-muted-foreground">/{s.slug}</p></td>
                          <td className="px-4 py-3"><p className="text-xs">{s.user.name}</p><p className="text-[10px] text-muted-foreground truncate max-w-[110px]">{s.user.email}</p></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.city??s.province}</td>
                          <td className="px-4 py-3 text-xs text-center">{s._count.products}</td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-semibold ${KYC_COLOR[s.user.kycStatus]}`}>{s.user.kycStatus.toLowerCase()}</span></td>
                          <td className="px-4 py-3">{s.isVerified?<span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit"><BadgeCheck className="w-3 h-3"/>Terverifikasi</span>:<span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Belum verif</span>}</td>
                          <td className="px-4 py-3"><div className="flex gap-1">
                            {!s.isVerified?<button onClick={()=>patchStore(s.id,{isVerified:true})} title="Verifikasi" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-amber-500"><BadgeCheck className="w-3.5 h-3.5"/></button>:<button onClick={()=>patchStore(s.id,{isVerified:false})} title="Cabut verif" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-yellow-500"><XCircle className="w-3.5 h-3.5"/></button>}
                            {s.isActive?<button onClick={()=>patchStore(s.id,{isActive:false})} title="Nonaktifkan" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-red-400"><Ban className="w-3.5 h-3.5"/></button>:<button onClick={()=>patchStore(s.id,{isActive:true})} title="Aktifkan" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-green-400"><CheckCircle2 className="w-3.5 h-3.5"/></button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
              </div>
            )}

            {/* KEUANGAN */}
            {tab==="keuangan"&&(
              <div className="space-y-6">
                <h2 className="font-semibold text-foreground">Laporan Keuangan</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[{l:"Fee Platform Terkumpul",v:formatRupiah(stats?.platformFeeCollected??0),d:"5% dari transaksi selesai"},{l:"Total Pesanan",v:String(stats?.totalOrders??0),d:"Semua waktu"},{l:"Total Seniman",v:String(stats?.totalSellers??0),d:"Terdaftar"},{l:"Total Pengguna",v:String(stats?.totalUsers??0),d:"Pembeli + Seniman + Admin"}].map(item=>(
                    <div key={item.l} className="p-5 rounded-xl border border-border bg-card">
                      <p className="text-sm text-muted-foreground">{item.l}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{!stats?"...":item.v}</p>
                      <p className="text-xs text-amber-600 mt-1">{item.d}</p>
                    </div>
                  ))}
                </div>
                <AdminWithdrawals />
              </div>
            )}

            {/* RUANG BUDAYA */}
            {tab==="ruang-budaya"&&(
              <RuangBudayaAdmin />
            )}

            {/* PENGATURAN */}
            {tab==="pengaturan"&&(
              <div className="space-y-6 max-w-lg">
                <h2 className="font-semibold text-foreground">Pengaturan Platform</h2>
                <AdminSettings />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal alasan tolak */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
            {rejectDone ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold text-foreground mb-1">Penolakan Terkirim</h3>
                <p className="text-sm text-muted-foreground">Seller telah mendapat notifikasi dan email alasan penolakan.</p>
                <button onClick={()=>{ setRejectModal(null); setRejectDone(false); }} className="mt-4 h-9 px-6 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:bg-muted">Tutup</button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-foreground mb-1">Tolak Produk</h3>
                <p className="text-sm text-muted-foreground mb-4">Berikan alasan penolakan untuk <span className="text-amber-400 font-medium">{rejectModal.name}</span>. Seller akan mendapat notifikasi.</p>
                <textarea
                  value={rejectReason}
                  onChange={e=>setRejectReason(e.target.value)}
                  placeholder="cth: Foto produk kurang jelas, deskripsi tidak lengkap, produk tidak sesuai kategori..."
                  rows={4}
                  disabled={rejecting}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 resize-none mb-4 disabled:opacity-50"
                />
                <div className="flex gap-3">
                  <button onClick={()=>setRejectModal(null)} disabled={rejecting} className="flex-1 h-10 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm disabled:opacity-50">Batal</button>
                  <button
                    disabled={rejecting || !rejectReason.trim()}
                    onClick={async()=>{
                      setRejecting(true);
                      await rejectProduct(rejectModal.id, rejectReason);
                      setRejecting(false);
                      setRejectDone(true);
                    }}
                    className="flex-1 h-10 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {rejecting ? <><Loader2 className="w-4 h-4 animate-spin"/>Mengirim...</> : "Tolak & Kirim Notifikasi"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RUANG BUDAYA ADMIN COMPONENT ─────────────────────────────────────────

type CulturalPost = {
  id: string; type: string; title: string; slug: string;
  excerpt: string | null; content: string; coverImage: string | null;
  tags: string[]; isPublished: boolean; viewCount: number; productId: string | null;
  eventDate: string | null; eventLocation: string | null;
  eventMaxRsvp: number | null; contactUrl: string | null;
  author: { name: string | null }; _count: { rsvps: number };
};

const EMPTY_POST = {
  type: "ARTIKEL", title: "", excerpt: "", content: "", coverImage: "",
  tags: "", productId: "", eventDate: "", eventLocation: "",
  eventMaxRsvp: "", contactUrl: "", isPublished: false,
};

const TYPE_LABELS_RB: Record<string,string> = { ARTIKEL:"Artikel", CERITA_KARYA:"Cerita Karya", ACARA:"Acara" };
const TYPE_COLORS_RB: Record<string,string> = {
  ARTIKEL:"bg-blue-100 text-blue-700",
  CERITA_KARYA:"bg-purple-100 text-purple-700",
  ACARA:"bg-amber-100 text-amber-700",
};

function RuangBudayaAdmin() {
  const [posts, setPosts]             = useState<CulturalPost[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingPost, setEditingPost] = useState<CulturalPost | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_POST });
  const [saving, setSaving]           = useState(false);
  const [rbError, setRbError]         = useState("");
  const [filterType, setFilterType]   = useState("ALL");
  const dialog = useModernDialog();

  const fetchPosts = async () => {
    setLoading(true);
    const q = filterType !== "ALL" ? `?type=${filterType}` : "";
    const d = await apiFetch(`/api/admin/ruang-budaya${q}`);
    setPosts(Array.isArray(d) ? d : []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPosts(); }, [filterType]);

  const openCreate = () => { setEditingPost(null); setForm({ ...EMPTY_POST }); setRbError(""); setShowForm(true); };
  const openEdit   = (p: CulturalPost) => {
    setEditingPost(p);
    setForm({
      type: p.type, title: p.title, excerpt: p.excerpt ?? "", content: p.content,
      coverImage: p.coverImage ?? "", tags: p.tags.join(", "),
      productId: p.productId ?? "", eventDate: p.eventDate?.slice(0,16) ?? "",
      eventLocation: p.eventLocation ?? "", eventMaxRsvp: p.eventMaxRsvp?.toString() ?? "",
      contactUrl: p.contactUrl ?? "", isPublished: p.isPublished,
    });
    setRbError(""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { setRbError("Judul dan konten wajib diisi"); return; }
    setSaving(true); setRbError("");
    const body = {
      ...form,
      tags:          form.tags.split(",").map(t => t.trim()).filter(Boolean),
      eventMaxRsvp:  form.eventMaxRsvp || null,
      productId:     form.productId || null,
      eventDate:     form.eventDate || null,
      eventLocation: form.eventLocation || null,
      contactUrl:    form.contactUrl || null,
      coverImage:    form.coverImage || null,
    };
    const url    = editingPost ? `/api/admin/ruang-budaya/${editingPost.id}` : "/api/admin/ruang-budaya";
    const method = editingPost ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type":"application/json" }, credentials:"include", body: JSON.stringify(body) });
    const data   = await res.json();
    if (res.ok) { setShowForm(false); fetchPosts(); }
    else setRbError(data.error ?? "Gagal menyimpan");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await dialog.confirm("Hapus post ini?"))) return;
    await fetch(`/api/admin/ruang-budaya/${id}`, { method:"DELETE", credentials:"include" });
    fetchPosts();
  };

  const togglePublish = async (p: CulturalPost) => {
    await fetch(`/api/admin/ruang-budaya/${p.id}`, {
      method:"PUT", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify({ isPublished: !p.isPublished }),
    });
    fetchPosts();
  };

  if (showForm) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-sm">← Kembali</button>
        <h2 className="font-semibold text-foreground">{editingPost ? "Edit Post" : "Buat Post Baru"}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-foreground mb-1.5 block">Tipe Konten *</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TYPE_LABELS_RB).map(([k,v]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${form.type===k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-foreground mb-1.5 block">Judul *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul artikel/cerita/acara"
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-foreground mb-1.5 block">Ringkasan</label>
          <textarea value={form.excerpt} rows={2} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Deskripsi singkat (tampil di card)"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-foreground mb-1.5 block">URL Gambar Cover</label>
          <input type="url" value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..."
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Tags (pisahkan koma)</label>
          <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="batik, tenun, jawa"
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
        </div>
        {form.type === "CERITA_KARYA" && (
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">ID Produk Terkait</label>
            <input type="text" value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} placeholder="ID produk dari database"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
          </div>
        )}
        {form.type === "ACARA" && (
          <>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Tanggal & Waktu</label>
              <input type="datetime-local" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Lokasi</label>
              <input type="text" value={form.eventLocation} onChange={e => setForm(f => ({ ...f, eventLocation: e.target.value }))} placeholder="Online / Kota"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Maks Peserta (kosong = unlimited)</label>
              <input type="number" value={form.eventMaxRsvp} onChange={e => setForm(f => ({ ...f, eventMaxRsvp: e.target.value }))} placeholder="50"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">URL Kontak</label>
              <input type="url" value={form.contactUrl} onChange={e => setForm(f => ({ ...f, contactUrl: e.target.value }))} placeholder="https://..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-foreground mb-1.5 block">Konten * (HTML)</label>
          <textarea value={form.content} rows={12} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Isi konten. Mendukung HTML: <h2>, <p>, <strong>, <em>, <ul>, <li>, <a href='...'>, <img src='...'>"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-y font-mono" />
          <p className="text-[10px] text-muted-foreground mt-1">Contoh: &lt;h2&gt;Judul&lt;/h2&gt;&lt;p&gt;Isi paragraf...&lt;/p&gt;</p>
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="sr-only peer" />
            <div className="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
          <span className="text-sm text-foreground font-medium">{form.isPublished ? "Dipublish (langsung live)" : "Simpan sebagai Draft"}</span>
        </div>
        {rbError && <div className="md:col-span-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{rbError}</div>}
        <div className="md:col-span-2 flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="px-6 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : editingPost ? "Simpan Perubahan" : "Buat Post"}
          </button>
          <button onClick={() => setShowForm(false)} className="px-6 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Batal</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Ruang Budaya</h2>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
            <option value="ALL">Semua Tipe</option>
            {Object.entries(TYPE_LABELS_RB).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={openCreate} className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Buat Post
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Belum ada post. Klik &ldquo;Buat Post&rdquo; untuk mulai.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Judul</th>
                <th className="px-4 py-3 text-left">Tipe</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Stats</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 max-w-[280px]">
                    <p className="font-medium text-foreground truncate">{p.title}</p>
                    {p.excerpt && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS_RB[p.type] ?? "bg-muted text-muted-foreground"}`}>{TYPE_LABELS_RB[p.type] ?? p.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(p)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer ${p.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"} transition-colors`}>
                      {p.isPublished ? "Dipublish" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.viewCount}</span>
                    {p.type === "ACARA" && <span className="flex items-center gap-1 mt-0.5">👥{p._count.rsvps}{p.eventMaxRsvp ? `/${p.eventMaxRsvp}` : ""}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(p)} title="Edit" className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <a href={`/ruang-budaya/${p.slug}`} target="_blank" rel="noreferrer" title="Lihat" className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => handleDelete(p.id)} title="Hapus" className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-300 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
