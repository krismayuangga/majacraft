"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Grid3X3, List, X, Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/marketplace/ProductCard";
import { formatRupiah } from "@/lib/data";

const SORT_OPTIONS = [
  { value: "relevan", label: "Paling Relevan" },
  { value: "terbaru", label: "Terbaru" },
  { value: "terlaris", label: "Terlaris" },
  { value: "harga-asc", label: "Harga: Terendah" },
  { value: "harga-desc", label: "Harga: Tertinggi" },
  { value: "rating", label: "Rating Tertinggi" },
];

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  productCount: number;
};

type ProductItem = {
  id: string; name: string; slug: string; price: number; originalPrice: number | null;
  image: string; images: string[]; category: string;
  seller: { name: string; avatar: string; location: string; rating: number; sold: number };
  rating: number; reviews: number; sold: number;
  isPhygital: boolean; isVerified: boolean; isFeatured: boolean; isModerated: boolean;
  hasCertificate: boolean; certificateId: string; stock: number;
  material: string; dimensions: string; weight: string; origin: string;
  description: string; tags: string[];
  isSoldOffline?: boolean;
};

function ProdukPageContent() {
  const searchParams = useSearchParams();
  
  // Initialize states with URL params
  const initialKategori = searchParams.get('kategori');
  
  const [sort, setSort] = useState("relevan");
  const [viewMode, setViewMode] = useState<"grid"|"list">("grid");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedKat, setSelectedKat] = useState<string[]>(initialKategori ? [initialKategori] : []);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyPhygital, setOnlyPhygital] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usedDb] = useState(true);

  // Sync URL params with state when URL changes
  useEffect(() => {
    const kategoriParam = searchParams.get('kategori');
    const currentKat = selectedKat[0] || null;
    if (kategoriParam !== currentKat) {
      setSelectedKat(kategoriParam ? [kategoriParam] : []);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load categories from database once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          const cats = (d.data as Array<{id:string, name:string, slug:string, icon:string|null, _count:{products:number}}>) .map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon,
            productCount: c._count.products
          }));
          setCategories(cats);
        }
      })
      .catch(e => console.error('Failed to load categories:', e));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        ...(search && { search }),
        ...(sort !== "relevan" && { sort }),
        ...(onlyPhygital && { sertifikat: "1" }),
        ...(selectedKat.length > 0 && { kategori: selectedKat[0] }), // Backend only supports single category
        limit: "40",
      });
      const res = await fetch(`/api/products?${q}`);
      const d = await res.json();
      const items = d.data?.items ?? [];
      if (items.length > 0) {
        // Normalize DB format
        const normalized = items.map((p: Record<string, unknown>) => ({
          id: String(p.id), name: String(p.name), slug: String(p.slug),
          price: Number(p.price), originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          image: ((p.images as {url:string}[])?.[0]?.url) ?? "",
          images: [(((p.images as {url:string}[])?.[0]?.url) ?? "")],
          category: ((p.category as {slug:string})?.slug) ?? "",
          seller: { name: ((p.store as {name:string})?.name)??"", avatar:"", location:((p.store as {province:string})?.province)??"", rating:5, sold:Number(p.soldCount??0) },
          rating: Number(p.rating??5), reviews: Number(p.reviewCount??0), sold: Number(p.soldCount??0),
          isPhygital: Boolean(p.hasCertificate), isVerified: Boolean((p.store as {isVerified:boolean})?.isVerified),
          isFeatured: Boolean(p.isFeatured), hasCertificate: Boolean(p.hasCertificate),
          isModerated: Boolean(p.isModerated), isSoldOffline: Boolean(p.isSoldOffline),
          certificateId: String(p.certificateId??""), stock: Number(p.stock??1),
          material: String(p.material??""), dimensions: String(p.dimensions??""),
          weight: p.weight?`${p.weight} gram`:"", origin: String(p.origin??""),
          description: String(p.description??""), tags: (p.tags as string[])??[],
        }));
        setProducts(normalized); setTotal(d.data?.total ?? normalized.length);
      } else {
        setProducts([]); setTotal(0);
      }
    } catch { setProducts([]); setTotal(0); }
    setLoading(false);
  }, [search, sort, onlyPhygital, selectedKat]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Client-side filter hanya untuk harga dan verified (yang tidak ada di API)
  const filtered = products.filter(p => {
    if (priceMin && p.price < parseInt(priceMin)) return false;
    if (priceMax && p.price > parseInt(priceMax)) return false;
    if (onlyVerified && !p.isVerified) return false;
    return true;
  });

  const toggleKat = (slug: string) => {
    // Only allow single category selection (backend limitation)
    setSelectedKat(prev => prev.includes(slug) ? [] : [slug]);
  };

  const activeFilters = [
    ...selectedKat.map(k=>({key:k, label: categories.find(c=>c.slug===k)?.name||k})),
    ...(onlyPhygital?[{key:"phygital",label:"Bersertifikat"}]:[]),
    ...(onlyVerified?[{key:"verified",label:"Terverifikasi"}]:[]),
    ...(priceMin?[{key:"price-min",label:`Min ${formatRupiah(parseInt(priceMin))}`}]:[]),
    ...(priceMax?[{key:"price-max",label:`Max ${formatRupiah(parseInt(priceMax))}`}]:[]),
  ];

  const removeFilter = (key:string) => {
    if(key==="phygital") setOnlyPhygital(false);
    else if(key==="verified") setOnlyVerified(false);
    else if(key==="price-min") setPriceMin("");
    else if(key==="price-max") setPriceMax("");
    else setSelectedKat(prev=>prev.filter(k=>k!==key));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Semua Produk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Menampilkan <span className="text-amber-600 font-medium">{filtered.length}</span> karya

          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Cari produk..." value={searchInput} onChange={e=>setSearchInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&setSearch(searchInput)}
              className="pl-8 h-9 w-full rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Kategori</h3>
            <div className="space-y-1.5">
              {categories.map(cat=>(
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={selectedKat.includes(cat.slug)} onChange={()=>toggleKat(cat.slug)} className="accent-amber-600 w-3.5 h-3.5" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{cat.name}</span>
                  <span className="text-[10px] text-amber-700">{cat.productCount}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Rentang Harga</h3>
            <div className="space-y-2">
              <input placeholder="Harga minimum" value={priceMin} onChange={e=>setPriceMin(e.target.value)} type="number" className="h-8 w-full px-3 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none" />
              <input placeholder="Harga maksimum" value={priceMax} onChange={e=>setPriceMax(e.target.value)} type="number" className="h-8 w-full px-3 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Kondisi</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={onlyPhygital} onChange={e=>setOnlyPhygital(e.target.checked)} className="accent-amber-600" /><span className="text-sm text-muted-foreground">Bersertifikat Digital</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={onlyVerified} onChange={e=>setOnlyVerified(e.target.checked)} className="accent-amber-600" /><span className="text-sm text-muted-foreground">Penjual Terverifikasi</span></label>
            </div>
          </div>
          {activeFilters.length > 0 && <button className="w-full text-xs text-red-400 hover:text-red-300" onClick={()=>{setSelectedKat([]);setOnlyPhygital(false);setOnlyVerified(false);setPriceMin("");setPriceMax("");}}>Reset Semua Filter</button>}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button onClick={()=>setShowFilter(!showFilter)} className="lg:hidden h-8 px-3 rounded-lg border border-amber-700/30 text-amber-700 text-xs flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5"/>Filter{activeFilters.length>0&&<span className="bg-amber-600 text-white text-[10px] px-1.5 rounded-full ml-1">{activeFilters.length}</span>}
            </button>
            {activeFilters.map(f=>(
              <span key={f.key} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-amber-600/40 text-amber-700">
                {f.label}<button onClick={()=>removeFilter(f.key)}><X className="w-3 h-3"/></button>
              </span>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Select value={sort} onValueChange={v=>{ if(v) setSort(v); }}>
                <SelectTrigger className="w-44 h-8 text-xs border-amber-700/30"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SORT_OPTIONS.map(o=><SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button onClick={()=>setViewMode("grid")} className={`p-1.5 ${viewMode==="grid"?"bg-amber-900/20 text-amber-600":"text-muted-foreground"}`}><Grid3X3 className="w-4 h-4"/></button>
                <button onClick={()=>setViewMode("list")} className={`p-1.5 ${viewMode==="list"?"bg-amber-900/20 text-amber-600":"text-muted-foreground"}`}><List className="w-4 h-4"/></button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-600"/></div>
          ) : filtered.length > 0 ? (
            <div className={viewMode==="grid"?"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5":"grid grid-cols-1 gap-3"}>
              {filtered.map(product=><ProductCard key={product.id} product={product}/>)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Karya tidak ditemukan</h3>
              <p className="text-sm text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProdukPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600"/>
        </div>
      </div>
    }>
      <ProdukPageContent />
    </Suspense>
  );
}
