"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Upload, AlertCircle, CheckCircle2, Loader2, Camera, XCircle } from "lucide-react";

type KycStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export default function KycPage() {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [nik, setNik] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [kycStatus, setKycStatus] = useState<KycStatus>("UNVERIFIED");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const ktpRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // Cek status KYC saat ini
  useEffect(() => {
    fetch("/api/users/kyc", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.data?.kycStatus) setKycStatus(d.data.kycStatus);
        setLoadingStatus(false);
      })
      .catch(() => setLoadingStatus(false));
  }, []);

  function handleFileChange(file: File | null, setFile: (f: File | null) => void, setPreview: (s: string) => void) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Ukuran file maksimal 5MB"); return; }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "kyc");
    const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Upload gagal");
    const url = json.data?.url;
    if (!url) throw new Error("Gagal mendapatkan URL file");
    return url as string;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpFile || !selfieFile) return;
    setSubmitting(true);
    setError("");
    try {
      const [ktpUrl, selfieUrl] = await Promise.all([
        uploadFile(ktpFile),
        uploadFile(selfieFile),
      ]);
      const res = await fetch("/api/users/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ktpUrl, selfieUrl, nik }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal mengirim dokumen"); return; }
      setSubmitted(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  if (kycStatus === "VERIFIED") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">Akun Terverifikasi!</h2>
        <p className="text-muted-foreground text-sm mt-2">Akun Anda telah diverifikasi. Anda dapat berjualan di MajaCraft.</p>
        <Link href="/studio" className="inline-block mt-6 btn-gold h-10 px-6 rounded-xl text-sm font-semibold">Buka Studio Seniman</Link>
      </div>
    );
  }

  if (kycStatus === "PENDING" || submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-900/20 border-2 border-yellow-700/30 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Dokumen Sedang Diverifikasi</h2>
        <p className="text-muted-foreground text-sm mt-2">Tim MajaCraft akan memverifikasi dokumen Anda dalam 1×24 jam. Anda akan mendapat notifikasi via email.</p>
        <Link href="/akun" className="inline-block mt-6 btn-gold h-10 px-6 rounded-xl text-sm font-semibold">Kembali ke Akun</Link>
      </div>
    );
  }

  if (kycStatus === "REJECTED") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">Verifikasi Ditolak</h2>
        <p className="text-muted-foreground text-sm mt-2">Dokumen Anda tidak memenuhi syarat. Silakan kirim ulang dengan foto yang lebih jelas.</p>
        <button onClick={() => setKycStatus("UNVERIFIED")} className="inline-block mt-6 btn-gold h-10 px-6 rounded-xl text-sm font-semibold">Kirim Ulang Dokumen</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/akun" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-foreground">Verifikasi Akun (KYC)</h1>
      </div>

      <div className="text-center py-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-amber-900/20 border-2 border-amber-700/30 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7 text-amber-600" />
        </div>
        <p className="text-sm text-muted-foreground">Verifikasi KTP diperlukan untuk menjual karya, mencairkan dana, dan transaksi besar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* NIK */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">NIK (Nomor Induk Kependudukan)</label>
          <input
            type="text" inputMode="numeric" maxLength={16} placeholder="16 digit nomor KTP"
            value={nik} onChange={e => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 placeholder:text-muted-foreground tracking-widest"
          />
        </div>

        {/* Upload fields */}
        {[
          { label: "Foto KTP", sublabel: "Pastikan seluruh data KTP terbaca jelas", ref: ktpRef, file: ktpFile, preview: ktpPreview, setFile: setKtpFile, setPreview: setKtpPreview },
          { label: "Selfie dengan KTP", sublabel: "Pegang KTP di depan wajah, keduanya terlihat jelas", ref: selfieRef, file: selfieFile, preview: selfiePreview, setFile: setSelfieFile, setPreview: setSelfiePreview },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-foreground mb-0.5">{i + 1}. {item.label}</p>
            <p className="text-xs text-muted-foreground mb-2">{item.sublabel}</p>
            <input ref={item.ref} type="file" accept="image/*" capture="environment"
              onChange={e => handleFileChange(e.target.files?.[0] ?? null, item.setFile, item.setPreview)}
              className="hidden"
            />
            {item.preview ? (
              <div className="relative rounded-xl overflow-hidden border border-amber-700/30 cursor-pointer" onClick={() => item.ref.current?.click()}>
                <Image src={item.preview} alt={item.label} width={500} height={280} className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Ganti foto</span>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => item.ref.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border hover:border-amber-700/50 hover:bg-amber-900/5 transition-colors">
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pilih foto atau ambil dari kamera</span>
                <span className="text-xs text-amber-700">JPG/PNG maks. 5MB</span>
              </button>
            )}
          </div>
        ))}

        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-800/20 text-xs text-amber-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Data KTP disimpan terenkripsi dan hanya diakses oleh tim verifikasi MajaCraft
        </div>

        <button type="submit" disabled={!ktpFile || !selfieFile || submitting}
          className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" />Mengunggah & Mengirim...</>
            : <><Upload className="w-4 h-4" />Kirim untuk Verifikasi</>
          }
        </button>
      </form>
    </div>
  );
}
