"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, MapPin, Clock, Users, Eye, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { formatRupiah } from "@/lib/data";

type Post = {
  id: string; type: string; title: string; slug: string;
  excerpt: string | null; content: string; coverImage: string | null;
  tags: string[]; publishedAt: string | null; viewCount: number;
  eventDate: string | null; eventLocation: string | null;
  eventMaxRsvp: number | null; contactUrl: string | null;
  author: { name: string | null; image: string | null };
  product: { name: string; slug: string; price: number; images: { url: string }[]; store: { name: string } } | null;
  _count: { rsvps: number };
};

type RsvpForm = { name: string; email: string; phone: string; message: string };

export default function RuangBudayaDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const slug     = params.slug as string;

  const [post, setPost]         = useState<Post | null>(null);
  const [loading, setLoading]   = useState(true);
  const [rsvpForm, setRsvpForm] = useState<RsvpForm>({ name: "", email: "", phone: "", message: "" });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError]     = useState("");

  useEffect(() => {
    fetch(`/api/ruang-budaya/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.data) setPost(d.data); else router.push("/ruang-budaya"); })
      .finally(() => setLoading(false));
  }, [slug, router]);

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpLoading(true); setRsvpError("");
    try {
      const res  = await fetch(`/api/ruang-budaya/${post!.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rsvpForm),
      });
      const data = await res.json();
      if (res.ok) setRsvpSuccess(true);
      else setRsvpError(data.error ?? "Gagal mendaftar");
    } catch { setRsvpError("Terjadi kesalahan. Coba lagi."); }
    finally   { setRsvpLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!post) return null;

  const isEvent  = post.type === "ACARA";
  const isCerita = post.type === "CERITA_KARYA";
  const isFull   = post.eventMaxRsvp && post._count.rsvps >= post.eventMaxRsvp;

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/ruang-budaya" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Ruang Budaya
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-sm text-foreground truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Cover image */}
        {post.coverImage && (
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        {/* Type badge + meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            post.type === "ARTIKEL" ? "bg-blue-100 text-blue-700" :
            post.type === "CERITA_KARYA" ? "bg-purple-100 text-purple-700" :
            "bg-amber-100 text-amber-700"
          }`}>
            {post.type === "ARTIKEL" ? "Artikel" : post.type === "CERITA_KARYA" ? "Cerita Karya" : "Acara"}
          </span>
          {post.publishedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />{post.viewCount} kali dilihat
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-amber-100 overflow-hidden flex-shrink-0">
            {post.author.image
              ? <Image src={post.author.image} alt="" width={40} height={40} className="object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-sm font-bold text-amber-700">{post.author.name?.[0] ?? "A"}</span>
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{post.author.name ?? "Tim MajaCraft"}</p>
            <p className="text-xs text-muted-foreground">MajaCraft Editorial</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2">
            {/* Cerita Karya — product card */}
            {isCerita && post.product && (
              <Link href={`/produk/${post.product.slug}`}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors mb-6">
                {post.product.images?.[0]?.url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={post.product.images[0].url} alt={post.product.name} width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Karya yang diceritakan</p>
                  <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{post.product.name}</p>
                  <p className="text-sm font-bold text-primary">{formatRupiah(post.product.price)}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            )}

            {/* Content */}
            <div
              className="prose prose-sm prose-amber max-w-none text-foreground"
              style={{
                "--tw-prose-body": "hsl(var(--foreground))",
                "--tw-prose-headings": "hsl(var(--foreground))",
              } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Event info */}
            {isEvent && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Detail Acara</h3>
                {post.eventDate && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{new Date(post.eventDate).toLocaleDateString("id-ID", { weekday:"long" })}</p>
                      <p className="text-sm text-muted-foreground">{new Date(post.eventDate).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.eventDate).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })} WIB</p>
                    </div>
                  </div>
                )}
                {post.eventLocation && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{post.eventLocation}</p>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    {post._count.rsvps} terdaftar
                    {post.eventMaxRsvp ? ` / ${post.eventMaxRsvp} kuota` : " (tidak terbatas)"}
                  </p>
                </div>
                {isFull && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium text-center">
                    Kuota Penuh
                  </div>
                )}
              </div>
            )}

            {/* RSVP Form */}
            {isEvent && !isFull && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <h3 className="font-semibold text-foreground mb-4">Daftar Sekarang</h3>
                {rsvpSuccess ? (
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Pendaftaran Berhasil!</p>
                      <p className="text-xs text-green-600 mt-0.5">Kami akan menghubungi via email.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRsvp} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Nama *</label>
                      <input type="text" required value={rsvpForm.name}
                        onChange={e => setRsvpForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Nama lengkap"
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Email *</label>
                      <input type="email" required value={rsvpForm.email}
                        onChange={e => setRsvpForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">No. WhatsApp</label>
                      <input type="tel" value={rsvpForm.phone}
                        onChange={e => setRsvpForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="08xxxxxxxxxx"
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Pesan (opsional)</label>
                      <textarea value={rsvpForm.message} rows={2}
                        onChange={e => setRsvpForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Pertanyaan atau informasi tambahan..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none" />
                    </div>
                    {rsvpError && <p className="text-xs text-red-600">{rsvpError}</p>}
                    <button type="submit" disabled={rsvpLoading}
                      className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                      {rsvpLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftar...</> : "Daftar Acara Gratis"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Hubungi kami */}
            {post.contactUrl && (
              <Link href={post.contactUrl}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                <Clock className="w-4 h-4" /> Hubungi Kami
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
