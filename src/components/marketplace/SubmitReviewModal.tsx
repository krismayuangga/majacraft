"use client";

import { useState, useRef } from "react";
import { Star, Upload, X, Loader2, ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export default function SubmitReviewModal({
  isOpen,
  onClose,
  orderId,
  productId,
  productName,
  onSuccess,
}: SubmitReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError("Maksimal 5 foto");
      return;
    }

    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        setError(`Foto ${f.name} terlalu besar (max 5MB)`);
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);
    
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Video terlalu besar (max 50MB)");
      return;
    }

    setVideo(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = async () => {
    setError("");

    if (rating === 0) {
      setError("Pilih rating bintang");
      return;
    }

    if (!comment || comment.trim().length < 20) {
      setError("Tulis ulasan minimal 20 karakter");
      return;
    }

    setUploading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("folder", "reviews");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrls.push(uploadData.data.url);
        }
      }

      // Upload video
      let videoUrl: string | null = null;
      if (video) {
        const formData = new FormData();
        formData.append("file", video);
        formData.append("folder", "reviews");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          videoUrl = uploadData.data.url;
        }
      }

      // Submit review
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          productId,
          rating,
          comment: comment.trim(),
          imageUrls,
          videoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengirim ulasan");
        return;
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError("Terjadi kesalahan saat mengirim ulasan");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment("");
    setImages([]);
    setImagePreviews([]);
    setVideo(null);
    setVideoPreview(null);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tulis Ulasan</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-500 text-amber-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  {
                    ["Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"][
                      rating - 1
                    ]
                  }
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ulasan Anda <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda dengan produk ini (minimal 20 karakter)"
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 karakter
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Foto Produk (Opsional, max 5 foto)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image src={preview} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-500 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-600 transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[10px]">Upload</span>
                </button>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Video */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Video Produk (Opsional, max 50MB)
            </label>
            {videoPreview ? (
              <div className="relative">
                <video src={videoPreview} controls className="w-full max-h-48 rounded-lg" />
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-500 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-amber-600 transition-colors"
              >
                <Video className="w-8 h-8" />
                <span className="text-sm">Upload Video</span>
              </button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} className="flex-1 btn-gold" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Ulasan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
