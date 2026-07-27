import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";
import { findDestinationId, calculateDomesticCost } from "@/lib/rajaongkir";

/**
 * POST /api/shipping/cost
 * Hitung ongkir real dari RajaOngkir berdasarkan:
 * - Origin  : kota toko seller (dari cartItems[0].product.store.city)
 * - Dest    : kota pembeli (dari addressId)
 * - Weight  : total berat semua item di cart
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { addressId } = await req.json();
  if (!addressId) return err("addressId wajib diisi");

  const userId = session!.user!.id!;

  // Validasi API key
  if (!process.env.RAJAONGKIR_API_KEY) {
    return err("RAJAONGKIR_API_KEY belum diset di .env.local", 500);
  }

  // Ambil alamat tujuan
  const address = await prisma.address.findUnique({
    where: { id: addressId, userId },
    select: { city: true, province: true },
  });
  if (!address) return err("Alamat tidak ditemukan", 404);

  // Ambil cart items + info toko (untuk origin city + total weight + dimensi)
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              weight: true,
              length: true,
              width:  true,
              height: true,
              store: { select: { city: true, province: true } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return err("Keranjang kosong");
  }

  // Origin: kota toko — fallback ke province jika city kosong
  const store = cart.items[0].product.store;
  const originCity = store.city || store.province || "";

  if (!originCity) {
    return err("Data kota toko seller belum diisi. Seller perlu melengkapi profil toko (Kota/Provinsi).");
  }

  // Destination: kota pembeli — fallback ke province jika city kosong
  const destCity = address.city || address.province || "";

  // Total weight — gunakan yang lebih besar antara actual weight dan volumetric weight
  // Volumetric = (P × L × T cm) / 6000 × 1000g (standar kurir ekspres)
  const totalActualWeight = cart.items.reduce((sum, item) => {
    const w = item.product.weight ?? 500;
    return sum + w * item.qty;
  }, 0) || 1000;

  // Hitung volumetric weight per item
  const totalVolumetricWeight = cart.items.reduce((sum, item) => {
    const { length, width, height, weight } = item.product;
    if (length && width && height) {
      const volumetricGram = Math.round((length * width * height) / 6000 * 1000);
      return sum + Math.max(volumetricGram, weight ?? 0) * item.qty;
    }
    return sum + (weight ?? 500) * item.qty;
  }, 0) || 1000;

  // Gunakan yang lebih besar
  const totalWeight = Math.max(totalActualWeight, totalVolumetricWeight);
  const weightKg    = Math.round(totalWeight / 100) / 10; // 1 desimal
  const isHeavyItem = weightKg > 30;

  // RajaOngkir Starter/Komerce batas kalkulasi ~30kg
  // Untuk produk berat, cap di 30.000g agar tidak dapat harga tidak realistis
  const weightForApi = isHeavyItem ? 30_000 : totalWeight;

  // Search destination IDs di RajaOngkir
  console.log("[shipping/cost] searching:", { originCity, destCity, totalWeight });

  const [originId, destId] = await Promise.all([
    findDestinationId(originCity),
    findDestinationId(destCity),
  ]);

  console.log("[shipping/cost] IDs found:", { originId, destId });

  if (!originId) {
    return err(`Kota asal "${originCity}" tidak ditemukan di RajaOngkir. Coba gunakan nama kota yang lebih spesifik, contoh: "Surabaya", "Jakarta Selatan", "Mojokerto".`);
  }
  if (!destId) {
    return err(`Kota tujuan "${destCity}" tidak ditemukan di RajaOngkir.`);
  }

  // Hitung ongkir
  let results;
  try {
    results = await calculateDomesticCost({
      originId,
      destinationId: destId,
      weight: weightForApi,
      couriers: ["jne", "jnt", "sicepat", "anteraja", "ninja", "pos"],
    });
  } catch (e) {
    console.error("[shipping/cost] RajaOngkir error:", e);
    return err(`Gagal menghitung ongkir: ${String(e)}`);
  }

  // Untuk produk berat: filter kurir yang tidak masuk akal
  // Harga < Rp 10.000 untuk berat > 10kg tidak realistis → hapus dari list
  const filteredResults = isHeavyItem
    ? results.filter(c => c.price >= 50_000) // minimum Rp 50.000 untuk heavy item
    : results;

  return ok({
    origin:      { city: originCity, id: originId },
    destination: { city: address.city, id: destId },
    weight:      totalWeight,
    weightKg,
    isHeavyItem,
    ...(isHeavyItem && {
      heavyItemNote: `Produk ini memiliki berat ${weightKg} kg. Estimasi ongkir dihitung berdasarkan batas maksimum kurir reguler (30 kg). Biaya aktual mungkin berbeda — konfirmasi dengan seller sebelum melakukan pembayaran.`,
    }),
    couriers: filteredResults,
  });
}
