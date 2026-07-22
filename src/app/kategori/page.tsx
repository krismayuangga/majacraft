"use client";

import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  _count: {
    products: number;
  };
};

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Jelajahi Kategori Seni & Budaya</h1>
        <p className="text-lg text-muted-foreground">
          Temukan karya seni Nusantara dari {categories.length} kategori pilihan
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/kategori/${cat.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
              {cat.imageUrl && (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${cat.imageUrl})` }}
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-center mb-2">{cat.name}</h3>
                <p className="text-sm text-center text-muted-foreground">
                  {cat._count.products} produk
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
