"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye, EyeOff, Mail, Lock, User, Store,
  MapPin, AlertCircle, Loader2, CheckCircle2, Phone,
  CreditCard,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const PROVINCES = [
  "DKI Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur","DI Yogyakarta",
  "Banten","Bali","Sumatera Utara","Sumatera Barat","Sumatera Selatan",
  "Kalimantan Timur","Kalimantan Barat","Sulawesi Selatan","Sulawesi Utara",
  "Nusa Tenggara Barat","Nusa Tenggara Timur","Maluku","Papua","Aceh","Lainnya",
];

type Role = "pembeli" | "seniman";
type Step = 1 | 2;

export default function DaftarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>("pembeli");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    storeName: "", province: "", bankName: "", accountNumber: "", agreed: false,
  });

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Nama lengkap wajib diisi.");
    if (!form.email.trim()) return setError("Email wajib diisi.");
    if (!form.phone.trim()) return setError("Nomor HP wajib diisi.");
    if (!/^(\+62|08)[0-9]{8,12}$/.test(form.phone.replace(/\s/g, "")))
      return setError("Format nomor HP tidak valid. Contoh: 08123456789");
    if (form.password.length < 8) return setError("Password minimal 8 karakter.");
    if (form.password !== form.confirmPassword) return setError("Password tidak cocok.");
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (role === "seniman" && !form.storeName.trim()) return setError("Nama toko wajib diisi.");
    if (role === "seniman" && !form.province) return setError("Pilih provinsi asal.");
    if (role === "seniman" && !form.bankName) return setError("Pilih nama bank untuk pencairan dana.");
    if (role === "seniman" && !form.accountNumber.trim()) return setError("Nomor rekening wajib diisi.");
    if (!form.agreed) return setError("Setujui syarat & ketentuan untuk melanjutkan.");
    setIsLoading(true);
    try {
      // 1. Daftarkan user ke API
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: role === "seniman" ? "SELLER" : "BUYER",
          storeName: form.storeName || undefined,
          province: form.province || undefined,
          bankName: form.bankName || undefined,
          bankAccount: form.accountNumber || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Pendaftaran gagal. Coba lagi."); setIsLoading(false); return; }

      // 2. Auto login setelah register
      const loginRes = await signIn("credentials", {
        email: form.email, password: form.password, redirect: false,
      });
      if (loginRes?.ok) {
        router.push(role === "seniman" ? "/studio" : "/");
        router.refresh();
      } else {
        router.push("/masuk");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-amber-100">Buat Akun</h1>
        <p className="text-sm text-amber-700 mt-1">Bergabung dengan komunitas seniman Nusantara</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              step >= s
                ? "bg-amber-600 border-amber-500 text-[#1C1A14]"
                : "border-amber-900/40 text-amber-800"
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs ${step >= s ? "text-amber-400" : "text-amber-800"}`}>
              {s === 1 ? "Data Akun" : "Peran & Toko"}
            </span>
            {s < 2 && <div className="w-8 h-px bg-amber-900/40" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-amber-900/40 bg-white/5 hover:bg-white/10 text-amber-100 text-sm font-medium transition-all disabled:opacity-60"
          >
            {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Daftar dengan Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-900/30" />
            <span className="text-xs text-amber-800 uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-amber-900/30" />
          </div>

          <form onSubmit={handleStep1} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                <input type="text" placeholder="Budi Santoso"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                <input type="email" placeholder="nama@email.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
                />
              </div>
            </div>

            {/* Nomor HP */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nomor HP / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                <input type="tel" placeholder="08123456789"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
                />
              </div>
              <p className="text-[11px] text-amber-800 pl-1 flex items-center gap-1">
                🔒 Nomor HP bersifat <strong className="text-amber-700">rahasia</strong> — tidak ditampilkan kepada siapapun.
                Hanya digunakan untuk notifikasi & verifikasi MAJA.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                <input type={showPassword ? "text" : "password"} placeholder="Min. 8 karakter"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-800 hover:text-amber-500 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                <input type="password" placeholder="Ulangi password"
                  value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
                />
              </div>
            </div>

            <button type="submit"
              className="w-full h-11 rounded-xl btn-gold font-semibold text-sm transition-all">
              Lanjut →
            </button>
          </form>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Pilih Role */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Saya adalah</label>
            <div className="grid grid-cols-2 gap-3">
              {(["pembeli", "seniman"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === r
                      ? "border-amber-500 bg-amber-900/20 text-amber-300"
                      : "border-amber-900/30 bg-[#1C1A14] text-amber-700 hover:border-amber-700/50"
                  }`}
                >
                  {r === "pembeli" ? (
                    <User className={`w-7 h-7 ${role === r ? "text-amber-400" : "text-amber-800"}`} />
                  ) : (
                    <Store className={`w-7 h-7 ${role === r ? "text-amber-400" : "text-amber-800"}`} />
                  )}
                  <span className="text-sm font-semibold capitalize">
                    {r === "pembeli" ? "Pembeli" : "Seniman"}
                  </span>
                  <span className="text-[10px] text-center leading-tight opacity-70">
                    {r === "pembeli" ? "Jelajahi & beli karya seni" : "Jual karya & buka toko"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form tambahan jika Seniman */}
          {role === "seniman" && (
            <div className="space-y-4 p-4 rounded-xl bg-amber-900/10 border border-amber-800/20">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Info Studio Seniman</p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nama Toko / Studio</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                  <input type="text" placeholder="cth: Kerajinan Batu Jogja"
                    value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Provinsi Asal</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800 pointer-events-none" />
                  <select
                    value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm appearance-none"
                  >
                    <option value="" className="bg-[#1C1A14]">Pilih provinsi...</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p} className="bg-[#1C1A14]">{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Rekening Bank — khusus Seniman */}
          {role === "seniman" && (
            <div className="space-y-4 p-4 rounded-xl bg-[#1C1A14]/80 border border-amber-900/20">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" /> Rekening Pencairan Dana
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nama Bank</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800 pointer-events-none" />
                  <select value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 focus:outline-none focus:border-amber-500 text-sm appearance-none">
                    <option value="" className="bg-[#1C1A14]">Pilih bank...</option>
                    {["BCA","BNI","BRI","Mandiri","BSI","CIMB Niaga","Danamon","Permata","BTN","Bank Jago","SeaBank","Jenius"].map((b) => (
                      <option key={b} value={b} className="bg-[#1C1A14]">{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nomor Rekening</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                  <input type="text" placeholder="cth: 1234567890"
                    value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <p className="text-[11px] text-amber-800 pl-1">
                  ⓘ Dana penjualan dicairkan ke rekening ini. Upload KTP di profil untuk verifikasi penuh.
                </p>
              </div>
            </div>
          )}

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
              className="mt-0.5 accent-amber-600 w-4 h-4 flex-shrink-0"
            />
            <span className="text-xs text-amber-700 leading-relaxed">
              Saya menyetujui{" "}
              <Link href="/syarat" className="text-amber-500 hover:text-amber-400">Syarat & Ketentuan</Link>
              {" "}dan{" "}
              <Link href="/privasi" className="text-amber-500 hover:text-amber-400">Kebijakan Privasi</Link>
              {" "}MajaCraft
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setStep(1); setError(""); }}
              className="flex-1 h-11 rounded-xl border border-amber-900/40 text-amber-500 hover:bg-amber-900/20 text-sm font-medium transition-all">
              ← Kembali
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Buat Akun"}
            </button>
          </div>
        </form>
      )}

      {/* Login link */}
      <p className="text-center text-sm text-amber-700">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
          Masuk
        </Link>
      </p>
    </div>
  );
}
