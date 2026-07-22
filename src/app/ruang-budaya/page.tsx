"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { ImageItem } from "@/components/ruang-budaya/DomeGallery";
import {
  BookOpen, Film, Calendar, ArrowRight, Eye, Users,
  MapPin, Clock, Loader2, ChevronRight, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatRupiah } from "@/lib/data";

// DomeGallery — CSS 3D sphere, no SSR
const DomeGallery = dynamic(
  () => import("@/components/ruang-budaya/DomeGallery"),
  { ssr: false }
);

type Author        = { name: string | null; image: string | null };
type ProductSnippet = { name: string; slug: string; price: number; images: { url: string }[]; store: { name: string } };
type Post = {
  id: string; type: string; title: string; slug: string;
  excerpt: string | null; coverImage: string | null; tags: string[];
  publishedAt: string | null; viewCount: number;
  eventDate: string | null; eventLocation: string | null; eventMaxRsvp: number | null;
  author: Author; product: ProductSnippet | null; _count: { rsvps: number };
};
type Product = { id: string; name: string; slug: string; price: number; images: { url: string }[] };
type SelectedProduct = { name: string; slug: string; price: number; image: string };

const TABS = [
  { id: "ALL",          label: "Semua",           icon: null },
  { id: "ARTIKEL",      label: "Artikel",          icon: BookOpen },
  { id: "CERITA_KARYA", label: "Cerita Karya",     icon: Film },
  { id: "ACARA",        label: "Acara & Workshop", icon: Calendar },
] as const;

function timeAgo(d: string) { return formatDistanceToNow(new Date(d), { addSuffix:true, locale:localeId }); }
function typeLabel(t: string) { return {ARTIKEL:"Artikel",CERITA_KARYA:"Cerita Karya",ACARA:"Acara"}[t]??t; }
function typeColor(t: string) { return {ARTIKEL:"bg-blue-100 text-blue-700",CERITA_KARYA:"bg-purple-100 text-purple-700",ACARA:"bg-amber-100 text-amber-700"}[t]??"bg-muted text-muted-foreground"; }

