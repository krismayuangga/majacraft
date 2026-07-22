"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, Image as ImageIcon, Play, Filter, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Image from "next/image";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  imageUrls: string[];
  videoUrl: string | null;
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
}

export default function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [hasMedia, setHasMedia] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRating, hasMedia, sort, page]);

  async function loadReviews() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        sort,
        page: String(page),
        ...(filterRating && { rating: String(filterRating) }),
        ...(hasMedia && { hasMedia: "true" }),
      });
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }

  async function markHelpful(reviewId: string) {
    await fetch(`/api/reviews/${reviewId}`, { method: "PATCH" });
    loadReviews();
  }

  if (!stats && loading) {
    return <div className="text-center py-8 text-muted-foreground">Memuat ulasan...</div>;
  }

  if (!stats) return null;

  const sortOptions = [
    { value: "newest", label: "Terbaru" },
    { value: "oldest", label: "Terlama" },
    { value: "highest", label: "Rating Tertinggi" },
    { value: "lowest", label: "Rating Terendah" },
    { value: "helpful", label: "Paling Membantu" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-amber-50/50 rounded-xl border border-amber-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-900">{stats.averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(stats.averageRating)
                    ? "fill-amber-500 text-amber-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{stats.totalReviews} ulasan</p>
        </div>

        <div className="md:col-span-2 space-y-2">
          {stats.ratingDistribution.map((dist) => (
            <button
              key={dist.rating}
              onClick={() => setFilterRating(filterRating === dist.rating ? null : dist.rating)}
              className={`w-full flex items-center gap-3 group ${
                filterRating === dist.rating ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-1 w-16">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-medium">{dist.rating}</span>
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{
                    width: `${stats.totalReviews > 0 ? (dist.count / stats.totalReviews) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">{dist.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setHasMedia(!hasMedia)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            hasMedia
              ? "bg-amber-100 border-amber-500 text-amber-900"
              : "bg-white border-gray-300 text-gray-700 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Dengan Foto/Video
          </div>
        </button>

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 border border-amber-500 text-amber-900"
          >
            {filterRating} ⭐ ✕
          </button>
        )}

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {sortOptions.find((o) => o.value === sort)?.label}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSort(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-border animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-1">Belum ada ulasan</p>
          <p className="text-sm">Jadilah yang pertama memberikan ulasan untuk produk ini!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-6 bg-white rounded-xl border border-border">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={review.user.image || undefined} />
                  <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{review.user.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Pembeli
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </span>
                  </div>

                  {review.comment && <p className="text-sm text-foreground mb-3">{review.comment}</p>}

                  {/* Images */}
                  {review.imageUrls.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {review.imageUrls.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightbox({ images: review.imageUrls, index: idx })}
                          className="relative w-20 h-20 rounded-lg overflow-hidden border border-border hover:border-amber-500 transition-all"
                        >
                          <Image src={url} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Video */}
                  {review.videoUrl && (
                    <div className="mb-3">
                      <video
                        src={review.videoUrl}
                        controls
                        className="max-w-xs rounded-lg border border-border"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => markHelpful(review.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-600 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Membantu ({review.helpfulCount})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={lightbox.images[lightbox.index]}
              alt=""
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
            />
            {lightbox.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {lightbox.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ ...lightbox, index: idx });
                    }}
                    className={`w-2 h-2 rounded-full ${
                      idx === lightbox.index ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
