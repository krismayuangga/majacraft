import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Star, Package, BadgeCheck } from "lucide-react";
import ProductCard from "@/components/marketplace/ProductCard";
import ChatButton from "./ChatButton";

export const dynamic = "force-dynamic";

async function getStore(storeSlug: string) {
  return prisma.store.findUnique({
    where: { slug: storeSlug },
    include: {
      user: { select: { name: true, kycStatus: true, createdAt: true } },
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
        },
      },
      _count: { select: { products: true } },
    },
  });
}

export default async function TokoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  const products = store.products.map(p => ({
    id: p.id as unknown as number, name: p.name, slug: p.slug,
    price: p.price, originalPrice: p.originalPrice ?? null,
    image: p.images?.[0]?.url ?? "",
    images: [p.images?.[0]?.url ?? ""],
    category: p.category?.slug ?? "",
    seller: { name: store.name, avatar: store.logoUrl ?? "", location: store.province, rating: Number(store.rating), sold: p.soldCount },
    rating: Number(p.rating), reviews: p.reviewCount, sold: p.soldCount,
    isPhygital: p.hasCertificate, isVerified: store.isVerified, isFeatured: p.isFeatured, isCurated: p.isCurated, isSoldOffline: p.isSoldOffline,
    hasCertificate: p.hasCertificate, certificateId: p.certificateId ?? "",
    stock: p.stock, material: p.material ?? "", dimensions: p.dimensions ?? "",
    weight: p.weight ? `${p.weight} gram` : "", origin: p.origin ?? "",
    description: p.description, tags: p.tags,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Store Header */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card mb-6">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-amber-950 via-[#2A2620] to-amber-950 bg-batik-overlay" />

        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl border-4 border-card bg-amber-900/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-amber-400">{store.name[0].toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{store.name}</h1>
                {store.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-green-500 border border-green-700/30 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3 h-3" /> Terverifikasi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{store.city ?? store.province}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{store.rating.toFixed(1)}</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{store._count.products} karya</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {store.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{store.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Total Karya", value: store._count.products },
              { label: "Total Terjual", value: store.totalSold },
              { label: "Rating", value: Number(store.rating).toFixed(1) },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-xl font-bold text-amber-600">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chat button */}
          <ChatButton storeSlug={slug} storeName={store.name} storeUserId={store.userId} />
        </div>
      </div>

      {/* Products */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">
          Karya Toko <span className="text-amber-600 text-base">({products.length})</span>
        </h2>
        {products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Belum ada karya yang dipublikasikan
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
