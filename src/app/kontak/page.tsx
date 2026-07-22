"use client";

import { useState } from "react";
import { Mail, MessageSquare, Phone, MapPin, Clock, Send, Loader2, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ContactForm() {
  const searchParams = useSearchParams();
  const defaultSubject = searchParams.get("subject") ?? "";

  const [form, setForm] = useState({ name: "", email: "", subject: defaultSubject, message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Mohon isi semua field yang wajib.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulasi pengiriman (implementasi real dengan email service)
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Pesan Terkirim!</h3>
        <p className="text-muted-foreground text-sm">Tim kami akan menghubungi Anda dalam 1–2 hari kerja melalui email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Lengkap *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Nama Anda"
            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="email@anda.com"
            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subjek</label>
        <input
          type="text"
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
          placeholder="Topik pesan Anda"
          className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pesan *</label>
        <textarea
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          placeholder="Tuliskan pesan atau pertanyaan Anda..."
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? "Mengirim..." : "Kirim Pesan"}
      </button>
    </form>
  );
}

const contacts = [
  {
    icon: Mail, label: "Email Umum", value: "halo@majacraft.id", desc: "Pertanyaan umum & informasi",
    href: "mailto:halo@majacraft.id?subject=Pertanyaan%20Umum%20MajaCraft&body=Halo%20tim%20MajaCraft%2C%0A%0ASaya%20pengunjung%20MajaCraft%20ingin%20menanyakan%3A%0A%0A",
  },
  {
    icon: Mail, label: "Support Pembeli", value: "support@majacraft.id", desc: "Bantuan pesanan & transaksi",
    href: "mailto:support@majacraft.id?subject=Bantuan%20Pesanan%20MajaCraft&body=Halo%20Support%20MajaCraft%2C%0A%0ASaya%20membutuhkan%20bantuan%20terkait%3A%0A%0A",
  },
  {
    icon: Mail, label: "Email Penjual", value: "seniman@majacraft.id", desc: "Onboarding & akun penjual",
    href: "mailto:seniman@majacraft.id?subject=Pendaftaran%20Seniman%20MajaCraft&body=Halo%20tim%20MajaCraft%2C%0A%0ASaya%20tertarik%20untuk%20bergabung%20sebagai%20seniman%20di%20platform%20MajaCraft.%0A%0APerkenalkan%20saya%3A%0A",
  },
  {
    icon: Phone, label: "WhatsApp Business", value: "+62 852-8000-2089", desc: "Sen–Jum, 09.00–17.00 WIB",
    href: "https://wa.me/6285280002089?text=Halo%2C%20saya%20pengunjung%20MajaCraft%20ingin%20bertanya%20%F0%9F%99%8F",
  },
];

export default function HubungiKami() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs text-amber-600 border border-amber-700/30 px-3 py-1 rounded-full mb-4">
          <MessageSquare className="w-3 h-3" /> Kontak
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Hubungi Kami</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Ada pertanyaan, saran, atau masukan? Tim kami siap membantu Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-card">
          <h2 className="font-bold text-foreground mb-5">Kirim Pesan</h2>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-foreground mb-4 text-sm">Informasi Kontak</h3>
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <a key={i} href={c.href} target={c.href?.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-amber-900/20 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-amber-600 transition-colors">{c.label}</p>
                    <p className="text-xs text-amber-600 font-medium">{c.value}</p>
                    <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Office */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-foreground mb-3 text-sm">Kantor</h3>
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Jln. Melati 1 No. 50<br />
                Jatipasar, Trowulan, Mojokerto<br />
                Jawa Timur 61362, Indonesia
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Senin – Jumat, 09.00 – 17.00 WIB</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-foreground mb-3 text-sm">Tautan Cepat</h3>
            <div className="space-y-2">
              {[
                { label: "Pusat Bantuan", href: "/bantuan" },
                { label: "Cara Berbelanja", href: "/bantuan/belanja" },
                { label: "Cara Berjualan", href: "/bantuan/jual" },
                { label: "Syarat & Ketentuan", href: "/syarat" },
              ].map((link, i) => (
                <a key={i} href={link.href} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors">
                  → {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
