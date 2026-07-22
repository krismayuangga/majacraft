"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  User, MapPin, ShieldCheck, Bell, Lock, LogOut,
  ChevronRight, Camera, Star, Package, Heart,
  Store, Settings, Edit3, Check, X, TrendingUp,
} from "lucide-react";
import { signOut } from "next-auth/react";

const MENU_SECTIONS = [
  {
    title: "Transaksi",
    items: [
      { icon: Package, label: "Pesanan Saya", href: "/pesanan", badge: "" },
      { icon: Heart, label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Pengaturan Akun",
    items: [
      { icon: User, label: "Data Diri", href: "/akun/profil" },
      { icon: MapPin, label: "Alamat Pengiriman", href: "/akun/alamat" },
      { icon: Lock, label: "Keamanan & Password", href: "/akun/keamanan" },
      { icon: Bell, label: "Notifikasi", href: "/akun/notifikasi" },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { icon: Store, label: "Buka Studio Seniman", href: "/studio" },
      { icon: ShieldCheck, label: "Verifikasi Akun (KYC)", href: "/akun/kyc" },
      { icon: Settings, label: "Bantuan", href: "/bantuan" },
    ],
  },
];

export default function AkunPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  // Ambil role + kycStatus dari DB
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("UNVERIFIED");
  useEffect(() => {
    fetch("/api/users/me").then(r => r.json()).then(d => {
      if (d.data?.role) {
        setDbRole(d.data.role);
        const jwtRole = (user as { role?: string } | undefined)?.role;
        if (d.data.role !== jwtRole) update({ role: d.data.role });
      }
      if (d.data?.kycStatus) setKycStatus(d.data.kycStatus);
    }).catch(() => {});
  }, []); // eslint-disable-line

  const role = dbRole ?? (user as { role?: string } | undefined)?.role ?? "BUYER";

  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [tempName, setTempName] = useState("");

  // Sync nama dari session
  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);

  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({ storeName: "", province: "" });
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/orders", { credentials: "include" }).then(r => r.json()).then(d => (d.data ?? []).length).catch(() => 0),
      fetch("/api/wishlist", { credentials: "include" }).then(r => r.json()).then(d => (d.data ?? []).length).catch(() => 0),
    ]).then(([orders, wishlist]) => setStats({ orders, wishlist }));
  }, []);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeForm.storeName || !upgradeForm.province) return setUpgradeError("Nama toko dan provinsi wajib diisi.");
    setUpgrading(true); setUpgradeError("");
    const res = await fetch("/api/users/upgrade-seller", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upgradeForm),
    });
    const data = await res.json();
    if (res.ok) {
      // Update JWT + DB role state
      setDbRole("SELLER");
      await update({ role: "SELLER" });
      setUpgradeModal(false);
      setUpgradeError("");
    } else {
      setUpgradeError(data.error ?? "Gagal upgrade akun.");
    }
    setUpgrading(false);
  };

  // Set name dari session saat pertama load
  const displayName = name || user?.name || "Pengguna";

  const saveName = async () => {
    if (!tempName.trim()) return;
    await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: tempName.trim() }) });
    await update({ name: tempName.trim() });
    setName(tempName);
    setEditName(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Profile Card */}
      <div className="relative rounded-2xl overflow-hidden mb-6"
        style={{ background: "linear-gradient(135deg, #1E1B0E 0%, #28200F 40%, #1C1A12 70%, #211D0E 100%)", border: "1px solid rgba(201,168,76,0.2)" }}>

        {/* Ornamen dekoratif sudut */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div style={{ position:"absolute", top:"-30px", right:"-20px", width:"160px", height:"160px", borderRadius:"50%", background:"radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />
          <div style={{ position:"absolute", bottom:"-40px", left:"-20px", width:"140px", height:"140px", borderRadius:"50%", background:"radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />
          <div style={{ position:"absolute", top:"50%", left:"45%", width:"200px", height:"1px", background:"linear-gradient(90deg, transparent, rgba(201,168,76,0.06), transparent)", transform:"translateY(-50%)" }} />
        </div>

        <div className="relative z-10 p-5">
          {/* Row utama: avatar + info + tombol */}
          <div className="flex items-center gap-4">

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center overflow-hidden"
                style={{ border: "2px solid rgba(201,168,76,0.5)", background: "rgba(201,168,76,0.1)", boxShadow: "0 0 16px rgba(201,168,76,0.15)" }}>
                {user?.image ? (
                  <Image src={user.image} alt={displayName} width={60} height={60} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: "#C9A84C" }}>{displayName[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input value={tempName} onChange={(e) => setTempName(e.target.value)}
                    className="h-7 px-2 rounded-lg border text-sm focus:outline-none w-36"
                    style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(201,168,76,0.5)", color: "#EDE8DE" }}
                    autoFocus />
                  <button onClick={saveName} className="w-6 h-6 rounded-md bg-green-700 flex items-center justify-center text-white hover:bg-green-600">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditName(false)} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "#9A8E77" }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h2 className="text-[15px] font-bold leading-tight truncate" style={{ color: "#EDE8DE" }}>{displayName}</h2>
                  <button onClick={() => { setTempName(displayName); setEditName(true); }} style={{ color: "rgba(201,168,76,0.5)" }} className="hover:opacity-100 transition-opacity flex-shrink-0">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="text-[11px] truncate mb-1.5" style={{ color: "#7A6E5A" }}>{user?.email}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", background: "rgba(201,168,76,0.07)" }}>
                  {role === "SELLER" ? "✓ Seniman" : role === "ADMIN" ? "Admin" : "Pembeli"}
                </span>
                {kycStatus === "VERIFIED" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.07)" }}>
                    <ShieldCheck className="w-2.5 h-2.5" /> Terverifikasi
                  </span>
                )}
                {kycStatus === "PENDING" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", background: "rgba(251,191,36,0.07)" }}>
                    ⏳ KYC Diproses
                  </span>
                )}
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {role === "BUYER" && (
                <button onClick={() => setUpgradeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}>
                  <TrendingUp className="w-3.5 h-3.5" /> Jadi Seniman
                </button>
              )}
              {kycStatus === "UNVERIFIED" && (
                <Link href="/akun/kyc"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Verifikasi Akun
                </Link>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: stats.orders > 0 ? String(stats.orders) : "0", label: "Pesanan" },
              { value: "0", label: "Ulasan" },
              { value: stats.wishlist > 0 ? String(stats.wishlist) : "0", label: "Wishlist" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold" style={{ color: "#C9A84C" }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "#7A6E5A" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="space-y-4">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs text-amber-700 uppercase tracking-wider font-semibold mb-2 px-1">
              {section.title}
            </p>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {section.items.map((item) => (
                <Link key={item.label} href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/20 border border-amber-800/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="flex-1 text-sm text-foreground group-hover:text-amber-600 transition-colors">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-900/30 bg-card hover:bg-red-900/10 transition-colors text-red-400 group"
          onClick={() => signOut({ callbackUrl: "/" })}>
          <div className="w-8 h-8 rounded-lg bg-red-900/20 border border-red-800/20 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="flex-1 text-sm text-left">Keluar dari Akun</span>
        </button>

        <p className="text-center text-xs text-muted-foreground pb-4">MajaCraft v1.0</p>
      </div>

      {/* Modal Upgrade ke Seniman */}
      {upgradeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setUpgradeModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-1">Upgrade ke Seniman</h2>
            <p className="text-xs text-muted-foreground mb-4">Isi data studio Anda untuk mulai berjualan</p>
            <form onSubmit={handleUpgrade} className="space-y-3">
              <div>
                <label className="text-xs text-amber-500 uppercase tracking-wider">Nama Toko / Studio *</label>
                <input type="text" placeholder="cth: Kerajinan Batu Jogja"
                  value={upgradeForm.storeName} onChange={(e) => setUpgradeForm({ ...upgradeForm, storeName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-1 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-amber-500 uppercase tracking-wider">Provinsi Asal *</label>
                <select value={upgradeForm.province} onChange={(e) => setUpgradeForm({ ...upgradeForm, province: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground text-sm mt-1 focus:outline-none focus:border-amber-500 appearance-none">
                  <option value="">Pilih provinsi...</option>
                  {["DKI Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur","DI Yogyakarta","Banten","Bali","Sumatera Utara","Sulawesi Selatan","Nusa Tenggara Barat","Nusa Tenggara Timur","Lainnya"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {upgradeError && <p className="text-red-400 text-xs">{upgradeError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setUpgradeModal(false)} className="flex-1 h-10 rounded-xl border border-border text-muted-foreground text-sm">Batal</button>
                <button type="submit" disabled={upgrading}
                  className="flex-1 h-10 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-1">
                  {upgrading ? "Memproses..." : "Upgrade Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
