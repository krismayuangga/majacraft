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

  // Ambil cart items + info toko (untuk origin city + total weight)
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              weight: true,
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

  // Total weight (gram) — min 1000g jika tidak ada data berat
  const totalWeight = cart.items.reduce((sum, item) => {
    const w = item.product.weight ?? 500;
    return sum + w * item.qty;
  }, 0) || 1000;

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
      weight: totalWeight,
      couriers: ["jne", "jnt", "sicepat", "anteraja", "ninja", "pos"],
    });
  } catch (e) {
    console.error("[shipping/cost] RajaOngkir error:", e);
    return err(`Gagal menghitung ongkir: ${String(e)}`);
  }

  return ok({
    origin:      { city: originCity, id: originId },
    destination: { city: address.city, id: destId },
    weight:      totalWeight,
    couriers:    results,
  });
}
