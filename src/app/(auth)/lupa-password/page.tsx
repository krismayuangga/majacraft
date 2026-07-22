"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email wajib diisi.");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Format email tidak valid.");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="space-y-6">
      {sent ? (
        // Success state
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-100">Email Terkirim!</h2>
            <p className="text-sm text-amber-700 mt-2 leading-relaxed">
              Link reset password telah dikirim ke<br />
              <span className="text-amber-400 font-medium">{email}</span>
            </p>
            <p className="text-xs text-amber-800 mt-3">
              Tidak menerima email? Cek folder spam atau{" "}
              <button onClick={() => setSent(false)} className="text-amber-500 hover:text-amber-400 underline">
                kirim ulang
              </button>
            </p>
          </div>
          <Link href="/masuk"
            className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <>
          {/* Heading */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-900/30 border border-amber-700/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-amber-100">Lupa Password?</h1>
            <p className="text-sm text-amber-700 mt-2 leading-relaxed">
              Masukkan email Anda dan kami akan<br />mengirimkan link untuk reset password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
                <input type="email" placeholder="nama@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1C1A14] border border-amber-900/40 text-amber-100 placeholder:text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-sm transition-all"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>

          <Link href="/masuk"
            className="flex items-center justify-center gap-2 text-sm text-amber-700 hover:text-amber-500 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke halaman masuk
          </Link>
        </>
      )}
    </div>
  );
}
