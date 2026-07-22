"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function KeamananPage() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.newPass.length < 8) return setError("Password baru minimal 8 karakter.");
    if (form.newPass !== form.confirm) return setError("Konfirmasi password tidak cocok.");
    setLoading(true);
    // TODO: call API PATCH /api/users/me/password
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSuccess(true);
    setForm({ current: "", newPass: "", confirm: "" });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/akun" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-foreground">Keamanan & Password</h1>
      </div>

      <div className="p-4 rounded-xl bg-amber-900/10 border border-amber-800/20 text-xs text-amber-700 mb-6">
        ⓘ Jika Anda masuk menggunakan Google, tidak perlu mengatur password. Password hanya diperlukan untuk login dengan email.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "current", label: "Password Saat Ini", showKey: "current" },
          { key: "newPass", label: "Password Baru", showKey: "new" },
          { key: "confirm", label: "Konfirmasi Password Baru", showKey: "confirm" },
        ].map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">{f.label}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
              <input type={(show as Record<string, boolean>)[f.showKey] ? "text" : "password"}
                value={(form as Record<string, string>)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full h-11 pl-10 pr-11 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-amber-500 text-sm"
              />
              <button type="button" onClick={() => setShow({ ...show, [f.showKey]: !(show as Record<string, boolean>)[f.showKey] })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-800 hover:text-amber-500">
                {(show as Record<string, boolean>)[f.showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}

        {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        {success && <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" />Password berhasil diubah!</div>}

        <button type="submit" disabled={loading}
          className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Menyimpan..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}