function PostCard({ post }: { post: Post }) {
  const isEvent=post.type==="ACARA", isCerita=post.type==="CERITA_KARYA";
  return (
    <Link href={`/ruang-budaya/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="relative h-48 bg-muted overflow-hidden">
        {(post.coverImage||post.product?.images?.[0]?.url) ?
          <Image src={post.coverImage??post.product!.images[0].url} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
              {isEvent?<Calendar className="w-12 h-12 text-amber-400"/>:isCerita?<Film className="w-12 h-12 text-purple-400"/>:<BookOpen className="w-12 h-12 text-blue-400"/>}
            </div>}
        <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColor(post.type)}`}>{typeLabel(post.type)}</span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-bold text-foreground text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">{post.excerpt}</p>}
        {isEvent && post.eventDate && (
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-700"><Clock className="w-3.5 h-3.5"/>{new Date(post.eventDate).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
            {post.eventLocation && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5"/>{post.eventLocation}</div>}
          </div>
        )}
        {isCerita && post.product && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border mb-3">
            {post.product.images?.[0]?.url && <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0"><Image src={post.product.images[0].url} alt={post.product.name} width={40} height={40} className="object-cover w-full h-full"/></div>}
            <div className="min-w-0 flex-1"><p className="text-xs font-medium text-foreground truncate">{post.product.name}</p><p className="text-xs text-primary font-semibold">{formatRupiah(post.product.price)}</p></div>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 overflow-hidden flex-shrink-0">
              {post.author.image?<Image src={post.author.image} alt="" width={24} height={24} className="object-cover"/>:<span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-amber-700">{post.author.name?.[0]??"A"}</span>}
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">{post.author.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isEvent?<span className="flex items-center gap-1"><Users className="w-3 h-3"/>{post._count.rsvps}{post.eventMaxRsvp?`/${post.eventMaxRsvp}`:""}</span>:<span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{post.viewCount}</span>}
            {post.publishedAt && <span>{timeAgo(post.publishedAt)}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function RuangBudayaPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [galleryItems, setGalleryItems] = useState<ImageItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  // Fetch products untuk gallery
  useEffect(() => {
    fetch("/api/products?limit=40&isCurated=false")
      .then(r => r.json())
      .then(d => {
        const products: Product[] = Array.isArray(d.data?.items)
          ? d.data.items
          : Array.isArray(d.data)
            ? d.data
            : [];
        const items: ImageItem[] = products
          .filter(p => p.images?.[0]?.url)
          .map(p => ({
            src:   p.images[0].url,
            alt:   p.name.length > 40 ? p.name.slice(0, 39) + "…" : p.name,
            slug:  p.slug,
            price: p.price,
          }));
        setGalleryItems(items);
      })
      .catch(() => setGalleryItems([]))
      .finally(() => setLoadingGallery(false));
  }, []);

  // Fetch cultural posts
  useEffect(() => {
    setLoadingPosts(true);
    const type = activeTab==="ALL" ? "" : `&type=${activeTab}`;
    fetch(`/api/ruang-budaya?limit=12${type}`)
      .then(r => r.json()).then(d => setPosts(d.data?.posts ?? []))
      .finally(() => setLoadingPosts(false));
  }, [activeTab]);

  const handleGalleryClick = useCallback((item: ImageItem, _index: number) => {
    setSelectedProduct({ name: item.alt, slug: item.slug ?? "", price: item.price ?? 0, image: item.src });
  }, []);

  const featured = activeTab==="ALL" ? posts[0] : null;
  const grid = activeTab==="ALL" ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-background">

      {/* ══ HERO: The Heritage Dome ══ */}
      <div className="relative overflow-hidden" style={{ background:"linear-gradient(to bottom, #1A1008 0%, #0D0A06 60%, var(--background) 100%)", minHeight:"90vh" }}>
        {/* Gold ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background:"radial-gradient(ellipse, #C6A75E 0%, transparent 70%)" }} />

        {/* Top: eyebrow + map — constrained width */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-0 flex flex-col items-center">
          {/* Eyebrow */}
          <span className="text-xs tracking-[0.35em] uppercase mb-4 block" style={{ color:"#C6A75E88", fontFamily:"serif" }}>
            MAJACRAFT · RUANG BUDAYA
          </span>

          {/* Indonesia Map */}
          <div className="relative w-full max-w-3xl mx-auto mb-0">
            <div className="relative flex justify-center">
              <Image
                src="/images/indonesia-map.png"
                alt="Peta Indonesia"
                width={850}
                height={320}
                className="w-full max-w-2xl h-auto select-none pointer-events-none"
                style={{ opacity: 0.28, filter:"drop-shadow(0 0 30px rgba(198,167,94,0.2)) sepia(1) saturate(2) hue-rotate(10deg)" }}
                priority
              />
            </div>
          </div>
        </div>

        {/* Dome Gallery — full width, same as themaja.com */}
        <div className="relative z-10 flex flex-col items-center" style={{ marginTop:"1.5rem" }}>
          <div className="w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[70vw] mx-auto" style={{ height: "clamp(350px, 95vw, 540px)", position: "relative" }}>
            {loadingGallery ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color:"#C6A75E" }}/>
              </div>
            ) : galleryItems.length > 0 ? (
              <DomeGallery
                images={galleryItems}
                fit={0.78}
                minRadius={200}
                maxRadius={540}
                maxVerticalRotationDeg={0}
                segments={22}
                dragDampening={2.2}
                grayscale={false}
                overlayBlurColor="transparent"
                openedImageWidth="250px"
                openedImageHeight="350px"
                imageBorderRadius="8px"
                openedImageBorderRadius="30px"
                autoRotate={true}
                autoRotateSpeed={0.025}
                onItemClick={handleGalleryClick}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-sm" style={{ color:"#F5EBDD44" }}>Karya akan segera tampil</p>
              </div>
            )}
          </div>
          <p className="text-xs tracking-widest pb-8 mt-1" style={{ color:"#C6A75E33" }}>
            ← drag to explore →
          </p>
        </div>
      </div>

      {/* ══ PRODUCT POPUP ══ */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(135deg,#1A1008,#2C1A12)", border:"1px solid rgba(198,167,94,0.3)" }}>
            <button onClick={()=>setSelectedProduct(null)} className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer" style={{ background:"rgba(13,10,6,0.8)", border:"1px solid rgba(198,167,94,0.3)", color:"#C6A75E88" }}>
              <X className="w-4 h-4"/>
            </button>
            <div className="relative h-48 bg-[#2C1A12]">
              <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover"/>
              <div className="absolute inset-0" style={{ background:"linear-gradient(to top, #1A1008 0%, transparent 60%)"}}/>
            </div>
            <div className="px-6 py-5">
              <h3 className="font-serif font-bold text-lg mb-1" style={{ color:"#C6A75E" }}>{selectedProduct.name}</h3>
              <p className="text-xl font-bold mb-4" style={{ color:"#D4B978" }}>{formatRupiah(selectedProduct.price)}</p>
              <Link href={`/produk/${selectedProduct.slug}`} onClick={()=>setSelectedProduct(null)}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background:"#C6A75E", color:"#0D0A06" }}>
                Lihat Karya <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══ CULTURAL POSTS ══ */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full bg-primary"/>
          <h2 className="text-2xl font-serif font-bold text-foreground">Konten Budaya</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {TABS.map(tab => {
            const Icon=tab.icon, active=activeTab===tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${active?"bg-primary text-primary-foreground border-primary shadow-sm":"bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}>
                {Icon&&<Icon className="w-3.5 h-3.5"/>}{tab.label}
              </button>
            );
          })}
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8 text-muted-foreground"/></div>
            <h3 className="font-semibold text-foreground mb-2">Belum ada konten</h3>
            <p className="text-muted-foreground text-sm">Konten akan segera hadir.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/ruang-budaya/${featured.slug}`}
                className="group grid md:grid-cols-5 gap-0 rounded-2xl border border-border bg-card overflow-hidden mb-10 hover:border-primary/50 hover:shadow-lg transition-all duration-200">
                <div className="md:col-span-3 relative h-64 md:h-auto bg-muted overflow-hidden min-h-[240px]">
                  {featured.coverImage?<Image src={featured.coverImage} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300"/>:<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100"><BookOpen className="w-16 h-16 text-amber-300"/></div>}
                  <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full ${typeColor(featured.type)}`}>{typeLabel(featured.type)}</span>
                </div>
                <div className="md:col-span-2 p-6 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Pilihan Editor</span>
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">{featured.title}</h2>
                  {featured.excerpt && <p className="text-muted-foreground leading-relaxed mb-5 line-clamp-3">{featured.excerpt}</p>}
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">Baca Selengkapnya<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></div>
                </div>
              </Link>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grid.map(post=><PostCard key={post.id} post={post}/>)}
            </div>
          </>
        )}

        <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-amber-900/10 to-amber-800/5 border border-amber-200/30">
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">Punya karya untuk dibagikan?</h3>
          <p className="text-muted-foreground text-sm mb-5">Bergabunglah dengan komunitas seniman Nusantara di MajaCraft</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/daftar" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Mulai Berjualan<ArrowRight className="w-4 h-4"/></Link>
            <Link href="/produk" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">Jelajahi Karya</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

