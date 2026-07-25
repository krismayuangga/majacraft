"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, User, Mail, Phone, Loader2, CheckCircle2, Camera } from "lucide-react";

export default function ProfilPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then(r => r.json())
      .then(d => {
        if (d.data?.name)  setName(d.data.name);
        if (d.data?.phone) setPhone(d.data.phone);
        if (d.data?.image) setImageUrl(d.data.image);
      })
      .catch(() => {
        if (user?.name)  setName(user.name);
        if (user?.image) setImageUrl(user.image);
      });
  }, []); // eslint-disable-line

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Foto maksimal 5MB.");

    setIsUploadingPhoto(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload gagal");
      const uploadData = await uploadRes.json();
      const newUrl = uploadData.data?.url as string;

      // Simpan ke DB
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newUrl }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan foto");

      setImageUrl(newUrl);
      await update({ image: newUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Gagal upload foto.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Nama tidak boleh kosong.");
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ...(phone.trim() && { phone: phone.trim() }),
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      await update({ name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const isGooglePhoto = imageUrl?.includes("googleusercontent.com") || imageUrl?.includes("google");

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/akun" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Data Diri</h1>
      </div>

      {/* Avatar dengan tombol ganti foto */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-amber-900/40 border-4 border-amber-700/30 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-4xl font-bold text-amber-400">{(name || "U")[0].toUpperCase()}</span>
            )}
          </div>
          {/* Tombol ganti foto */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-700 hover:bg-amber-600 border-2 border-background flex items-center justify-center transition-colors disabled:opacity-60"
            title="Ganti foto profil"
          >
            {isUploadingPhoto
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Camera className="w-3.5 h-3.5 text-white" />
            }
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {isUploadingPhoto
            ? "Mengupload foto..."
            : isGooglePhoto
            ? "Foto dari Google — klik ikon kamera untuk ganti"
            : "Klik ikon kamera untuk ganti foto"
          }
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">JPG / PNG / WebP, maks 5MB</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
            <input type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
            <input type="email" value={user?.email ?? ""} disabled
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border border-border text-muted-foreground text-sm cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-amber-800 pl-1">Email tidak dapat diubah</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-amber-500 uppercase tracking-wider">Nomor HP</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800" />
            <input type="tel" placeholder="08xxxxxxxxxx" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground pl-1">🔒 Nomor HP bersifat rahasia</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Perubahan berhasil disimpan!
          </div>
        )}

        <button type="submit" disabled={isSaving}
          className="w-full h-11 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
